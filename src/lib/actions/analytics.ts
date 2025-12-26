'use server'

import { prisma } from '@/lib/db'
import { auth } from '@clerk/nextjs/server'

interface MonthlyData {
    month: number
    year: number
    income: number
    expenses: number
    netChange: number
    accumulatedNetWorth: number
}

export async function getNetWorthHistory(type: 'PERSONAL' | 'BUSINESS' = 'PERSONAL') {
    try {
        const { userId } = await auth()
        if (!userId) throw new Error('Unauthorized')

        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: { id: true, initialBalance: true, initialSavings: true }
        })

        if (!user) {
            return { success: true, data: [] } // No user found, return empty history
        }

        const budgets = await prisma.budget.findMany({
            where: { userId: user.id, type },
            select: {
                month: true,
                year: true,
                incomes: { select: { amount: true } },
                expenses: { select: { amount: true } },
                bills: { select: { amount: true } },
                debts: { select: { monthlyPayment: true } }
            },
            orderBy: [
                { year: 'asc' },
                { month: 'asc' }
            ]
            ]
    }) as any

    if (!budgets || budgets.length === 0) {
        // Even if no budgets, return initial state if user exists
        if (user && ((user.initialBalance || 0) > 0 || (user.initialSavings || 0) > 0)) {
            return {
                success: true,
                data: [{
                    month: new Date().getMonth() + 1,
                    year: new Date().getFullYear(),
                    income: 0,
                    expenses: 0,
                    netChange: 0,
                    accumulatedNetWorth: (user.initialBalance || 0) + (user.initialSavings || 0)
                }]
            }
        }
        return { success: true, data: [] }
    }

    // Start with initial state
    let accumulatedNetWorth = (user.initialBalance || 0) + (user.initialSavings || 0)
    const history: MonthlyData[] = []

    // 2. Iterate through budgets to calculate monthly stats
    for (const budget of budgets) {
        // Calculate total income
        const totalIncome = budget.incomes.reduce((sum, item) => sum + item.amount, 0)

        // Calculate total expenses (Expenses + Bills + Debt Monthly Payments)
        const totalExpenses = budget.expenses.reduce((sum, item) => sum + item.amount, 0)

        // For bills, we can assume 'isPaid' or just planned. 
        // For Net Worth (projected), we usually care about the obligations.
        // Let's us all amounts to be safe, representing "Cash Flow"
        const totalBills = budget.bills.reduce((sum, item) => sum + item.amount, 0)

        // For debts, only monthly payment counts as immediate outflow
        const totalDebtPayments = budget.debts.reduce((sum, item) => sum + item.monthlyPayment, 0)

        const totalOutflow = totalExpenses + totalBills + totalDebtPayments

        const netChange = totalIncome - totalOutflow
        accumulatedNetWorth += netChange

        history.push({
            month: budget.month,
            year: budget.year,
            income: totalIncome,
            expenses: totalOutflow,
            netChange,
            accumulatedNetWorth
        })
    }

    return { success: true, data: history }

} catch (error) {
    console.error('Error calculating net worth history:', error)
    return { success: false, error: 'Failed to calculate net worth' }
}
}
