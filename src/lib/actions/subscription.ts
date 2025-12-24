'use server'

import { prisma } from '@/lib/db'
import { currentUser } from '@clerk/nextjs/server'
import { addYears, addDays } from 'date-fns'

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
                email: user.emailAddresses[0]?.emailAddress || ''
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

export async function startTrial(userId: string, email: string) {
    // Check if already tracked
    const existingTracker = await prisma.trialTracker.findUnique({
        where: { email }
    })

    if (existingTracker) {
        return { success: false, reason: 'Trial already used' }
    }

    // Create tracker
    await prisma.trialTracker.create({
        data: { email }
    })

    // Create trial subscription
    const endDate = addDays(new Date(), 14)

    await prisma.subscription.upsert({
        where: { userId },
        create: {
            userId,
            status: 'trial',
            startDate: new Date(),
            endDate,
        },
        update: {
            status: 'trial',
            startDate: new Date(),
            endDate,
        }
    })

    return { success: true }
}

export async function getSubscriptionStatus(userId: string) {
    const subscription = await prisma.subscription.findUnique({
        where: { userId }
    })

    if (!subscription) {
        // User has no subscription at all.
        // We should probably check if they are eligible for trial here?
        // Or let the layout handle the "start trial" flow.
        // For now, return none.
        return { hasAccess: false, status: 'none', daysUntilExpiry: null }
    }

    const now = new Date()

    // Check if trial expired and update status if needed
    if (subscription.status === 'trial' && subscription.endDate && subscription.endDate < now) {
        await prisma.subscription.update({
            where: { id: subscription.id },
            data: { status: 'trial_expired' }
        })
        return { hasAccess: false, status: 'trial_expired', daysUntilExpiry: 0 }
    }

    const hasAccess = (subscription.status === 'active' || subscription.status === 'trial') &&
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

export async function validateCoupon(code: string, userEmail: string) {
    const coupon = await prisma.coupon.findUnique({
        where: { code }
    })

    if (!coupon) {
        return { valid: false, message: 'Invalid coupon code' }
    }

    if (coupon.specificEmail && coupon.specificEmail !== userEmail) {
        return { valid: false, message: 'This coupon is not valid for your email' }
    }

    if (coupon.expiryDate && coupon.expiryDate < new Date()) {
        return { valid: false, message: 'Coupon expired' }
    }

    return {
        valid: true,
        discountPercent: coupon.discountPercent,
        message: 'Coupon applied!'
    }
}
