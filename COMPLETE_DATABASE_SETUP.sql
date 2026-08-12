-- ============================================================================
-- SMART-BARANGAY - COMPLETE DATABASE SETUP
-- ============================================================================
-- One file to rule them all! 
-- Run this ONCE in a fresh Supabase project
-- No email verification complications - simple and working!
-- ============================================================================

-- ============================================================================
-- STEP 1: ENABLE EXTENSIONS
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "postgis";

-- ============================================================================
-- STEP 2: CREATE TYPES (ENUMS)
-- ============================================================================

DO $$ BEGIN
    CREATE TYPE user_role AS ENUM ('resident', 'staff', 'admin');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE incident_category AS ENUM (
        'road_maintenance', 'street_lighting', 'garbage_collection',
        'water_drainage', 'public_safety', 'noise_complaint',
        'illegal_parking', 'stray_animals', 'damaged_facilities',
        'health_concern', 'other'
    );
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE incident_status AS ENUM (
        'pending', 'acknowledged', 'in_progress', 'resolved', 'closed', 'rejected'
    );
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE incident_priority AS ENUM ('low', 'medium', 'high', 'urgent');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE incident_severity AS ENUM ('minor', 'moderate', 'major', 'critical');
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- ============================================================================
-- STEP 3: CREATE TABLES
-- ============================================================================

-- Profiles table
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT UNIQUE NOT NULL,
    full_name TEXT NOT NULL,
    role user_role DEFAULT 'resident' NOT NULL,
    phone TEXT,
    address TEXT,
    barangay TEXT,
    avatar_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Reports table
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
-- STEP 4: CREATE INDEXES
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);
CREATE INDEX IF NOT EXISTS idx_reports_user_id ON public.reports(user_id);
CREATE INDEX IF NOT EXISTS idx_reports_status ON public.reports(status);
CREATE INDEX IF NOT EXISTS idx_reports_category ON public.reports(category);
CREATE INDEX IF NOT EXISTS idx_reports_created_at ON public.reports(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_reports_priority ON public.reports(priority);
CREATE INDEX IF NOT EXISTS idx_reports_location ON public.reports USING GIST(location_coordinates);
CREATE INDEX IF NOT EXISTS idx_comments_report_id ON public.comments(report_id);
CREATE INDEX IF NOT EXISTS idx_comments_user_id ON public.comments(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON public.notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON public.audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON public.audit_logs(created_at DESC);

-- ============================================================================
-- STEP 5: CREATE FUNCTIONS
-- ============================================================================

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, email, full_name)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email)
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update updated_at timestamp
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Update report upvotes count
CREATE OR REPLACE FUNCTION public.update_report_upvotes()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE public.reports
    SET upvotes = (
        SELECT COUNT(*) FROM public.upvotes 
        WHERE report_id = COALESCE(NEW.report_id, OLD.report_id)
    )
    WHERE id = COALESCE(NEW.report_id, OLD.report_id);
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Notify on status change
CREATE OR REPLACE FUNCTION public.notify_report_status_change()
RETURNS TRIGGER AS $$
BEGIN
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
-- STEP 6: CREATE TRIGGERS
-- ============================================================================

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

DROP TRIGGER IF EXISTS set_updated_at_profiles ON public.profiles;
CREATE TRIGGER set_updated_at_profiles
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS set_updated_at_reports ON public.reports;
CREATE TRIGGER set_updated_at_reports
    BEFORE UPDATE ON public.reports
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS update_upvotes_on_insert ON public.upvotes;
CREATE TRIGGER update_upvotes_on_insert
    AFTER INSERT ON public.upvotes
    FOR EACH ROW EXECUTE FUNCTION public.update_report_upvotes();

DROP TRIGGER IF EXISTS update_upvotes_on_delete ON public.upvotes;
CREATE TRIGGER update_upvotes_on_delete
    AFTER DELETE ON public.upvotes
    FOR EACH ROW EXECUTE FUNCTION public.update_report_upvotes();

