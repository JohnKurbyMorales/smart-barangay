'use client'
import { Suspense, useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { toast } from 'sonner'
import Link from 'next/link'
import { ShieldAlert, Loader2, Mail } from 'lucide-react'

function VerifyEmailForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const email = searchParams.get('email') || ''
  
  const [code, setCode] = useState(['', '', '', '', '', ''])
  const [loading, setLoading] = useState(false)
  const [resending, setResending] = useState(false)
  const [countdown, setCountdown] = useState(0)

  // Handle countdown timer
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000)
      return () => clearTimeout(timer)
    }
  }, [countdown])

  // Auto-focus first input on mount
  useEffect(() => {
    document.getElementById('code-0')?.focus()
  }, [])

  const handleCodeChange = (index: number, value: string) => {
    // Only allow numbers
    if (value && !/^\d$/.test(value)) return

    const newCode = [...code]
    newCode[index] = value
    setCode(newCode)

    // Auto-focus next input
    if (value && index < 5) {
      document.getElementById(`code-${index + 1}`)?.focus()
    }
  }

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !code[index] && index > 0) {
      document.getElementById(`code-${index - 1}`)?.focus()
    }
  }

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault()
    const pastedData = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6)
    const newCode = [...code]
    
    for (let i = 0; i < pastedData.length; i++) {
      newCode[i] = pastedData[i]
    }
    
    setCode(newCode)
    
    // Focus last filled input or first empty
    const focusIndex = Math.min(pastedData.length, 5)
    document.getElementById(`code-${focusIndex}`)?.focus()
  }

  const handleVerify = async () => {
    const verificationCode = code.join('')
    
    if (verificationCode.length !== 6) {
      toast.error('Please enter all 6 digits')
      return
    }

    setLoading(true)
    const supabase = createClient()

    try {
      console.log('Verifying OTP:', { email, code: verificationCode })

      // Verify the OTP code
      const { data, error } = await supabase.auth.verifyOtp({
        email,
        token: verificationCode,
        type: 'email'
      })

      console.log('Verify OTP response:', { data, error })

      if (error) {
        console.error('OTP verification error:', error)
        
        // Handle specific error types
        if (error.message.toLowerCase().includes('expired')) {
          toast.error('Verification code expired. Please request a new code.')
        } else if (error.message.toLowerCase().includes('invalid')) {
          toast.error('Invalid verification code. Please try again.')
        } else if (error.message.toLowerCase().includes('not found')) {
          toast.error('Verification session not found. Please register again.')
          setTimeout(() => router.push('/register'), 2000)
        } else {
          toast.error(error.message || 'Verification failed. Please try again.')
        }
        setLoading(false)
        return
      }

      if (data.session) {
        toast.success('Email verified successfully!')
        // Redirect to dashboard
        router.push('/submit-report')
      } else {
        toast.error('Verification completed but no session created. Please try logging in.')
        router.push('/login')
      }
    } catch (err) {
      console.error('Unexpected error during verification:', err)
      toast.error('An error occurred. Please try again.')
      setLoading(false)
    }
  }

  const handleResend = async () => {
    if (!email) {
      toast.error('Email address not found. Please register again.')
      router.push('/register')
      return
    }

    setResending(true)
    const supabase = createClient()

    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        }
      })

      if (error) {
        toast.error(error.message)
      } else {
        toast.success('A new verification code has been sent to your email.')
        setCountdown(60)
        setCode(['', '', '', '', '', ''])
        document.getElementById('code-0')?.focus()
      }
    } catch (err) {
      toast.error('Failed to resend code. Please try again.')
    } finally {
      setResending(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <div className="flex justify-center mb-4">
          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
            <Mail className="w-8 h-8 text-primary" />
          </div>
        </div>
        <p className="text-sm text-muted-foreground">
          We've sent a verification code to
        </p>
        <p className="font-medium text-foreground">{email}</p>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-3 text-center">
            Verification Code
          </label>
          <div className="flex gap-2 justify-center" onPaste={handlePaste}>
            {code.map((digit, index) => (
              <Input
                key={index}
                id={`code-${index}`}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={digit}
                onChange={(e) => handleCodeChange(index, e.target.value)}
                onKeyDown={(e) => handleKeyDown(index, e)}
                className="w-12 h-12 text-center text-lg font-semibold"
                disabled={loading}
              />
            ))}
          </div>
        </div>

        <Button 
          onClick={handleVerify} 
          className="w-full" 
          disabled={loading || code.some(d => !d)}
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Verifying...
            </>
          ) : (
            'Verify Email'
          )}
        </Button>
      </div>

      <div className="text-center space-y-2">
        <p className="text-sm text-muted-foreground">
          Didn't receive the code?
        </p>
        <Button
          variant="outline"
          onClick={handleResend}
          disabled={resending || countdown > 0}
          className="w-full"
        >
          {resending ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Sending...
            </>
          ) : countdown > 0 ? (
            `Resend Code (${countdown}s)`
          ) : (
            'Resend Code'
          )}
        </Button>
      </div>

      <div className="text-center">
        <Link href="/register" className="text-sm text-primary hover:underline">
          Back to Register
        </Link>
      </div>
    </div>
  )
}

export default function VerifyEmailPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 p-4">
      <Card className="w-full max-w-md shadow-xl">
        <CardHeader className="text-center pb-2">
          <div className="flex justify-center mb-4">
            <div className="w-14 h-14 rounded-2xl bg-primary flex items-center justify-center">
              <ShieldAlert className="w-8 h-8 text-white" />
            </div>
          </div>
          <CardTitle className="text-2xl">Verify Your Email</CardTitle>
          <CardDescription>
            Enter the verification code to complete registration
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Suspense 
            fallback={
              <div className="h-64 flex items-center justify-center">
                <Loader2 className="w-6 h-6 animate-spin" />
              </div>
            }
          >
            <VerifyEmailForm />
          </Suspense>
        </CardContent>
      </Card>
    </div>
  )
}
