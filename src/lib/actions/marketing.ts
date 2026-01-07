'use server'

import { prisma } from '@/lib/db'
import { auth } from '@clerk/nextjs/server'
import { revalidatePath } from 'next/cache'
import { convertToILS } from '@/lib/currency'

// Define types locally if Prisma types aren't generated yet
// import { MarketingCampaign } from '@prisma/client'

export async function getCampaigns() {
    try {
        const { userId } = await auth()
        if (!userId) return { success: false, error: 'Unauthorized' }

        const campaigns = await prisma.marketingCampaign.findMany({
            where: { userId },
            orderBy: { createdAt: 'desc' },
            include: {
                expenses: true
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

        // 2. If valid cost, create Expense
        if (data.cost && data.cost > 0) {
            // Find current Business Budget
            const now = new Date()
            const month = now.getMonth() + 1
            const year = now.getFullYear()

            let budget = await prisma.budget.findFirst({
                where: {
                    userId,
                    month,
                    year,
                    type: 'BUSINESS'
                }
            })

            // If no budget exists, we might need to create one or skip expense
            // For now, we'll try to find it. If not found, we skip auto-expense (or logic to create budget)
            if (budget) {
                await prisma.expense.create({
                    data: {
                        budgetId: budget.id,
                        category: 'שיווק', // Default category
                        amount: data.cost,
                        currency: data.currency || 'ILS',
                        description: `קמפיין: ${data.name}`,
                        date: data.startDate || now,
                        expenseType: 'OPEX',
                        marketingCampaignId: campaign.id,
                        paymentMethod: data.paymentMethod
                    }
                })
            }
        }

        revalidatePath('/management/marketing')
        revalidatePath('/management/expenses')
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