DROP TRIGGER IF EXISTS notify_on_status_change ON public.reports;
CREATE TRIGGER notify_on_status_change
    AFTER UPDATE OF status ON public.reports
    FOR EACH ROW EXECUTE FUNCTION public.notify_report_status_change();

-- ============================================================================
-- STEP 7: ROW LEVEL SECURITY (RLS)
-- ============================================================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.status_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.upvotes ENABLE ROW LEVEL SECURITY;

-- Profiles policies
DROP POLICY IF EXISTS "Profiles viewable by everyone" ON public.profiles;
CREATE POLICY "Profiles viewable by everyone" ON public.profiles FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);

DROP POLICY IF EXISTS "Admins can update any profile" ON public.profiles;
CREATE POLICY "Admins can update any profile" ON public.profiles FOR UPDATE
USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

-- Reports policies
DROP POLICY IF EXISTS "Reports viewable by everyone" ON public.reports;
CREATE POLICY "Reports viewable by everyone" ON public.reports FOR SELECT USING (true);

DROP POLICY IF EXISTS "Authenticated users can create reports" ON public.reports;
CREATE POLICY "Authenticated users can create reports" ON public.reports FOR INSERT
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own reports" ON public.reports;
CREATE POLICY "Users can update own reports" ON public.reports FOR UPDATE
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Staff can update any report" ON public.reports;
CREATE POLICY "Staff can update any report" ON public.reports FOR UPDATE
USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('staff', 'admin')));

DROP POLICY IF EXISTS "Admins can delete reports" ON public.reports;
CREATE POLICY "Admins can delete reports" ON public.reports FOR DELETE
USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

-- Comments policies
DROP POLICY IF EXISTS "Public comments viewable" ON public.comments;
CREATE POLICY "Public comments viewable" ON public.comments FOR SELECT
USING (is_internal = false OR auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Staff can view internal comments" ON public.comments;
CREATE POLICY "Staff can view internal comments" ON public.comments FOR SELECT
USING (is_internal = true AND EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('staff', 'admin')));

DROP POLICY IF EXISTS "Users can create comments" ON public.comments;
CREATE POLICY "Users can create comments" ON public.comments FOR INSERT
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own comments" ON public.comments;
CREATE POLICY "Users can update own comments" ON public.comments FOR UPDATE
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own comments" ON public.comments;
CREATE POLICY "Users can delete own comments" ON public.comments FOR DELETE
USING (auth.uid() = user_id);

-- Notifications policies
DROP POLICY IF EXISTS "Users view own notifications" ON public.notifications;
CREATE POLICY "Users view own notifications" ON public.notifications FOR SELECT
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "System can create notifications" ON public.notifications;
CREATE POLICY "System can create notifications" ON public.notifications FOR INSERT
WITH CHECK (true);

DROP POLICY IF EXISTS "Users update own notifications" ON public.notifications;
CREATE POLICY "Users update own notifications" ON public.notifications FOR UPDATE
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users delete own notifications" ON public.notifications;
CREATE POLICY "Users delete own notifications" ON public.notifications FOR DELETE
USING (auth.uid() = user_id);

-- Announcements policies
DROP POLICY IF EXISTS "Everyone can view announcements" ON public.announcements;
CREATE POLICY "Everyone can view announcements" ON public.announcements FOR SELECT USING (true);

DROP POLICY IF EXISTS "Staff can create announcements" ON public.announcements;
CREATE POLICY "Staff can create announcements" ON public.announcements FOR INSERT
WITH CHECK (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('staff', 'admin')));

DROP POLICY IF EXISTS "Admins can update announcements" ON public.announcements;
CREATE POLICY "Admins can update announcements" ON public.announcements FOR UPDATE
USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

DROP POLICY IF EXISTS "Admins can delete announcements" ON public.announcements;
CREATE POLICY "Admins can delete announcements" ON public.announcements FOR DELETE
USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

