'use server'

import { prisma } from '@/lib/db'
import { getCurrentBudget } from './budget'
import { revalidatePath } from 'next/cache'

export async function getSavings(month: number, year: number) {
    try {
        const budget = await getCurrentBudget(month, year)

        const savings = await prisma.saving.findMany({
            where: { budgetId: budget.id },
            orderBy: { date: 'desc' }
        })

        return { success: true, data: savings }
    } catch (error) {
        console.error('Error fetching savings:', error)
        return { success: false, error: 'Failed to fetch savings' }
    }
}

export async function addSaving(
    month: number,
    year: number,
    data: {
        type: string
        description: string
        monthlyDeposit: number
        goal?: string
        date: Date
    }
) {
    try {
        const budget = await getCurrentBudget(month, year)

        const saving = await prisma.saving.create({
            data: {
                budgetId: budget.id,
                type: data.type,
                description: data.description,
                monthlyDeposit: data.monthlyDeposit,
                goal: data.goal,
                date: data.date
            }
        })

        revalidatePath('/dashboard')
        return { success: true, data: saving }
    } catch (error) {
        console.error('Error adding saving:', error)
        return { success: false, error: 'Failed to add saving' }
    }
}

export async function updateSaving(
    id: string,
    data: {
        type?: string
        description?: string
        monthlyDeposit?: number
        goal?: string
        date?: Date
    }
) {
    try {
        const saving = await prisma.saving.update({
            where: { id },
            data
        })

        revalidatePath('/dashboard')
        return { success: true, data: saving }
    } catch (error) {
        console.error('Error updating saving:', error)
        return { success: false, error: 'Failed to update saving' }
    }
}

export async function deleteSaving(id: string) {
    try {
        await prisma.saving.delete({
            where: { id }
        })

        revalidatePath('/dashboard')
        return { success: true }
    } catch (error) {
        console.error('Error deleting saving:', error)
        return { success: false, error: 'Failed to delete saving' }
    }
}
