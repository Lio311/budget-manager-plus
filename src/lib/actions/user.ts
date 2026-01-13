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

export async function markOnboardingSeen() {
    try {
        const { userId } = await auth()
        if (!userId) return { success: false }

        await prisma.user.update({
            where: { id: userId },
            data: { hasSeenOnboarding: true }
        })

        return { success: true }
    } catch (error) {
        console.error('Error marking onboarding seen:', error)
        return { success: false }
    }
}

export async function getOnboardingStatus() {
    try {
        const { userId } = await auth()
        if (!userId) return false

        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: {
                hasSeenOnboarding: true,
                createdAt: true
            }
        })

        if (!user) return true // User not found, treat as seen to avoid errors

        // If already seen, return true (seen)
        if (user.hasSeenOnboarding) return true

        // check if created today
        const now = new Date()
        const created = new Date(user.createdAt)
        const isCreatedToday =
            now.getDate() === created.getDate() &&
            now.getMonth() === created.getMonth() &&
            now.getFullYear() === created.getFullYear()

        // If NOT created today, return true (treat as seen/don't show)
        if (!isCreatedToday) return true

        return false // Not seen AND created today -> Show popup
    } catch (error) {
        return true // Error -> treat as seen
    }
}

export async function syncUser(userId: string, email: string) {
    console.log('[syncUser] Syncing user:', userId, email)
    try {
        // Try to create/update normally
        const user = await prisma.user.upsert({
            where: { id: userId },
            update: { email }, // Ensure email is up to date
            create: {
                id: userId,
                email
            }
        })
        console.log('[syncUser] User synced successfully:', user.id)
        return user
    } catch (error: any) {
        // Handle "Unique constraint failed on email" (P2002)
        if (error.code === 'P2002' && error.meta?.target?.includes('email')) {
            console.warn('[syncUser] Email collision detected. User ID changed? Attempting to recover/merge.')

            // Find the existing user with this email
            const existingUser = await prisma.user.findUnique({
                where: { email }
            })

            if (existingUser) {
                console.log('[syncUser] Found existing user with old ID:', existingUser.id)
                // We have a mismatch: existingUser.id !== userId

                try {
                    // Update the existing user's ID to the new userId
                    // This works because the new userId is unused (upsert create failed)
                    // Note: This relies on database ON UPDATE CASCADE for foreign keys if they exist
                    const updatedUser = await prisma.user.update({
                        where: { email }, // Use email to identify the record
                        data: { id: userId }
                    })
                    console.log('[syncUser] Recovered user account. Updated ID from', existingUser.id, 'to', userId)
                    return updatedUser
                } catch (updateError) {
                    console.error('[syncUser] Failed to update user ID during recovery:', updateError)
                    throw updateError
                }
            }
        }

        console.error('[syncUser] Critical error syncing user:', error)
        throw error
    }
}
