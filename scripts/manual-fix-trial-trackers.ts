/**
 * Manual migration to fix trial_trackers table
 * This adds planType column and updates the unique constraint
 * Run with: npx tsx scripts/manual-fix-trial-trackers.ts
 */

import { config } from 'dotenv'
import { PrismaClient } from '@prisma/client'

// Load environment variables from .env.local
config({ path: '.env.local' })

const prisma = new PrismaClient()

async function main() {
    console.log('🔧 Manually fixing trial_trackers table...\n')

    try {
        // Run the migration SQL directly
        console.log('Step 1: Adding planType column if missing...')
        await prisma.$executeRawUnsafe(`
            DO $$ 
            BEGIN
                -- Add planType column if it doesn't exist
                IF NOT EXISTS (
                    SELECT 1 FROM information_schema.columns 
                    WHERE table_name = 'trial_trackers' AND column_name = 'planType'
                ) THEN
                    ALTER TABLE "trial_trackers" ADD COLUMN "planType" TEXT NOT NULL DEFAULT 'PERSONAL';
                    RAISE NOTICE 'Added planType column';
                ELSE
                    RAISE NOTICE 'planType column already exists';
                END IF;
            END $$;
        `)
        console.log('✅ Step 1 complete\n')

        console.log('Step 2: Dropping old unique constraint...')
        await prisma.$executeRawUnsafe(`
            DO $$ 
            BEGIN
                -- Drop old unique constraint if it exists
                IF EXISTS (
                    SELECT 1 FROM pg_constraint 
                    WHERE conname = 'trial_trackers_email_key'
                ) THEN
                    ALTER TABLE "trial_trackers" DROP CONSTRAINT "trial_trackers_email_key";
                    RAISE NOTICE 'Dropped old email constraint';
                ELSE
                    RAISE NOTICE 'Old constraint does not exist';
                END IF;
            END $$;
        `)
        console.log('✅ Step 2 complete\n')

        console.log('Step 3: Adding new unique constraint...')
        await prisma.$executeRawUnsafe(`
            DO $$ 
            BEGIN
                -- Add new unique constraint if it doesn't exist
                IF NOT EXISTS (
                    SELECT 1 FROM pg_constraint 
                    WHERE conname = 'trial_trackers_email_planType_key'
                ) THEN
                    ALTER TABLE "trial_trackers" ADD CONSTRAINT "trial_trackers_email_planType_key" UNIQUE ("email", "planType");
                    RAISE NOTICE 'Added new (email, planType) constraint';
                ELSE
                    RAISE NOTICE 'New constraint already exists';
                END IF;
            END $$;
        `)
        console.log('✅ Step 3 complete\n')

        // Verify the changes
        console.log('📋 Verifying changes...')
        const constraints = await prisma.$queryRaw`
            SELECT conname, pg_get_constraintdef(oid) as definition
            FROM pg_constraint
            WHERE conrelid = 'trial_trackers'::regclass
        `
        console.log('Current constraints:', constraints)

        const columns = await prisma.$queryRaw`
            SELECT column_name, data_type, column_default
            FROM information_schema.columns
            WHERE table_name = 'trial_trackers'
            ORDER BY ordinal_position
        `
        console.log('\nCurrent columns:', columns)

        console.log('\n✅ Migration completed successfully!')
        console.log('Users can now use trial for both PERSONAL and BUSINESS plans.')

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
