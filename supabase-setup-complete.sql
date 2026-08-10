-- ============================================
-- COMPLETE SMART-Barangay Database Setup
-- Copy-paste this entire file in Supabase SQL Editor
-- ============================================

-- ============================================
-- 1. PROFILES
-- ============================================
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL DEFAULT 'New User',
  email TEXT UNIQUE NOT NULL,
  phone TEXT,
  avatar_url TEXT,
  address TEXT,
  role TEXT NOT NULL DEFAULT 'resident' CHECK (role IN ('resident', 'staff', 'admin')),
  barangay_id TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, email, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'New User'),
    NEW.email,
    'resident'
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================
-- 2. INCIDENT_REPORTS
-- ============================================
CREATE TABLE IF NOT EXISTS incident_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  report_number TEXT UNIQUE NOT NULL DEFAULT ('RPT-' || to_char(NOW(), 'YYYYMMDD') || '-' || upper(substr(gen_random_uuid()::text, 1, 6))),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  category_name TEXT DEFAULT 'Other',
  severity TEXT DEFAULT 'low' CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  priority TEXT DEFAULT 'low' CHECK (priority IN ('low', 'medium', 'high', 'critical')),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'ai_reviewing', 'verified', 'assigned', 'in_progress', 'resolved', 'closed')),
  lat DECIMAL(10, 7),
  lng DECIMAL(10, 7),
  address TEXT,
  landmark TEXT,
  is_anonymous BOOLEAN DEFAULT false,
  incident_date TIMESTAMPTZ DEFAULT NOW(),
  reporter_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  reporter_name TEXT,
  reporter_contact TEXT,
  assigned_staff_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  ai_summary TEXT,
  ai_keywords TEXT[],
  ai_severity TEXT,
  ai_department TEXT,
  ai_processed BOOLEAN DEFAULT false,
  resolution_notes TEXT,
  resolved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_reports_status ON incident_reports(status);
