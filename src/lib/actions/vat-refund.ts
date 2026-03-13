'use server'

import { prisma, authenticatedPrisma } from '@/lib/db'
import { getCurrentBudget } from './budget'
import { revalidatePath } from 'next/cache'
import { auth } from '@clerk/nextjs/server'

export async function getManualVatRefundAttachment(id: string) {
    try {
        const { userId } = await auth();
        if (!userId) return { success: false, error: 'Unauthorized' };

        const db = await authenticatedPrisma(userId);
        const refund = await db.manualVatRefund.findUnique({
            where: { id },
            select: { attachmentUrl: true }
        })

        if (!refund) return { success: false, error: 'Refund not found' }
        return { success: true, data: refund.attachmentUrl }
    } catch (error) {
        console.error('Error fetching refund attachment:', error)
        return { success: false, error: 'Failed to fetch attachment' }
    }
}

export async function getManualVatRefunds(month: number, year: number) {
    try {
        const { userId } = await auth();
        if (!userId) return { success: false, error: 'Unauthorized' };

        const budget = await getCurrentBudget(month, year, '₪', 'BUSINESS')
        const db = await authenticatedPrisma(userId);

        const refunds = await db.manualVatRefund.findMany({
            where: { budgetId: budget.id },
            select: {
                id: true,
                amount: true,
                description: true,
                date: true,
                budgetId: true,
                createdAt: true,
                updatedAt: true
                // Exclude attachmentUrl here
            },
            orderBy: { date: 'desc' }
        })

        return { success: true, data: refunds }
    } catch (error) {
        console.error('Error fetching manual VAT refunds:', error)
        return { success: false, error: 'Failed to fetch refunds' }
    }
}

export async function addManualVatRefund(
    month: number,
    year: number,
    data: {
        amount: number
        description: string
        date: string
        attachmentUrl?: string | null
    }
) {
    try {
        const { userId } = await auth();
        if (!userId) return { success: false, error: 'Unauthorized' };

        const budget = await getCurrentBudget(month, year, '₪', 'BUSINESS')
        const db = await authenticatedPrisma(userId);

        const refund = await db.manualVatRefund.create({
            data: {
                budgetId: budget.id,
                amount: data.amount,
                description: data.description,
                date: new Date(data.date),
                attachmentUrl: data.attachmentUrl
            },
            select: {
                id: true,
                budgetId: true,
                amount: true,
                description: true,
                date: true,
                createdAt: true,
                updatedAt: true
            }
        })

        revalidatePath('/')
        return { success: true, data: refund }
    } catch (error) {
        console.error('Error adding manual VAT refund:', error)
        return { success: false, error: 'Failed to add refund' }
    }
}

export async function updateManualVatRefund(
    id: string,
    data: {
        amount?: number
        description?: string
        date?: string
        attachmentUrl?: string | null
    }
) {
    try {
        const { userId } = await auth();
        if (!userId) return { success: false, error: 'Unauthorized' };

        const db = await authenticatedPrisma(userId);

        const refund = await db.manualVatRefund.update({
            where: { id },
            data: {
                ...(data.amount !== undefined && { amount: data.amount }),
                ...(data.description !== undefined && { description: data.description }),
                ...(data.date !== undefined && { date: new Date(data.date) }),
                ...(data.attachmentUrl !== undefined && { attachmentUrl: data.attachmentUrl })
            },
            select: {
                id: true,
                budgetId: true,
                amount: true,
                description: true,
                date: true,
                createdAt: true,
                updatedAt: true
            }
        })

        revalidatePath('/')
        return { success: true, data: refund }
    } catch (error) {
        console.error('Error updating manual VAT refund:', error)
        return { success: false, error: 'Failed to update refund' }
    }
}

export async function deleteManualVatRefund(id: string) {
    try {
        const { userId } = await auth();
        if (!userId) return { success: false, error: 'Unauthorized' };

        const db = await authenticatedPrisma(userId);

        await db.manualVatRefund.delete({
            where: { id }
        })

        revalidatePath('/')
        return { success: true }
    } catch (error) {
        console.error('Error deleting manual VAT refund:', error)
        return { success: false, error: 'Failed to delete refund' }
    }
}
