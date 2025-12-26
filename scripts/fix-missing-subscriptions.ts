/**
 * Migration Script: Add Missing Subscriptions
 * 
 * This script finds users who have only one subscription (either PERSONAL or BUSINESS)
 * and creates the missing subscription for them.
 * 
 * Run with: npx tsx scripts/fix-missing-subscriptions.ts
 */

import { config } from 'dotenv'
import { PrismaClient } from '@prisma/client'

// Load environment variables from .env.local
config({ path: '.env.local' })

const prisma = new PrismaClient()

async function main() {
    console.log('Starting migration: Adding missing subscriptions...\n')

    try {
        // Get all users with their subscriptions
        const users = await prisma.user.findMany({
            include: {
                subscriptions: true
            }
        })

        console.log(`Found ${users.length} total users\n`)

        let fixedCount = 0

        for (const user of users) {
            const subs = user.subscriptions

            // Skip users with no subscriptions
            if (subs.length === 0) {
                continue
            }

            // Skip users who already have both subscriptions
            if (subs.length >= 2) {
                continue
            }

            // User has only one subscription - need to create the missing one
            const existingSub = subs[0]
            const missingPlanType = existingSub.planType === 'PERSONAL' ? 'BUSINESS' : 'PERSONAL'

            console.log(`User ${user.email}:`)
            console.log(`  - Has: ${existingSub.planType} (${existingSub.status})`)
            console.log(`  - Missing: ${missingPlanType}`)
            console.log(`  - Creating missing subscription...`)

            // Create the missing subscription with same dates and status as existing one
            await prisma.subscription.create({
                data: {
                    userId: user.id,
                    status: existingSub.status,
                    planType: missingPlanType,
                    startDate: existingSub.startDate,
                    endDate: existingSub.endDate,
                    paypalOrderId: existingSub.paypalOrderId,
                    lastPaymentDate: existingSub.lastPaymentDate,
                    lastPaymentAmount: existingSub.lastPaymentAmount,
                }
            })

            console.log(`  ✓ Created ${missingPlanType} subscription\n`)
            fixedCount++
        }

        console.log(`\n✅ Migration complete!`)
        console.log(`Fixed ${fixedCount} users`)

    } catch (error) {
        console.error('❌ Migration failed:', error)
        throw error
    } finally {
        await prisma.$disconnect()
    }
}

main()
    .catch((error) => {
        console.error(error)
        process.exit(1)
    })
