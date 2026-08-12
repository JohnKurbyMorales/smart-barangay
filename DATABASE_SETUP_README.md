# 🚀 Database Setup - Simple & Complete

## One File, Three Steps!

### Step 1: Run SQL (2 minutes)
```
1. Supabase Dashboard → SQL Editor
2. Copy COMPLETE_DATABASE_SETUP.sql
3. Paste and Run
4. Wait for "Database setup complete! ✅"
```

### Step 2: Disable Email Confirmation (30 seconds)
```
1. Dashboard → Authentication → Settings
2. DISABLE "Enable email confirmations"
3. Save
```

**Why?** Para walang email verification issues. Simple auto-login lang.

### Step 3: Create Admin (1 minute)
```
1. Visit: http://localhost:3000/setup-admin
2. Fill in:
   - Email: admin@smartbarangay.com
   - Password: Admin123!
   - Name: Admin
3. Submit
```

## ✅ Done! 

Test mo na:
- Register: http://localhost:3000/register
- Login: http://localhost:3000/login
- Admin: http://localhost:3000/admin/login

---

## 🎯 What's Included?

✅ All tables (profiles, reports, comments, etc.)  
✅ All functions and triggers  
✅ Row Level Security (RLS)  
✅ Storage buckets  
✅ Indexes for performance  
✅ Auto-create profile on signup  
✅ Auto-count upvotes  
✅ Auto-notify on status change  

## 🔧 Quick Commands

**Make user admin:**
```sql
UPDATE public.profiles 
SET role = 'admin' 
WHERE email = 'user@example.com';
```

**Check users:**
```sql
SELECT email, role FROM public.profiles;
```

**Check reports:**
```sql
SELECT title, status, category FROM public.reports;
```

---

**That's it! Simple setup, no complications!** 🎉
