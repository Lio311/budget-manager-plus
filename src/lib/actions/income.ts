'use server'

import { prisma } from '@/lib/db'
import { getCurrentBudget } from './budget'
import { revalidatePath } from 'next/cache'

export async function getIncomes(month: number, year: number) {
    try {
        const budget = await getCurrentBudget(month, year)

        const incomes = await prisma.income.findMany({
            where: { budgetId: budget.id },
            orderBy: { date: 'desc' }
        })

        return { success: true, data: incomes }
    } catch (error) {
        console.error('Error fetching incomes:', error)
        return { success: false, error: 'Failed to fetch incomes' }
    }
}

export async function addIncome(
    month: number,
    year: number,
    data: { source: string; amount: number; date?: string }
) {
    try {
        const budget = await getCurrentBudget(month, year)

        const income = await prisma.income.create({
            data: {
                budgetId: budget.id,
                source: data.source,
                amount: data.amount,
                date: data.date ? new Date(data.date) : null
            }
        })

        revalidatePath('/dashboard')
        return { success: true, data: income }
    } catch (error) {
        console.error('Error adding income:', error)
        return { success: false, error: 'Failed to add income' }
    }
}

export async function deleteIncome(id: string) {
    try {
        await prisma.income.delete({
            where: { id }
        })

        revalidatePath('/dashboard')
        return { success: true }
    } catch (error) {
        console.error('Error deleting income:', error)
        return { success: false, error: 'Failed to delete income' }
    }
}
