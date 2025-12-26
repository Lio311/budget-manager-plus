-- Force fix for trial_trackers table
-- This migration ensures the planType column exists and correct constraints are in place

DO $$ 
BEGIN
    -- Add planType column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'trial_trackers' AND column_name = 'planType'
    ) THEN
        ALTER TABLE "trial_trackers" ADD COLUMN "planType" TEXT NOT NULL DEFAULT 'PERSONAL';
        RAISE NOTICE 'Added planType column';
    END IF;

    -- Drop old unique constraint if it exists
    IF EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'trial_trackers_email_key'
    ) THEN
        ALTER TABLE "trial_trackers" DROP CONSTRAINT "trial_trackers_email_key";
        RAISE NOTICE 'Dropped old email constraint';
    END IF;

    -- Add new unique constraint if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'trial_trackers_email_planType_key'
    ) THEN
        ALTER TABLE "trial_trackers" ADD CONSTRAINT "trial_trackers_email_planType_key" UNIQUE ("email", "planType");
        RAISE NOTICE 'Added new (email, planType) constraint';
    END IF;
END $$;
