'use server'

import { currentUser } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'

const ADMIN_EMAILS = ['lior31197@gmail.com', 'ron.kor97@gmail.com']

/**
 * Check if current user is admin
 */
export async function isUserAdmin(): Promise<boolean> {
    try {
        const user = await currentUser()
        const userEmail = user?.emailAddresses[0]?.emailAddress?.toLowerCase()
        return !!userEmail && ADMIN_EMAILS.includes(userEmail)
    } catch (error) {
        return false
    }
}

/**
 * Get the current maintenance mode status
 * Checks both environment variable (for emergency override) and database
 */
export async function getMaintenanceMode(): Promise<boolean> {
    try {
        // DB check first
        const config = await prisma.siteConfig.findUnique({
            where: { id: 'default' }
        })

        const dbStatus = config?.maintenanceMode || false
        const envStatus = process.env.MAINTENANCE_MODE === 'true'

        return dbStatus || envStatus
    } catch (error) {
        console.error('Error fetching maintenance mode:', error)
        // Fallback to env variable if DB fails
        return process.env.MAINTENANCE_MODE === 'true'
    }
}

/**
 * Toggle maintenance mode in the database
 */
export async function toggleMaintenanceMode(enabled: boolean): Promise<{ success: boolean; status?: boolean }> {
    try {
        const isAdmin = await isUserAdmin()
        if (!isAdmin) {
            console.error('Unauthorized maintenance toggle attempt')
            throw new Error('Unauthorized')
        }

        const config = await prisma.siteConfig.upsert({
            where: { id: 'default' },
            update: { maintenanceMode: enabled },
            create: { id: 'default', maintenanceMode: enabled }
        })

        revalidatePath('/')
        revalidatePath('/admin')

        return { success: true, status: config.maintenanceMode }
    } catch (error) {
        console.error('Error toggling maintenance mode:', error)
        return { success: false }
    }
}
