# Email Verification Flow Diagram

## 📊 Complete User Journey

```
┌─────────────────────────────────────────────────────────────────┐
│                     REGISTRATION FLOW                           │
└─────────────────────────────────────────────────────────────────┘

    USER                    APP                      SUPABASE
     │                       │                          │
     │  Fill Registration    │                          │
     │  Form                 │                          │
     ├──────────────────────>│                          │
     │                       │                          │
     │                       │  supabase.auth.signUp()  │
     │                       ├─────────────────────────>│
     │                       │                          │
     │                       │  Create user             │
     │                       │  Send OTP email          │
     │                       │<─────────────────────────┤
     │                       │                          │
     │  Redirect to          │                          │
     │  /verify-email        │                          │
     │<──────────────────────┤                          │
     │                       │                          │
     ▼                       │                          │
┌─────────────────┐         │                          │
│ Check Email     │         │                          │
│ Get 6-digit     │         │                          │
│ code: 123456    │         │                          │
└─────────────────┘         │                          │
     │                       │                          │
     │  Enter code           │                          │
     ├──────────────────────>│                          │
     │                       │                          │
     │                       │  supabase.auth.verifyOtp()
     │                       ├─────────────────────────>│
     │                       │                          │
     │                       │  Verify code             │
     │                       │  Create session          │
     │                       │<─────────────────────────┤
     │                       │                          │
     │  Redirect to          │                          │
     │  /submit-report       │                          │
     │<──────────────────────┤                          │
     │                       │                          │
     ▼                       │                          │
┌─────────────────┐         │                          │
│   Dashboard     │         │                          │
│  (Verified!)    │         │                          │
└─────────────────┘         │                          │


┌─────────────────────────────────────────────────────────────────┐
│                     RESEND CODE FLOW                            │
└─────────────────────────────────────────────────────────────────┘

    USER                    APP                      SUPABASE
     │                       │                          │
     │  Click                │                          │
     │  "Resend Code"        │                          │
     ├──────────────────────>│                          │
     │                       │                          │
     │                       │  supabase.auth.resend()  │
     │                       ├─────────────────────────>│
     │                       │                          │
     │                       │  Send new OTP email      │
     │                       │<─────────────────────────┤
     │                       │                          │
     │  Countdown starts     │                          │
     │  "Resend Code (60s)"  │                          │
     │<──────────────────────┤                          │
     │                       │                          │
     │  Wait 60 seconds...   │                          │
     │  "Resend Code (0s)"   │                          │
     │<──────────────────────┤                          │
     │                       │                          │
     │  Button enabled       │                          │
     │                       │                          │


┌─────────────────────────────────────────────────────────────────┐
│                   LOGIN WITH UNVERIFIED EMAIL                   │
└─────────────────────────────────────────────────────────────────┘

    USER                    APP                      SUPABASE
     │                       │                          │
     │  Enter credentials    │                          │
     ├──────────────────────>│                          │
     │                       │                          │
     │                       │  signInWithPassword()    │
     │                       ├─────────────────────────>│
     │                       │                          │
     │                       │  ❌ Email not verified   │
     │                       │<─────────────────────────┤
     │                       │                          │
     │  Show error:          │                          │
     │  "Email not verified  │                          │
     │  yet. Check inbox     │                          │
     │  for verification     │                          │
     │  code"                │                          │
     │<──────────────────────┤                          │
     │                       │                          │


┌─────────────────────────────────────────────────────────────────┐
│                  ROUTE PROTECTION (MIDDLEWARE)                  │
└─────────────────────────────────────────────────────────────────┘

    USER                    MIDDLEWARE               SUPABASE
     │                       │                          │
     │  Try to access        │                          │
     │  /submit-report       │                          │
     ├──────────────────────>│                          │
     │                       │                          │
     │                       │  getUser()               │
     │                       ├─────────────────────────>│
     │                       │                          │
     │                       │  user data               │
     │                       │  email_confirmed_at: null│
     │                       │<─────────────────────────┤
     │                       │                          │
     │  ❌ Redirect to       │                          │
     │  /verify-email        │                          │
     │<──────────────────────┤                          │
     │                       │                          │
```

## 🎯 Page Structure

