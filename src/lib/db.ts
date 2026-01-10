import { PrismaClient } from '@prisma/client'

const globalForPrisma = global as unknown as { prisma: PrismaClient }

export const prisma = globalForPrisma.prisma || new PrismaClient({
    datasourceUrl: process.env.DATABASE_URL,
})

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma

/**
 * Returns a Prisma Client instance that automatically sets the RLS context
 * for the current transaction/query.
 * 
 * Usage:
 * const db = await authenticatedPrisma(userId)
 * await db.income.findMany(...)
 */
export async function authenticatedPrisma(userId: string) {
    return prisma.$extends({
        query: {
            $allModels: {
                async $allOperations({ args, query }) {
                    // Wrap every query in a transaction to safely set the session variable
                    // local to this transaction only.
                    return prisma.$transaction(async (tx) => {
                        await tx.$executeRaw`SELECT set_config('app.current_user_id', ${userId}, true)`
                        return query(args)
                    })
                }
            }
        }
    })
}
