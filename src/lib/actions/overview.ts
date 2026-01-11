'use server'

import { prisma, authenticatedPrisma } from '@/lib/db'
import { auth } from '@clerk/nextjs/server'
import { convertToILS } from '@/lib/currency'

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
            select: {
                id: true,
                initialBalance: true,
                initialSavings: true,
                businessInitialBalance: true,
                businessInitialSavings: true,
                referralProgramActive: true,
                trialEndsAt: true,
                hasUsedTrial: true,
                subscriptions: {
                    where: { status: 'active' },
                    select: {
                        endDate: true,
                        planType: true
                    }
                }
            }
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
                    incomes: { select: { id: true, source: true, category: true, amount: true, currency: true, date: true, vatAmount: true } },
                    expenses: { select: { id: true, description: true, category: true, amount: true, currency: true, date: true, vatAmount: true, amountBeforeVat: true, isDeductible: true, responsibles: true } },
                    bills: { select: { id: true, name: true, amount: true, currency: true, isPaid: true } },
                    debts: { select: { id: true, creditor: true, monthlyPayment: true, currency: true, isPaid: true } },
                    savings: { select: { id: true, category: true, monthlyDeposit: true, currency: true } },
                    // @ts-ignore
                    initialBalance: true,
                    // @ts-ignore
                    initialSavings: true
                }
            }),
            db.budget.findFirst({
                where: { userId, month: prevMonth, year: prevYear, type },
                select: {
                    id: true,
                    incomes: { select: { id: true, source: true, category: true, amount: true, currency: true, date: true, vatAmount: true } },
                    expenses: { select: { id: true, description: true, category: true, amount: true, currency: true, date: true, vatAmount: true, amountBeforeVat: true, isDeductible: true, responsibles: true } },
                    bills: { select: { id: true, name: true, amount: true, currency: true, isPaid: true } },
                    debts: { select: { id: true, creditor: true, monthlyPayment: true, currency: true, isPaid: true } },
                    savings: { select: { id: true, category: true, monthlyDeposit: true, currency: true } },
                    // @ts-ignore
                    initialBalance: true,
                    // @ts-ignore
                    initialSavings: true
                }
            })
        ])

        // Get New Clients Count (Current Month vs Previous Month)
        // Only if type is BUSINESS (optimization)
        let newClientsCount = 0
        let prevNewClientsCount = 0

        if (type === 'BUSINESS') {
            const startDate = new Date(year, month - 1, 1) // Start of current month
            const endDate = new Date(year, month, 1) // Start of next month (exclusive)

            const prevStartDate = new Date(prevYear, prevMonth - 1, 1)
            const prevEndDate = new Date(prevYear, prevMonth, 1)

            const [currentClients, prevClients] = await Promise.all([
                db.client.count({
                    where: { userId, createdAt: { gte: startDate, lt: endDate } }
                }),
                db.client.count({
                    where: { userId, createdAt: { gte: prevStartDate, lt: prevEndDate } }
                })
            ])
            newClientsCount = currentClients
            prevNewClientsCount = prevClients
        }

        // Convert all amounts to ILS for consistency
        const convertBudgetItems = async (budget: any) => {
            if (!budget) return null

            const [incomes, expenses, bills, debts, savings] = await Promise.all([
                Promise.all(budget.incomes?.map(async (item: any) => {
                    const amountILS = await convertToILS(item.amount, item.currency)
                    const ratio = item.amount && item.amount !== 0 ? amountILS / item.amount : 0
                    const vatAmountILS = (item.vatAmount || 0) * ratio
                    return {
                        ...item,
                        amountILS,
                        vatAmountILS,
                        amountBeforeVatILS: amountILS - vatAmountILS
                    }
                }) || []),
                Promise.all(budget.expenses?.map(async (item: any) => {
                    const amountILS = await convertToILS(item.amount, item.currency)
                    // Calculate ratios for VAT and Amount Before VAT to avoid redundant API calls per item
                    const ratio = item.amount && item.amount !== 0 ? amountILS / item.amount : 0

                    return {
                        ...item,
                        amountILS,
                        vatAmountILS: (item.vatAmount || 0) * ratio,
                        amountBeforeVatILS: (item.amountBeforeVat || 0) * ratio
                    }
                }) || []),
                Promise.all(budget.bills?.map(async (item: any) => ({
                    ...item,
                    amountILS: await convertToILS(item.amount, item.currency)
                })) || []),
                Promise.all(budget.debts?.map(async (item: any) => ({
                    ...item,
                    monthlyPaymentILS: await convertToILS(item.monthlyPayment, item.currency)
                })) || []),
                Promise.all(budget.savings?.map(async (item: any) => ({
                    ...item,
                    monthlyDepositILS: await convertToILS(item.monthlyDeposit, item.currency)
                })) || [])
            ])

            return { ...budget, incomes, expenses, bills, debts, savings }
        }

        const [currentBudgetConverted, previousBudgetConverted] = await Promise.all([
            convertBudgetItems(currentBudget),
            convertBudgetItems(previousBudget)
        ])

        // Get categories (only expense categories for the overview)
        // @ts-ignore
        const categories = await db.category.findMany({
            where: { userId, type: 'expense', scope: type },
            select: { id: true, name: true, color: true }
        })

        // Get net worth history (up to current month for accurate "Current" state)
        // @ts-ignore
        const allBudgets = await db.budget.findMany({
            where: {
                userId,
                type,
                OR: [
                    { year: { lt: year } },
                    { year: year, month: { lte: month } }
                ]
            },
            select: {
                month: true,
                year: true,
                incomes: { select: { amount: true, currency: true } },
                expenses: { select: { amount: true, currency: true } },
                bills: { select: { amount: true, currency: true } },
                debts: { select: { monthlyPayment: true, currency: true } },
                // @ts-ignore
                initialBalance: true,
                // @ts-ignore
                initialSavings: true
            },
            orderBy: [
                { year: 'asc' },
                { month: 'asc' }
            ]
        })

        // Calculate net worth history - using real-time API conversion for accuracy
        // FIX: Use correct initial values based on budget type, prioritizing monthly overrides
        const globalInitialBalance = type === 'BUSINESS' ? (user.businessInitialBalance || 0) : (user.initialBalance || 0)
        const globalInitialSavings = type === 'BUSINESS' ? (user.businessInitialSavings || 0) : (user.initialSavings || 0)

        let accumulatedNetWorth = 0
        let hasStarted = false

        const netWorthHistory = await Promise.all(allBudgets.map(async (budget) => {
            // Apply monthly override if present, otherwise use global/accumulated
            if (budget.initialBalance !== null || budget.initialSavings !== null) {
                accumulatedNetWorth = (budget.initialBalance || 0) + (budget.initialSavings || 0)
                hasStarted = true
            } else if (!hasStarted) {
                // If no override yet and we haven't started, use global
                accumulatedNetWorth = globalInitialBalance + globalInitialSavings
                hasStarted = true
            }
            // Convert all amounts to ILS using real API rates
            const incomePromises = budget.incomes.map(item => convertToILS(item.amount, item.currency))
            const expensePromises = budget.expenses.map(item => convertToILS(item.amount, item.currency))
            const billPromises = budget.bills.map(item => convertToILS(item.amount, item.currency))
            const debtPromises = budget.debts.map(item => convertToILS(item.monthlyPayment, item.currency))

            const [incomeAmounts, expenseAmounts, billAmounts, debtAmounts] = await Promise.all([
                Promise.all(incomePromises),
                Promise.all(expensePromises),
                Promise.all(billPromises),
                Promise.all(debtPromises)
            ])

            const totalIncome = incomeAmounts.reduce((sum, amount) => sum + amount, 0)
            const totalExpenses = expenseAmounts.reduce((sum, amount) => sum + amount, 0)
            const totalBills = billAmounts.reduce((sum, amount) => sum + amount, 0)
            const totalDebtPayments = debtAmounts.reduce((sum, amount) => sum + amount, 0)

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
        }))

        return {
            success: true,
            data: {
                current: {
                    incomes: currentBudgetConverted?.incomes || [],
                    expenses: currentBudgetConverted?.expenses || [],
                    bills: currentBudgetConverted?.bills || [],
                    debts: currentBudgetConverted?.debts || [],
                    savings: currentBudgetConverted?.savings || []
                },
                previous: {
                    incomes: previousBudgetConverted?.incomes || [],
                    expenses: previousBudgetConverted?.expenses || [],
                    bills: previousBudgetConverted?.bills || [],
                    debts: previousBudgetConverted?.debts || [],
                    savings: previousBudgetConverted?.savings || []
                },
                businessStats: {
                    newClientsCount,
                    prevNewClientsCount
                },
                categories,
                netWorthHistory,
                user: {
                    initialBalance: user.initialBalance,
                    initialSavings: user.initialSavings,
                    businessInitialBalance: user.businessInitialBalance,
                    businessInitialSavings: user.businessInitialSavings,
                    monthlyBalanceOverride: currentBudget?.initialBalance,
                    monthlySavingsOverride: currentBudget?.initialSavings,
                    referralProgramActive: user.referralProgramActive,
                    trialEndsAt: user.trialEndsAt,
                    activeSubscription: user.subscriptions[0] || null
                }
            }
        }
    } catch (error) {
        console.error('Error fetching overview data:', error)
        return { success: false, error: 'Failed to fetch overview data' }
    }
}
