-- ============================================
-- UPDATE EXISTING DATABASE ONLY
-- For databases that already have some tables
-- ============================================

-- Helper function
CREATE OR REPLACE FUNCTION get_user_role()
RETURNS TEXT AS $$
  SELECT role FROM profiles WHERE id = auth.uid();
$$ LANGUAGE SQL SECURITY DEFINER STABLE;

-- ============================================
-- CLEAN UP EXISTING POLICIES
-- ============================================

-- PROFILES policies
DROP POLICY IF EXISTS "profiles_select" ON profiles;
DROP POLICY IF EXISTS "profiles_update" ON profiles;
DROP POLICY IF EXISTS "profiles_admin" ON profiles;
DROP POLICY IF EXISTS "profiles_insert" ON profiles;

-- INCIDENT_REPORTS policies
DROP POLICY IF EXISTS "reports_insert" ON incident_reports;
DROP POLICY IF EXISTS "reports_select" ON incident_reports;
DROP POLICY IF EXISTS "reports_update_own" ON incident_reports;
DROP POLICY IF EXISTS "reports_staff" ON incident_reports;

-- INCIDENT_IMAGES policies
DROP POLICY IF EXISTS "images_select" ON incident_images;
DROP POLICY IF EXISTS "images_insert" ON incident_images;
DROP POLICY IF EXISTS "images_delete" ON incident_images;

-- NOTIFICATIONS policies
DROP POLICY IF EXISTS "notifs_select" ON notifications;
DROP POLICY IF EXISTS "notifs_update" ON notifications;
DROP POLICY IF EXISTS "notifs_insert" ON notifications;

-- ANNOUNCEMENTS policies
DROP POLICY IF EXISTS "announcements_select" ON announcements;
DROP POLICY IF EXISTS "announcements_staff" ON announcements;

-- ACTIVITY_LOGS policies
DROP POLICY IF EXISTS "logs_select" ON activity_logs;
DROP POLICY IF EXISTS "logs_insert" ON activity_logs;

-- CHAT_HISTORY policies
DROP POLICY IF EXISTS "chat_select" ON chat_history;
DROP POLICY IF EXISTS "chat_insert" ON chat_history;

-- SYSTEM_SETTINGS policies
DROP POLICY IF EXISTS "settings_select" ON system_settings;
DROP POLICY IF EXISTS "settings_admin" ON system_settings;

-- ============================================
-- CREATE NEW POLICIES
-- ============================================

-- PROFILES policies
CREATE POLICY "profiles_insert" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "profiles_select" ON profiles FOR SELECT USING (auth.uid() = id OR get_user_role() IN ('staff', 'admin'));
CREATE POLICY "profiles_update" ON profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "profiles_admin" ON profiles FOR ALL USING (get_user_role() = 'admin');

-- INCIDENT_REPORTS policies with role separation
CREATE POLICY "reports_insert" ON incident_reports FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "reports_select" ON incident_reports FOR SELECT USING (
  CASE 
    WHEN get_user_role() = 'resident' THEN reporter_id = auth.uid()
    WHEN get_user_role() IN ('staff', 'admin') THEN true
    ELSE true  -- Fallback for now
  END
);
CREATE POLICY "reports_update_own" ON incident_reports FOR UPDATE USING (reporter_id = auth.uid() OR get_user_role() IN ('staff', 'admin'));
CREATE POLICY "reports_staff" ON incident_reports FOR DELETE USING (get_user_role() IN ('staff', 'admin'));

-- INCIDENT_IMAGES policies
CREATE POLICY "images_select" ON incident_images FOR SELECT USING (true);
CREATE POLICY "images_insert" ON incident_images FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "images_delete" ON incident_images FOR DELETE USING (get_user_role() IN ('staff', 'admin'));

-- NOTIFICATIONS policies
CREATE POLICY "notifs_select" ON notifications FOR SELECT USING (user_id = auth.uid() OR get_user_role() IN ('staff', 'admin'));
CREATE POLICY "notifs_update" ON notifications FOR UPDATE USING (user_id = auth.uid() OR get_user_role() IN ('staff', 'admin'));
CREATE POLICY "notifs_insert" ON notifications FOR INSERT WITH CHECK (true);

-- ANNOUNCEMENTS policies
CREATE POLICY "announcements_select" ON announcements FOR SELECT USING (is_active = true OR get_user_role() IN ('staff', 'admin'));
CREATE POLICY "announcements_staff" ON announcements FOR ALL USING (get_user_role() IN ('staff', 'admin'));

-- ACTIVITY_LOGS policies
CREATE POLICY "logs_select" ON activity_logs FOR SELECT USING (get_user_role() = 'admin');
CREATE POLICY "logs_insert" ON activity_logs FOR INSERT WITH CHECK (true);

-- CHAT_HISTORY policies
CREATE POLICY "chat_select" ON chat_history FOR SELECT USING (user_id = auth.uid() OR get_user_role() IN ('staff', 'admin'));
CREATE POLICY "chat_insert" ON chat_history FOR INSERT WITH CHECK (user_id = auth.uid());

-- SYSTEM_SETTINGS policies
CREATE POLICY "settings_select" ON system_settings FOR SELECT USING (true);
CREATE POLICY "settings_admin" ON system_settings FOR ALL USING (get_user_role() = 'admin');

-- ============================================
-- ENABLE RLS ON ALL TABLES
-- ============================================
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE incident_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE incident_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_settings ENABLE ROW LEVEL SECURITY;

-- ============================================
-- ADD SAMPLE DATA (IF NOT EXISTS)
-- ============================================
INSERT INTO announcements (title, content, author_name, is_pinned, is_active) 
SELECT 'Welcome to SMART-Barangay', 'This system allows residents to report incidents and barangay officials to monitor and respond to them efficiently.', 'Barangay Admin', true, true
WHERE NOT EXISTS (SELECT 1 FROM announcements WHERE title = 'Welcome to SMART-Barangay');

INSERT INTO announcements (title, content, author_name, is_pinned, is_active) 
SELECT 'Emergency Hotline', 'For emergencies, please call 911 or the barangay emergency hotline. This system is for reporting and monitoring only.', 'Barangay Office', false, true
WHERE NOT EXISTS (SELECT 1 FROM announcements WHERE title = 'Emergency Hotline');

-- Success message
SELECT 'Database policies updated successfully for role-based access control!' as message;