CREATE INDEX IF NOT EXISTS idx_reports_category ON incident_reports(category_name);
CREATE INDEX IF NOT EXISTS idx_reports_created ON incident_reports(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_reports_reporter ON incident_reports(reporter_id);

-- ============================================
-- 3. INCIDENT_IMAGES
-- ============================================
CREATE TABLE IF NOT EXISTS incident_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  report_id UUID NOT NULL REFERENCES incident_reports(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  file_path TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 4. NOTIFICATIONS
-- ============================================
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT DEFAULT 'info' CHECK (type IN ('info', 'success', 'warning', 'error')),
  is_read BOOLEAN DEFAULT false,
  related_report_id UUID REFERENCES incident_reports(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_unread ON notifications(user_id, is_read);

-- ============================================
-- 5. ANNOUNCEMENTS
-- ============================================
CREATE TABLE IF NOT EXISTS announcements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  author_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  author_name TEXT DEFAULT 'Barangay Admin',
  is_pinned BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  is_published BOOLEAN DEFAULT true,
  publish_date TIMESTAMPTZ DEFAULT NOW(),
  expiry_date TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 6. ACTIVITY_LOGS
-- ============================================
CREATE TABLE IF NOT EXISTS activity_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  user_name TEXT,
  action TEXT NOT NULL,
  entity_type TEXT,
  entity_id UUID,
  old_values JSONB,
  new_values JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_logs_created ON activity_logs(created_at DESC);

-- ============================================
-- 7. CHAT_HISTORY
-- ============================================
CREATE TABLE IF NOT EXISTS chat_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
  content TEXT NOT NULL,
  session_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 8. SYSTEM_SETTINGS
-- ============================================
CREATE TABLE IF NOT EXISTS system_settings (
  id INTEGER PRIMARY KEY DEFAULT 1,
  barangay_name TEXT DEFAULT 'Barangay',
  city_municipality TEXT,
  province TEXT,
  region TEXT,
  contact_number TEXT,
  email TEXT,
  office_hours TEXT DEFAULT 'Mon-Fri, 8:00 AM - 5:00 PM',
  emergency_hotline TEXT DEFAULT '911',
  ai_enabled BOOLEAN DEFAULT true,
  ai_model TEXT DEFAULT 'gpt-4o-mini',
  map_default_lat DECIMAL(10, 7) DEFAULT 14.5995,
  map_default_lng DECIMAL(10, 7) DEFAULT 120.9842,
  map_default_zoom INTEGER DEFAULT 13,
  allow_anonymous BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

INSERT INTO system_settings (id) VALUES (1) ON CONFLICT (id) DO NOTHING;

-- ============================================
-- UPDATED_AT TRIGGER
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_profiles_updated ON profiles;
CREATE TRIGGER update_profiles_updated
  BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS update_reports_updated ON incident_reports;
CREATE TRIGGER update_reports_updated
  BEFORE UPDATE ON incident_reports FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS update_announcements_updated ON announcements;
CREATE TRIGGER update_announcements_updated
  BEFORE UPDATE ON announcements FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS update_settings_updated ON system_settings;
CREATE TRIGGER update_settings_updated
  BEFORE UPDATE ON system_settings FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================
-- ROW LEVEL SECURITY & HELPER FUNCTIONS
-- ============================================
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE incident_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE incident_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_settings ENABLE ROW LEVEL SECURITY;

-- Helper function
CREATE OR REPLACE FUNCTION get_user_role()
RETURNS TEXT AS $$
  SELECT role FROM profiles WHERE id = auth.uid();
$$ LANGUAGE SQL SECURITY DEFINER STABLE;

-- ============================================
-- STRICT ROLE-BASED POLICIES
-- ============================================

-- PROFILES policies
DROP POLICY IF EXISTS "profiles_select" ON profiles;
DROP POLICY IF EXISTS "profiles_update" ON profiles;
DROP POLICY IF EXISTS "profiles_admin" ON profiles;
DROP POLICY IF EXISTS "profiles_insert" ON profiles;

CREATE POLICY "profiles_insert" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "profiles_select" ON profiles FOR SELECT USING (auth.uid() = id OR get_user_role() IN ('staff', 'admin'));
CREATE POLICY "profiles_update" ON profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "profiles_admin" ON profiles FOR ALL USING (get_user_role() = 'admin');

-- INCIDENT_REPORTS policies - Strict separation
DROP POLICY IF EXISTS "reports_insert" ON incident_reports;
DROP POLICY IF EXISTS "reports_select" ON incident_reports;
DROP POLICY IF EXISTS "reports_update_own" ON incident_reports;
DROP POLICY IF EXISTS "reports_staff" ON incident_reports;
DROP POLICY IF EXISTS "reports_resident_select" ON incident_reports;
DROP POLICY IF EXISTS "reports_resident_update" ON incident_reports;
DROP POLICY IF EXISTS "reports_staff_all" ON incident_reports;

CREATE POLICY "reports_insert" ON incident_reports FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "reports_resident_select" ON incident_reports 
  FOR SELECT USING (
    CASE 
      WHEN get_user_role() = 'resident' THEN reporter_id = auth.uid()
      WHEN get_user_role() IN ('staff', 'admin') THEN true
      ELSE false
    END
  );
CREATE POLICY "reports_resident_update" ON incident_reports 
  FOR UPDATE USING (
    CASE 
      WHEN get_user_role() = 'resident' THEN reporter_id = auth.uid() AND status = 'pending'
      WHEN get_user_role() IN ('staff', 'admin') THEN true
      ELSE false
    END
  );
CREATE POLICY "reports_staff_delete" ON incident_reports FOR DELETE USING (get_user_role() IN ('staff', 'admin'));

-- INCIDENT_IMAGES policies
DROP POLICY IF EXISTS "images_select" ON incident_images;
DROP POLICY IF EXISTS "images_insert" ON incident_images;
DROP POLICY IF EXISTS "images_delete" ON incident_images;
DROP POLICY IF EXISTS "images_user_access" ON incident_images;
DROP POLICY IF EXISTS "images_user_insert" ON incident_images;
DROP POLICY IF EXISTS "images_staff_all" ON incident_images;

CREATE POLICY "images_user_access" ON incident_images 
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM incident_reports ir 
      WHERE ir.id = incident_images.report_id 
      AND (
        (get_user_role() = 'resident' AND ir.reporter_id = auth.uid()) OR
        (get_user_role() IN ('staff', 'admin'))
      )
    )
  );
CREATE POLICY "images_user_insert" ON incident_images 
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM incident_reports ir 
      WHERE ir.id = incident_images.report_id 
      AND ir.reporter_id = auth.uid()
    )
  );
CREATE POLICY "images_staff_all" ON incident_images FOR ALL USING (get_user_role() IN ('staff', 'admin'));

-- NOTIFICATIONS policies
DROP POLICY IF EXISTS "notifs_select" ON notifications;
DROP POLICY IF EXISTS "notifs_update" ON notifications;
DROP POLICY IF EXISTS "notifs_insert" ON notifications;
DROP POLICY IF EXISTS "notifications_user_select" ON notifications;
DROP POLICY IF EXISTS "notifications_user_update" ON notifications;
DROP POLICY IF EXISTS "notifications_staff_insert" ON notifications;

