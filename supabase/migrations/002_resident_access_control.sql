-- ============================================
-- RESIDENT ACCESS CONTROL POLICIES
-- Update RLS policies to ensure proper role separation
-- ============================================

-- Drop existing report policies to recreate them
DROP POLICY IF EXISTS "reports_select" ON incident_reports;
DROP POLICY IF EXISTS "reports_update_own" ON incident_reports;
DROP POLICY IF EXISTS "reports_staff" ON incident_reports;

-- INCIDENT_REPORTS policies - Strict separation between residents and staff/admin
CREATE POLICY "reports_resident_select" ON incident_reports 
  FOR SELECT USING (
    CASE 
      WHEN get_user_role() = 'resident' THEN reported_by = auth.uid()
      WHEN get_user_role() IN ('staff', 'admin') THEN true
      ELSE false
    END
  );

CREATE POLICY "reports_resident_update" ON incident_reports 
  FOR UPDATE USING (
    CASE 
      WHEN get_user_role() = 'resident' THEN reported_by = auth.uid() AND status = 'pending'
      WHEN get_user_role() IN ('staff', 'admin') THEN true
      ELSE false
    END
  );

CREATE POLICY "reports_staff_all" ON incident_reports 
  FOR ALL USING (get_user_role() IN ('staff', 'admin'));

-- INCIDENT_IMAGES policies - Follow report access
DROP POLICY IF EXISTS "images_select" ON incident_images;
DROP POLICY IF EXISTS "images_insert" ON incident_images;
DROP POLICY IF EXISTS "images_staff" ON incident_images;

CREATE POLICY "images_user_access" ON incident_images 
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM incident_reports ir 
      WHERE ir.id = incident_images.report_id 
      AND (
        (get_user_role() = 'resident' AND ir.reported_by = auth.uid()) OR
        (get_user_role() IN ('staff', 'admin'))
      )
    )
  );

CREATE POLICY "images_user_insert" ON incident_images 
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM incident_reports ir 
      WHERE ir.id = incident_images.report_id 
      AND ir.reported_by = auth.uid()
    )
  );

CREATE POLICY "images_staff_all" ON incident_images 
  FOR ALL USING (get_user_role() IN ('staff', 'admin'));

-- NOTIFICATIONS policies - Users see only their own notifications
DROP POLICY IF EXISTS "notifications_select" ON notifications;
DROP POLICY IF EXISTS "notifications_update" ON notifications;

CREATE POLICY "notifications_user_select" ON notifications 
  FOR SELECT USING (user_id = auth.uid() OR get_user_role() IN ('staff', 'admin'));

CREATE POLICY "notifications_user_update" ON notifications 
  FOR UPDATE USING (user_id = auth.uid() OR get_user_role() IN ('staff', 'admin'));

CREATE POLICY "notifications_staff_insert" ON notifications 
  FOR INSERT WITH CHECK (get_user_role() IN ('staff', 'admin'));

-- ACTIVITY_LOGS policies - Admin only
DROP POLICY IF EXISTS "activity_logs_admin" ON activity_logs;

CREATE POLICY "activity_logs_admin_only" ON activity_logs 
  FOR ALL USING (get_user_role() = 'admin');

-- ANNOUNCEMENTS policies - Everyone can read, only admin can modify
DROP POLICY IF EXISTS "announcements_select" ON announcements;
DROP POLICY IF EXISTS "announcements_admin" ON announcements;

CREATE POLICY "announcements_read_all" ON announcements 
  FOR SELECT USING (is_published = true OR get_user_role() IN ('staff', 'admin'));

CREATE POLICY "announcements_admin_manage" ON announcements 
  FOR ALL USING (get_user_role() IN ('staff', 'admin'));

-- SYSTEM_SETTINGS policies - Admin only
DROP POLICY IF EXISTS "settings_admin" ON system_settings;

CREATE POLICY "settings_admin_only" ON system_settings 
  FOR ALL USING (get_user_role() = 'admin');

-- CHAT_HISTORY policies - Users see only their own chats
DROP POLICY IF EXISTS "chat_select" ON chat_history;
DROP POLICY IF EXISTS "chat_insert" ON chat_history;

CREATE POLICY "chat_user_access" ON chat_history 
  FOR SELECT USING (user_id = auth.uid() OR get_user_role() IN ('staff', 'admin'));

CREATE POLICY "chat_user_insert" ON chat_history 
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "chat_admin_all" ON chat_history 
  FOR ALL USING (get_user_role() = 'admin');