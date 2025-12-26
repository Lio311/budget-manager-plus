-- Check if planType column exists in trial_trackers table
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_name = 'trial_trackers'
ORDER BY ordinal_position;

-- Check current unique constraints on trial_trackers
SELECT conname, contype, pg_get_constraintdef(oid) as definition
FROM pg_constraint
WHERE conrelid = 'trial_trackers'::regclass;

-- Show all data in trial_trackers
SELECT * FROM trial_trackers;
