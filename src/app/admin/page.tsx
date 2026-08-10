'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { AdminHeader } from '@/components/layout/admin-header'
import { StatCard } from '@/components/shared/stat-card'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { StatusBadge } from '@/components/shared/status-badge'
import { formatDate } from '@/lib/utils'
import Link from 'next/link'
import { Users, FileText, Activity, CheckCircle, AlertTriangle, Shield } from 'lucide-react'

export default function AdminPage() {
  const [stats, setStats] = useState({ reports: 0, users: 0, staff: 0, resolved: 0, critical: 0, pending: 0 })
  const [recentReports, setRecentReports] = useState<any[]>([])

  useEffect(() => {
    const fetch = async () => {
      const supabase = createClient()
      const [{ count: reports }, { count: users }, { count: staff }, { data: recent }] = await Promise.all([
        supabase.from('incident_reports').select('*', { count: 'exact', head: true }),
        supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'resident'),
        supabase.from('profiles').select('*', { count: 'exact', head: true }).in('role', ['staff', 'admin']),
        supabase.from('incident_reports').select('*').order('created_at', { ascending: false }).limit(10),
      ])
      const resolved = recent?.filter(r => r.status === 'resolved' || r.status === 'closed').length || 0
      const critical = recent?.filter(r => r.priority === 'critical').length || 0
      const pending = recent?.filter(r => r.status === 'pending').length || 0
      setStats({ reports: reports || 0, users: users || 0, staff: staff || 0, resolved, critical, pending })
      setRecentReports(recent || [])
    }
    fetch()
  }, [])

  return (
    <div className="min-h-screen">
      <AdminHeader title="Admin Dashboard" />
      <div className="p-6 space-y-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <Shield className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h1 className="text-xl font-bold">Admin Dashboard</h1>
            <p className="text-sm text-muted-foreground">System overview and management</p>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <StatCard title="Total Reports" value={stats.reports} icon={FileText} color="#2563eb" />
          <StatCard title="Residents" value={stats.users} icon={Users} color="#7c3aed" />
          <StatCard title="Staff/Admins" value={stats.staff} icon={Shield} color="#059669" />
          <StatCard title="Resolved" value={stats.resolved} icon={CheckCircle} color="#22c55e" />
          <StatCard title="Critical" value={stats.critical} icon={AlertTriangle} color="#ef4444" />
          <StatCard title="Pending" value={stats.pending} icon={Activity} color="#f59e0b" />
        </div>

        <Card>
          <CardHeader><CardTitle className="text-sm">Recent Reports (All)</CardTitle></CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-2 px-3 font-medium text-muted-foreground">Report #</th>
                    <th className="text-left py-2 px-3 font-medium text-muted-foreground">Title</th>
                    <th className="text-left py-2 px-3 font-medium text-muted-foreground">Category</th>
                    <th className="text-left py-2 px-3 font-medium text-muted-foreground">Status</th>
                    <th className="text-left py-2 px-3 font-medium text-muted-foreground">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {recentReports.map(r => (
                    <tr key={r.id} className="border-b border-border/50 hover:bg-muted/30">
                      <td className="py-2 px-3 font-mono text-xs text-muted-foreground">{r.report_number?.slice(-10)}</td>
                      <td className="py-2 px-3">
                        <Link href={`/reports/${r.id}`} className="hover:text-primary truncate max-w-[200px] block">{r.title}</Link>
                      </td>
                      <td className="py-2 px-3">{r.category_name || '—'}</td>
                      <td className="py-2 px-3"><StatusBadge status={r.status} /></td>
                      <td className="py-2 px-3 text-muted-foreground">{formatDate(r.created_at)}</td>
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
