-- This migration fixes the failed migration by handling existing data
-- First, check if the column already exists before adding it

DO $$ 
BEGIN
    -- Add planType column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'trial_trackers' AND column_name = 'planType'
    ) THEN
        ALTER TABLE "trial_trackers" ADD COLUMN "planType" "PlanType" NOT NULL DEFAULT 'PERSONAL';
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

-- Create site_settings table if it doesn't exist
CREATE TABLE IF NOT EXISTS "site_settings" (
    "id" TEXT NOT NULL DEFAULT 'site_settings',
    "maintenanceMode" BOOLEAN NOT NULL DEFAULT false,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "site_settings_pkey" PRIMARY KEY ("id")
);
