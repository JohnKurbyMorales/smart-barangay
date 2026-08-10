'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { AdminHeader } from '@/components/layout/admin-header'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { formatDate } from '@/lib/utils'
import { Search, Users } from 'lucide-react'
import type { Profile } from '@/types'

export default function ResidentsPage() {
  const [residents, setResidents] = useState<Profile[]>([])
  const [filtered, setFiltered] = useState<Profile[]>([])
  const [search, setSearch] = useState('')

  useEffect(() => {
    const fetch = async () => {
      const supabase = createClient()
      const { data } = await supabase.from('profiles').select('*').eq('role', 'resident').order('created_at', { ascending: false })
      setResidents(data || [])
      setFiltered(data || [])
    }
    fetch()
  }, [])

  useEffect(() => {
    const q = search.toLowerCase()
    setFiltered(residents.filter(r => r.full_name.toLowerCase().includes(q) || r.email.toLowerCase().includes(q)))
  }, [search, residents])

  return (
    <div className="min-h-screen">
      <AdminHeader title="Residents" />
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Users className="w-6 h-6 text-primary" />
            <h1 className="text-xl font-bold">Residents ({filtered.length})</h1>
          </div>
          <div className="relative w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input placeholder="Search residents..." className="pl-9" value={search} onChange={e => setSearch(e.target.value)} />
          </div>
        </div>
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b border-border">
                  <tr>
                    {['Name', 'Email', 'Phone', 'Joined'].map(h => (
                      <th key={h} className="text-left py-3 px-4 font-medium text-muted-foreground">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(r => (
                    <tr key={r.id} className="border-b border-border/50 hover:bg-muted/30">
                      <td className="py-3 px-4 font-medium">{r.full_name}</td>
                      <td className="py-3 px-4 text-muted-foreground">{r.email}</td>
                      <td className="py-3 px-4 text-muted-foreground">{r.phone || '—'}</td>
                      <td className="py-3 px-4 text-muted-foreground">{formatDate(r.created_at)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
