/**
 * Script to check and fix trial_trackers table
 * Run with: npx tsx scripts/fix-trial-trackers.ts
 */

import { config } from 'dotenv'
import { PrismaClient } from '@prisma/client'

// Load environment variables from .env.local
config({ path: '.env.local' })

const prisma = new PrismaClient()

async function main() {
    console.log('Checking trial_trackers table structure...\n')

    try {
        // Try to query with planType - if this fails, the column doesn't exist
        try {
            const trackers = await prisma.$queryRaw`
                SELECT id, email, "planType", "createdAt" 
                FROM trial_trackers 
                LIMIT 5
            `
            console.log('✅ planType column exists!')
            console.log('Sample data:', trackers)
        } catch (error: any) {
            if (error.message.includes('planType') || error.message.includes('column')) {
                console.log('❌ planType column does NOT exist!')
                console.log('\nAttempting to add planType column...\n')

                // Run the migration SQL manually
                await prisma.$executeRawUnsafe(`
                    DO $$ 
                    BEGIN
                        -- Add planType column if it doesn't exist
                        IF NOT EXISTS (
                            SELECT 1 FROM information_schema.columns 
                            WHERE table_name = 'trial_trackers' AND column_name = 'planType'
                        ) THEN
                            ALTER TABLE "trial_trackers" ADD COLUMN "planType" TEXT NOT NULL DEFAULT 'PERSONAL';
                        END IF;

                        -- Drop old unique constraint if it exists
                        IF EXISTS (
                            SELECT 1 FROM pg_constraint 
                            WHERE conname = 'trial_trackers_email_key'
                        ) THEN
                            ALTER TABLE "trial_trackers" DROP CONSTRAINT "trial_trackers_email_key";
                        END IF;

                        -- Add new unique constraint if it doesn't exist
                        IF NOT EXISTS (
                            SELECT 1 FROM pg_constraint 
                            WHERE conname = 'trial_trackers_email_planType_key'
                        ) THEN
                            ALTER TABLE "trial_trackers" ADD CONSTRAINT "trial_trackers_email_planType_key" UNIQUE ("email", "planType");
                        END IF;
                    END $$;
                `)

                console.log('✅ Migration completed successfully!')
                console.log('\nVerifying...')

                const trackersAfter = await prisma.$queryRaw`
                    SELECT id, email, "planType", "createdAt" 
                    FROM trial_trackers 
                    LIMIT 5
                `
                console.log('✅ Verification successful!')
                console.log('Sample data:', trackersAfter)
            } else {
                throw error
            }
        }

        // Show current constraints
        console.log('\n📋 Current constraints:')
        const constraints = await prisma.$queryRaw`
            SELECT conname, pg_get_constraintdef(oid) as definition
            FROM pg_constraint
            WHERE conrelid = 'trial_trackers'::regclass
        `
        console.log(constraints)

    } catch (error) {
        console.error('❌ Error:', error)
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
