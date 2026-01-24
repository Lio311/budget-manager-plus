import { prisma as db } from "@/lib/db";
import { headers } from "next/headers";

/**
 * Creates an immutable audit log entry.
 * Should be called from Server Actions or Route Handlers.
 */
export async function logAudit({
    userId,
    action,
    entity,
    entityId,
    details
}: {
    userId: string;
    action: string;
    entity: string;
    entityId?: string;
    details?: any;
}) {
    try {
        const headerStore = headers();
        const ip = headerStore.get("x-forwarded-for") || "unknown";
        const ua = headerStore.get("user-agent") || "unknown";

        await db.auditLog.create({
            data: {
                userId,
                action,
                entity,
                entityId,
                details: details ? JSON.stringify(details) : undefined,
                ipAddress: typeof ip === 'string' ? ip : ip[0] || 'unknown',
                userAgent: ua
            }
        });
    } catch (e) {
        console.error("Failed to create audit log:", e);
        // Fail silently so we don't block the main business logic
    }
}
