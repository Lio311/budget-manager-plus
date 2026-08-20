import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function resetRevenue() {
    console.log('🚀 Starting revenue reset...')

    try {
        // 1. Delete all payment history records
        const deletedPayments = await prisma.paymentHistory.deleteMany({})
        console.log(`✅ Deleted ${deletedPayments.count} payment history records.`)

        // 2. Clear payment info from subscriptions
        const updatedSubs = await prisma.subscription.updateMany({
            data: {
                lastPaymentAmount: null,
                lastPaymentDate: null,
            }
        })
        console.log(`✅ Cleared payment info from ${updatedSubs.count} subscriptions.`)

        console.log('✨ Revenue reset complete!')
    } catch (error) {
        console.error('❌ Error resetting revenue:', error)
    } finally {
        await prisma.$disconnect()
    }
}

resetRevenue()
