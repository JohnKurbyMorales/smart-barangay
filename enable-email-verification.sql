-- ============================================================================
-- ENABLE EMAIL VERIFICATION FOR SMART-BARANGAY
-- ============================================================================
-- Run this in Supabase SQL Editor to enable email verification
-- ============================================================================

-- NOTE: This SQL script only handles database-level settings.
-- You still need to enable email confirmation in Supabase Dashboard:
-- 
-- 1. Go to: Supabase Dashboard → Authentication → Settings
-- 2. Find: "Enable email confirmations"
-- 3. Toggle it ON ✓
-- 4. Save
--
-- That setting is not controllable via SQL - it's a Supabase Auth config.

-- ============================================================================
-- OPTIONAL: Manually verify existing users (if needed)
-- ============================================================================

-- If you have existing users who need to be auto-verified:
-- Uncomment the lines below to verify all existing users

/*
UPDATE auth.users 
SET email_confirmed_at = NOW(), 
    confirmed_at = NOW()
WHERE email_confirmed_at IS NULL;
*/

-- Or verify specific users by email:
/*
UPDATE auth.users 
SET email_confirmed_at = NOW(), 
    confirmed_at = NOW()
WHERE email = 'admin@example.com';
*/

-- Or verify by user ID:
/*
UPDATE auth.users 
SET email_confirmed_at = NOW(), 
    confirmed_at = NOW()
WHERE id = 'user-uuid-here';
*/

-- ============================================================================
-- CHECK VERIFICATION STATUS
-- ============================================================================

-- View all users and their verification status:
SELECT 
    id,
    email,
    email_confirmed_at,
    confirmed_at,
    created_at,
    CASE 
        WHEN email_confirmed_at IS NOT NULL THEN '✓ Verified'
        ELSE '✗ Not Verified'
    END as status
FROM auth.users
ORDER BY created_at DESC;

-- ============================================================================
-- USEFUL QUERIES FOR DEBUGGING
-- ============================================================================

-- Count verified vs unverified users:
SELECT 
    COUNT(*) FILTER (WHERE email_confirmed_at IS NOT NULL) as verified_users,
    COUNT(*) FILTER (WHERE email_confirmed_at IS NULL) as unverified_users,
    COUNT(*) as total_users
FROM auth.users;

-- Find all unverified users:
SELECT 
    id,
    email,
    created_at,
    EXTRACT(HOUR FROM (NOW() - created_at)) as hours_since_registration
FROM auth.users
WHERE email_confirmed_at IS NULL
ORDER BY created_at DESC;

-- Find recently verified users (last 24 hours):
SELECT 
    email,
    email_confirmed_at,
    created_at,
    EXTRACT(MINUTE FROM (email_confirmed_at - created_at)) as minutes_to_verify
FROM auth.users
WHERE email_confirmed_at >= NOW() - INTERVAL '24 hours'
ORDER BY email_confirmed_at DESC;

-- ============================================================================
-- RESET VERIFICATION (for testing)
-- ============================================================================

-- CAUTION: Use these only for testing purposes!

-- Reset specific user to unverified (for testing):
/*
UPDATE auth.users 
SET email_confirmed_at = NULL,
    confirmed_at = NULL
WHERE email = 'test@example.com';
*/

-- Delete test user completely:
/*
DELETE FROM auth.users 
WHERE email = 'test@example.com';
*/

-- ============================================================================
-- NOTES
-- ============================================================================

/*
1. Email verification settings are configured in Supabase Dashboard, not SQL
2. The auth.users table is managed by Supabase Auth
3. Never manually insert into auth.users - use signUp() API instead
4. email_confirmed_at and confirmed_at should match
5. OTP codes are not stored in database - they're managed by Supabase Auth
6. OTP codes expire after 1 hour by default
7. Users can request new codes via resend functionality

IMPORTANT: After running this SQL, you must also:
- Enable email confirmation in Supabase Dashboard
- Test the registration flow
- Check that verification emails are being sent
*/

-- ============================================================================
-- ADMIN SETUP - Auto-verify admin users
-- ============================================================================

-- If you want admins to bypass email verification:
-- (This is useful for initial admin setup)

/*
-- Create trigger to auto-verify admin users
CREATE OR REPLACE FUNCTION auto_verify_admin_users()
RETURNS TRIGGER AS $$
BEGIN
    -- Check if the user is being set as admin in profiles table
    IF NEW.role = 'admin' OR NEW.role = 'staff' THEN
        -- Auto-verify the auth user
        UPDATE auth.users 
        SET email_confirmed_at = NOW(),
            confirmed_at = NOW()
        WHERE id = NEW.id
        AND email_confirmed_at IS NULL;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger on profiles table
DROP TRIGGER IF EXISTS on_admin_profile_created ON public.profiles;
CREATE TRIGGER on_admin_profile_created
    AFTER INSERT OR UPDATE OF role ON public.profiles
    FOR EACH ROW
    EXECUTE FUNCTION auto_verify_admin_users();
*/

-- ============================================================================
-- DONE!
-- ============================================================================

-- Your email verification system is now ready!
-- 
-- Next steps:
-- 1. Enable "Email confirmations" in Supabase Dashboard
-- 2. Test registration at: http://localhost:3000/register
-- 3. Check email for 6-digit code
-- 4. Enter code at: /verify-email
-- 
-- Good luck! 🚀