CREATE POLICY "notifications_user_select" ON notifications FOR SELECT USING (user_id = auth.uid() OR get_user_role() IN ('staff', 'admin'));
CREATE POLICY "notifications_user_update" ON notifications FOR UPDATE USING (user_id = auth.uid() OR get_user_role() IN ('staff', 'admin'));
CREATE POLICY "notifications_staff_insert" ON notifications FOR INSERT WITH CHECK (get_user_role() IN ('staff', 'admin') OR user_id = auth.uid());

-- ANNOUNCEMENTS policies
DROP POLICY IF EXISTS "announcements_select" ON announcements;
DROP POLICY IF EXISTS "announcements_staff" ON announcements;
DROP POLICY IF EXISTS "announcements_read_all" ON announcements;
DROP POLICY IF EXISTS "announcements_admin_manage" ON announcements;

CREATE POLICY "announcements_read_all" ON announcements FOR SELECT USING (is_published = true OR get_user_role() IN ('staff', 'admin'));
CREATE POLICY "announcements_admin_manage" ON announcements FOR ALL USING (get_user_role() IN ('staff', 'admin'));

-- ACTIVITY_LOGS policies
DROP POLICY IF EXISTS "logs_select" ON activity_logs;
DROP POLICY IF EXISTS "logs_insert" ON activity_logs;
DROP POLICY IF EXISTS "activity_logs_admin_only" ON activity_logs;

CREATE POLICY "activity_logs_admin_only" ON activity_logs FOR ALL USING (get_user_role() = 'admin');
CREATE POLICY "logs_insert_any" ON activity_logs FOR INSERT WITH CHECK (true);

-- CHAT_HISTORY policies
DROP POLICY IF EXISTS "chat_select" ON chat_history;
DROP POLICY IF EXISTS "chat_insert" ON chat_history;
DROP POLICY IF EXISTS "chat_user_access" ON chat_history;
DROP POLICY IF EXISTS "chat_user_insert" ON chat_history;
DROP POLICY IF EXISTS "chat_admin_all" ON chat_history;

CREATE POLICY "chat_user_access" ON chat_history FOR SELECT USING (user_id = auth.uid() OR get_user_role() IN ('staff', 'admin'));
CREATE POLICY "chat_user_insert" ON chat_history FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "chat_admin_all" ON chat_history FOR ALL USING (get_user_role() = 'admin');

-- SYSTEM_SETTINGS policies
DROP POLICY IF EXISTS "settings_select" ON system_settings;
DROP POLICY IF EXISTS "settings_admin" ON system_settings;
DROP POLICY IF EXISTS "settings_admin_only" ON system_settings;

CREATE POLICY "settings_select" ON system_settings FOR SELECT USING (true);
CREATE POLICY "settings_admin_only" ON system_settings FOR ALL USING (get_user_role() = 'admin');

-- ============================================
-- STORAGE BUCKETS
-- ============================================
INSERT INTO storage.buckets (id, name, public, file_size_limit)
VALUES
  ('incident-images', 'incident-images', true, 10485760),
  ('avatars', 'avatars', true, 5242880)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "images_upload" ON storage.objects;
DROP POLICY IF EXISTS "images_view" ON storage.objects;
DROP POLICY IF EXISTS "avatars_upload" ON storage.objects;
DROP POLICY IF EXISTS "avatars_view" ON storage.objects;

CREATE POLICY "images_upload" ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'incident-images' AND auth.uid() IS NOT NULL);
CREATE POLICY "images_view" ON storage.objects FOR SELECT
  USING (bucket_id = 'incident-images');
CREATE POLICY "avatars_upload" ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'avatars' AND auth.uid() IS NOT NULL);
CREATE POLICY "avatars_view" ON storage.objects FOR SELECT
  USING (bucket_id = 'avatars');

-- ============================================
-- REALTIME
-- ============================================
ALTER PUBLICATION supabase_realtime ADD TABLE incident_reports;
ALTER PUBLICATION supabase_realtime ADD TABLE notifications;
ALTER PUBLICATION supabase_realtime ADD TABLE announcements;

-- ============================================
-- SEED DATA
-- ============================================
INSERT INTO announcements (title, content, author_name, is_pinned, is_active, is_published) VALUES
  ('Welcome to SMART-Barangay', 'This system allows residents to report incidents and barangay officials to monitor and respond to them efficiently.', 'Barangay Admin', true, true, true),
  ('Emergency Hotline', 'For emergencies, please call 911 or the barangay emergency hotline. This system is for reporting and monitoring only.', 'Barangay Office', false, true, true)
ON CONFLICT DO NOTHING;

-- Success message
SELECT 'Database setup completed successfully! You can now create admin accounts.' as message;