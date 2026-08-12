-- ============================================================================
-- ADD EMAIL VERIFICATION SUPPORT TO EXISTING DATABASE
-- ============================================================================
-- Run this if you already have existing tables and want to add email verification
-- This will only ADD new features, not recreate existing ones
-- ============================================================================

-- ============================================================================
-- 1. ADD EMAIL VERIFICATION COLUMN (if not exists)
-- ============================================================================

-- Add email_verified column to profiles table
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'profiles' 
        AND column_name = 'email_verified'
    ) THEN
        ALTER TABLE public.profiles ADD COLUMN email_verified BOOLEAN DEFAULT FALSE;
        RAISE NOTICE 'Added email_verified column to profiles table';
    ELSE
        RAISE NOTICE 'email_verified column already exists';
    END IF;
END $$;

-- ============================================================================
-- 2. UPDATE EXISTING USERS (Set verified = true for existing users)
-- ============================================================================

-- Update existing users to be verified (so they can still login)
UPDATE public.profiles 
SET email_verified = TRUE 
WHERE email_verified IS NULL OR email_verified = FALSE;

-- Also verify in auth.users table
-- Note: confirmed_at is a generated column, only update email_confirmed_at
UPDATE auth.users 
SET email_confirmed_at = COALESCE(email_confirmed_at, NOW())
WHERE email_confirmed_at IS NULL;

-- ============================================================================
-- 3. CREATE/REPLACE EMAIL VERIFICATION FUNCTIONS
-- ============================================================================

-- Function: Update email_verified when auth.users email is confirmed
CREATE OR REPLACE FUNCTION public.sync_email_verification()
RETURNS TRIGGER AS $$
BEGIN
    -- If email was just confirmed, update profile
    IF OLD.email_confirmed_at IS NULL AND NEW.email_confirmed_at IS NOT NULL THEN
        UPDATE public.profiles
        SET email_verified = TRUE,
            updated_at = NOW()
        WHERE id = NEW.id;
        
        RAISE NOTICE 'Email verified for user: %', NEW.email;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: Update handle_new_user to include email_verified
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, email, full_name, email_verified)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
        NEW.email_confirmed_at IS NOT NULL
    )
    ON CONFLICT (id) DO UPDATE
    SET email_verified = NEW.email_confirmed_at IS NOT NULL;
    
    RAISE NOTICE 'Profile created/updated for user: %', NEW.email;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- 4. CREATE/REPLACE TRIGGERS
-- ============================================================================

-- Drop existing triggers if they exist
DROP TRIGGER IF EXISTS on_auth_user_email_verified ON auth.users;
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Recreate trigger: Sync email verification status
CREATE TRIGGER on_auth_user_email_verified
    AFTER UPDATE OF email_confirmed_at ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.sync_email_verification();

-- Recreate trigger: Create profile on new user signup
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user();

-- ============================================================================
-- 5. CREATE VERIFICATION STATUS VIEW
-- ============================================================================

-- Drop view if exists
DROP VIEW IF EXISTS public.user_verification_status;

-- Create view to check email verification status
CREATE VIEW public.user_verification_status AS
SELECT 
    p.id,
    p.email,
    p.full_name,
    p.role,
    p.email_verified as profile_verified,
    au.email_confirmed_at,
    au.confirmed_at,
    p.created_at,
    CASE 
        WHEN au.email_confirmed_at IS NOT NULL THEN '✓ Verified'
        ELSE '✗ Not Verified'
    END as status,
    CASE 
        WHEN au.email_confirmed_at IS NOT NULL THEN 'green'
        ELSE 'red'
    END as status_color
FROM public.profiles p
LEFT JOIN auth.users au ON au.id = p.id
ORDER BY p.created_at DESC;

-- ============================================================================
-- 6. CREATE ADMIN HELPER FUNCTION
-- ============================================================================

-- Function to manually verify user email (for admin use)
CREATE OR REPLACE FUNCTION public.admin_verify_user_email(user_email TEXT)
RETURNS TEXT AS $$
DECLARE
    user_id UUID;
    rows_affected INTEGER;
BEGIN
    -- Get user ID
    SELECT id INTO user_id FROM auth.users WHERE email = user_email;
    
    IF user_id IS NULL THEN
        RETURN '❌ Error: User not found with email: ' || user_email;
    END IF;
    
    -- Update auth.users
    -- Note: confirmed_at is auto-generated, only update email_confirmed_at
    UPDATE auth.users 
    SET email_confirmed_at = COALESCE(email_confirmed_at, NOW())
    WHERE id = user_id
    AND email_confirmed_at IS NULL;
    
    GET DIAGNOSTICS rows_affected = ROW_COUNT;
    
    -- Update profiles
    UPDATE public.profiles
    SET email_verified = TRUE,
        updated_at = NOW()
    WHERE id = user_id;
    
    IF rows_affected > 0 THEN
        RETURN '✓ Success: Email verified for ' || user_email;
    ELSE
        RETURN '⚠ Note: Email was already verified for ' || user_email;
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to verify user by ID
CREATE OR REPLACE FUNCTION public.admin_verify_user_by_id(user_uuid UUID)
RETURNS TEXT AS $$
DECLARE
    user_email TEXT;
