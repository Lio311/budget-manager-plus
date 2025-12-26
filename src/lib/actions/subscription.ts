'use server'

import { prisma } from '@/lib/db'
import { currentUser } from '@clerk/nextjs/server'
import { addYears, addDays } from 'date-fns'
import { revalidatePath } from 'next/cache'

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
    console.log('[startTrial] Starting trial for user:', userId, email)

    // Sync user to DB to handle webhook race condition
    await prisma.user.upsert({
        where: { id: userId },
        update: {},
        create: {
            id: userId,
            email: email
        }
    })

    // Check if already tracked
    const existingTracker = await prisma.trialTracker.findUnique({
        where: { email }
    })

    if (existingTracker) {
        console.log('[startTrial] Trial already used for email:', email)
        return { success: false, reason: 'Trial already used' }
    }

    // Create tracker
    await prisma.trialTracker.create({
        data: { email }
    })
    console.log('[startTrial] Trial tracker created')

    // Create trial subscription
    const startDate = new Date()
    const endDate = addDays(startDate, 14)

    const subscription = await prisma.subscription.upsert({
        where: { userId },
        create: {
            userId,
            status: 'trial',
            startDate,
            endDate,
        },
        update: {
            status: 'trial',
            startDate,
            endDate,
        }
    })

    console.log('[startTrial] Subscription created/updated:', subscription)
    revalidatePath('/dashboard')
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
    console.log(`Validating coupon: ${code} for email: ${userEmail}`)

    // Check if code is provided
    if (!code) {
        return { valid: false, message: 'נא להזין קוד קופון' }
    }

    const coupon = await prisma.coupon.findFirst({
        where: {
            code: {
                equals: code,
                mode: 'insensitive'
            }
        }
    })

    if (!coupon) {
        console.log(`Coupon not found: ${code}`)
        return { valid: false, message: 'קוד הקופון שהוזן שגוי או פג תוקפו' }
    }

    if (coupon.specificEmail && coupon.specificEmail.toLowerCase() !== userEmail.toLowerCase()) {
        console.log(`Coupon email mismatch. Coupon: ${coupon.specificEmail}, User: ${userEmail}`)
        return { valid: false, message: 'קוד הקופון שהוזן שגוי או פג תוקפו' }
    }

    if (coupon.expiryDate && coupon.expiryDate < new Date()) {
        console.log(`Coupon expired: ${coupon.expiryDate}`)
        return { valid: false, message: 'קוד הקופון שהוזן שגוי או פג תוקפו' }
    }

    return {
        valid: true,
        discountPercent: coupon.discountPercent,
        message: 'קופון הופעל בהצלחה!'
    }
}
