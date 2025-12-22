'use server'

import { auth, currentUser } from '@clerk/nextjs/server'
import { prisma } from '@/lib/db'

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

        const user = await currentUser()

        if (!user || !user.emailAddresses[0]) {
            console.error('Clerk user found but no email')
            throw new Error('User profile incomplete')
        }

        // Find or create user
        let dbUser = await prisma.user.findUnique({
            where: { clerkId }
        })

        if (!dbUser) {
            console.log('Creating new user in database:', clerkId)
            dbUser = await prisma.user.create({
                data: {
                    clerkId,
                    email: user.emailAddresses[0].emailAddress
                }
            })
        }

        return dbUser
    } catch (error) {
        console.error('Error in ensureUserExists:', error)
        throw error
    }
}

/**
 * Gets or creates a budget for the current user and specified month/year
 */
export async function getCurrentBudget(month: number, year: number, currency: string = '₪') {
    try {
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
            console.log('Creating new budget for user:', user.id, 'month:', month, 'year:', year)
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
    } catch (error) {
        console.error('Error in getCurrentBudget:', error)
        throw error
    }
}