BEGIN
    -- Get user email
    SELECT email INTO user_email FROM auth.users WHERE id = user_uuid;
    
    IF user_email IS NULL THEN
        RETURN '❌ Error: User not found with ID: ' || user_uuid;
    END IF;
    
    -- Use the email verification function
    RETURN public.admin_verify_user_email(user_email);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to verify ALL unverified users (use carefully!)
CREATE OR REPLACE FUNCTION public.admin_verify_all_users()
RETURNS TEXT AS $$
DECLARE
    rows_affected INTEGER;
BEGIN
    -- Update auth.users
    -- Note: confirmed_at is auto-generated, only update email_confirmed_at
    UPDATE auth.users 
    SET email_confirmed_at = NOW()
    WHERE email_confirmed_at IS NULL;
    
    GET DIAGNOSTICS rows_affected = ROW_COUNT;
    
    -- Update profiles
    UPDATE public.profiles
    SET email_verified = TRUE,
        updated_at = NOW()
    WHERE email_verified = FALSE OR email_verified IS NULL;
    
    RETURN '✓ Success: Verified ' || rows_affected || ' users';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- 7. GRANT PERMISSIONS
-- ============================================================================

-- Grant select on view to authenticated users
GRANT SELECT ON public.user_verification_status TO authenticated;

-- ============================================================================
-- 8. VERIFICATION STATUS SUMMARY
-- ============================================================================

-- Query to see current verification status
DO $$ 
DECLARE
    total_users INTEGER;
    verified_users INTEGER;
    unverified_users INTEGER;
BEGIN
    SELECT COUNT(*) INTO total_users FROM auth.users;
    SELECT COUNT(*) INTO verified_users FROM auth.users WHERE email_confirmed_at IS NOT NULL;
    unverified_users := total_users - verified_users;
    
    RAISE NOTICE '';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'EMAIL VERIFICATION STATUS';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'Total Users: %', total_users;
    RAISE NOTICE 'Verified Users: %', verified_users;
    RAISE NOTICE 'Unverified Users: %', unverified_users;
    RAISE NOTICE '========================================';
    RAISE NOTICE '';
    
    IF unverified_users > 0 THEN
        RAISE NOTICE 'To verify all users, run:';
        RAISE NOTICE '  SELECT public.admin_verify_all_users();';
    ELSE
        RAISE NOTICE 'All users are verified! ✓';
    END IF;
END $$;

-- ============================================================================
-- ✅ SETUP COMPLETE!
-- ============================================================================

/*
=============================================================================
NEXT STEPS:
=============================================================================

1. ✅ Database changes applied successfully!

2. 🔧 ENABLE EMAIL CONFIRMATION in Supabase Dashboard:
   - Go to: Authentication → Settings
   - Find: "Enable email confirmations"
   - Toggle it ON ✓
   - Save

3. 📧 Configure Email Templates (optional):
   - Go to: Authentication → Email Templates
   - Customize "Confirm signup" template
   - Test email delivery

4. 🧪 TEST THE FLOW:
   - Visit: http://localhost:3000/register
   - Register new user
   - Check email for 6-digit code
   - Enter code at: /verify-email
   - Should redirect to dashboard

=============================================================================
USEFUL COMMANDS:
=============================================================================

-- View all users and verification status:
SELECT * FROM public.user_verification_status;

-- Verify specific user by email:
SELECT public.admin_verify_user_email('user@example.com');

-- Verify specific user by ID:
SELECT public.admin_verify_user_by_id('uuid-here');

-- Verify ALL unverified users (use carefully!):
SELECT public.admin_verify_all_users();

-- Check verification counts:
SELECT 
    COUNT(*) FILTER (WHERE email_confirmed_at IS NOT NULL) as verified,
    COUNT(*) FILTER (WHERE email_confirmed_at IS NULL) as unverified,
    COUNT(*) as total
FROM auth.users;

-- Find unverified users:
SELECT email, created_at 
FROM auth.users 
WHERE email_confirmed_at IS NULL
ORDER BY created_at DESC;

=============================================================================
*/

-- Show final message
DO $$ 
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '🎉 Email verification support has been added successfully!';
    RAISE NOTICE '';
    RAISE NOTICE 'Remember to:';
    RAISE NOTICE '  1. Enable "Email confirmations" in Supabase Dashboard';
    RAISE NOTICE '  2. Test the registration flow';
    RAISE NOTICE '  3. Configure email templates (optional)';
    RAISE NOTICE '';
END $$;
