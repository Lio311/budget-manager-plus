'use server'

import { prisma } from '@/lib/db'
import { currentUser } from '@clerk/nextjs/server'
import { addYears, addDays } from 'date-fns'
import { revalidatePath } from 'next/cache'
import { trackReferralUsage } from './referral'

export async function createSubscription(paypalOrderId: string, amount: number, planType: string = 'PERSONAL', couponCode?: string) {
    try {
        console.log('createSubscription called:', { paypalOrderId, amount, planType, couponCode })

        if (couponCode) {
            console.log('Processing coupon:', couponCode)

            // fetch coupon to check for owner (referral)
            const coupon = await prisma.coupon.findUnique({
                where: { code: couponCode } // unique constraint should exist on code
            }).catch(err => null)

            if (coupon) {
                // Increment usage
                prisma.coupon.update({
                    where: { id: coupon.id },
                    data: { usedCount: { increment: 1 } }
                }).catch(err => console.error('Failed to update coupon usage:', err))

                // Check for Referral Owner
                if (coupon.ownerId) {
                    console.log('Referral coupon used! Tracking usage for owner:', coupon.ownerId)
                    // Fire and forget
                    trackReferralUsage(coupon.ownerId).catch(err => console.error('Failed to track referral:', err))
                }
            }
        }

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

        // Determine which subscriptions to create based on plan type
        const createBoth = planType === 'COMBINED'
        const createPersonal = planType === 'PERSONAL' || createBoth
        const createBusiness = planType === 'BUSINESS' || createBoth

        console.log(`Creating subscriptions: PERSONAL=${createPersonal}, BUSINESS=${createBusiness}`)

        // Create or update subscriptions in a transaction
        const result = await prisma.$transaction(async (tx) => {
            let personalSubscription = null
            let businessSubscription = null

            // Create/update PERSONAL subscription if needed
            if (createPersonal) {
                personalSubscription = await tx.subscription.upsert({
                    where: {
                        userId_planType: {
                            userId,
                            planType: 'PERSONAL'
                        }
                    },
                    update: {
                        status: 'active',
                        startDate: new Date(),
                        endDate,
                        paypalOrderId,
                        lastPaymentDate: new Date(),
                        lastPaymentAmount: amount,
                        couponCode: couponCode || null,
                    },
                    create: {
                        userId,
                        status: 'active',
                        planType: 'PERSONAL',
                        startDate: new Date(),
                        endDate,
                        paypalOrderId,
                        lastPaymentDate: new Date(),
                        lastPaymentAmount: amount,
                        couponCode: couponCode || null,
                    },
                })
                console.log('PERSONAL subscription created/updated:', personalSubscription.id)
            }

            // Create/update BUSINESS subscription if needed
            if (createBusiness) {
                businessSubscription = await tx.subscription.upsert({
                    where: {
                        userId_planType: {
                            userId,
                            planType: 'BUSINESS'
                        }
                    },
                    update: {
                        status: 'active',
                        startDate: new Date(),
                        endDate,
                        paypalOrderId,
                        lastPaymentDate: new Date(),
                        lastPaymentAmount: amount,
                        couponCode: couponCode || null,
                    },
                    create: {
                        userId,
                        status: 'active',
                        planType: 'BUSINESS',
                        startDate: new Date(),
                        endDate,
                        paypalOrderId,
                        lastPaymentDate: new Date(),
                        lastPaymentAmount: amount,
                        couponCode: couponCode || null,
                    },
                })
                console.log('BUSINESS subscription created/updated:', businessSubscription.id)
            }

            // Record payment
            const payment = await tx.paymentHistory.create({
                data: {
                    userId,
                    paypalOrderId,
                    amount,
                    currency: 'ILS',
                    status: 'completed'
                }
            })

            console.log('Payment history created:', payment.id)

            return { personalSubscription, businessSubscription, payment }
        })

        console.log('createSubscription completed successfully')

        return result
    } catch (error) {
        console.error('createSubscription error:', error)
        console.error('Error details:', JSON.stringify(error, null, 2))
        throw error
    }
}

