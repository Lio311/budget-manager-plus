'use server'

import { prisma } from '@/lib/db'
import { currentUser } from '@clerk/nextjs/server'
import { addYears } from 'date-fns'

export async function createSubscription(paypalOrderId: string, amount: number) {
    const user = await currentUser()
    if (!user) throw new Error('Unauthorized')
    const userId = user.id

    const endDate = addYears(new Date(), 1)

    // Create/update subscription
    const subscription = await prisma.subscription.upsert({
        where: { userId },
        create: {
            userId,
            paypalOrderId,
            status: 'active',
            startDate: new Date(),
            endDate,
            lastPaymentDate: new Date(),
            lastPaymentAmount: amount
        },
        update: {
            paypalOrderId,
            status: 'active',
            endDate,
            lastPaymentDate: new Date(),
            lastPaymentAmount: amount,
            expiryNotified30Days: false,
            expiryNotified7Days: false,
            deletionScheduledFor: null
        }
    })

    // Record payment
    await prisma.paymentHistory.create({
        data: {
            userId,
            paypalOrderId,
            amount,
            currency: 'ILS',
            status: 'completed'
        }
    })

    return { success: true, subscription }
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
