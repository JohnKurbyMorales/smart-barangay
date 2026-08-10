'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Header } from '@/components/layout/header'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { formatDateTime } from '@/lib/utils'
import { ClipboardList, Search } from 'lucide-react'

export default function AuditLogsPage() {
  const [logs, setLogs] = useState<any[]>([])
  const [filtered, setFiltered] = useState<any[]>([])
  const [search, setSearch] = useState('')

  useEffect(() => {
    const fetch = async () => {
      const supabase = createClient()
      const { data } = await supabase
        .from('activity_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(200)
      setLogs(data || [])
      setFiltered(data || [])
    }
    fetch()
  }, [])

  useEffect(() => {
    const q = search.toLowerCase()
    setFiltered(logs.filter(l =>
      l.action?.toLowerCase().includes(q) ||
      l.user_name?.toLowerCase().includes(q) ||
      l.entity_type?.toLowerCase().includes(q)
    ))
  }, [search, logs])

  return (
    <div className="min-h-screen">
      <Header title="Audit Logs" />
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <ClipboardList className="w-6 h-6 text-primary" />
            <h1 className="text-xl font-bold">Audit Logs ({filtered.length})</h1>
          </div>
          <div className="relative w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input placeholder="Search logs..." className="pl-9" value={search} onChange={e => setSearch(e.target.value)} />
          </div>
        </div>

        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b border-border">
                  <tr>
                    {['Timestamp', 'User', 'Action', 'Entity', 'Details'].map(h => (
                      <th key={h} className="text-left py-3 px-4 font-medium text-muted-foreground">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.length === 0 ? (
                    <tr><td colSpan={5} className="py-8 text-center text-muted-foreground">No audit logs found</td></tr>
                  ) : filtered.map(log => (
                    <tr key={log.id} className="border-b border-border/50 hover:bg-muted/30">
                      <td className="py-2.5 px-4 text-xs text-muted-foreground whitespace-nowrap">{formatDateTime(log.created_at)}</td>
                      <td className="py-2.5 px-4">{log.user_name || '—'}</td>
                      <td className="py-2.5 px-4">
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-muted">{log.action}</span>
                      </td>
                      <td className="py-2.5 px-4 text-muted-foreground">{log.entity_type || '—'}</td>
                      <td className="py-2.5 px-4 text-xs text-muted-foreground max-w-[200px] truncate">
                        {log.new_values ? JSON.stringify(log.new_values).slice(0, 60) : '—'}
                      </td>
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
