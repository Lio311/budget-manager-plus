'use server'

import { prisma } from '@/lib/db'
import { currentUser } from '@clerk/nextjs/server'
import { revalidatePath } from 'next/cache'

async function checkAdmin() {
    const user = await currentUser()
    if (!user) throw new Error('Unauthorized')

    const isAdmin = user.publicMetadata?.role === 'admin'
    if (!isAdmin) throw new Error('Admin access required')

    return user
}

export async function getMaintenanceMode() {
    try {
        const settings = await prisma.siteSettings.findUnique({
            where: { id: 'site_settings' }
        })

        return settings?.maintenanceMode ?? false
    } catch (error) {
        console.error('Error getting maintenance mode:', error)
        return false
    }
}

export async function toggleMaintenanceMode() {
    try {
        await checkAdmin()

        const currentSettings = await prisma.siteSettings.findUnique({
            where: { id: 'site_settings' }
        })

        const newMode = !currentSettings?.maintenanceMode

        await prisma.siteSettings.upsert({
            where: { id: 'site_settings' },
            update: { maintenanceMode: newMode },
            create: { id: 'site_settings', maintenanceMode: newMode }
        })

        revalidatePath('/admin')

        return {
            success: true,
            maintenanceMode: newMode,
            message: newMode ? 'Maintenance mode enabled' : 'Maintenance mode disabled'
        }
    } catch (error) {
        console.error('Error toggling maintenance mode:', error)
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Failed to toggle maintenance mode'
        }
    }
}
