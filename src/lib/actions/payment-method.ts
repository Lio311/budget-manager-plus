'use server'

import { auth } from '@clerk/nextjs'
import { prisma } from '@/lib/db'
import { revalidatePath } from 'next/cache'

export async function getPaymentMethods() {
    try {
        const { userId } = auth()
        if (!userId) return { success: false, error: 'User not authenticated' }

        const methods = await prisma.userPaymentMethod.findMany({
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
        const { userId } = auth()
        if (!userId) return { success: false, error: 'User not authenticated' }

        // Check if exists
        const existing = await prisma.userPaymentMethod.findFirst({
            where: { userId, name }
        })

        if (existing) {
            return { success: true, data: existing }
        }

        const method = await prisma.userPaymentMethod.create({
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
