'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useUser } from '@/hooks/use-user'
import { Header } from '@/components/layout/header'
import { Card, CardContent } from '@/components/ui/card'
import { CATEGORIES, CATEGORY_COLORS } from '@/lib/constants'
import dynamic from 'next/dynamic'
import type { IncidentReport } from '@/types'
import { Map } from 'lucide-react'

const IncidentMap = dynamic(() => import('@/components/maps/incident-map'), { ssr: false, loading: () => <div className="h-[500px] rounded-xl bg-muted animate-pulse" /> })

export default function MapPage() {
  const { user } = useUser()
  const [reports, setReports] = useState<IncidentReport[]>([])
  const [filtered, setFiltered] = useState<IncidentReport[]>([])
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [loading, setLoading] = useState(true)

  const isAdmin = user?.role === 'admin' || user?.role === 'staff'

  useEffect(() => {
    const fetch = async () => {
      if (!user) return
      
      const supabase = createClient()
      let query = supabase
        .from('incident_reports')
        .select('*')
        .not('lat', 'is', null)
        .not('lng', 'is', null)
        .order('created_at', { ascending: false })
        .limit(300)

      // Residents only see non-sensitive or their own reports
      if (!isAdmin) {
        // Show only resolved/closed reports (public info) or reports by this user
        query = query.or(`status.in.(resolved,closed),reporter_id.eq.${user.id}`)
      }

      const { data } = await query
      setReports(data || [])
      setFiltered(data || [])
      setLoading(false)
    }
    fetch()
  }, [user, isAdmin])

  useEffect(() => {
    if (categoryFilter === 'all') setFiltered(reports)
    else setFiltered(reports.filter(r => r.category_name === categoryFilter))
  }, [categoryFilter, reports])

  // Legend counts
  const categoryCounts = CATEGORIES.reduce((acc, cat) => {
    acc[cat] = reports.filter(r => r.category_name === cat).length
    return acc
  }, {} as Record<string, number>)

  return (
    <div className="min-h-screen">
      <Header title="Map View" />
      <div className="p-6 space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <Map className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h1 className="text-xl font-bold">
              {isAdmin ? 'Incident Map Dashboard' : 'Public Incidents Map'}
            </h1>
            <p className="text-sm text-muted-foreground">
              {filtered.length} {isAdmin ? 'active incidents' : 'resolved incidents'} on map
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          <select
            className="rounded-md border border-input bg-background px-3 py-2 text-sm"
            value={categoryFilter}
            onChange={e => setCategoryFilter(e.target.value)}
          >
            <option value="all">All Categories</option>
            {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          <p className="text-xs text-muted-foreground">
            {isAdmin 
              ? 'Toggle Street / Satellite view using the map controls. Click markers for details.'
              : 'Viewing resolved incidents only. Click markers for details.'
            }
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
          <div className="lg:col-span-3">
            <Card className="overflow-hidden">
              <CardContent className="p-0">
                {loading ? (
                  <div className="h-[500px] bg-muted animate-pulse rounded-xl" />
                ) : (
                  <IncidentMap incidents={filtered} height="500px" />
                )}
              </CardContent>
            </Card>
          </div>

          {/* Legend */}
          <Card>
            <CardContent className="p-4">
              <h3 className="font-semibold text-sm mb-3">Legend</h3>
              <div className="space-y-2">
                {CATEGORIES.filter(c => categoryCounts[c] > 0).map(cat => (
                  <div key={cat} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: CATEGORY_COLORS[cat] }} />
                      <span className="text-xs">{cat}</span>
                    </div>
                    <span className="text-xs font-medium text-muted-foreground">{categoryCounts[cat]}</span>
                  </div>
                ))}
                {Object.values(categoryCounts).every(v => v === 0) && (
                  <p className="text-xs text-muted-foreground">No located incidents</p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
