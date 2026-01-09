'use server'

import { prisma } from '@/lib/db'

export async function logVisitorLocation(city: string, country?: string) {
    try {
        if (!city) return { success: false }

        await prisma.visitorLog.create({
            data: {
                city,
                country
            }
        })

        return { success: true }
    } catch (error) {
        console.error('Error logging visitor location:', error)
        return { success: false }
    }
}
