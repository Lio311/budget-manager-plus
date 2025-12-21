import { prisma } from '@/lib/db'
import { getCurrentBudget } from './budget'

export async function getCalendarPayments(month: number, year: number) {
    try {
        const budget = await getCurrentBudget(month, year)

        // Get bills and debts for the month
        const [bills, debts] = await Promise.all([
            prisma.bill.findMany({
                where: { budgetId: budget.id },
                orderBy: { dueDay: 'asc' }
            }),
            prisma.debt.findMany({
                where: { budgetId: budget.id },
                orderBy: { dueDay: 'asc' }
            })
        ])

        // Combine into calendar payments format
        const payments = [
            ...bills.map(bill => ({
                id: bill.id,
                name: bill.name,
                amount: bill.amount,
                day: bill.dueDay,
                type: 'bill' as const,
                isPaid: bill.isPaid
            })),
            ...debts.map(debt => ({
                id: debt.id,
                name: debt.creditor,
                amount: debt.monthlyPayment,
                day: debt.dueDay,
                type: 'debt' as const,
                isPaid: debt.isPaid
            }))
        ]

        return { success: true, data: payments }
    } catch (error) {
        console.error('Error fetching calendar payments:', error)
        return { success: false, error: 'Failed to fetch payments' }
    }
}
