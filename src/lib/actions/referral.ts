'use server'

import { prisma } from '@/lib/db'
import { auth } from '@clerk/nextjs/server'
import { revalidatePath } from 'next/cache'

// Helper to generate a short alphanumeric code
function generateReferralCode(length: number = 6): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
    let result = ''
    for (let i = 0; i < length; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    return result
}

export async function optInToReferral() {
    try {
        const { userId } = await auth()
        if (!userId) return { success: false, error: 'Unauthorized' }

        // Check if already opted in
        const user = await prisma.user.findUnique({
            where: { id: userId }
        })

        if (user?.referralProgramActive) {
            return { success: true, code: user.referralCode }
        }

        // Generate unique code
        let code = generateReferralCode()
        let isUnique = false
        while (!isUnique) {
            const existing = await prisma.user.findUnique({
                where: { referralCode: code }
            })
            if (!existing) isUnique = true
            else code = generateReferralCode()
        }

        // 1. Update User
        await prisma.user.update({
            where: { id: userId },
            data: {
                referralProgramActive: true,
                referralCode: code
            }
        })

        // 2. Create the "Referral Coupon" that others will use
        // The prompt doesn't specify a discount for the referee, but usually there is one.
        // For now, we'll create it with 0% or allow admin to update it later.
        // We link it to the owner so we can track usage.
        await prisma.coupon.create({
            data: {
                code: code,
                discountPercent: 0, // No default discount for the friend currently specified
                ownerId: userId,
                // Valid forever
                expiryDate: null,
                maxUses: null // Unlimited
            }
        })

        revalidatePath('/dashboard')
        return { success: true, code }
    } catch (error) {
        console.error('Error opting in to referral:', error)
        return { success: false, error: 'Failed to opt in' }
    }
}

export async function getReferralStats() {
    try {
        const { userId } = await auth()
        if (!userId) return { success: false, error: 'Unauthorized' }

        const user = await prisma.user.findUnique({
            where: { id: userId },
            include: {
                referralCoupons: true // These are the REWARDS the user earned
            }
        })

        if (!user) return { success: false, error: 'User not found' }

        return {
            success: true,
            isActive: user.referralProgramActive,
            code: user.referralCode,
            count: user.referralCount,
            coupons: user.referralCoupons
        }
    } catch (error) {
        console.error('Error getting referral stats:', error)
        return { success: false, error: 'Failed to get stats' }
    }
}

export async function trackReferralUsage(ownerId: string) {
    console.log('Tracking referral usage for owner:', ownerId)
    try {
        // Increment count
        const user = await prisma.user.update({
            where: { id: ownerId },
            data: { referralCount: { increment: 1 } }
        })

        const count = user.referralCount
        console.log('New referral count:', count)

        // Check Milestones
        let rewardDiscount = 0

        switch (count) {
            case 2: rewardDiscount = 8; break;
            case 4: rewardDiscount = 17; break;
            case 6: rewardDiscount = 25; break;
            case 8: rewardDiscount = 40; break;
            case 10: rewardDiscount = 50; break;
            default: return { success: true, reward: null }
        }

        if (rewardDiscount > 0) {
            console.log(`Milestone reached! ${count} referrals. Granting ${rewardDiscount}% coupon.`)
            // Create a specialized one-time use coupon for the OWNER
            const rewardCode = `REWARD-${rewardDiscount}-${generateReferralCode(4)}`

            await prisma.coupon.create({
                data: {
                    code: rewardCode,
                    discountPercent: rewardDiscount,
                    ownerId: ownerId, // It belongs to them
                    maxUses: 1, // Single use
                    // Valid for 1 month after subscription ends? 
                    // Implementation detail: we just create it now, user can use it later.
                    specificEmail: user.email // Lock it to them just in case
                }
            })

            return { success: true, reward: rewardDiscount }
        }

        return { success: true, reward: null }

    } catch (error) {
        console.error('Error tracking referral usage:', error)
        return { success: false, error: 'Failed to track usage' }
    }
}
