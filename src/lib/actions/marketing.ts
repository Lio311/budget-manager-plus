'use server'

import { prisma } from '@/lib/db'
import { auth } from '@clerk/nextjs/server'
import { revalidatePath } from 'next/cache'

// --- Campaigns ---

export async function getCampaigns() {
    try {
        const { userId } = await auth()
        if (!userId) return { success: false, error: 'Unauthorized' }

        const campaigns = await prisma.marketingCampaign.findMany({
            where: { userId },
            orderBy: { createdAt: 'desc' },
            include: {
                marketingExpenses: true
            }
        })

        return { success: true, data: campaigns }
    } catch (error) {
        console.error('Error fetching campaigns:', error)
        return { success: false, error: 'Failed to fetch campaigns' }
    }
}

export async function createCampaign(data: any) {
    try {
        const { userId } = await auth()
        if (!userId) return { success: false, error: 'Unauthorized' }

        // 1. Create Campaign
        const campaign = await prisma.marketingCampaign.create({
            data: {
                ...data,
                userId
            }
        })

        // 2. If valid cost, create MarketingExpense (Separate from Business Budget)
        if (data.cost && data.cost > 0) {
            await prisma.marketingExpense.create({
                data: {
                    userId,
                    title: `קמפיין: ${data.name}`,
                    amount: parseFloat(data.cost),
                    currency: data.currency || 'ILS',
                    date: data.startDate || new Date(),
                    category: 'קמפיינים',
                    marketingCampaignId: campaign.id,
                    paymentMethod: data.paymentMethod,
                    notes: data.notes
                }
            })
        }

        revalidatePath('/management/marketing')
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

        // MarketingExpenses will be set to null or deleted depending on requirement.
        // Currently Schema says SetNull for relation. We might want to keep independent expenses.

        await prisma.marketingCampaign.delete({
            where: { id }
        })

        revalidatePath('/management/marketing')
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
        return { success: true, data: campaign }
    } catch (error) {
        console.error('Error updating campaign:', error)
        return { success: false, error: 'Failed to update campaign' }
    }
}

// --- Marketing Expenses ---

export async function getMarketingExpenses() {
    try {
        const { userId } = await auth()
        if (!userId) return { success: false, error: 'Unauthorized' }

        const expenses = await prisma.marketingExpense.findMany({
            where: { userId },
            orderBy: { date: 'desc' },
            include: {
                marketingCampaign: {
                    select: { name: true }
                }
            }
        })

        return { success: true, data: expenses }
    } catch (error) {
        console.error('Error fetching marketing expenses:', error)
        return { success: false, error: 'Failed to fetch marketing expenses' }
    }
}

export async function createMarketingExpense(data: any) {
    try {
        const { userId } = await auth()
        if (!userId) return { success: false, error: 'Unauthorized' }

        const expense = await prisma.marketingExpense.create({
            data: {
                userId,
                title: data.title,
                amount: parseFloat(data.amount),
                currency: data.currency || 'ILS',
                date: data.date || new Date(),
                category: data.category || 'כללי',
                paymentMethod: data.paymentMethod,
                notes: data.notes,
                marketingCampaignId: data.marketingCampaignId || undefined
            }
        })

        revalidatePath('/management/marketing')
        return { success: true, data: expense }
    } catch (error) {
        console.error('Error creating marketing expense:', error)
        return { success: false, error: 'Failed to create marketing expense' }
    }
}

export async function deleteMarketingExpense(id: string) {
    try {
        const { userId } = await auth()
        if (!userId) return { success: false, error: 'Unauthorized' }

        await prisma.marketingExpense.delete({
            where: { id }
        })

        revalidatePath('/management/marketing')
        return { success: true }
    } catch (error) {
        console.error('Error deleting marketing expense:', error)
        return { success: false, error: 'Failed to delete marketing expense' }
    }
}
