'use server'

import { prisma } from '@/lib/db'
import { getCurrentBudget } from './budget'
import { revalidatePath } from 'next/cache'

export async function getDebts(month: number, year: number) {
    try {
        const budget = await getCurrentBudget(month, year)

        const debts = await prisma.debt.findMany({
            where: { budgetId: budget.id },
            orderBy: { dueDay: 'asc' }
        })

        return { success: true, data: debts }
    } catch (error) {
        console.error('Error fetching debts:', error)
        return { success: false, error: 'Failed to fetch debts' }
    }
}

export async function addDebt(
    month: number,
    year: number,
    data: {
        creditor: string
        totalAmount: number
        monthlyPayment: number
        dueDay: number
    }
) {
    try {
        const budget = await getCurrentBudget(month, year)

        const debt = await prisma.debt.create({
            data: {
                budgetId: budget.id,
                creditor: data.creditor,
                totalAmount: data.totalAmount,
                monthlyPayment: data.monthlyPayment,
                dueDay: data.dueDay,
                isPaid: false
            }
        })

        revalidatePath('/dashboard')
        return { success: true, data: debt }
    } catch (error) {
        console.error('Error adding debt:', error)
        return { success: false, error: 'Failed to add debt' }
    }
}

export async function deleteDebt(id: string) {
    try {
        await prisma.debt.delete({
            where: { id }
        })

        revalidatePath('/dashboard')
        return { success: true }
    } catch (error) {
        console.error('Error deleting debt:', error)
        return { success: false, error: 'Failed to delete debt' }
    }
}

export async function toggleDebtPaid(id: string, isPaid: boolean) {
    try {
        await prisma.debt.update({
            where: { id },
            data: {
                isPaid,
                paidDate: isPaid ? new Date() : null
            }
        })

        revalidatePath('/dashboard')
        return { success: true }
    } catch (error) {
        console.error('Error toggling debt paid status:', error)
        return { success: false, error: 'Failed to update debt' }
    }
}
