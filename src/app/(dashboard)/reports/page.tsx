'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useUser } from '@/hooks/use-user'
import { Header } from '@/components/layout/header'
import { StatusBadge, CategoryBadge, SeverityBadge } from '@/components/shared/status-badge'
import { EmptyState } from '@/components/shared/empty-state'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { CATEGORIES } from '@/lib/constants'
import { formatDate } from '@/lib/utils'
import Link from 'next/link'
import { Search, Plus, Filter } from 'lucide-react'
import type { IncidentReport } from '@/types'

const STATUSES = ['pending', 'ai_reviewing', 'verified', 'assigned', 'in_progress', 'resolved', 'closed']

export default function ReportsPage() {
  const { user } = useUser()
  const [reports, setReports] = useState<IncidentReport[]>([])
  const [filtered, setFiltered] = useState<IncidentReport[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [categoryFilter, setCategoryFilter] = useState('all')

  const isAdmin = user?.role === 'admin' || user?.role === 'staff'

  useEffect(() => {
    const fetchReports = async () => {
      if (!user) return
      
      const supabase = createClient()
      let query = supabase
        .from('incident_reports')
        .select('*, incident_images(image_url)')
        .order('created_at', { ascending: false })
        .limit(200)

      // Residents can only see their own reports
      if (!isAdmin) {
        query = query.eq('reporter_id', user.id)
      }

      const { data } = await query
      setReports(data || [])
      setFiltered(data || [])
      setLoading(false)
    }
    fetchReports()
  }, [user, isAdmin])

  useEffect(() => {
    let result = reports
    if (search) {
      const q = search.toLowerCase()
      result = result.filter(r =>
        r.title.toLowerCase().includes(q) ||
        r.description.toLowerCase().includes(q) ||
        r.report_number?.toLowerCase().includes(q)
      )
    }
    if (statusFilter !== 'all') result = result.filter(r => r.status === statusFilter)
    if (categoryFilter !== 'all') result = result.filter(r => r.category_name === categoryFilter)
    setFiltered(result)
  }, [search, statusFilter, categoryFilter, reports])

  return (
    <div className="min-h-screen">
      <Header title="Reports" />
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-xl font-bold">{isAdmin ? 'All Incident Reports' : 'My Reports'}</h1>
            <p className="text-sm text-muted-foreground">{filtered.length} reports found</p>
          </div>
          <Link href="/submit-report">
            <Button><Plus className="w-4 h-4 mr-2" /> New Report</Button>
          </Link>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-3 mb-6">
          <div className="relative flex-1 min-w-48">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input placeholder="Search reports..." className="pl-9" value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <select
            className="rounded-md border border-input bg-background px-3 py-2 text-sm"
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
          >
            <option value="all">All Status</option>
            {STATUSES.map(s => <option key={s} value={s}>{s.replace('_', ' ').replace(/\b\w/g, c => c.toUpperCase())}</option>)}
          </select>
          <select
            className="rounded-md border border-input bg-background px-3 py-2 text-sm"
            value={categoryFilter}
            onChange={e => setCategoryFilter(e.target.value)}
          >
            <option value="all">All Categories</option>
            {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array(6).fill(0).map((_, i) => (
              <div key={i} className="h-44 rounded-xl bg-muted animate-pulse" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <EmptyState 
            title="No reports found" 
            description={isAdmin 
              ? "No incident reports match your search criteria." 
              : "You haven't submitted any incident reports yet. Click 'New Report' to get started."
            } 
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map(report => (
              <Link key={report.id} href={`/reports/${report.id}`}>
                <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <CategoryBadge category={report.category_name || 'Other'} />
                      <SeverityBadge severity={report.severity} />
                    </div>
                    <h3 className="font-semibold text-sm mb-1 line-clamp-2">{report.title}</h3>
                    <p className="text-xs text-muted-foreground mb-3 line-clamp-2">{report.ai_summary || report.description}</p>
                    <div className="flex items-center justify-between">
                      <StatusBadge status={report.status} />
                      <span className="text-xs text-muted-foreground">{formatDate(report.created_at)}</span>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