export async function startTrial(userId: string, email: string, planType: string = 'PERSONAL') {
    // Fixed: Now supports separate trials for PERSONAL and BUSINESS plans, and COMBINED (creates both)
    console.log('[startTrial] Starting trial for user:', userId, email, planType)

    // Sync user to DB to handle webhook race condition
    await prisma.user.upsert({
        where: { id: userId },
        update: {},
        create: {
            id: userId,
            email: email
        }
    })

    // Determine which plans to activate
    const plansToActivate = planType === 'COMBINED' ? ['PERSONAL', 'BUSINESS'] : [planType]

    // 1. Check if ANY of the requested plans have already been used
    for (const plan of plansToActivate) {
        // @ts-ignore - Prisma types update lag
        const existingTracker = await prisma.trialTracker.findUnique({
            where: {
                email_planType: {
                    email,
                    planType: plan as any
                }
            }
        })

        if (existingTracker) {
            console.log(`[startTrial] Trial already used for email: ${email} on plan: ${plan}`)
            return { success: false, reason: `תקופת הניסיון לתוכנית ${plan === 'BUSINESS' ? 'עסקית' : 'פרטית'} כבר נוצלה` }
        }
    }

    // 2. Activate all requested plans
    const startDate = new Date()
    const endDate = addDays(startDate, 60) // 2 months trial period

    for (const plan of plansToActivate) {
        // Create tracker
        // @ts-ignore
        await prisma.trialTracker.create({
            data: {
                email,
                planType: plan as any
            }
        })
        console.log(`[startTrial] Trial tracker created for ${plan}`)

        // Create trial subscription
        // @ts-ignore - planType issue with Prisma types in dev
        await prisma.subscription.upsert({
            where: {
                userId_planType: {
                    userId,
                    planType: plan as any
                }
            },
            create: {
                userId,
                status: 'trial',
                planType: plan as any,
                startDate,
                endDate,
            },
            update: {
                status: 'trial',
                planType: plan as any,
                startDate,
                endDate,
            }
        })
        console.log(`[startTrial] Subscription created/updated for ${plan}`)
    }

    revalidatePath('/dashboard')
    return { success: true }
}

export async function getSubscriptionStatus(userId: string, planType: string = 'PERSONAL') {
    const validPlanType = planType === 'BUSINESS' ? 'BUSINESS' : 'PERSONAL'

    const subscription = await prisma.subscription.findUnique({
        where: {
            userId_planType: {
                userId,
                planType: validPlanType as any
            }
        }
    })

    if (!subscription) {
        return { hasAccess: false, status: 'none', daysUntilExpiry: null, planType: validPlanType }
    }

    const now = new Date()

    // Check if trial expired and update status if needed
    if (subscription.status === 'trial' && subscription.endDate && subscription.endDate < now) {
        await prisma.subscription.update({
            where: { id: subscription.id },
            data: { status: 'trial_expired' }
        })
        return { hasAccess: false, status: 'trial_expired', daysUntilExpiry: 0, planType: validPlanType }
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
        // @ts-ignore - planType might verify
        planType: subscription.planType || 'PERSONAL',
        daysUntilExpiry
    }
}

export async function validateCoupon(code: string, userEmail: string, planType: string = 'PERSONAL') {
    console.log(`Validating coupon: ${code} for email: ${userEmail} and plan: ${planType}`)

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

    // NEW: Check Plan Type Restriction
    if (coupon.planType && coupon.planType !== planType) {
        console.log(`Coupon plan mismatch. Coupon: ${coupon.planType}, Requested: ${planType}`)
        return {
            valid: false,
            message: `קופון זה תקף רק למנוי מסוג ${coupon.planType === 'PERSONAL' ? 'פרטי' : 'עסקי'}`
        }
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

export async function getMySubscriptionStatus() {
    const user = await currentUser()
    if (!user) return { success: false, error: 'User not authenticated' }

    // Check Personal
    const personalStatus = await getSubscriptionStatus(user.id, 'PERSONAL')
    const businessStatus = await getSubscriptionStatus(user.id, 'BUSINESS')

    return {
        success: true,
        data: {
            personal: personalStatus,
            business: businessStatus,
            userEmail: user.emailAddresses[0]?.emailAddress
        }
    }
}
