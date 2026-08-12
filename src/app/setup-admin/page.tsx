'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from 'sonner'
import { Shield } from 'lucide-react'

export default function SetupAdminPage() {
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    email: 'admin@smartbarangay.com',
    password: 'Admin123!',
    fullName: 'System Administrator'
  })

  const createAdmin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const supabase = createClient()
      
      // Create auth user with auto-confirm
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            full_name: formData.fullName
          },
          emailRedirectTo: undefined // Skip email confirmation for admin setup
        }
      })

      if (authError) {
        throw authError
      }

      if (authData.user) {
        // Update profile to admin role using service role
        const { error: profileError } = await supabase
          .from('profiles')
          .update({ 
            role: 'admin',
            full_name: formData.fullName 
          })
          .eq('id', authData.user.id)

        if (profileError) {
          throw profileError
        }

        // If user needs confirmation, show manual confirmation instruction
        if (!authData.user.email_confirmed_at) {
          toast.info('Account created! Please check Supabase Dashboard to confirm email or disable email confirmation.')
        }

        toast.success('Admin account created successfully!')
        toast.info('You can now login at /admin/login')
      }

    } catch (error: any) {
      console.error('Error creating admin:', error)
      if (error.message?.includes('email_address_not_confirmed')) {
        toast.error('Email confirmation required. Check Supabase Authentication settings.')
      } else {
        toast.error(error.message || 'Failed to create admin account')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-muted/30 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
            <Shield className="w-6 h-6 text-primary" />
          </div>
          <CardTitle className="text-xl">Create Admin Account</CardTitle>
          <p className="text-sm text-muted-foreground">
            Setup the first admin account for SMART-Barangay system
          </p>
        </CardHeader>
        <CardContent>
          <form onSubmit={createAdmin} className="space-y-4">
            <div>
              <Label htmlFor="fullName">Full Name</Label>
              <Input
                id="fullName"
                value={formData.fullName}
                onChange={(e) => setFormData(prev => ({ ...prev, fullName: e.target.value }))}
                required
              />
            </div>
            
            <div>
              <Label htmlFor="email">Admin Email</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                required
              />
            </div>
            
            <div>
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={formData.password}
                onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                required
              />
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Creating...' : 'Create Admin Account'}
            </Button>
          </form>

          <div className="mt-6 p-4 bg-blue-50 rounded-lg">
            <h4 className="font-medium text-sm text-blue-900">After creating admin:</h4>
            <ul className="text-xs text-blue-700 mt-2 space-y-1">
              <li>• Admin login: <code>/admin/login</code></li>
              <li>• User login: <code>/login</code></li>
              <li>• This page will be disabled after first admin</li>
            </ul>
            
            <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded">
              <p className="text-xs text-yellow-700 font-medium">📧 Email Confirmation Issue?</p>
              <p className="text-xs text-yellow-600 mt-1">
                If login fails due to email confirmation:
              </p>
              <ol className="text-xs text-yellow-600 mt-1 ml-3 space-y-0.5">
                <li>1. Go to Supabase Dashboard → Authentication → Settings</li>
                <li>2. Disable "Enable email confirmations"</li>
                <li>3. OR manually confirm user in Authentication → Users</li>
              </ol>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}