'use server'

import { prisma } from '@/lib/db'
import { auth } from '@clerk/nextjs/server'
import { revalidatePath } from 'next/cache'

export async function updateUserSettings(data: { initialBalance?: number; initialSavings?: number }) {
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
                initialSavings: true
            }
        })

        return { success: true, data: user }
    } catch (error) {
        console.error('Error fetching user settings:', error)
        return { success: false, error: 'Failed to fetch settings' }
    }
}
