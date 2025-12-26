-- AlterTable
ALTER TABLE "trial_trackers" DROP CONSTRAINT "trial_trackers_email_key";
ALTER TABLE "trial_trackers" ADD COLUMN "planType" "PlanType" NOT NULL DEFAULT 'PERSONAL';
ALTER TABLE "trial_trackers" ADD CONSTRAINT "trial_trackers_email_planType_key" UNIQUE ("email", "planType");

-- CreateTable
CREATE TABLE "site_settings" (
    "id" TEXT NOT NULL DEFAULT 'site_settings',
    "maintenanceMode" BOOLEAN NOT NULL DEFAULT false,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "site_settings_pkey" PRIMARY KEY ("id")
);
