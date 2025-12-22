'use server'

import { prisma } from '@/lib/db'
import { currentUser } from '@clerk/nextjs/server'
import { addYears } from 'date-fns'

export async function createSubscription(paypalOrderId: string, amount: number) {
    try {
        console.log('createSubscription called:', { paypalOrderId, amount })

        const user = await currentUser()

        if (!user || !user.id) {
            console.error('No user found')
            throw new Error('User not authenticated')
        }

        console.log('User authenticated:', user.id)
        const userId = user.id

        // Ensure user exists in database (sync from Clerk)
        console.log('Syncing user to database...')
        await prisma.user.upsert({
            where: { id: userId },
            update: {},
            create: {
                id: userId,
                email: user.emailAddresses[0]?.emailAddress || '',
                name: user.fullName || user.firstName || 'User'
            }
        })
        console.log('User synced successfully')

        // Calculate end date for 1 year from now
        const endDate = addYears(new Date(), 1)

        console.log('Creating subscription in database...')

        // Create or update subscription
        const subscription = await prisma.subscription.upsert({
            where: { userId },
            update: {
                status: 'active',
                startDate: new Date(),
                endDate,
                paypalOrderId,
                lastPaymentDate: new Date(),
                lastPaymentAmount: amount,
            },
            create: {
                userId,
                status: 'active',
                startDate: new Date(),
                endDate,
                paypalOrderId,
                lastPaymentDate: new Date(),
                lastPaymentAmount: amount,
            },
        })

        console.log('Subscription created/updated:', subscription.id)
        console.log('Creating payment history...')

        // Record payment
        const payment = await prisma.paymentHistory.create({
            data: {
                userId,
                paypalOrderId,
                amount,
                currency: 'ILS',
                status: 'completed'
            }
        })

        console.log('Payment history created:', payment.id)
        console.log('createSubscription completed successfully')

        return { subscription, payment }
    } catch (error) {
        console.error('createSubscription error:', error)
        console.error('Error details:', JSON.stringify(error, null, 2))
        throw error
    }
}

export async function getSubscriptionStatus(userId: string) {
    const subscription = await prisma.subscription.findUnique({
        where: { userId }
    })

    if (!subscription) {
        return { hasAccess: false, status: 'none', daysUntilExpiry: null }
    }

    const now = new Date()
    const hasAccess = subscription.status === 'active' &&
        subscription.endDate &&
        subscription.endDate > now

    const daysUntilExpiry = subscription.endDate
        ? Math.ceil((subscription.endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
        : null

    return {
        hasAccess,
        status: subscription.status,
        endDate: subscription.endDate,
        daysUntilExpiry
    }
}

export async function getUserSubscription(userId: string) {
    return await prisma.subscription.findUnique({
        where: { userId },
        include: {
            user: {
                select: {
                    email: true
                }
            }
        }
    })
}