```
┌──────────────────────────────────────────┐
│         /verify-email Page               │
├──────────────────────────────────────────┤
│                                          │
│  📧 Verify Your Email                    │
│                                          │
│  We've sent a verification code to       │
│  user@example.com                        │
│                                          │
│  Verification Code:                      │
│  ┌───┬───┬───┬───┬───┬───┐             │
│  │ 1 │ 2 │ 3 │ 4 │ 5 │ 6 │             │
│  └───┴───┴───┴───┴───┴───┘             │
│                                          │
│  ┌──────────────────────────────┐       │
│  │      Verify Email            │       │
│  └──────────────────────────────┘       │
│                                          │
│  Didn't receive the code?                │
│  ┌──────────────────────────────┐       │
│  │  Resend Code (45s)           │       │
│  └──────────────────────────────┘       │
│                                          │
│  ← Back to Register                      │
│                                          │
└──────────────────────────────────────────┘
```

## 🔄 State Machine

```
┌─────────────────┐
│   REGISTERED    │
│ (unverified)    │
└────────┬────────┘
         │
         │ Enter code
         ▼
┌─────────────────┐     Invalid/Expired
│   VERIFYING     ├──────────────┐
└────────┬────────┘              │
         │                       │
         │ Valid code            │
         ▼                       │
┌─────────────────┐              │
│    VERIFIED     │              │
│  (can login)    │              │
└─────────────────┘              │
                                 │
                                 ▼
                          ┌─────────────┐
                          │ Show Error  │
                          │ Stay on     │
                          │ verify page │
                          └─────────────┘
```

## 📱 Input Component Behavior

```
┌───┬───┬───┬───┬───┬───┐
│ 1 │ 2 │ 3 │   │   │   │  ← User types "123"
└───┴───┴───┴───┴───┴───┘
     Auto-focus advances →

Paste "123456"
         ↓
┌───┬───┬───┬───┬───┬───┐
│ 1 │ 2 │ 3 │ 4 │ 5 │ 6 │  ← All filled at once
└───┴───┴───┴───┴───┴───┘

Backspace when empty
         ↓
┌───┬───┬───┬───┬───┬───┐
│ 1 │ 2 │   │   │   │   │  ← Moves to previous
└───┴───┴───┴───┴───┴───┘
          ↑ Focus here
```

## ⏱️ Resend Timer

```
Click "Resend Code"
        ↓
┌──────────────────────────┐
│  Resend Code (60s)       │  ← Disabled, counting down
└──────────────────────────┘
        ↓ (1 second)
┌──────────────────────────┐
│  Resend Code (59s)       │
└──────────────────────────┘
        ↓ (58 more seconds)
┌──────────────────────────┐
│  Resend Code (1s)        │
└──────────────────────────┘
        ↓ (1 second)
┌──────────────────────────┐
│  Resend Code             │  ← Enabled again
└──────────────────────────┘
```

## 🛡️ Security Flow

```
Frontend                Middleware              Supabase Auth
   │                         │                        │
   │ verifyOtp()            │                        │
   ├────────────────────────┼───────────────────────>│
   │                         │                        │
   │                         │    ✓ Valid token       │
   │                         │    ✓ Not expired       │
   │<────────────────────────┼────────────────────────┤
   │                         │                        │
   │ Session created         │                        │
   │ email_confirmed_at set  │                        │
   │                         │                        │
   │ Navigate to route       │                        │
   ├────────────────────────>│                        │
   │                         │                        │
   │                         │ Check session          │
   │                         ├───────────────────────>│
   │                         │                        │
   │                         │ ✓ Verified             │
   │                         │<───────────────────────┤
   │                         │                        │
   │ Allow access            │                        │
   │<────────────────────────┤                        │
```

## 🎨 Component Hierarchy

```
verify-email/page.tsx
  │
  ├─ Card
  │   ├─ CardHeader
  │   │   ├─ ShieldAlert Icon
  │   │   ├─ CardTitle
  │   │   └─ CardDescription
  │   │
  │   └─ CardContent
  │       └─ VerifyEmailForm (Suspense)
  │           ├─ Email display
  │           ├─ 6x Input (code digits)
  │           ├─ Button (Verify Email)
  │           ├─ Button (Resend Code)
  │           └─ Link (Back to Register)
```

## 📊 Error Handling

```
User enters code
        ↓
  Validate locally
        ↓
    Send to API
        ↓
   Check response
        ↓
    ┌────┴────┐
    │         │
 Success   Error
    │         │
    │    ┌────┴────┐
    │    │         │
    │  Invalid  Expired
    │    │         │
    │    ▼         ▼
    │  Toast     Toast
    │  Stay      Stay
    │            
    ▼
  Redirect
```

---

## Legend

- `│` = Flow continues
- `├─` = Branch/Option
- `▼` = Next step
- `─>` = Direction of flow
- `✓` = Success
- `❌` = Error/Denied

---

**Use this diagram to understand the complete flow at a glance!**
