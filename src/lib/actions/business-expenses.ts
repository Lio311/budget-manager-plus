'use server'

import { prisma } from '@/lib/db'
import { auth } from '@clerk/nextjs/server'
import { revalidatePath } from 'next/cache'
import { createManagementNotification } from './notifications'

// --- Campaigns ---

// --- Campaigns ---

export async function getCampaigns() {
    try {
        const { userId } = await auth()
        if (!userId) return { success: false, error: 'Unauthorized' }

        const campaigns = await prisma.marketingCampaign.findMany({
            where: { userId },
            orderBy: { startDate: 'desc' },
            include: {
                expenses: true // BusinessExpense[]
            }
        })

        return { success: true, data: campaigns }
    } catch (error) {
        console.error('Error fetching campaigns:', error)
        return { success: false, error: 'Failed to fetch campaigns' }
    }
}

export async function createCampaign(data: {
    name: string;
    type: string; // Changed from platform
    startDate: Date;
    endDate?: Date;
    cost?: number; // Budget/Cost
    status: string;
    priority: string;
    currency: string;
    paymentMethod: string;
    notes: string;
}) {
    try {
        const { userId } = await auth()
        if (!userId) return { success: false, error: 'Unauthorized' }

        // 1. Create Campaign
        const campaign = await prisma.marketingCampaign.create({
            data: {
                userId,
                name: data.name,
                type: data.type,
                status: data.status,
                priority: data.priority,
                startDate: data.startDate,
                endDate: data.endDate,
                cost: data.cost,
                currency: data.currency,
                paymentMethod: data.paymentMethod,
                notes: data.notes
            }
        })

        // 2. If valid cost, create BusinessExpense
        if (data.cost && data.cost > 0) {
            await prisma.businessExpense.create({
                data: {
                    userId,
                    description: `קמפיין: ${data.name}`,
                    amount: parseFloat(data.cost.toString()),
                    currency: data.currency || 'ILS', // Use campaign currency
                    date: data.startDate || new Date(),
                    category: 'Marketing',
                    campaignId: campaign.id,
                    paymentMethod: data.paymentMethod,
                }
            })
        }

        revalidatePath('/management/marketing')
        revalidatePath('/management/expenses')

        // Trigger Notification
        await createManagementNotification({
            type: 'CAMPAIGN_CREATED',
            title: 'קמפיין חדש נוצר',
            message: `נוצר קמפיין שיווק חדש: "${data.name}"`,
            link: '/management/marketing'
        })
        return { success: true, data: campaign }
    } catch (error) {
        console.error('Error creating campaign:', error)
        return { success: false, error: 'Failed to create campaign' }
    }
}

export async function deleteCampaign(id: string) {
    try {
        const { userId } = await auth()
        if (!userId) return { success: false, error: 'Unauthorized' }

        await prisma.marketingCampaign.delete({
            where: { id }
        })

        revalidatePath('/management/marketing')
        revalidatePath('/management/expenses')
        return { success: true }
    } catch (error) {
        console.error('Error deleting campaign:', error)
        return { success: false, error: 'Failed to delete campaign' }
    }
}

export async function updateCampaign(id: string, data: any) {
    try {
        const { userId } = await auth()
        if (!userId) return { success: false, error: 'Unauthorized' }

        const campaign = await prisma.marketingCampaign.update({
            where: { id },
            data
        })

        revalidatePath('/management/marketing')
        revalidatePath('/management/expenses')
        return { success: true, data: campaign }
    } catch (error) {
        console.error('Error updating campaign:', error)
        return { success: false, error: 'Failed to update campaign' }
    }
}

// --- Business Expenses ---

export async function getBusinessExpenses() {
    try {
        const { userId } = await auth()
        if (!userId) return { success: false, error: 'Unauthorized' }

        const expenses = await prisma.businessExpense.findMany({
            where: { userId },
            orderBy: { date: 'desc' },
            include: {
                campaign: {
                    select: { name: true }
                }
            }
        })

        return { success: true, data: expenses }
    } catch (error) {
        console.error('Error fetching business expenses:', error)
        return { success: false, error: 'Failed to fetch business expenses' }
    }
}

export async function createBusinessExpense(data: any) {
    try {
        const { userId } = await auth()
        if (!userId) return { success: false, error: 'Unauthorized' }

        const expense = await prisma.businessExpense.create({
            data: {
                userId,
                description: data.description,
                amount: parseFloat(data.amount),
                currency: data.currency || 'ILS',
                date: data.date || new Date(),
                category: data.category || 'General',
                paymentMethod: data.paymentMethod,
                notes: data.notes,
                campaignId: data.campaignId || undefined // Was marketingCampaignId
            }
        })

        revalidatePath('/management/expenses')
        revalidatePath('/management/marketing')
        revalidatePath('/management') // Update overview stats
        return { success: true, data: expense }
    } catch (error) {
        console.error('Error creating business expense:', error)
        return { success: false, error: 'Failed to create business expense' }
    }
}

export async function deleteBusinessExpense(id: string) {
    try {
        const { userId } = await auth()
        if (!userId) return { success: false, error: 'Unauthorized' }

        await prisma.businessExpense.delete({
            where: { id }
        })

        revalidatePath('/management/expenses')
        revalidatePath('/management/marketing')
        revalidatePath('/management')
        return { success: true }
    } catch (error) {
        console.error('Error deleting business expense:', error)
        return { success: false, error: 'Failed to delete business expense' }
    }
}

export async function updateBusinessExpense(id: string, data: any) {
    try {
        const { userId } = await auth()
        if (!userId) return { success: false, error: 'Unauthorized' }

        const expense = await prisma.businessExpense.update({
            where: { id },
            data: {
                description: data.description,
                amount: parseFloat(data.amount),
                currency: data.currency || 'ILS',
                date: data.date,
                category: data.category,
                paymentMethod: data.paymentMethod,
                notes: data.notes,
            },
            include: {
                campaign: {
                    select: { name: true }
                }
            }
        })

        revalidatePath('/management/expenses')
        revalidatePath('/management/marketing')
        revalidatePath('/management')
        return { success: true, data: expense }
    } catch (error) {
        console.error('Error updating business expense:', error)
        return { success: false, error: 'Failed to update business expense' }
    }
}
