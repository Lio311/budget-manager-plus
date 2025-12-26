-- Grant 14-day trial to specific users
-- Run this in your database console (Neon, pgAdmin, etc.)

-- Set variables
DO $$
DECLARE
    trial_start TIMESTAMP := NOW();
    trial_end TIMESTAMP := NOW() + INTERVAL '14 days';
    user_record RECORD;
BEGIN
    -- Process amirbi98@gmail.com
    SELECT * INTO user_record FROM users WHERE email = 'amirbi98@gmail.com';
    IF FOUND THEN
        -- Create/update trial tracker
        INSERT INTO trial_trackers (id, email, "createdAt")
        VALUES (gen_random_uuid(), 'amirbi98@gmail.com', NOW())
        ON CONFLICT (email) DO NOTHING;
        
        -- Create/update subscription
        INSERT INTO subscriptions (id, "userId", status, "startDate", "endDate", "createdAt", "updatedAt")
        VALUES (gen_random_uuid(), user_record.id, 'trial', trial_start, trial_end, NOW(), NOW())
        ON CONFLICT ("userId") DO UPDATE
        SET status = 'trial', "startDate" = trial_start, "endDate" = trial_end, "updatedAt" = NOW();
        
        RAISE NOTICE 'Trial granted to amirbi98@gmail.com';
    ELSE
        RAISE NOTICE 'User not found: amirbi98@gmail.com';
    END IF;

    -- Process yossefshalev@gmail.com
    SELECT * INTO user_record FROM users WHERE email = 'yossefshalev@gmail.com';
    IF FOUND THEN
        INSERT INTO trial_trackers (id, email, "createdAt")
        VALUES (gen_random_uuid(), 'yossefshalev@gmail.com', NOW())
        ON CONFLICT (email) DO NOTHING;
        
        INSERT INTO subscriptions (id, "userId", status, "startDate", "endDate", "createdAt", "updatedAt")
        VALUES (gen_random_uuid(), user_record.id, 'trial', trial_start, trial_end, NOW(), NOW())
        ON CONFLICT ("userId") DO UPDATE
        SET status = 'trial', "startDate" = trial_start, "endDate" = trial_end, "updatedAt" = NOW();
        
        RAISE NOTICE 'Trial granted to yossefshalev@gmail.com';
    ELSE
        RAISE NOTICE 'User not found: yossefshalev@gmail.com';
    END IF;

    -- Process idozalma34@gmail.com
    SELECT * INTO user_record FROM users WHERE email = 'idozalma34@gmail.com';
    IF FOUND THEN
        INSERT INTO trial_trackers (id, email, "createdAt")
        VALUES (gen_random_uuid(), 'idozalma34@gmail.com', NOW())
        ON CONFLICT (email) DO NOTHING;
        
        INSERT INTO subscriptions (id, "userId", status, "startDate", "endDate", "createdAt", "updatedAt")
        VALUES (gen_random_uuid(), user_record.id, 'trial', trial_start, trial_end, NOW(), NOW())
        ON CONFLICT ("userId") DO UPDATE
        SET status = 'trial', "startDate" = trial_start, "endDate" = trial_end, "updatedAt" = NOW();
        
        RAISE NOTICE 'Trial granted to idozalma34@gmail.com';
    ELSE
        RAISE NOTICE 'User not found: idozalma34@gmail.com';
    END IF;
END $$;

-- Verify the changes
SELECT 
    u.email,
    s.status,
    s."startDate",
    s."endDate",
    CASE 
        WHEN s."endDate" > NOW() THEN 'Active'
        ELSE 'Expired'
    END as trial_status,
    EXISTS(SELECT 1 FROM trial_trackers tt WHERE tt.email = u.email) as has_tracker
FROM users u
LEFT JOIN subscriptions s ON s."userId" = u.id
WHERE u.email IN ('amirbi98@gmail.com', 'yossefshalev@gmail.com', 'idozalma34@gmail.com')
ORDER BY u.email;
