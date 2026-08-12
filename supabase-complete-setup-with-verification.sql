-- ============================================================================
-- SMART-BARANGAY COMPLETE SETUP WITH EMAIL VERIFICATION
-- ============================================================================
-- Complete database setup including email verification support
-- Run this entire file in Supabase SQL Editor
-- ============================================================================

-- ============================================================================
-- 1. ENABLE REQUIRED EXTENSIONS
-- ============================================================================

-- Enable UUID generation
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Enable PostGIS for geographic data (maps)
CREATE EXTENSION IF NOT EXISTS "postgis";

-- ============================================================================
-- 2. CREATE ENUMS (Types)
-- ============================================================================

-- User roles
DO $$ BEGIN
    CREATE TYPE user_role AS ENUM ('resident', 'staff', 'admin');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Incident categories
DO $$ BEGIN
    CREATE TYPE incident_category AS ENUM (
        'road_maintenance',
        'street_lighting',
        'garbage_collection',
        'water_drainage',
        'public_safety',
        'noise_complaint',
        'illegal_parking',
        'stray_animals',
        'damaged_facilities',
        'health_concern',
        'other'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Incident status
DO $$ BEGIN
    CREATE TYPE incident_status AS ENUM (
        'pending',
        'acknowledged',
        'in_progress',
        'resolved',
        'closed',
        'rejected'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Incident priority
DO $$ BEGIN
    CREATE TYPE incident_priority AS ENUM ('low', 'medium', 'high', 'urgent');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Incident severity
DO $$ BEGIN
    CREATE TYPE incident_severity AS ENUM ('minor', 'moderate', 'major', 'critical');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- ============================================================================
-- 3. CREATE TABLES
-- ============================================================================

-- Profiles table (linked to auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT UNIQUE NOT NULL,
    full_name TEXT NOT NULL,
    role user_role DEFAULT 'resident' NOT NULL,
    phone TEXT,
    address TEXT,
    barangay TEXT,
    avatar_url TEXT,
    email_verified BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Reports/Incidents table
CREATE TABLE IF NOT EXISTS public.reports (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    category incident_category NOT NULL,
    status incident_status DEFAULT 'pending' NOT NULL,
    priority incident_priority DEFAULT 'medium',
    severity incident_severity DEFAULT 'moderate',
    location_name TEXT,
    location_coordinates GEOGRAPHY(POINT, 4326),
    address TEXT,
    ai_summary TEXT,
    ai_keywords TEXT[],
    assigned_department TEXT,
    assigned_to UUID REFERENCES public.profiles(id),
    image_urls TEXT[],
    video_urls TEXT[],
    document_urls TEXT[],
    upvotes INTEGER DEFAULT 0,
    is_anonymous BOOLEAN DEFAULT FALSE,
    resolved_at TIMESTAMPTZ,
    resolved_by UUID REFERENCES public.profiles(id),
    resolution_notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Comments table
CREATE TABLE IF NOT EXISTS public.comments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    report_id UUID NOT NULL REFERENCES public.reports(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    is_internal BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Status history table
CREATE TABLE IF NOT EXISTS public.status_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    report_id UUID NOT NULL REFERENCES public.reports(id) ON DELETE CASCADE,
    changed_by UUID NOT NULL REFERENCES public.profiles(id),
    old_status incident_status,
    new_status incident_status NOT NULL,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Announcements table
CREATE TABLE IF NOT EXISTS public.announcements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    category TEXT,
    author_id UUID NOT NULL REFERENCES public.profiles(id),
    image_url TEXT,
    is_pinned BOOLEAN DEFAULT FALSE,
    published_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Notifications table
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    type TEXT,
    reference_id UUID,
    reference_type TEXT,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Audit logs table
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.profiles(id),
    action TEXT NOT NULL,
    resource_type TEXT,
    resource_id UUID,
    details JSONB,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Upvotes table
CREATE TABLE IF NOT EXISTS public.upvotes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    report_id UUID NOT NULL REFERENCES public.reports(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(report_id, user_id)
);

-- ============================================================================
-- 4. CREATE INDEXES FOR PERFORMANCE
-- ============================================================================

-- Profiles indexes
CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);

-- Reports indexes
CREATE INDEX IF NOT EXISTS idx_reports_user_id ON public.reports(user_id);
CREATE INDEX IF NOT EXISTS idx_reports_status ON public.reports(status);
CREATE INDEX IF NOT EXISTS idx_reports_category ON public.reports(category);
CREATE INDEX IF NOT EXISTS idx_reports_created_at ON public.reports(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_reports_priority ON public.reports(priority);
CREATE INDEX IF NOT EXISTS idx_reports_location ON public.reports USING GIST(location_coordinates);

-- Comments indexes
CREATE INDEX IF NOT EXISTS idx_comments_report_id ON public.comments(report_id);
CREATE INDEX IF NOT EXISTS idx_comments_user_id ON public.comments(user_id);

-- Notifications indexes
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON public.notifications(is_read);

-- Audit logs indexes
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON public.audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON public.audit_logs(created_at DESC);

-- ============================================================================
-- 5. CREATE FUNCTIONS
-- ============================================================================

-- Function: Auto-create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, email, full_name, email_verified)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
        NEW.email_confirmed_at IS NOT NULL
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

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
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: Update updated_at timestamp
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function: Update report upvotes count
CREATE OR REPLACE FUNCTION public.update_report_upvotes()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE public.reports
    SET upvotes = (
        SELECT COUNT(*) FROM public.upvotes WHERE report_id = COALESCE(NEW.report_id, OLD.report_id)
    )
    WHERE id = COALESCE(NEW.report_id, OLD.report_id);
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Function: Create notification on report status change
CREATE OR REPLACE FUNCTION public.notify_report_status_change()
RETURNS TRIGGER AS $$
BEGIN
    -- Only notify if status actually changed
    IF OLD.status IS DISTINCT FROM NEW.status THEN
        INSERT INTO public.notifications (user_id, title, message, type, reference_id, reference_type)
        VALUES (
            NEW.user_id,
            'Report Status Updated',
            'Your report "' || NEW.title || '" status changed to ' || NEW.status,
            'report_status',
            NEW.id,
            'report'
        );
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- 6. CREATE TRIGGERS
-- ============================================================================

-- Trigger: Create profile on new user signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user();

-- Trigger: Sync email verification status
DROP TRIGGER IF EXISTS on_auth_user_email_verified ON auth.users;
CREATE TRIGGER on_auth_user_email_verified
    AFTER UPDATE OF email_confirmed_at ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.sync_email_verification();

-- Trigger: Update updated_at on profiles
DROP TRIGGER IF EXISTS set_updated_at_profiles ON public.profiles;
CREATE TRIGGER set_updated_at_profiles
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

-- Trigger: Update updated_at on reports
DROP TRIGGER IF EXISTS set_updated_at_reports ON public.reports;
CREATE TRIGGER set_updated_at_reports
    BEFORE UPDATE ON public.reports
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

-- Trigger: Update upvotes count
DROP TRIGGER IF EXISTS update_upvotes_on_insert ON public.upvotes;
CREATE TRIGGER update_upvotes_on_insert
    AFTER INSERT ON public.upvotes
    FOR EACH ROW
    EXECUTE FUNCTION public.update_report_upvotes();

DROP TRIGGER IF EXISTS update_upvotes_on_delete ON public.upvotes;
CREATE TRIGGER update_upvotes_on_delete
    AFTER DELETE ON public.upvotes
    FOR EACH ROW
    EXECUTE FUNCTION public.update_report_upvotes();

-- Trigger: Notify on status change
DROP TRIGGER IF EXISTS notify_on_status_change ON public.reports;
CREATE TRIGGER notify_on_status_change
    AFTER UPDATE OF status ON public.reports
    FOR EACH ROW
    EXECUTE FUNCTION public.notify_report_status_change();

-- ============================================================================
-- 7. ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.status_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.upvotes ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- PROFILES POLICIES
-- ============================================================================

-- Anyone can view profiles
CREATE POLICY "Profiles are viewable by everyone"
    ON public.profiles FOR SELECT
    USING (true);

-- Users can update their own profile
CREATE POLICY "Users can update own profile"
    ON public.profiles FOR UPDATE
    USING (auth.uid() = id);

-- Admins can update any profile
CREATE POLICY "Admins can update any profile"
    ON public.profiles FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- ============================================================================
-- REPORTS POLICIES
-- ============================================================================

-- Anyone can view reports
CREATE POLICY "Reports are viewable by everyone"
    ON public.reports FOR SELECT
    USING (true);

-- Authenticated users can create reports
CREATE POLICY "Authenticated users can create reports"
    ON public.reports FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Users can update their own reports
CREATE POLICY "Users can update own reports"
    ON public.reports FOR UPDATE
    USING (auth.uid() = user_id);

-- Staff and admins can update any report
CREATE POLICY "Staff and admins can update any report"
    ON public.reports FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND role IN ('staff', 'admin')
        )
    );

-- Admins can delete reports
CREATE POLICY "Admins can delete reports"
    ON public.reports FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- ============================================================================
-- COMMENTS POLICIES
-- ============================================================================

-- Anyone can view non-internal comments
CREATE POLICY "Anyone can view public comments"
    ON public.comments FOR SELECT
    USING (is_internal = false OR auth.uid() IS NOT NULL);

-- Staff/admin can view internal comments
CREATE POLICY "Staff can view internal comments"
    ON public.comments FOR SELECT
    USING (
        is_internal = true AND
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND role IN ('staff', 'admin')
        )
    );

-- Authenticated users can create comments
CREATE POLICY "Authenticated users can create comments"
    ON public.comments FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Users can update their own comments
CREATE POLICY "Users can update own comments"
    ON public.comments FOR UPDATE
    USING (auth.uid() = user_id);

-- Users can delete their own comments
CREATE POLICY "Users can delete own comments"
    ON public.comments FOR DELETE
    USING (auth.uid() = user_id);

-- ============================================================================
-- NOTIFICATIONS POLICIES
-- ============================================================================

-- Users can only view their own notifications
CREATE POLICY "Users can view own notifications"
    ON public.notifications FOR SELECT
    USING (auth.uid() = user_id);

-- System can create notifications (handled by triggers)
CREATE POLICY "System can create notifications"
    ON public.notifications FOR INSERT
    WITH CHECK (true);

-- Users can update their own notifications (mark as read)
CREATE POLICY "Users can update own notifications"
    ON public.notifications FOR UPDATE
    USING (auth.uid() = user_id);

-- Users can delete their own notifications
CREATE POLICY "Users can delete own notifications"
    ON public.notifications FOR DELETE
    USING (auth.uid() = user_id);

-- ============================================================================
-- ANNOUNCEMENTS POLICIES
-- ============================================================================

-- Everyone can view announcements
CREATE POLICY "Everyone can view announcements"
    ON public.announcements FOR SELECT
    USING (true);

-- Staff and admins can create announcements
CREATE POLICY "Staff and admins can create announcements"
    ON public.announcements FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND role IN ('staff', 'admin')
        )
    );

