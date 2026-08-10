'use client'
import { Suspense, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { toast } from 'sonner'
import { Shield, Loader2, Lock } from 'lucide-react'

function AdminLoginForm() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email || !password) { toast.error('Please fill in all fields'); return }
    setLoading(true)

    const supabase = createClient()
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })

    if (error) {
      if (error.message.toLowerCase().includes('email not confirmed') ||
          error.message.toLowerCase().includes('invalid login credentials')) {
        toast.error('Email not verified or invalid credentials.', {
          duration: 6000,
          description: 'Run this in Supabase SQL Editor: UPDATE auth.users SET email_confirmed_at = NOW() WHERE email = \'' + email + '\';'
        })
      } else {
        toast.error(error.message)
      }
      setLoading(false)
      return
    }

    // Check if user is admin or staff
    const { data: profile } = await supabase
      .from('profiles')
      .select('role, full_name')
      .eq('id', data.user.id)
      .single()

    if (!profile || !['admin', 'staff'].includes(profile.role)) {
      await supabase.auth.signOut()
      toast.error('Access denied. Admin or staff account required.')
      setLoading(false)
      return
    }

    toast.success(`Welcome, ${profile.full_name}!`)
    router.push('/admin')
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="email">Email Address</Label>
        <Input
          id="email"
          type="email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          placeholder="admin@barangay.gov.ph"
          className="mt-1"
          required
        />
      </div>
      <div>
        <Label htmlFor="password">Password</Label>
        <Input
          id="password"
          type="password"
          value={password}
          onChange={e => setPassword(e.target.value)}
          placeholder="••••••••"
          className="mt-1"
          required
        />
      </div>
      <Button type="submit" className="w-full" disabled={loading}>
        {loading
          ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Signing in...</>
          : <><Lock className="w-4 h-4 mr-2" /> Sign In to Admin Panel</>
        }
      </Button>
    </form>
  )
}

export default function AdminLoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 p-4">
      {/* Background pattern */}
      <div className="absolute inset-0 opacity-10"
        style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '40px 40px' }}
      />

      <div className="relative w-full max-w-md">
        {/* Badge */}
        <div className="flex justify-center mb-6">
          <div className="flex items-center gap-2 bg-white/10 backdrop-blur border border-white/20 rounded-full px-4 py-2">
            <Shield className="w-4 h-4 text-blue-300" />
            <span className="text-sm text-blue-200 font-medium">Admin Portal</span>
          </div>
        </div>

        <Card className="shadow-2xl border-0 bg-white/95 backdrop-blur">
          <CardHeader className="text-center pb-2">
            <div className="flex justify-center mb-4">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center shadow-lg">
                <Shield className="w-9 h-9 text-white" />
              </div>
            </div>
            <CardTitle className="text-2xl">SMART-Barangay</CardTitle>
            <CardDescription className="text-base">Admin & Staff Access Only</CardDescription>
          </CardHeader>
          <CardContent className="pt-2">
            <Suspense fallback={
              <div className="h-40 flex items-center justify-center">
                <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
              </div>
            }>
              <AdminLoginForm />
            </Suspense>

            <div className="mt-4 p-3 rounded-lg bg-amber-50 border border-amber-200">
              <p className="text-xs text-amber-700 text-center">
                🔒 This portal is restricted to authorized barangay personnel only.
              </p>
            </div>

            <p className="text-center text-sm text-muted-foreground mt-4">
              Resident?{' '}
              <a href="/login" className="text-primary hover:underline font-medium">
                Go to resident portal →
              </a>
            </p>
          </CardContent>
        </Card>

        <p className="text-center text-xs text-white/40 mt-6">
          SMART-Barangay Incident Reporting System
        </p>
      </div>
    </div>
  )
}
