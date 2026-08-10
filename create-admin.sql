-- ============================================
-- CREATE ADMIN ACCOUNT
-- Run this in Supabase SQL Editor to create admin accounts
-- ============================================

-- First, you need to create the user account in Supabase Auth
-- Go to Authentication > Users in Supabase Dashboard and create user with:
-- Email: admin@smartbarangay.com
-- Password: Admin123!

-- Then run this SQL to update the role to admin:
-- Replace 'admin@smartbarangay.com' with the actual email you used

UPDATE profiles 
SET role = 'admin', full_name = 'System Administrator'
WHERE email = 'admin@smartbarangay.com';

-- Optional: Create additional admin/staff accounts
-- UPDATE profiles 
-- SET role = 'staff', full_name = 'Staff Member'
-- WHERE email = 'staff@smartbarangay.com';

-- Check existing users and their roles
SELECT email, full_name, role, created_at FROM profiles ORDER BY created_at DESC;