'use server'

import { prisma } from '@/lib/db'
import { getCurrentBudget } from './budget'

export async function getCalendarPayments(month: number, year: number) {
    try {
        const budget = await getCurrentBudget(month, year)

        // Get bills, debts, income, expenses, and savings for the month
        const [bills, debts, incomes, expenses, savings] = await Promise.all([
            prisma.bill.findMany({
                where: { budgetId: budget.id },
                orderBy: { dueDay: 'asc' }
            }),
            prisma.debt.findMany({
                where: { budgetId: budget.id },
                orderBy: { dueDay: 'asc' }
            }),
            prisma.income.findMany({
                where: { budgetId: budget.id },
                orderBy: { date: 'asc' }
            }),
            prisma.expense.findMany({
                where: { budgetId: budget.id },
                orderBy: { date: 'asc' }
            }),
            prisma.saving.findMany({
                where: { budgetId: budget.id },
                orderBy: { date: 'asc' }
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
                name: expense.description,
                amount: expense.amount,
                day: expense.date ? expense.date.getDate() : 1,
                type: 'expense' as const,
                isPaid: true // Expenses don't have paid status
            })),
            ...savings.map(saving => ({
                id: saving.id,
                name: saving.description,
                amount: saving.monthlyDeposit,
                day: saving.date.getDate(),
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
