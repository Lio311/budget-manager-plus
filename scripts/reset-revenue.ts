import { PrismaClient } from '@prisma/client'
import * as dotenv from 'dotenv'

dotenv.config()

const prisma = new PrismaClient()

async function resetRevenue() {
    console.log('Resetting revenue statistics...')

    try {
        // Delete all records from PaymentHistory table
        const { count } = await prisma.paymentHistory.deleteMany({})

        console.log(`✅ Successfully deleted ${count} payment records.`)
        console.log('   Total Revenue should now be 0.')

    } catch (error) {
        console.error('❌ Error resetting revenue:', error)
    } finally {
        await prisma.$disconnect()
    }
}

resetRevenue()
