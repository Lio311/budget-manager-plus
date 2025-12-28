'use server'

import { prisma, authenticatedPrisma } from '@/lib/db'
import { auth } from '@clerk/nextjs/server'

/**
 * Optimized Server Action to fetch ALL overview data in a single request
 * This reduces 11+ separate API calls to just 1, dramatically improving performance
 */
export async function getOverviewData(month: number, year: number, type: 'PERSONAL' | 'BUSINESS' = 'PERSONAL') {
    try {
        const { userId } = await auth()
        if (!userId) {
            return { success: false, error: 'Unauthorized' }
        }

        const db = await authenticatedPrisma(userId)

        // Calculate previous month
        const prevMonth = month === 1 ? 12 : month - 1
        const prevYear = month === 1 ? year - 1 : year

        // Fetch user for initial balance/savings
        const user = await db.user.findUnique({
            where: { id: userId },
            select: { id: true, initialBalance: true, initialSavings: true }
        })

        if (!user) {
            return { success: false, error: 'User not found' }
        }

        // Get current and previous budgets with optimized field selection
        const [currentBudget, previousBudget] = await Promise.all([
            db.budget.findFirst({
                where: { userId, month, year, type },
                select: {
                    id: true,
                    incomes: { select: { id: true, source: true, category: true, amount: true, currency: true, date: true } },
                    expenses: { select: { id: true, description: true, category: true, amount: true, currency: true, date: true } },
                    bills: { select: { id: true, name: true, amount: true, currency: true, isPaid: true } },
                    debts: { select: { id: true, creditor: true, monthlyPayment: true, currency: true, isPaid: true } },
                    savings: { select: { id: true, category: true, monthlyDeposit: true, currency: true } }
                }
            }),
            db.budget.findFirst({
                where: { userId, month: prevMonth, year: prevYear, type },
                select: {
                    id: true,
                    incomes: { select: { id: true, source: true, category: true, amount: true, currency: true, date: true } },
                    expenses: { select: { id: true, description: true, category: true, amount: true, currency: true, date: true } },
                    bills: { select: { id: true, name: true, amount: true, currency: true, isPaid: true } },
                    debts: { select: { id: true, creditor: true, monthlyPayment: true, currency: true, isPaid: true } },
                    savings: { select: { id: true, category: true, monthlyDeposit: true, currency: true } }
                }
            })
        ])

        // Get categories (only expense categories for the overview)
        // @ts-ignore
        const categories = await db.category.findMany({
            where: { userId, type: 'expense', scope: type },
            select: { id: true, name: true, color: true }
        })

        // Get net worth history (all budgets for this user and type)
        // @ts-ignore
        const allBudgets = await db.budget.findMany({
            where: { userId, type },
            select: {
                month: true,
                year: true,
                incomes: { select: { amount: true, currency: true } },
                expenses: { select: { amount: true, currency: true } },
                bills: { select: { amount: true, currency: true } },
                debts: { select: { monthlyPayment: true, currency: true } }
            },
            orderBy: [
                { year: 'asc' },
                { month: 'asc' }
            ]
        })

        // Calculate net worth history - using ILS amounts for multi-currency support
        let accumulatedNetWorth = (user.initialBalance || 0) + (user.initialSavings || 0)
        const netWorthHistory = allBudgets.map(budget => {
            const totalIncome = budget.incomes.reduce((sum, item) => sum + item.amount, 0)
            const totalExpenses = budget.expenses.reduce((sum, item) => sum + item.amount, 0)
            const totalBills = budget.bills.reduce((sum, item) => sum + item.amount, 0)
            const totalDebtPayments = budget.debts.reduce((sum, item) => sum + item.monthlyPayment, 0)
            const totalOutflow = totalExpenses + totalBills + totalDebtPayments
            const netChange = totalIncome - totalOutflow
            accumulatedNetWorth += netChange

            return {
                month: budget.month,
                year: budget.year,
                income: totalIncome,
                expenses: totalOutflow,
                netChange,
                accumulatedNetWorth
            }
        })

        return {
            success: true,
            data: {
                current: {
                    incomes: currentBudget?.incomes || [],
                    expenses: currentBudget?.expenses || [],
                    bills: currentBudget?.bills || [],
                    debts: currentBudget?.debts || [],
                    savings: currentBudget?.savings || []
                },
                previous: {
                    incomes: previousBudget?.incomes || [],
                    expenses: previousBudget?.expenses || [],
                    bills: previousBudget?.bills || [],
                    debts: previousBudget?.debts || [],
                    savings: previousBudget?.savings || []
                },
                categories,
                netWorthHistory,
                userSettings: {
                    initialBalance: user.initialBalance || 0,
                    initialSavings: user.initialSavings || 0
                }
            }
        }
    } catch (error) {
        console.error('Error fetching overview data:', error)
        return { success: false, error: 'Failed to fetch overview data' }
    }
}
