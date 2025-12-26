'use server'

import { get } from '@vercel/edge-config'
import { currentUser } from '@clerk/nextjs/server'

/**
 * Get the current maintenance mode status from Edge Config
 */
export async function getMaintenanceMode(): Promise<boolean> {
    try {
        const maintenanceMode = await get('maintenanceMode')
        return maintenanceMode === true
    } catch (error) {
        console.error('Error reading maintenance mode from Edge Config:', error)
        // Default to false if Edge Config is not available
        return false
    }
}

/**
 * Toggle maintenance mode (admin only)
 * Note: This function requires manual update in Vercel Edge Config dashboard
 * or using Vercel API
 */
export async function toggleMaintenanceMode() {
    try {
        const user = await currentUser()

        if (!user) {
            return { success: false, error: 'Not authenticated' }
        }

        // Check if user is admin
        const isAdmin = user.publicMetadata?.role === 'admin'

        if (!isAdmin) {
            return { success: false, error: 'Admin access required' }
        }

        // Note: Edge Config doesn't support writes from server actions
        // You need to update it via Vercel Dashboard or API
        return {
            success: false,
            error: 'Please update maintenance mode in Vercel Dashboard → Edge Config',
            message: 'Go to: https://vercel.com/dashboard → Your Project → Storage → Edge Config'
        }
    } catch (error) {
        console.error('Error toggling maintenance mode:', error)
        return { success: false, error: 'Failed to toggle maintenance mode' }
    }
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
