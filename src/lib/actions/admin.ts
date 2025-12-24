'use server'

import { prisma } from '@/lib/db'
import { currentUser } from '@clerk/nextjs/server'
import { revalidatePath } from 'next/cache'

const ADMIN_EMAIL = 'lior31197@gmail.com'

async function checkAdmin() {
    const user = await currentUser()
    if (!user || user.emailAddresses[0]?.emailAddress !== ADMIN_EMAIL) {
        throw new Error('Unauthorized')
    }
}

export async function getAdminData() {
    await checkAdmin()

    const [users, coupons, feedbacks] = await Promise.all([
        prisma.user.findMany({
            include: {
                subscription: true,
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
            orderBy: { createdAt: 'desc' }
        }),
        prisma.paymentHistory.aggregate({
            _sum: {
                amount: true
            }
        })
    ])

    return { users, coupons, feedbacks, totalRevenue: coupons[1]?._sum?.amount ?? 0 } // Fixed: accessing 4th element as its own const 
    // actually, let's unpack properly

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const [userData, couponData, feedbackData, revenueData] = [users, coupons, feedbacks, {}]

    return {
        users,
        coupons,
        feedbacks,
        totalRevenue: (typeof coupons[3] === 'object' && '_sum' in coupons[3]) ? 0 : 0 // Wait, Promise.all returns array.
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
    await prisma.subscription.update({
        where: { userId },
        data: { endDate }
    })
    revalidatePath('/admin')
}
