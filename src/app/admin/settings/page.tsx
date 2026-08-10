'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Header } from '@/components/layout/header'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { toast } from 'sonner'
import { Settings, Loader2 } from 'lucide-react'
import type { SystemSettings } from '@/types'

export default function SettingsPage() {
  const [settings, setSettings] = useState<Partial<SystemSettings>>({})
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    const fetch = async () => {
      const supabase = createClient()
      const { data } = await supabase.from('system_settings').select('*').eq('id', 1).single()
      if (data) setSettings(data)
    }
    fetch()
  }, [])

  const handleSave = async () => {
    setSaving(true)
    const supabase = createClient()
    const { error } = await supabase.from('system_settings').update(settings).eq('id', 1)
    if (error) { toast.error('Failed to save settings'); setSaving(false); return }
    toast.success('Settings saved!')
    setSaving(false)
  }

  return (
    <div className="min-h-screen">
      <Header title="Settings" />
      <div className="p-6">
        <div className="max-w-2xl mx-auto space-y-6">
          <div className="flex items-center gap-3 mb-6">
            <Settings className="w-6 h-6 text-primary" />
            <h1 className="text-xl font-bold">System Settings</h1>
          </div>

          <Card>
            <CardHeader><CardTitle className="text-sm">Barangay Information</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              {[
                { label: 'Barangay Name', key: 'barangay_name', placeholder: 'Barangay' },
                { label: 'City / Municipality', key: 'city_municipality', placeholder: 'City' },
                { label: 'Province', key: 'province', placeholder: 'Province' },
                { label: 'Contact Number', key: 'contact_number', placeholder: '+63 xxx xxx xxxx' },
                { label: 'Email', key: 'email', placeholder: 'barangay@example.com' },
                { label: 'Emergency Hotline', key: 'emergency_hotline', placeholder: '911' },
                { label: 'Office Hours', key: 'office_hours', placeholder: 'Mon-Fri, 8AM-5PM' },
              ].map(({ label, key, placeholder }) => (
                <div key={key}>
                  <Label>{label}</Label>
                  <Input
                    value={(settings as any)[key] || ''}
                    onChange={e => setSettings(prev => ({ ...prev, [key]: e.target.value }))}
                    placeholder={placeholder}
                    className="mt-1"
                  />
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="text-sm">AI Configuration</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-sm">Enable AI Features</p>
                  <p className="text-xs text-muted-foreground">Auto-classify incidents using AI</p>
                </div>
                <Switch
                  checked={settings.ai_enabled ?? true}
                  onCheckedChange={v => setSettings(prev => ({ ...prev, ai_enabled: v }))}
                />
              </div>
              <div>
                <Label>AI Model</Label>
                <Input value={settings.ai_model || 'gpt-4o-mini'} onChange={e => setSettings(prev => ({ ...prev, ai_model: e.target.value }))} className="mt-1" />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-sm">Allow Anonymous Reports</p>
                </div>
                <Switch
                  checked={settings.allow_anonymous ?? true}
                  onCheckedChange={v => setSettings(prev => ({ ...prev, allow_anonymous: v }))}
                />
              </div>
            </CardContent>
          </Card>

          <Button onClick={handleSave} disabled={saving} className="w-full">
            {saving ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Saving...</> : 'Save Settings'}
          </Button>
        </div>
      </div>
    </div>
  )
}