-- Upvotes policies
DROP POLICY IF EXISTS "Anyone can view upvotes" ON public.upvotes;
CREATE POLICY "Anyone can view upvotes" ON public.upvotes FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can create upvotes" ON public.upvotes;
CREATE POLICY "Users can create upvotes" ON public.upvotes FOR INSERT
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own upvotes" ON public.upvotes;
CREATE POLICY "Users can delete own upvotes" ON public.upvotes FOR DELETE
USING (auth.uid() = user_id);

-- Audit logs policies
DROP POLICY IF EXISTS "Admins view audit logs" ON public.audit_logs;
CREATE POLICY "Admins view audit logs" ON public.audit_logs FOR SELECT
USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

DROP POLICY IF EXISTS "System can create audit logs" ON public.audit_logs;
CREATE POLICY "System can create audit logs" ON public.audit_logs FOR INSERT
WITH CHECK (true);

-- Status history policies
DROP POLICY IF EXISTS "Anyone can view status history" ON public.status_history;
CREATE POLICY "Anyone can view status history" ON public.status_history FOR SELECT USING (true);

DROP POLICY IF EXISTS "Staff can create status history" ON public.status_history;
CREATE POLICY "Staff can create status history" ON public.status_history FOR INSERT
WITH CHECK (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('staff', 'admin')));

-- ============================================================================
-- STEP 8: STORAGE BUCKETS
-- ============================================================================

INSERT INTO storage.buckets (id, name, public)
VALUES 
    ('avatars', 'avatars', true),
    ('report-images', 'report-images', true),
    ('report-videos', 'report-videos', true),
    ('report-documents', 'report-documents', false),
    ('announcements', 'announcements', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies
DROP POLICY IF EXISTS "Avatar images publicly accessible" ON storage.objects;
CREATE POLICY "Avatar images publicly accessible" ON storage.objects FOR SELECT
USING (bucket_id = 'avatars');

DROP POLICY IF EXISTS "Users can upload avatars" ON storage.objects;
CREATE POLICY "Users can upload avatars" ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'avatars' AND auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Users update own avatar" ON storage.objects;
CREATE POLICY "Users update own avatar" ON storage.objects FOR UPDATE
USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

DROP POLICY IF EXISTS "Users delete own avatar" ON storage.objects;
CREATE POLICY "Users delete own avatar" ON storage.objects FOR DELETE
USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

DROP POLICY IF EXISTS "Report images publicly accessible" ON storage.objects;
CREATE POLICY "Report images publicly accessible" ON storage.objects FOR SELECT
USING (bucket_id = 'report-images');

DROP POLICY IF EXISTS "Users can upload report images" ON storage.objects;
CREATE POLICY "Users can upload report images" ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'report-images' AND auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Report videos publicly accessible" ON storage.objects;
CREATE POLICY "Report videos publicly accessible" ON storage.objects FOR SELECT
USING (bucket_id = 'report-videos');

DROP POLICY IF EXISTS "Users can upload report videos" ON storage.objects;
CREATE POLICY "Users can upload report videos" ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'report-videos' AND auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Authenticated view documents" ON storage.objects;
CREATE POLICY "Authenticated view documents" ON storage.objects FOR SELECT
USING (bucket_id = 'report-documents' AND auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Users can upload documents" ON storage.objects;
CREATE POLICY "Users can upload documents" ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'report-documents' AND auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Announcements publicly accessible" ON storage.objects;
CREATE POLICY "Announcements publicly accessible" ON storage.objects FOR SELECT
USING (bucket_id = 'announcements');

DROP POLICY IF EXISTS "Staff can upload announcements" ON storage.objects;
CREATE POLICY "Staff can upload announcements" ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'announcements' AND EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('staff', 'admin')));

-- ============================================================================
-- ✅ SETUP COMPLETE!
-- ============================================================================

SELECT 'Database setup complete! ✅' as status,
       'Next: Disable email confirmation in Settings' as next_step,
       'Then visit /setup-admin to create admin user' as after_that;
