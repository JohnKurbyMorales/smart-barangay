'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { AdminHeader } from '@/components/layout/admin-header'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { formatDate } from '@/lib/utils'
import { toast } from 'sonner'
import { Users, Plus, Search } from 'lucide-react'

export default function StaffPage() {
  const [staff, setStaff] = useState<any[]>([])
  const [filtered, setFiltered] = useState<any[]>([])
  const [search, setSearch] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ email: '', full_name: '', position: '', department: '' })
  const [submitting, setSubmitting] = useState(false)

  const fetchStaff = async () => {
    const supabase = createClient()
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .in('role', ['staff', 'admin'])
      .order('created_at', { ascending: false })
    setStaff(data || [])
    setFiltered(data || [])
  }

  useEffect(() => { fetchStaff() }, [])

  useEffect(() => {
    const q = search.toLowerCase()
    setFiltered(staff.filter(s => s.full_name?.toLowerCase().includes(q) || s.email?.toLowerCase().includes(q)))
  }, [search, staff])

  const handleInvite = async () => {
    if (!form.email || !form.full_name) { toast.error('Email and name required'); return }
    setSubmitting(true)
    const supabase = createClient()
    // Create auth user and set role to staff
    const { data, error } = await supabase.auth.admin?.createUser?.({
      email: form.email,
      password: Math.random().toString(36).slice(-8),
      user_metadata: { full_name: form.full_name },
      email_confirm: true,
    }) as any
    if (error) {
      toast.error('Failed to create user: ' + error.message)
      setSubmitting(false)
      return
    }
    toast.success('Staff member added!')
    setShowForm(false)
    setForm({ email: '', full_name: '', position: '', department: '' })
    fetchStaff()
    setSubmitting(false)
  }

  return (
    <div className="min-h-screen">
      <AdminHeader title="Staff Management" />
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Users className="w-6 h-6 text-primary" />
            <h1 className="text-xl font-bold">Staff & Admins ({filtered.length})</h1>
          </div>
          <div className="flex items-center gap-3">
            <div className="relative w-56">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input placeholder="Search staff..." className="pl-9" value={search} onChange={e => setSearch(e.target.value)} />
            </div>
            <Button onClick={() => setShowForm(true)}><Plus className="w-4 h-4 mr-2" /> Add Staff</Button>
          </div>
        </div>

        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b border-border">
                  <tr>
                    {['Name', 'Email', 'Role', 'Joined'].map(h => (
                      <th key={h} className="text-left py-3 px-4 font-medium text-muted-foreground">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(s => (
                    <tr key={s.id} className="border-b border-border/50 hover:bg-muted/30">
                      <td className="py-3 px-4 font-medium">{s.full_name}</td>
                      <td className="py-3 px-4 text-muted-foreground">{s.email}</td>
                      <td className="py-3 px-4">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary capitalize">{s.role}</span>
                      </td>
                      <td className="py-3 px-4 text-muted-foreground">{formatDate(s.created_at)}</td>
                    </tr>
                  ))}
                  {filtered.length === 0 && (
                    <tr><td colSpan={4} className="py-8 text-center text-muted-foreground">No staff members found</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>

      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent>
          <DialogHeader><DialogTitle>Add Staff Member</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Full Name</Label>
              <Input value={form.full_name} onChange={e => setForm(p => ({ ...p, full_name: e.target.value }))} className="mt-1" />
            </div>
            <div>
              <Label>Email</Label>
              <Input type="email" value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} className="mt-1" />
            </div>
            <div>
              <Label>Position</Label>
              <Input value={form.position} onChange={e => setForm(p => ({ ...p, position: e.target.value }))} placeholder="e.g., Barangay Tanod" className="mt-1" />
            </div>
            <div>
              <Label>Department</Label>
              <Input value={form.department} onChange={e => setForm(p => ({ ...p, department: e.target.value }))} placeholder="e.g., Public Safety" className="mt-1" />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
              <Button onClick={handleInvite} disabled={submitting}>{submitting ? 'Adding...' : 'Add Staff'}</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
