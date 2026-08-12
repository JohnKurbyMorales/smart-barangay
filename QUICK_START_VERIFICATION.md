# Quick Start: Email Verification

## 🚀 5-Minute Setup

### Step 1: Configure Supabase (2 minutes)
```
1. Open Supabase Dashboard
2. Go to: Authentication → Settings
3. Enable: "Confirm email"
4. Save changes
```

### Step 2: Test Locally (3 minutes)
```bash
# Start server
npm run dev

# Open browser
http://localhost:3000/register

# Register test user
# Check email for 6-digit code
# Enter code on verification page
```

## 🎯 What Changed?

### New Pages
- `/verify-email` - Enter 6-digit verification code
- `/reset-password` - Set new password after reset

### User Flow
```
Register → Verify Email (6-digit code) → Dashboard
         ↓
    Email with code
```

## 🔑 Key Features

✅ **6-digit code input** with auto-advance
✅ **Resend code** with 60-second countdown  
✅ **Route protection** until verified
✅ **Clear error messages** for invalid/expired codes
✅ **Mobile responsive** design

## 📝 Terminology Changed

❌ Before: "Confirmation Code"  
✅ After: "Verification Code"

Used consistently across all pages, messages, and errors.

## 🧪 Quick Test

1. Register: `http://localhost:3000/register`
2. Check email for 6-digit code
3. Enter code on verification page
4. Should redirect to `/submit-report`

### Test Resend
1. Click "Resend Code"
2. Countdown starts (60s)
3. New code sent to email
4. Button re-enables at 0s

## 🔐 Security

✅ Supabase Auth handles everything  
✅ No codes stored in database  
✅ Only anon key used on frontend  
✅ Routes protected until verified  

## 📚 Full Documentation

- `EMAIL_VERIFICATION_GUIDE.md` - Complete guide
- `VERIFICATION_MIGRATION_CHECKLIST.md` - Testing checklist
- `VERIFICATION_UPDATE_SUMMARY.md` - Detailed summary

## ⚡ Troubleshooting

**Code not received?**
→ Check spam folder, verify Supabase email settings

**"Verification failed" error?**
→ Check callback URL in Supabase is `{YOUR_URL}/auth/callback`

**User stuck on verification?**
→ Run in Supabase SQL Editor:
```sql
UPDATE auth.users 
SET email_confirmed_at = NOW() 
WHERE email = 'user@example.com';
```

## 🎉 That's It!

Your email verification is ready to use. Just configure Supabase and test!

**Status**: ✅ Implementation Complete  
**Next**: Configure Supabase → Test → Deploy
