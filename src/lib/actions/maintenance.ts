'use server'

import { currentUser } from '@clerk/nextjs/server'

/**
 * Get the current maintenance mode status from environment variable
 */
export async function getMaintenanceMode(): Promise<boolean> {
    return process.env.MAINTENANCE_MODE === 'true'
}

/**
 * Check if current user is admin
 */
export async function isUserAdmin(): Promise<boolean> {
    try {
        const user = await currentUser()
        return user?.publicMetadata?.role === 'admin'
    } catch (error) {
        return false
    }
}
