'use server'

import { prisma } from '@/lib/db'
import { currentUser } from '@clerk/nextjs/server'
import { revalidatePath } from 'next/cache'

const ADMIN_EMAILS = ['lior31197@gmail.com', 'ron.kor97@gmail.com']

async function checkAdmin() {
    const user = await currentUser()
    const userEmail = user?.emailAddresses[0]?.emailAddress?.toLowerCase()

    if (!user || !userEmail || !ADMIN_EMAILS.includes(userEmail)) {
        throw new Error('Unauthorized')
    }
}

export async function getAdminData() {
    await checkAdmin()

    const [users, coupons, feedbacks, revenue, trialTrackers] = await Promise.all([
        prisma.user.findMany({
            include: {
                // @ts-ignore - Prisma types lag, subscriptions exists in schema
                subscriptions: true,
                paymentHistory: {
                    orderBy: { createdAt: 'desc' },
                    take: 1
                }
            },
            orderBy: { createdAt: 'desc' }
        }),
        prisma.coupon.findMany({
            orderBy: { createdAt: 'desc' }
        }),
        prisma.feedback.findMany({
            include: { user: true },
            orderBy: { createdAt: 'desc' }
        }),
        prisma.paymentHistory.aggregate({
            _sum: {
                amount: true
            }
        }),
        prisma.trialTracker.findMany()
    ])

    const enrichedUsers = users.map(user => {
        // @ts-ignore - Prisma returns subscriptions array now
        const subs = user.subscriptions || []
        // @ts-ignore
        const primarySub = subs.find(s => s.status === 'active') || subs[0] || null

        console.log(`User ${user.email} has ${subs.length} subscriptions:`, subs.map((s: any) => ({ planType: s.planType, status: s.status })))

        return {
            ...user,
            subscription: primarySub,
            hasUsedTrial: trialTrackers.some(tracker => tracker.email === user.email)
        }
    })

    return {
        users: enrichedUsers,
        coupons,
        feedbacks,
        totalRevenue: revenue._sum.amount || 0
    }
}

export async function deleteUser(userId: string) {
    await checkAdmin()
    await prisma.user.delete({ where: { id: userId } })
    revalidatePath('/admin')
}

export async function createCoupon(data: {
    code: string
    discountPercent: number
    expiryDate?: Date
    specificEmail?: string
    planType?: 'PERSONAL' | 'BUSINESS'
}) {
    await checkAdmin()
    await prisma.coupon.create({ data })
    revalidatePath('/admin')
}

export async function deleteCoupon(id: string) {
    await checkAdmin()
    await prisma.coupon.delete({ where: { id } })
    revalidatePath('/admin')
}

export async function updateUserSubscription(userId: string, endDate: Date) {
    await checkAdmin()
    // Update all subscriptions for this user to the new end date
    await prisma.subscription.updateMany({
        where: { userId },
        data: { endDate }
    })
    revalidatePath('/admin')
}

export async function updateCoupon(id: string, data: {
    code?: string
    discountPercent?: number
    expiryDate?: Date
    specificEmail?: string
    planType?: 'PERSONAL' | 'BUSINESS'
}) {
    await checkAdmin()
    await prisma.coupon.update({
        where: { id },
        data
    })
    revalidatePath('/admin')
}

export async function updateSubscription(
    subscriptionId: string,
    data: {
        status?: string
        planType?: 'PERSONAL' | 'BUSINESS'
        endDate?: Date
    }
) {
    await checkAdmin()

    try {
        await prisma.subscription.update({
            where: { id: subscriptionId },
            data
        })
        revalidatePath('/admin')
        return { success: true }
    } catch (error) {
        console.error('Failed to update subscription:', error)
        return { success: false, error: 'Failed to update. Check if plan type already exists.' }
    }
}

export async function resetRevenue() {
    await checkAdmin()

    try {
        // 1. Delete all payment history records
        await prisma.paymentHistory.deleteMany({})

        // 2. Clear payment info from subscriptions
        await prisma.subscription.updateMany({
            data: {
                lastPaymentAmount: null,
                lastPaymentDate: null,
            }
        })

        revalidatePath('/admin')
        return { success: true }
    } catch (error) {
        console.error('Failed to reset revenue:', error)
        return { success: false, error: 'Failed to reset revenue' }
    }
}
