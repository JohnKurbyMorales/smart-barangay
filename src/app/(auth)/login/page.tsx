'use client'
import { Suspense, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { loginSchema, type LoginValues } from '@/lib/validations/auth'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { toast } from 'sonner'
import Link from 'next/link'
import { ShieldAlert, Loader2 } from 'lucide-react'

function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const redirect = searchParams.get('redirect') || '/submit-report'
  const error = searchParams.get('error')
  const [loading, setLoading] = useState(false)

  const { register, handleSubmit, formState: { errors } } = useForm<LoginValues>({
    resolver: zodResolver(loginSchema) as any,
  })

  const onSubmit = async (values: LoginValues) => {
    setLoading(true)
    const supabase = createClient()
    const { error } = await supabase.auth.signInWithPassword({
      email: values.email,
      password: values.password,
    })
    if (error) {
      if (error.message.toLowerCase().includes('email not confirmed')) {
        toast.error('Email not confirmed yet.', {
          description: 'Please check your inbox for the confirmation link we sent you.',
          duration: 7000,
        })
      } else if (error.message.toLowerCase().includes('invalid login credentials')) {
        toast.error('Invalid email or password', {
          description: 'Please check your credentials and try again.',
          duration: 5000,
        })
      } else {
        toast.error(error.message)
      }
      setLoading(false)
      return
    }
    toast.success('Welcome back!')
    router.push(redirect)
  }

  return (
    <div className="space-y-4">
      {/* Show error from callback */}
      {error === 'verification_failed' && (
        <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-sm text-red-700">
          ❌ Email confirmation failed. Please try registering again or contact support.
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit as any)} className="space-y-4">
      <div>
        <Label htmlFor="email">Email</Label>
        <Input id="email" type="email" placeholder="you@example.com" {...register('email')} className="mt-1" />
        {errors.email && <p className="text-xs text-destructive mt-1">{errors.email.message}</p>}
      </div>
      <div>
        <div className="flex justify-between items-center">
          <Label htmlFor="password">Password</Label>
          <Link href="/forgot-password" className="text-xs text-primary hover:underline">Forgot password?</Link>
        </div>
        <Input id="password" type="password" placeholder="••••••••" {...register('password')} className="mt-1" />
        {errors.password && <p className="text-xs text-destructive mt-1">{errors.password.message}</p>}
      </div>
      <Button type="submit" className="w-full" disabled={loading}>
        {loading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Signing in...</> : 'Sign In'}
      </Button>
    </form>
    </div>
  )
}

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 p-4">
      <Card className="w-full max-w-md shadow-xl">
        <CardHeader className="text-center pb-2">
          <div className="flex justify-center mb-4">
            <div className="w-14 h-14 rounded-2xl bg-primary flex items-center justify-center">
              <ShieldAlert className="w-8 h-8 text-white" />
            </div>
          </div>
          <CardTitle className="text-2xl">SMART-Barangay</CardTitle>
          <CardDescription>Sign in to your account</CardDescription>
        </CardHeader>
        <CardContent>
          <Suspense fallback={<div className="h-40 flex items-center justify-center"><Loader2 className="w-5 h-5 animate-spin" /></div>}>
            <LoginForm />
          </Suspense>
          <p className="text-center text-sm text-muted-foreground mt-4">
            Don't have an account? <Link href="/register" className="text-primary hover:underline font-medium">Sign up</Link>
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
