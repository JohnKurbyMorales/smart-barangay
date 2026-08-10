'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Header } from '@/components/layout/header'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { formatDate } from '@/lib/utils'
import { useUser } from '@/hooks/use-user'
import { toast } from 'sonner'
import { Megaphone, Plus, Pin, Trash2 } from 'lucide-react'
import type { Announcement } from '@/types'

export default function AnnouncementsPage() {
  const { user } = useUser()
  const [announcements, setAnnouncements] = useState<Announcement[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const fetchAnnouncements = async () => {
    const supabase = createClient()
    const { data } = await supabase
      .from('announcements')
      .select('*')
      .eq('is_active', true)
      .order('is_pinned', { ascending: false })
      .order('created_at', { ascending: false })
    setAnnouncements(data || [])
    setLoading(false)
  }

  useEffect(() => { fetchAnnouncements() }, [])

  const handleSubmit = async () => {
    if (!title.trim() || !content.trim()) { toast.error('Title and content are required'); return }
    setSubmitting(true)
    const supabase = createClient()
    const { error } = await supabase.from('announcements').insert({
      title, content,
      author_id: user?.id,
      author_name: user?.full_name || 'Barangay Admin',
      is_active: true,
      is_pinned: false,
    })
    if (error) { toast.error('Failed to create announcement'); setSubmitting(false); return }
    toast.success('Announcement created!')
    setShowForm(false)
    setTitle('')
    setContent('')
    fetchAnnouncements()
    setSubmitting(false)
  }

  const togglePin = async (a: Announcement) => {
    const supabase = createClient()
    await supabase.from('announcements').update({ is_pinned: !a.is_pinned }).eq('id', a.id)
    fetchAnnouncements()
  }

  const deleteAnnouncement = async (id: string) => {
    const supabase = createClient()
    await supabase.from('announcements').update({ is_active: false }).eq('id', id)
    setAnnouncements(prev => prev.filter(a => a.id !== id))
    toast.success('Announcement removed')
  }

  const canManage = user?.role === 'admin' || user?.role === 'staff'

  return (
    <div className="min-h-screen">
      <Header title="Announcements" />
      <div className="p-6">
        <div className="max-w-3xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <Megaphone className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h1 className="text-xl font-bold">Announcements</h1>
                <p className="text-sm text-muted-foreground">Barangay news and updates</p>
              </div>
            </div>
            {canManage && (
              <Button onClick={() => setShowForm(true)}><Plus className="w-4 h-4 mr-2" /> New</Button>
            )}
          </div>

          {loading ? (
            <div className="space-y-4">{Array(3).fill(0).map((_, i) => <div key={i} className="h-28 rounded-xl bg-muted animate-pulse" />)}</div>
          ) : announcements.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground">No announcements yet.</div>
          ) : (
            <div className="space-y-4">
              {announcements.map(a => (
                <Card key={a.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-5">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        {a.is_pinned && <p className="text-xs text-blue-500 font-medium mb-1">📌 Pinned</p>}
                        <h3 className="font-semibold">{a.title}</h3>
                        <p className="text-sm text-muted-foreground mt-1">{a.content}</p>
                        <p className="text-xs text-muted-foreground mt-3">
                          {formatDate(a.created_at)} · {a.author_name}
                        </p>
                      </div>
                      {canManage && (
                        <div className="flex gap-1 flex-shrink-0">
                          <Button variant="ghost" size="icon" className="w-8 h-8" onClick={() => togglePin(a)}>
                            <Pin className={`w-4 h-4 ${a.is_pinned ? 'text-blue-500' : 'text-muted-foreground'}`} />
                          </Button>
                          <Button variant="ghost" size="icon" className="w-8 h-8 text-destructive" onClick={() => deleteAnnouncement(a.id)}>
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>

      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent>
          <DialogHeader><DialogTitle>New Announcement</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Title</Label>
              <Input value={title} onChange={e => setTitle(e.target.value)} placeholder="Announcement title" className="mt-1" />
            </div>
            <div>
              <Label>Content</Label>
              <Textarea value={content} onChange={e => setContent(e.target.value)} placeholder="Write your announcement..." rows={5} className="mt-1" />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
              <Button onClick={handleSubmit} disabled={submitting}>{submitting ? 'Publishing...' : 'Publish'}</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
