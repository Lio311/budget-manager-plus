
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
                initialSavings: true,
                savings: { select: { monthlyDeposit: true, currency: true } }
            },
            orderBy: [{ year: 'asc' }, { month: 'asc' }]
        })

        // 4. Calculate Totals
        let totalAccountBalance = (user.initialBalance || 0) + (user.initialSavings || 0)
        let currentMonthIncome = 0
        let currentMonthExpenses = 0
        let currentMonthBalance = 0 // To match Dashboard "Net Monthly"
        let currentMonthTotalOutflow = 0

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

            // Helper to sum
            const sumItems = async (items: any[], isExpense = false) => {
                let sum = 0
                for (const item of items) {
                    const val = isExpense ? (item.amount || item.monthlyPayment || item.monthlyDeposit) : item.amount
                    const amountILS = await convertToILS(val, item.currency)
                    sum += amountILS
                }
                return sum
            }

            const incomeSum = await sumItems(budget.incomes)

            // Expenses include: expenses, bills, debts
            const expensesSum = await sumItems(budget.expenses, true)
            const billsSum = await sumItems(budget.bills, true)
            const debtsSum = await sumItems(budget.debts, true)
            const savingsSum = await sumItems(budget.savings || [], true) // Treat savings as "outflow" from current cash, but it adds to net worth typically.
            // Wait, for "Monthly Balance" (Cash Flow), savings IS an outflow (money moved aside).
            // For Net Worth, Savings IS part of the balance.

            // Dashboard Net Worth Logic:
            // accumulatedNetWorth = (prev + income - expenses - bills - debts - savings) + savings? 
            // Actually Dashboard Net Worth is mostly cumulative.
            // But let's stick to the requested "Monthly Balance" card (-527k).
            // That card is: Income - Expenses - Bills - Debts - Savings.

            const totalOutflowForNetWorth = expensesSum + billsSum + debtsSum // Savings stays in your pocket (technically)

            // Update Total Net Worth (Accumulated)
            // Income adds, Expenses/Bills/Debts subtract. Savings just move from Checking to Savings, so Net Worth assumes (Check + Save).
            // So for Net Worth, we only subtract real expenses.
            totalAccountBalance += (incomeSum - totalOutflowForNetWorth)

            // Current Month Stats (Match Dashboard Logic)
            if (budget.month === month && budget.year === year) {
                currentMonthIncome = incomeSum
                currentMonthExpenses = expensesSum // Pure expenses

                // Exact Dashboard Formula for "Monthly Balance" / "Savings Remainder":
                currentMonthBalance = incomeSum - expensesSum - billsSum - debtsSum - savingsSum

                // For "Total Outflow" (optional stat)
                currentMonthTotalOutflow = expensesSum + billsSum + debtsSum + savingsSum
            }
        }

        // Net Worth is totalAccountBalance

        // 5. Response
        return NextResponse.json({
            success: true,
            data: {
                month,
                year,
                // Dashboard Matches
                monthName: new Intl.DateTimeFormat('he-IL', { month: 'long' }).format(new Date(year, month - 1)), // "ינואר"
                totalIncome: Math.round(currentMonthIncome), // "סך הכנסות"
                totalExpenses: Math.round(currentMonthExpenses), // "סך הוצאות" (Dashboard style)

                // Requested Explicitly
                monthlyIncome: Math.round(currentMonthIncome), // Alias for user convenience

                totalOutflow: Math.round(currentMonthTotalOutflow), // Keep as is for reference if needed

                // Dashboard "Monthly Balance" (Rubber Pig Card)
                // Formula: Income - Expenses - Bills - Debts - Savings
                monthlyBalance: Math.round(currentMonthBalance),

                // Net Worth (Total Money) - This is likely what they want for "Account Balance"
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
