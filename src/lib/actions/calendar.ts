'use server'

import { prisma, authenticatedPrisma } from '@/lib/db'
import { getCurrentBudget } from './budget'
import { auth } from '@clerk/nextjs/server'

export async function getCalendarPayments(month: number, year: number) {
    try {
        const { userId } = await auth()
        if (!userId) {
            return { success: false, error: 'Unauthorized' }
        }

        const db = await authenticatedPrisma(userId)

        const budget = await getCurrentBudget(month, year)

        // Get bills, debts, income, expenses, and savings for the month
        const [bills, debts, incomes, expenses, savings] = await Promise.all([
            db.bill.findMany({
                where: { budgetId: budget.id },
                orderBy: { dueDate: 'asc' }
            }),
            db.debt.findMany({
                where: { budgetId: budget.id },
                orderBy: { dueDay: 'asc' }
            }),
            db.income.findMany({
                where: { budgetId: budget.id },
                orderBy: { date: 'asc' }
            }),
            db.expense.findMany({
                where: { budgetId: budget.id },
                orderBy: { date: 'asc' }
            }),
            db.saving.findMany({
                where: { budgetId: budget.id },
                orderBy: { createdAt: 'asc' }
            })
        ])

        // Combine into calendar payments format
        const payments = [
            ...bills.map(bill => ({
                id: bill.id,
                name: bill.name,
                amount: bill.amount,
                day: new Date(bill.dueDate).getDate(),
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
            })),
            ...incomes.map(income => ({
                id: income.id,
                name: income.source,
                amount: income.amount,
                day: income.date ? income.date.getDate() : 1,
                type: 'income' as const,
                isPaid: true // Income doesn't have paid status
            })),
            ...expenses.map(expense => ({
                id: expense.id,
                name: expense.description || 'הוצאה',
                amount: expense.amount,
                day: expense.date ? expense.date.getDate() : 1,
                type: 'expense' as const,
                isPaid: true // Expenses don't have paid status
            })),
            ...savings.map(saving => ({
                id: saving.id,
                name: saving.name,
                amount: saving.monthlyDeposit || 0,
                day: saving.createdAt.getDate(),
                type: 'saving' as const,
                isPaid: true // Savings don't have paid status
            }))
        ]

        return { success: true, data: payments }
    } catch (error) {
        console.error('Error fetching calendar payments:', error)
        return { success: false, error: 'Failed to fetch payments' }
    }
}
