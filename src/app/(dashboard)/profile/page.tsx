'use client'
import { useState } from 'react'
import { useUser } from '@/hooks/use-user'
import { createClient } from '@/lib/supabase/client'
import { Header } from '@/components/layout/header'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { toast } from 'sonner'
import { User, Loader2 } from 'lucide-react'

export default function ProfilePage() {
  const { user } = useUser()
  const [saving, setSaving] = useState(false)
  const [name, setName] = useState(user?.full_name || '')
  const [phone, setPhone] = useState(user?.phone || '')

  const handleSave = async () => {
    if (!user) return
    setSaving(true)
    const supabase = createClient()
    const { error } = await supabase.from('profiles').update({ full_name: name, phone }).eq('id', user.id)
    if (error) { toast.error('Failed to save'); setSaving(false); return }
    toast.success('Profile updated!')
    setSaving(false)
  }

  const initials = user?.full_name?.split(' ').map(n => n[0]).join('').toUpperCase() || 'U'

  return (
    <div className="min-h-screen">
      <Header title="Profile" />
      <div className="p-6">
        <div className="max-w-lg mx-auto space-y-6">
          <Card>
            <CardHeader><CardTitle className="text-sm flex items-center gap-2"><User className="w-4 h-4" /> My Profile</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-4">
                <Avatar className="w-16 h-16">
                  <AvatarFallback className="text-xl bg-primary/10 text-primary font-bold">{initials}</AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-semibold">{user?.full_name}</p>
                  <p className="text-sm text-muted-foreground">{user?.email}</p>
                  <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-primary/10 text-primary capitalize mt-1">{user?.role}</span>
                </div>
              </div>

              <div>
                <Label>Full Name</Label>
                <Input value={name} onChange={e => setName(e.target.value)} className="mt-1" />
              </div>
              <div>
                <Label>Email</Label>
                <Input value={user?.email || ''} disabled className="mt-1 bg-muted" />
              </div>
              <div>
                <Label>Phone</Label>
                <Input value={phone} onChange={e => setPhone(e.target.value)} placeholder="+63 xxx xxx xxxx" className="mt-1" />
              </div>

              <Button onClick={handleSave} disabled={saving} className="w-full">
                {saving ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Saving...</> : 'Save Changes'}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
