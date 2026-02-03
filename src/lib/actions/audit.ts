'use server'

import { authenticatedPrisma } from '@/lib/db'
import { auth } from '@clerk/nextjs/server'

export async function getAuditLogs(limit = 50) {
    try {
        const { userId } = await auth()
        if (!userId) throw new Error('Unauthorized')

        const db = await authenticatedPrisma(userId)

        const logs = await db.auditLog.findMany({
            where: { userId },
            orderBy: { createdAt: 'desc' },
            take: limit
        })

        return { success: true, data: logs }
    } catch (error) {
        console.error('getAuditLogs error:', error)
        return { success: false, error: 'Failed to fetch audit logs' }
    }
}

export async function createAuditLog(action: string, entity: string, entityId: string | null | undefined, details: any) {
    try {
        const { userId } = await auth()
        if (!userId) return // Can't log if no user (or use system user if needed)

        // Use authenticatedPrisma to ensure RLS (though creating log is write-only)
        const db = await authenticatedPrisma(userId)

        await db.auditLog.create({
            data: {
                userId,
                action,
                entity,
                entityId,
                details: typeof details === 'string' ? details : JSON.stringify(details),
                // ipAddress and userAgent would need headers(), usually passed from client or middleware
            }
        })
    } catch (error) {
        console.error('Failed to create audit log:', error)
        // We generally don't want to throw here to avoid blocking the main action
    }
}
