import { prisma } from '@/lib/db'
import { subDays, addDays, format } from 'date-fns'
import { sendEmail } from '@/lib/email/send'
import { expiryWarning30Days, expiryWarning7Days, accessBlocked } from '@/lib/email/templates'

export async function runSubscriptionCleanup() {
    const now = new Date()

    console.log('🔄 Starting subscription cleanup...')

    // 1. Send 30-day warnings
    const thirtyDaysFromNow = addDays(now, 30)
    const subscriptionsExpiring30 = await prisma.subscription.findMany({
        where: {
            status: 'active',
            endDate: {
                gte: addDays(thirtyDaysFromNow, -1),
                lte: addDays(thirtyDaysFromNow, 1)
            },
            expiryNotified30Days: false
        },
        include: { user: true }
    })

    for (const sub of subscriptionsExpiring30) {
        if (!sub.endDate) continue

        const expiryDate = format(sub.endDate, 'dd/MM/yyyy')
        await sendEmail(
            sub.user.email,
            'המנוי שלך יפוג בעוד חודש',
            expiryWarning30Days(sub.user.email, expiryDate)
        )

        await prisma.subscription.update({
            where: { id: sub.id },
            data: { expiryNotified30Days: true }
        })

        console.log(`✉️ Sent 30-day warning to ${sub.user.email}`)
    }

    // 2. Send 7-day warnings
    const sevenDaysFromNow = addDays(now, 7)
    const subscriptionsExpiring7 = await prisma.subscription.findMany({
        where: {
            status: 'active',
            endDate: {
                gte: addDays(sevenDaysFromNow, -1),
                lte: addDays(sevenDaysFromNow, 1)
            },
            expiryNotified7Days: false
        },
        include: { user: true }
    })

    for (const sub of subscriptionsExpiring7) {
        if (!sub.endDate) continue

        const expiryDate = format(sub.endDate, 'dd/MM/yyyy')
        const deletionDate = format(addDays(sub.endDate, 30), 'dd/MM/yyyy')

        await sendEmail(
            sub.user.email,
            '⚠️ שבוע אחרון! המנוי שלך יפוג בקרוב',
            expiryWarning7Days(sub.user.email, expiryDate, deletionDate)
        )

        await prisma.subscription.update({
            where: { id: sub.id },
            data: { expiryNotified7Days: true }
        })

        console.log(`✉️ Sent 7-day warning to ${sub.user.email}`)
    }

    // 3. Block access for expired subscriptions
    const expiredToday = await prisma.subscription.findMany({
        where: {
            status: 'active',
            endDate: { lte: now }
        },
        include: { user: true }
    })

    for (const sub of expiredToday) {
        if (!sub.endDate) continue

        const deletionDate = format(addDays(sub.endDate, 30), 'dd/MM/yyyy')

        await sendEmail(
            sub.user.email,
            'המנוי שלך פג - גישה נחסמה',
            accessBlocked(sub.user.email, deletionDate)
        )

        await prisma.subscription.update({
            where: { id: sub.id },
            data: {
                status: 'expired',
                deletionScheduledFor: addDays(now, 30)
            }
        })

        console.log(`🚫 Blocked access for ${sub.user.email}`)
    }

    // 4. DELETE users 30 days after expiry
    const usersToDelete = await prisma.subscription.findMany({
        where: {
            status: 'expired',
            deletionScheduledFor: { lte: now }
        }
    })

    for (const sub of usersToDelete) {
        // CASCADE DELETE will remove all user data
        await prisma.user.delete({
            where: { id: sub.userId }
        })

        console.log(`🗑️ Deleted user ${sub.userId} - expired ${sub.endDate}`)
    }

    console.log(`✅ Cleanup complete: 
    - 30-day warnings: ${subscriptionsExpiring30.length}
    - 7-day warnings: ${subscriptionsExpiring7.length}
    - Blocked: ${expiredToday.length}
    - Deleted: ${usersToDelete.length}
  `)

    return {
        warnings30: subscriptionsExpiring30.length,
        warnings7: subscriptionsExpiring7.length,
        blocked: expiredToday.length,
        deleted: usersToDelete.length
    }
}
