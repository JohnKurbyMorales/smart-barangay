'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { AdminHeader } from '@/components/layout/admin-header'
import { Card, CardContent } from '@/components/ui/card'
import { CATEGORIES, CATEGORY_COLORS } from '@/lib/constants'
import { Activity } from 'lucide-react'

export default function CategoriesPage() {
  const [counts, setCounts] = useState<Record<string, number>>({})

  useEffect(() => {
    const fetch = async () => {
      const supabase = createClient()
      const { data } = await supabase.from('incident_reports').select('category_name')
      const c: Record<string, number> = {}
      data?.forEach(r => {
        const cat = r.category_name || 'Other'
        c[cat] = (c[cat] || 0) + 1
      })
      setCounts(c)
    }
    fetch()
  }, [])

  return (
    <div className="min-h-screen">
      <AdminHeader title="Categories" />
      <div className="p-6">
        <div className="flex items-center gap-3 mb-6">
          <Activity className="w-6 h-6 text-primary" />
          <h1 className="text-xl font-bold">Incident Categories</h1>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {CATEGORIES.map(cat => {
            const color = CATEGORY_COLORS[cat] || '#6b7280'
            return (
              <Card key={cat} className="hover:shadow-md transition-shadow">
                <CardContent className="p-5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: color + '20' }}>
                        <div className="w-4 h-4 rounded-full" style={{ backgroundColor: color }} />
                      </div>
                      <div>
                        <p className="font-semibold text-sm">{cat}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">{counts[cat] || 0} reports</p>
                      </div>
                    </div>
                    <span className="text-2xl font-bold" style={{ color }}>{counts[cat] || 0}</span>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      </div>
    </div>
  )
}
