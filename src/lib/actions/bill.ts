'use server'

import { prisma, authenticatedPrisma } from '@/lib/db'
import { getCurrentBudget } from './budget'
import { revalidatePath } from 'next/cache'
import { auth } from '@clerk/nextjs/server'

import { convertToILS } from '@/lib/currency'

export async function getBills(month: number, year: number, type: 'PERSONAL' | 'BUSINESS' = 'PERSONAL') {
    try {
        const { userId } = await auth();
        if (!userId) return { success: false, error: 'Unauthorized' };

        const db = await authenticatedPrisma(userId);
        const budget = await getCurrentBudget(month, year, '₪', type)

        const bills = await db.bill.findMany({
            where: { budgetId: budget.id },
            orderBy: { dueDate: 'asc' }
        })

        // Calculate totals in ILS
        let totalILS = 0
        let totalPaidILS = 0
        let totalUnpaidILS = 0

        for (const bill of bills) {
            const amountInILS = await convertToILS(bill.amount, bill.currency)
            totalILS += amountInILS

            if (bill.isPaid) {
                totalPaidILS += amountInILS
            } else {
                totalUnpaidILS += amountInILS
            }
        }

        return { success: true, data: { bills, totalILS, totalPaidILS, totalUnpaidILS } }
    } catch (error) {
        console.error('Error fetching bills:', error)
        return { success: false, error: 'Failed to fetch bills' }
    }
}

export async function addBill(
    month: number,
    year: number,
    data: { name: string; amount: number; currency: string; dueDay: number; paymentMethod?: string },
    type: 'PERSONAL' | 'BUSINESS' = 'PERSONAL'
) {
    try {
        const budget = await getCurrentBudget(month, year, '₪', type)

        // Create date object for the specific day in the budget month
        const dueDate = new Date(year, month - 1, data.dueDay)

        const { userId } = await auth();
        if (!userId) return { success: false, error: 'Unauthorized' };
        const db = await authenticatedPrisma(userId);

        const bill = await db.bill.create({
            data: {
                budgetId: budget.id,
                name: data.name,
                amount: data.amount,
                currency: data.currency,
                dueDate: dueDate,
                isPaid: false,
                paymentMethod: data.paymentMethod
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
        currency?: string
        dueDay?: number
        paymentMethod?: string
    }
) {
    try {
        const { userId } = await auth();
        if (!userId) return { success: false, error: 'Unauthorized' };
        const db = await authenticatedPrisma(userId);

        const existingBill = await db.bill.findUnique({ where: { id } })
        if (!existingBill) return { success: false, error: 'Bill not found' }

        let newDueDate = undefined
        if (data.dueDay) {
            const currentDate = new Date(existingBill.dueDate)
            newDueDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), data.dueDay)
        }

        const bill = await db.bill.update({
            where: { id },
            data: {
                ...(data.name && { name: data.name }),
                ...(data.amount && { amount: data.amount }),
                ...(data.currency && { currency: data.currency }),
                ...(newDueDate && { dueDate: newDueDate }),
                ...(data.paymentMethod !== undefined && { paymentMethod: data.paymentMethod })
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
        const { userId } = await auth();
        if (!userId) return { success: false, error: 'Unauthorized' };
        const db = await authenticatedPrisma(userId);

        const bill = await db.bill.update({
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
        const { userId } = await auth();
        if (!userId) return { success: false, error: 'Unauthorized' };
        const db = await authenticatedPrisma(userId);

        await db.bill.delete({
            where: { id }
        })

        revalidatePath('/dashboard')
        return { success: true }
    } catch (error) {
        console.error('Error deleting bill:', error)
        return { success: false, error: 'Failed to delete bill' }
    }
}
