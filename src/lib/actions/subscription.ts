'use server'

import { prisma } from '@/lib/db'
import { currentUser } from '@clerk/nextjs/server'
import { addYears, addDays } from 'date-fns'
import { revalidatePath } from 'next/cache'

export async function createSubscription(paypalOrderId: string, amount: number, planType: string = 'PERSONAL') {
    try {
        console.log('createSubscription called:', { paypalOrderId, amount, planType })

        // ... (user auth check)

        const validPlanType = planType === 'BUSINESS' ? 'BUSINESS' : 'PERSONAL'

        // Create or update subscription
        const subscription = await prisma.subscription.upsert({
            where: { userId },
            update: {
                status: 'active',
                planType: validPlanType,
                startDate: new Date(),
                endDate,
                paypalOrderId,
                lastPaymentDate: new Date(),
                lastPaymentAmount: amount,
            },
            create: {
                userId,
                status: 'active',
                planType: validPlanType,
                startDate: new Date(),
                endDate,
                paypalOrderId,
                lastPaymentDate: new Date(),
                lastPaymentAmount: amount,
            },
        })

        // ... (rest of function)
    }

export async function startTrial(userId: string, email: string, planType: string = 'PERSONAL') {
        console.log('[startTrial] Starting trial for user:', userId, email, planType)

        // ... (user sync)

        const validPlanType = planType === 'BUSINESS' ? 'BUSINESS' : 'PERSONAL'

        // Create trial subscription
        const startDate = new Date()
        const endDate = addDays(startDate, 14)

        const subscription = await prisma.subscription.upsert({
            where: { userId },
            create: {
                userId,
                status: 'trial',
                planType: validPlanType,
                startDate,
                endDate,
            },
            update: {
                status: 'trial',
                planType: validPlanType,
                startDate,
                endDate,
            }
        })

        console.log('[startTrial] Subscription created/updated with plan:', subscription)
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
