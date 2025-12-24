'use server'

import { prisma } from '@/lib/db'
import { getCurrentBudget } from './budget'
import { revalidatePath } from 'next/cache'

export async function getBills(month: number, year: number) {
    try {
        const budget = await getCurrentBudget(month, year)

        const bills = await prisma.bill.findMany({
            where: { budgetId: budget.id },
            orderBy: { dueDate: 'asc' }
        })

        return { success: true, data: bills }
    } catch (error) {
        console.error('Error fetching bills:', error)
        return { success: false, error: 'Failed to fetch bills' }
    }
}

export async function addBill(
    month: number,
    year: number,
    data: { name: string; amount: number; dueDay: number }
) {
    try {
        const budget = await getCurrentBudget(month, year)

        // Create date object for the specific day in the budget month
        const dueDate = new Date(year, month - 1, data.dueDay)

        const bill = await prisma.bill.create({
            data: {
                budgetId: budget.id,
                name: data.name,
                amount: data.amount,
                dueDate: dueDate,
                isPaid: false
            }
        })

        revalidatePath('/dashboard')
        return { success: true, data: bill }
    } catch (error) {
        console.error('Error adding bill:', error)
        return { success: false, error: 'Failed to add bill' }
    }
}

export async function updateBill(
    id: string,
    data: {
        name?: string
        amount?: number
        dueDay?: number
    }
) {
    try {
        const existingBill = await prisma.bill.findUnique({ where: { id } })
        if (!existingBill) return { success: false, error: 'Bill not found' }

        let newDueDate = undefined
        if (data.dueDay) {
            const currentDate = new Date(existingBill.dueDate)
            newDueDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), data.dueDay)
        }

        const bill = await prisma.bill.update({
            where: { id },
            data: {
                ...(data.name && { name: data.name }),
                ...(data.amount && { amount: data.amount }),
                ...(newDueDate && { dueDate: newDueDate })
            }
        })

        revalidatePath('/dashboard')
        return { success: true, data: bill }
    } catch (error) {
        console.error('Error updating bill:', error)
        return { success: false, error: 'Failed to update bill' }
    }
}

export async function toggleBillPaid(id: string, isPaid: boolean) {
    try {
        const bill = await prisma.bill.update({
            where: { id },
            data: {
                isPaid,
                paidDate: isPaid ? new Date() : null
            }
        })

        revalidatePath('/dashboard')
        return { success: true, data: bill }
    } catch (error) {
        console.error('Error updating bill:', error)
        return { success: false, error: 'Failed to update bill' }
    }
}

export async function deleteBill(id: string) {
    try {
        await prisma.bill.delete({
            where: { id }
        })

        revalidatePath('/dashboard')
        return { success: true }
    } catch (error) {
        console.error('Error deleting bill:', error)
        return { success: false, error: 'Failed to delete bill' }
    }
}
