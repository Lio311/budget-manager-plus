'use server'

import { auth, currentUser } from '@clerk/nextjs/server'
import { prisma, authenticatedPrisma } from '@/lib/db'

// Helper to serialize user for safe transport
function serializeUser(user: any) {
    if (!user) return null
    return {
        ...user,
        createdAt: user.createdAt instanceof Date ? user.createdAt.toISOString() : user.createdAt,
        updatedAt: user.updatedAt instanceof Date ? user.updatedAt.toISOString() : user.updatedAt,
    }
}

/**
 * Ensures the current user exists in the database
 * Creates a new user record if it doesn't exist
 */
export async function ensureUserExists() {
    try {
        const { userId: clerkId } = await auth()

        if (!clerkId) {
            console.error('No Clerk user ID found')
            throw new Error('Unauthorized - Please sign in')
        }

        // 1. Try to find existing user first to avoid unnecessary Clerk API calls
        const dbUser = await prisma.user.findUnique({
            where: { id: clerkId }
        })

        if (dbUser) return serializeUser(dbUser)

        // 2. If not found, fetch from Clerk and create
        const user = await currentUser()

        if (!user) {
            console.error('Clerk user not found')
            throw new Error('User profile not found')
        }

        const email = user.emailAddresses[0]?.emailAddress
        if (!email) {
            console.error('Clerk user found but no email')
            throw new Error('User email not found')
        }

        console.log('Creating new user in database:', clerkId)
        const newUser = await prisma.user.create({
            data: {
                id: clerkId,
                email
            }
        })

        return serializeUser(newUser)
    } catch (error: any) {
        console.error('Error in ensureUserExists:', error)
        // If it's a validation error or similar, return it gracefully
        throw new Error(`שגיאת משתמש: ${error.message || 'לא ניתן לוודא משתמש'}`)
    }
}

/**
 * Gets or creates a budget for the current user and specified month/year
 */

export async function getCurrentBudget(month: number, year: number, currency: string = '₪', type: 'PERSONAL' | 'BUSINESS' = 'PERSONAL') {
    try {
        console.log(`Getting budget for ${month}/${year} type: ${type}`)
        const user = await ensureUserExists()

        // RLS: Get authenticated client
        const db = await authenticatedPrisma(user.id)

        // Find or create budget using new compound key
        // @ts-ignore - Prisma types might be stale in dev environment
        let budget = await db.budget.findUnique({
            where: {
                userId_month_year_type: {
                    userId: user.id,
                    month,
                    year,
                    type
                }
            }
        })

        if (!budget) {
            console.log('Creating new budget for user:', user.id, 'month:', month, 'year:', year, 'type:', type)
            // @ts-ignore
            budget = await db.budget.create({
                data: {
                    userId: user.id,
                    month,
                    year,
                    currency,
                    type
                }
            })
        }

        return budget
    } catch (error) {
        console.error('Error in getCurrentBudget:', error)
        throw error
    }
}
