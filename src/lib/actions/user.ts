'use server'

import { prisma } from '@/lib/db'
import { auth } from '@clerk/nextjs/server'
import { revalidatePath } from 'next/cache'

export async function updateUserSettings(data: {
    initialBalance?: number;
    initialSavings?: number;
    businessInitialBalance?: number;
    businessInitialSavings?: number;
}) {
    try {
        const { userId } = await auth()
        if (!userId) {
            return { success: false, error: 'Unauthorized' }
        }

        const user = await prisma.user.update({
            where: { id: userId },
            data: {
                ...data
            }
        })

        revalidatePath('/')
        return { success: true, data: user }
    } catch (error) {
        console.error('Error updating user settings:', error)
        return { success: false, error: 'Failed to update settings' }
    }
}

export async function getUserSettings() {
    try {
        const { userId } = await auth()
        if (!userId) {
            return { success: false, error: 'Unauthorized' }
        }

        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: {
                initialBalance: true,
                initialSavings: true,
                businessInitialBalance: true,
                businessInitialSavings: true
            }
        })

        return { success: true, data: user };

    } catch (error) {
        console.error('Error fetching settings:', error)
        return { success: false, error: 'Failed to fetch settings' }
    }
}

export async function generateShortcutApiKey() {
    try {
        const { userId } = await auth()
        if (!userId) return { success: false, error: 'Unauthorized' }

        // Generate a random key (sk- + 32 chars)
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
        let key = 'sk-'
        for (let i = 0; i < 32; i++) {
            key += chars.charAt(Math.floor(Math.random() * chars.length))
        }

        await prisma.user.update({
            where: { id: userId },
            data: { shortcutApiKey: key }
        })

        revalidatePath('/')
        return { success: true, key }
    } catch (error) {
        console.error('Error generating API Key:', error)
        return { success: false, error: 'Failed to generate key' }
    }
}


export async function getShortcutApiKey() {
    try {
        const { userId } = await auth()
        if (!userId) return { success: false, error: 'Unauthorized' }

        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: { shortcutApiKey: true }
        })

        return { success: true, key: user?.shortcutApiKey }
    } catch (error) {
        console.error('Error fetching API Key:', error)
        return { success: false, error: 'Failed to fetch key' }
    }
}

export async function getUserSubscriptionStatus() {
    try {
        const { userId } = await auth()
        if (!userId) return null

        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: {
                trialEndsAt: true,
                subscriptions: {
                    where: { status: 'active' },
                    select: {
                        endDate: true,
                        planType: true
                    }
                }
            }
        })

        if (!user) return null

        return {
            trialEndsAt: user.trialEndsAt,
            activeSubscription: user.subscriptions[0] || null
        }
    } catch (error) {
        console.error('Error fetching subscription status:', error)
        return null
    }
}
