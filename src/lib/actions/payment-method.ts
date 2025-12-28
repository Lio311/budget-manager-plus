'use server'

import { auth } from '@clerk/nextjs/server'
import { prisma, authenticatedPrisma } from '@/lib/db'
import { revalidatePath } from 'next/cache'

export async function getPaymentMethods() {
    try {
        const { userId } = await auth()
        if (!userId) return { success: false, error: 'User not authenticated' }

        const db = await authenticatedPrisma(userId)

        const methods = await db.userPaymentMethod.findMany({
            where: { userId },
            orderBy: { name: 'asc' }
        })

        return { success: true, data: methods }
    } catch (error) {
        console.error('Failed to fetch payment methods:', error)
        return { success: false, error: 'Failed to fetch payment methods' }
    }
}

export async function addPaymentMethod(name: string) {
    try {
        const { userId } = await auth()
        if (!userId) return { success: false, error: 'User not authenticated' }

        const db = await authenticatedPrisma(userId)

        // Check if exists
        const existing = await db.userPaymentMethod.findFirst({
            where: { userId, name }
        })

        if (existing) {
            return { success: true, data: existing }
        }

        const method = await db.userPaymentMethod.create({
            data: {
                userId,
                name: name.trim()
            }
        })


        revalidatePath('/')
        return { success: true, data: method }
    } catch (error) {
        console.error('Failed to add payment method:', error)
        return { success: false, error: 'Failed to add payment method' }
    }
}