-- Admins can update announcements
CREATE POLICY "Admins can update announcements"
    ON public.announcements FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Admins can delete announcements
CREATE POLICY "Admins can delete announcements"
    ON public.announcements FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- ============================================================================
-- UPVOTES POLICIES
-- ============================================================================

-- Anyone can view upvotes
CREATE POLICY "Anyone can view upvotes"
    ON public.upvotes FOR SELECT
    USING (true);

-- Authenticated users can create upvotes
CREATE POLICY "Authenticated users can create upvotes"
    ON public.upvotes FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Users can delete their own upvotes
CREATE POLICY "Users can delete own upvotes"
    ON public.upvotes FOR DELETE
    USING (auth.uid() = user_id);

-- ============================================================================
-- AUDIT LOGS POLICIES
-- ============================================================================

-- Only admins can view audit logs
CREATE POLICY "Only admins can view audit logs"
    ON public.audit_logs FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- System can create audit logs
CREATE POLICY "System can create audit logs"
    ON public.audit_logs FOR INSERT
    WITH CHECK (true);

-- ============================================================================
-- STATUS HISTORY POLICIES
-- ============================================================================

-- Anyone can view status history
CREATE POLICY "Anyone can view status history"
    ON public.status_history FOR SELECT
    USING (true);

-- Staff and admins can create status history
CREATE POLICY "Staff and admins can create status history"
    ON public.status_history FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND role IN ('staff', 'admin')
        )
    );

