
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { convertToILS } from '@/lib/currency'

export const dynamic = 'force-dynamic'

/**
 * GET /api/quick-stats
 * 
 * Returns financial summary for iOS Shortcuts:
 * - Monthly Income
 * - Monthly Expenses
 * - Monthly Balance
 * - Total Account Balance (Net Worth)
 */
export async function GET(request: NextRequest) {
    try {
        // 1. Authentication
        const apiKey = request.headers.get('x-api-key')
        if (!apiKey) {
            return NextResponse.json({ success: false, error: 'Unauthorized: Missing API key' }, { status: 401 })
        }

        const user = await prisma.user.findUnique({
            where: { shortcutApiKey: apiKey },
            select: {
                id: true,
                initialBalance: true,
                initialSavings: true,
                businessInitialBalance: true,
                businessInitialSavings: true
            }
        })

        if (!user) {
            return NextResponse.json({ success: false, error: 'Unauthorized: Invalid API key' }, { status: 401 })
        }

        const userId = user.id

        // 2. Date Setup (Current Month)
        const now = new Date()
        const month = now.getMonth() + 1
        const year = now.getFullYear()

        // 3. Fetch Data - We need:
        // A. Current Month Budget (for monthly stats)
        // B. All Budgets (for total account balance/net worth)

        const allBudgets = await prisma.budget.findMany({
            where: {
                userId,
                type: 'PERSONAL' // Default to Personal for quick stats
            },
            select: {
                month: true,
                year: true,
                incomes: { select: { amount: true, currency: true } },
                expenses: { select: { amount: true, currency: true } },
                bills: { select: { amount: true, currency: true, isPaid: true } },
                debts: { select: { monthlyPayment: true, currency: true } },
                initialBalance: true,
                initialSavings: true
            },
            orderBy: [{ year: 'asc' }, { month: 'asc' }]
        })

        // 4. Calculate Totals
        let totalAccountBalance = (user.initialBalance || 0) + (user.initialSavings || 0)
        let currentMonthIncome = 0
        let currentMonthExpenses = 0

        let hasStarted = false

        // We traverse history to calculate accurate Net Worth
        for (const budget of allBudgets) {
            // Handle overrides
            if (budget.initialBalance !== null || budget.initialSavings !== null) {
                totalAccountBalance = (budget.initialBalance || 0) + (budget.initialSavings || 0)
                hasStarted = true
            } else if (!hasStarted) {
                // Keep initial value
                hasStarted = true
            }

            // Convert and Sum Items
            // Note: convertToILS is async, but we'll map/promise.all here for speed if needed, 
            // but for a simple loop awaiting might be safer to not flood currency API if it's external.
            // Assuming convertToILS is fast/cached or internal.

            let bIncome = 0
            let bExpense = 0

            // Helper to sum
            const sumItems = async (items: any[], isExpense = false) => {
                let sum = 0
                for (const item of items) {
                    // For bills/debts, we usually count them as expenses
                    // For quick-stats, we want "What did I spend vs earn"
                    const amountILS = await convertToILS(isExpense ? (item.amount || item.monthlyPayment) : item.amount, item.currency)
                    sum += amountILS
                }
                return sum
            }

            const incomeSum = await sumItems(budget.incomes)

            // Expenses include: expenses, bills, debts
            const expensesSum = await sumItems(budget.expenses, true)
            const billsSum = await sumItems(budget.bills, true)
            const debtsSum = await sumItems(budget.debts, true)

            const totalOutflow = expensesSum + billsSum + debtsSum

            // Update Total Net Worth
            totalAccountBalance += (incomeSum - totalOutflow)

            // If this is the CURRENT month, save for specific stats
            if (budget.month === month && budget.year === year) {
                currentMonthIncome = incomeSum
                currentMonthExpenses = totalOutflow
            }
        }

        const monthlyBalance = currentMonthIncome - currentMonthExpenses

        // 5. Response
        return NextResponse.json({
            success: true,
            data: {
                month,
                year,
                totalIncome: Math.round(currentMonthIncome),
                totalExpenses: Math.round(currentMonthExpenses),
                monthlyBalance: Math.round(monthlyBalance),
                accountBalance: Math.round(totalAccountBalance),
                currency: '₪'
            }
        })

    } catch (error) {
        console.error('Quick-Stats API Error:', error)
        return NextResponse.json({
            success: false,
            error: `Internal server error: ${error instanceof Error ? error.message : 'Unknown error'}`
        }, { status: 500 })
    }
}
