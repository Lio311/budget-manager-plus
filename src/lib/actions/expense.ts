'use server'

import { prisma } from '@/lib/db'
import { getCurrentBudget } from './budget'
import { revalidatePath } from 'next/cache'

export async function getExpenses(month: number, year: number) {
    try {
        const budget = await getCurrentBudget(month, year)

        const expenses = await prisma.expense.findMany({
            where: { budgetId: budget.id },
            orderBy: { date: 'desc' }
        })

        return { success: true, data: expenses }
    } catch (error) {
        console.error('Error fetching expenses:', error)
        return { success: false, error: 'Failed to fetch expenses' }
    }
}

export async function addExpense(
    month: number,
    year: number,
    data: { category: string; description: string; amount: number; date: string }
) {
    try {
        const budget = await getCurrentBudget(month, year)

        const expense = await prisma.expense.create({
            data: {
                budgetId: budget.id,
                category: data.category,
                description: data.description,
                amount: data.amount,
                date: new Date(data.date)
            }
        })

        revalidatePath('/dashboard')
        return { success: true, data: expense }
    } catch (error) {
        console.error('Error adding expense:', error)
        return { success: false, error: 'Failed to add expense' }
    }
}

export async function deleteExpense(id: string) {
    try {
        await prisma.expense.delete({
            where: { id }
        })

        revalidatePath('/dashboard')
        return { success: true }
    } catch (error) {
        console.error('Error deleting expense:', error)
        return { success: false, error: 'Failed to delete expense' }
    }
}
