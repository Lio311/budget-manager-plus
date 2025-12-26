import { PrismaClient } from '@prisma/client'
import { addDays } from 'date-fns'

const prisma = new PrismaClient()

const USERS_TO_UPDATE = [
    'amirbi98@gmail.com',
    'yossefshalev@gmail.com',
    'idozalma34@gmail.com'
]

async function grantTrialToUsers() {
    console.log('Starting trial grant process...\n')

    for (const email of USERS_TO_UPDATE) {
        console.log(`Processing ${email}...`)

        try {
            // Find user by email
            const user = await prisma.user.findUnique({
                where: { email },
                include: { subscriptions: true }
            })

            if (!user) {
                console.log(`  ❌ User not found: ${email}`)
                continue
            }

            console.log(`  ✓ Found user: ${user.id}`)

            // Check if trial tracker already exists
            const existingTracker = await prisma.trialTracker.findUnique({
                where: { email }
            })

            if (existingTracker) {
                console.log(`  ⚠️  Trial tracker already exists, deleting...`)
                await prisma.trialTracker.delete({
                    where: { email }
                })
            }

            // Create new trial tracker
            await prisma.trialTracker.create({
                data: { email }
            })
            console.log(`  ✓ Trial tracker created`)

            // Create/update subscription with trial
            const startDate = new Date()
            const endDate = addDays(startDate, 14)

            const subscription = await prisma.subscription.upsert({
                where: {
                    userId_planType: {
                        userId: user.id,
                        planType: 'PERSONAL'
                    }
                },
                create: {
                    userId: user.id,
                    status: 'trial',
                    planType: 'PERSONAL',
                    startDate,
                    endDate
                },
                update: {
                    status: 'trial',
                    planType: 'PERSONAL',
                    startDate,
                    endDate
                }
            })

            console.log(`  ✓ Subscription created/updated`)
            console.log(`    - Status: ${subscription.status}`)
            console.log(`    - Start: ${subscription.startDate?.toISOString()}`)
            console.log(`    - End: ${subscription.endDate?.toISOString()}`)
            console.log(`  ✅ Successfully granted 14-day trial to ${email}\n`)

        } catch (error) {
            console.error(`  ❌ Error processing ${email}:`, error)
        }
    }

    console.log('\n✅ Trial grant process completed!')
}

grantTrialToUsers()
    .catch(console.error)
    .finally(() => prisma.$disconnect())
