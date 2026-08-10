'use client'
import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Header } from '@/components/layout/header'
import { StatusBadge, CategoryBadge, SeverityBadge } from '@/components/shared/status-badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { formatDateTime } from '@/lib/utils'
import { useUser } from '@/hooks/use-user'
import { toast } from 'sonner'
import { MapPin, User, Calendar, Bot, ArrowLeft, CheckCircle2, Clock, Loader2 } from 'lucide-react'
import Link from 'next/link'
import dynamic from 'next/dynamic'
import type { IncidentReport } from '@/types'

const IncidentMap = dynamic(() => import('@/components/maps/incident-map'), { ssr: false })

const STATUS_FLOW = ['pending', 'ai_reviewing', 'verified', 'assigned', 'in_progress', 'resolved', 'closed']

export default function ReportDetailPage() {
  const params = useParams()
  const { user } = useUser()
  const [report, setReport] = useState<IncidentReport | null>(null)
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState(false)

  useEffect(() => {
    const fetch = async () => {
      const supabase = createClient()
      const { data } = await supabase
        .from('incident_reports')
        .select('*, incident_images(*)')
        .eq('id', params.id as string)
        .single()
      setReport(data)
      setLoading(false)
    }
    fetch()
  }, [params.id])

  const updateStatus = async (newStatus: string) => {
    if (!report) return
    setUpdating(true)
    const supabase = createClient()
    const { error } = await supabase
      .from('incident_reports')
      .update({ status: newStatus, updated_at: new Date().toISOString() })
      .eq('id', report.id)
    if (error) { toast.error('Failed to update status'); setUpdating(false); return }
    setReport(prev => prev ? { ...prev, status: newStatus as IncidentReport['status'] } : null)
    toast.success(`Status updated to ${newStatus}`)
    setUpdating(false)
  }

  if (loading) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="w-6 h-6 animate-spin" /></div>
  if (!report) return <div className="min-h-screen flex items-center justify-center text-muted-foreground">Report not found</div>

  const currentStep = STATUS_FLOW.indexOf(report.status)

  return (
    <div className="min-h-screen">
      <Header title="Report Detail" />
      <div className="p-6">
        <div className="max-w-4xl mx-auto space-y-6">
          <Link href="/reports"><Button variant="ghost" size="sm"><ArrowLeft className="w-4 h-4 mr-2" /> Back to Reports</Button></Link>

          {/* Header card */}
          <Card>
            <CardContent className="p-6">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <CategoryBadge category={report.category_name || 'Other'} />
                    <SeverityBadge severity={report.severity} />
                    <StatusBadge status={report.status} />
                  </div>
                  <h1 className="text-xl font-bold">{report.title}</h1>
                  <p className="text-sm text-muted-foreground mt-1">#{report.report_number}</p>
                </div>
                {(user?.role === 'staff' || user?.role === 'admin') && (
                  <div className="flex flex-wrap gap-2">
                    {STATUS_FLOW.map(s => (
                      <Button
                        key={s}
                        size="sm"
                        variant={report.status === s ? 'default' : 'outline'}
                        onClick={() => updateStatus(s)}
                        disabled={updating}
                        className="text-xs"
                      >
                        {s.replace('_', ' ')}
                      </Button>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Status Timeline */}
          <Card>
            <CardHeader><CardTitle className="text-sm">Status Timeline</CardTitle></CardHeader>
            <CardContent>
              <div className="flex items-center gap-1 overflow-x-auto pb-2">
                {STATUS_FLOW.map((s, i) => {
                  const done = i <= currentStep
                  const current = i === currentStep
                  return (
                    <div key={s} className="flex items-center gap-1 flex-shrink-0">
                      <div className={`flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium transition-colors ${
                        current ? 'bg-primary text-white' : done ? 'bg-green-100 text-green-700 dark:bg-green-900/30' : 'bg-muted text-muted-foreground'
                      }`}>
                        {done && !current ? <CheckCircle2 className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
                        {s.replace('_', ' ')}
                      </div>
                      {i < STATUS_FLOW.length - 1 && <div className={`w-4 h-0.5 ${i < currentStep ? 'bg-green-400' : 'bg-muted'}`} />}
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Description */}
            <Card>
              <CardHeader><CardTitle className="text-sm">Incident Description</CardTitle></CardHeader>
              <CardContent>
                <p className="text-sm">{report.description}</p>
                {report.ai_summary && (
                  <div className="mt-4 p-3 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
                    <div className="flex items-center gap-2 mb-1"><Bot className="w-4 h-4 text-blue-500" /><span className="text-xs font-medium text-blue-600">AI Summary</span></div>
                    <p className="text-sm text-blue-700 dark:text-blue-300">{report.ai_summary}</p>
                    {report.ai_keywords && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {report.ai_keywords.map(k => <span key={k} className="bg-blue-100 dark:bg-blue-800 text-blue-600 dark:text-blue-200 px-2 py-0.5 rounded text-xs">{k}</span>)}
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Info */}
            <Card>
              <CardHeader><CardTitle className="text-sm">Incident Information</CardTitle></CardHeader>
              <CardContent className="space-y-3 text-sm">
                {report.address && <div className="flex items-start gap-2"><MapPin className="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0" /><span>{report.address}{report.landmark && ` — near ${report.landmark}`}</span></div>}
                <div className="flex items-center gap-2"><Calendar className="w-4 h-4 text-muted-foreground" /><span>{formatDateTime(report.incident_date || report.created_at)}</span></div>
                {!report.is_anonymous && report.reporter_name && (
                  <div className="flex items-center gap-2"><User className="w-4 h-4 text-muted-foreground" /><span>{report.reporter_name}</span></div>
                )}
                {report.is_anonymous && <div className="flex items-center gap-2"><User className="w-4 h-4 text-muted-foreground" /><span className="text-muted-foreground italic">Anonymous</span></div>}
                {report.ai_department && <div className="flex items-center gap-2"><span className="text-muted-foreground">Department:</span><span>{report.ai_department}</span></div>}
              </CardContent>
            </Card>
          </div>

          {/* Map */}
          {report.lat && report.lng && (
            <Card>
              <CardHeader><CardTitle className="text-sm">Location</CardTitle></CardHeader>
              <CardContent className="p-0 overflow-hidden rounded-b-xl">
                <IncidentMap incidents={[report]} height="300px" />
              </CardContent>
            </Card>
          )}

          {/* Images */}
          {(report as any).incident_images?.length > 0 && (
            <Card>
              <CardHeader><CardTitle className="text-sm">Attached Images</CardTitle></CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {(report as any).incident_images.map((img: any) => (
                    <a key={img.id} href={img.image_url} target="_blank" rel="noopener noreferrer">
                      <img src={img.image_url} alt="Incident" className="w-full h-32 object-cover rounded-lg hover:opacity-90 transition-opacity" />
                    </a>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
