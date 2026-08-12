# Email Verification Flow - Implementation Guide

## Overview
This document describes the updated email verification flow using Supabase Auth with "Verification Code" terminology throughout the entire system.

## Key Changes

### 1. Terminology Updates
- **Old Terms**: "Confirmation Code", "Confirmation", "Confirm Code"
- **New Term**: "Verification Code" (used consistently across all UI, messages, and documentation)

### 2. New Pages Created

#### `/verify-email` - Email Verification Page
- **Purpose**: Allow users to enter the 6-digit verification code sent to their email
- **Features**:
  - 6-digit code input with auto-focus and auto-advance
  - Paste support for verification codes
  - Real-time validation
  - Resend code functionality with 60-second countdown
  - Clear error messages for invalid/expired codes
  - Responsive design matching existing auth pages

#### `/reset-password` - Password Reset Page
- **Purpose**: Allow users to set a new password after requesting a reset
- **Features**:
  - New password input with confirmation
  - Password strength validation (min 6 characters)
  - Integration with Supabase Auth
  - Redirect to login after successful reset

### 3. Updated Registration Flow

**Before:**
1. User registers → Supabase sends email with link
2. User clicks link → Redirected to `/auth/callback`
3. Session created → Redirected to dashboard or login

**After:**
1. User registers → Supabase sends email with 6-digit code
2. User automatically redirected to `/verify-email?email={user-email}`
3. User enters 6-digit verification code
4. Code verified via `supabase.auth.verifyOtp()`
5. Session created → Redirected to `/submit-report`

### 4. Middleware Protection

The middleware now checks `email_confirmed_at` status and redirects unverified users:

```typescript
if (user && !user.email_confirmed_at) {
  // Redirect to verify-email page (except for allowed paths)
  const allowedUnverifiedPaths = ['/verify-email', '/auth/callback', '/login', '/register']
  if (!isAllowedPath) {
    return redirect('/verify-email?email=' + user.email)
  }
}
```

### 5. Verification Code Features

#### Input Field
- 6 individual input boxes for better UX
- Auto-focus first input on page load
- Auto-advance to next input on digit entry
- Backspace support to go to previous input
- Paste support for 6-digit codes

#### Resend Functionality
```typescript
const { error } = await supabase.auth.resend({
  type: 'signup',
  email,
  options: {
    emailRedirectTo: `${window.location.origin}/auth/callback`,
  }
})
```

#### Countdown Timer
- 60-second countdown before allowing another resend
- Button disabled during countdown
- Shows remaining seconds: "Resend Code (59s)"
- Re-enables when countdown reaches 0

### 6. Error Messages

All error messages now use "Verification Code" terminology:

| Scenario | Message |
|----------|---------|
| Invalid code | "Invalid verification code. Please try again." |
| Expired code | "Verification code expired. Please request a new code." |
| Successful verification | "Email verified successfully!" |
| Successful resend | "A new verification code has been sent to your email." |
| Login with unverified email | "Email not verified yet. Please check your inbox for the verification code we sent you." |

### 7. Security Implementation

✅ **Implemented:**
- Supabase Auth is the source of truth for email verification
- No custom verification codes stored in database
- Only uses `NEXT_PUBLIC_SUPABASE_ANON_KEY` on frontend
- Never exposes Service Role Key to frontend
- Proper handling of expired/invalid/already-used codes
- Route protection until email is verified

✅ **Supabase Auth Methods Used:**
```typescript
// Verify OTP
await supabase.auth.verifyOtp({
  email,
  token: verificationCode,
  type: 'email'
})

// Resend verification code
await supabase.auth.resend({
  type: 'signup',
  email,
  options: { emailRedirectTo: '...' }
})
```

## File Changes Summary

### New Files
1. `/src/app/(auth)/verify-email/page.tsx` - Verification code entry page
2. `/src/app/(auth)/reset-password/page.tsx` - Password reset page
3. `/EMAIL_VERIFICATION_GUIDE.md` - This documentation

### Modified Files
1. `/src/app/(auth)/register/page.tsx`
   - Updated success message to mention "verification code"
   - Redirect to `/verify-email` instead of `/login`

2. `/src/app/(auth)/login/page.tsx`
   - Updated error message for unverified emails
   - Changed "confirmation_failed" to "verification_failed"

3. `/src/app/(auth)/forgot-password/page.tsx`
   - Fixed redirect URL to use `window.location.origin`

4. `/src/app/auth/callback/route.ts`
   - Updated error parameter from "confirmation_failed" to "verification_failed"

5. `/src/lib/supabase/middleware.ts`
   - Added `/verify-email` and `/reset-password` to public paths
   - Added email verification check that redirects unverified users
   - Protected all routes except allowed paths when user is unverified

6. `/src/app/setup-admin/page.tsx`
   - Updated all "confirmation" references to "verification"
   - Updated instructions text

## Supabase Configuration

### Required Settings

In Supabase Dashboard → Authentication → Settings:

1. **Email Auth**: Enabled
2. **Confirm email**: Enabled (to require email verification)
3. **Secure email change**: Enabled (recommended)
4. **Email OTP**: Length = 6 digits (default)

### Email Templates

The default Supabase email templates will work with this implementation. The OTP code is automatically included in the email.

**Optional**: Customize the email template in Supabase Dashboard → Authentication → Email Templates → Confirm signup

## Testing the Flow

### Test Email Verification

1. Register a new user at `/register`
2. Check that you're redirected to `/verify-email?email={your-email}`
3. Open email and copy the 6-digit code
4. Enter code on verification page
5. Verify you're redirected to `/submit-report` after successful verification

### Test Resend Code

1. On verification page, click "Resend Code"
2. Verify countdown starts at 60 seconds
3. Verify button is disabled during countdown
4. Check email for new code
5. Verify button re-enables after countdown

### Test Invalid/Expired Codes

1. Enter an incorrect 6-digit code → Should show "Invalid verification code"
2. Wait for code to expire → Should show "Verification code expired"
3. Try to access `/submit-report` without verification → Should redirect to `/verify-email`

## Admin Users

For admin users who need immediate access without email verification:

```sql
-- Run in Supabase SQL Editor
UPDATE auth.users 
SET email_confirmed_at = NOW() 
WHERE email = 'admin@example.com';
```

Or disable email confirmation in Supabase Auth settings during development.

## Troubleshooting

### User stuck on verification page
- Check if `email_confirmed_at` is NULL in `auth.users` table
- Manually set: `UPDATE auth.users SET email_confirmed_at = NOW() WHERE id = 'user-id';`

### Verification code not received
- Check Supabase project email settings
- Verify SMTP configuration if using custom SMTP
- Check spam folder

### "Verification failed" error on callback
- Ensure callback URL is whitelisted in Supabase settings
- Check redirect URL matches exactly: `{APP_URL}/auth/callback`

## UI/UX Consistency

The verification page maintains the same design language as other auth pages:
- Same card layout and styling
- Same color scheme (blue-50 to indigo-100 gradient)
- Same component library (shadcn/ui)
- Same animations and transitions
- Fully responsive design

## Future Enhancements

Potential improvements for future iterations:
- [ ] Add biometric authentication option
- [ ] Implement magic link as alternative to OTP
- [ ] Add SMS verification option
- [ ] Multi-factor authentication (MFA)
- [ ] Remember device option
- [ ] Email verification reminder emails
