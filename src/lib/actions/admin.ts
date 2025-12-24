'use server'

import { prisma } from '@/lib/db'
import { currentUser } from '@clerk/nextjs/server'
import { revalidatePath } from 'next/cache'

const ADMIN_EMAIL = 'lior31197@gmail.com'

async function checkAdmin() {
    const user = await currentUser()
    const userEmail = user?.emailAddresses[0]?.emailAddress?.toLowerCase()
    const adminEmail = ADMIN_EMAIL.toLowerCase()

    if (!user || userEmail !== adminEmail) {
        throw new Error('Unauthorized')
    }
}

export async function getAdminData() {
    await checkAdmin()

    const [users, coupons, feedbacks, revenue] = await Promise.all([
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
            include: { user: true },
            orderBy: { createdAt: 'desc' }
        }),
        prisma.paymentHistory.aggregate({
            _sum: {
                amount: true
            }
        })
    ])

    return {
        users,
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