-- ============================================================================
-- 8. STORAGE BUCKETS
-- ============================================================================

-- Create storage buckets for file uploads
INSERT INTO storage.buckets (id, name, public)
VALUES 
    ('avatars', 'avatars', true),
    ('report-images', 'report-images', true),
    ('report-videos', 'report-videos', true),
    ('report-documents', 'report-documents', false),
    ('announcements', 'announcements', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for avatars
CREATE POLICY "Avatar images are publicly accessible"
    ON storage.objects FOR SELECT
    USING (bucket_id = 'avatars');

CREATE POLICY "Authenticated users can upload avatars"
    ON storage.objects FOR INSERT
    WITH CHECK (bucket_id = 'avatars' AND auth.role() = 'authenticated');

CREATE POLICY "Users can update own avatar"
    ON storage.objects FOR UPDATE
    USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete own avatar"
    ON storage.objects FOR DELETE
    USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Storage policies for report images
CREATE POLICY "Report images are publicly accessible"
    ON storage.objects FOR SELECT
    USING (bucket_id = 'report-images');

CREATE POLICY "Authenticated users can upload report images"
    ON storage.objects FOR INSERT
    WITH CHECK (bucket_id = 'report-images' AND auth.role() = 'authenticated');

-- Storage policies for report videos
CREATE POLICY "Report videos are publicly accessible"
    ON storage.objects FOR SELECT
    USING (bucket_id = 'report-videos');

CREATE POLICY "Authenticated users can upload report videos"
    ON storage.objects FOR INSERT
    WITH CHECK (bucket_id = 'report-videos' AND auth.role() = 'authenticated');

-- Storage policies for report documents
CREATE POLICY "Authenticated users can view report documents"
    ON storage.objects FOR SELECT
    USING (bucket_id = 'report-documents' AND auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can upload report documents"
    ON storage.objects FOR INSERT
    WITH CHECK (bucket_id = 'report-documents' AND auth.role() = 'authenticated');

-- Storage policies for announcements
CREATE POLICY "Announcement images are publicly accessible"
    ON storage.objects FOR SELECT
    USING (bucket_id = 'announcements');

CREATE POLICY "Staff can upload announcement images"
    ON storage.objects FOR INSERT
    WITH CHECK (
        bucket_id = 'announcements' AND
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND role IN ('staff', 'admin')
        )
    );

-- ============================================================================
-- 9. EMAIL VERIFICATION MANAGEMENT
-- ============================================================================

-- View to check email verification status
CREATE OR REPLACE VIEW public.user_verification_status AS
SELECT 
    p.id,
    p.email,
    p.full_name,
    p.role,
    p.email_verified,
    au.email_confirmed_at,
    au.confirmed_at,
    p.created_at,
    CASE 
        WHEN au.email_confirmed_at IS NOT NULL THEN 'Verified'
        ELSE 'Not Verified'
    END as status
FROM public.profiles p
LEFT JOIN auth.users au ON au.id = p.id;

-- Function to manually verify user email (for admin use)
CREATE OR REPLACE FUNCTION public.admin_verify_user_email(user_email TEXT)
RETURNS TEXT AS $$
DECLARE
    user_id UUID;
BEGIN
    -- Get user ID
    SELECT id INTO user_id FROM auth.users WHERE email = user_email;
    
    IF user_id IS NULL THEN
        RETURN 'Error: User not found';
    END IF;
    
    -- Update auth.users
    UPDATE auth.users 
    SET email_confirmed_at = NOW(),
        confirmed_at = NOW()
    WHERE id = user_id;
    
    -- Update profiles
    UPDATE public.profiles
    SET email_verified = TRUE
    WHERE id = user_id;
    
    RETURN 'Success: Email verified for ' || user_email;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- 10. INITIAL DATA / SAMPLE DATA
-- ============================================================================

-- Note: Users should be created via Supabase Auth signup, not directly in database
-- This section is for reference only

/*
-- Example: Create admin user (DO NOT RUN - use /setup-admin page instead)
-- This is just for reference

INSERT INTO auth.users (email, encrypted_password, email_confirmed_at, confirmed_at)
VALUES ('admin@smartbarangay.com', crypt('your-password', gen_salt('bf')), NOW(), NOW());

INSERT INTO public.profiles (id, email, full_name, role, email_verified)
VALUES (
    (SELECT id FROM auth.users WHERE email = 'admin@smartbarangay.com'),
    'admin@smartbarangay.com',
    'System Administrator',
    'admin',
    TRUE
);
*/

-- ============================================================================
-- 11. USEFUL QUERIES FOR MONITORING
-- ============================================================================

-- Check all users and their verification status
-- SELECT * FROM public.user_verification_status ORDER BY created_at DESC;

-- Count users by role
-- SELECT role, COUNT(*) FROM public.profiles GROUP BY role;

-- Count reports by status
-- SELECT status, COUNT(*) FROM public.reports GROUP BY status;

-- View unread notifications
-- SELECT * FROM public.notifications WHERE is_read = FALSE;

-- Recent reports
-- SELECT * FROM public.reports ORDER BY created_at DESC LIMIT 10;

-- ============================================================================
-- 12. MANUAL VERIFICATION COMMANDS (FOR TESTING)
-- ============================================================================

-- Verify specific user by email:
-- SELECT public.admin_verify_user_email('user@example.com');

-- Or directly via SQL:
-- UPDATE auth.users SET email_confirmed_at = NOW(), confirmed_at = NOW() 
-- WHERE email = 'user@example.com';

-- Verify all existing users at once (use carefully!):
-- UPDATE auth.users SET email_confirmed_at = NOW(), confirmed_at = NOW() 
-- WHERE email_confirmed_at IS NULL;

-- ============================================================================
-- SETUP COMPLETE! 🎉
-- ============================================================================

-- Next steps:
-- 1. Go to Supabase Dashboard → Authentication → Settings
-- 2. Enable "Enable email confirmations" toggle
-- 3. Configure email templates (optional)
-- 4. Test registration at: http://localhost:3000/register
-- 5. Create first admin via: http://localhost:3000/setup-admin
-- 
-- Your SMART-Barangay database is now ready with email verification support!
-- All tables, indexes, RLS policies, and triggers are configured.
