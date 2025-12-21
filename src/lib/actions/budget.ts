'use server'

import { auth, currentUser } from '@clerk/nextjs/server'
import { prisma } from '@/lib/db'

/**
 * Ensures the current user exists in the database
 * Creates a new user record if it doesn't exist
 */
async function ensureUserExists() {
    const { userId: clerkId } = await auth()

    if (!clerkId) {
        throw new Error('Unauthorized')
    }

    const user = await currentUser()

    if (!user || !user.emailAddresses[0]) {
        throw new Error('User not found')
    }

    // Find or create user
    let dbUser = await prisma.user.findUnique({
        where: { clerkId }
    })

    if (!dbUser) {
        dbUser = await prisma.user.create({
            data: {
                clerkId,
                email: user.emailAddresses[0].emailAddress
            }
        })
    }

    return dbUser
}

/**
 * Gets or creates a budget for the current user and specified month/year
 */
export async function getCurrentBudget(month: number, year: number, currency: string = '₪') {
    const user = await ensureUserExists()

    // Find or create budget
    let budget = await prisma.budget.findUnique({
        where: {
            userId_month_year: {
                userId: user.id,
                month,
                year
            }
        }
    })

    if (!budget) {
        budget = await prisma.budget.create({
            data: {
                userId: user.id,
                month,
                year,
                currency
            }
        })
    }

    return budget
}
