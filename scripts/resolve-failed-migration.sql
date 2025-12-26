-- Script to resolve failed migration
-- This marks the failed migration as rolled back so Prisma can retry it

DELETE FROM "_prisma_migrations" 
WHERE migration_name = '20251226204400_add_maintenance_mode_and_trial_plan_type';
