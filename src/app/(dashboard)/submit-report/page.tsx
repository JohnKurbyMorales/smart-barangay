'use client'
import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { reportSchema, type ReportValues } from '@/lib/validations/report'
import { createClient } from '@/lib/supabase/client'
import { useUser } from '@/hooks/use-user'
import { Header } from '@/components/layout/header'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { CATEGORIES } from '@/lib/constants'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import { Sparkles, MapPin, Upload, FileText, Loader2, Navigation } from 'lucide-react'
import dynamic from 'next/dynamic'

const IncidentMap = dynamic(() => import('@/components/maps/incident-map'), { ssr: false })

export default function SubmitReportPage() {
  const { user } = useUser()
  const router = useRouter()
  const [submitting, setSubmitting] = useState(false)
  const [classifying, setClassifying] = useState(false)
  const [gettingLocation, setGettingLocation] = useState(false)
  const [images, setImages] = useState<File[]>([])
  const [aiResult, setAiResult] = useState<any>(null)
  const [selectedLat, setSelectedLat] = useState<number | undefined>()
  const [selectedLng, setSelectedLng] = useState<number | undefined>()

  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm<ReportValues>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(reportSchema) as any,
    defaultValues: {
      is_anonymous: false,
      incident_date: new Date().toISOString().slice(0, 16),
      category: 'Other',
    },
  })

  const isAnonymous = watch('is_anonymous')
  const title = watch('title')
  const description = watch('description')

  // Set reporter name once user profile loads — avoids defaultValue/controlled conflict
  useEffect(() => {
    if (user?.full_name) {
      setValue('reporter_name', user.full_name, { shouldDirty: false })
    }
  }, [user?.full_name, setValue])

  const handleAIClassify = async () => {
    if (!title?.trim() || !description?.trim()) {
      toast.error('Please fill in both title and description first')
      return
    }
    
    if (description.length > 2000) {
      toast.error('Description too long (max 2000 characters)')
      return
    }
    
    setClassifying(true)
    try {
      const res = await fetch('/api/ai/classify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: title.trim(), description: description.trim() })
      })
      
      const result = await res.json()
      
      if (!res.ok) {
        throw new Error(result.error || 'Classification failed')
      }
      
      setAiResult(result)
      if (result.category) setValue('category', result.category)
      toast.success('✨ Classification complete!')
    } catch (error: any) {
      console.error('AI classify error:', error)
      toast.error(error.message || 'Classification failed. Please select category manually.')
    } finally {
      setClassifying(false)
    }
  }

  const handleLocationSelect = (lat: number, lng: number) => {
    setSelectedLat(lat)
    setSelectedLng(lng)
    setValue('lat', lat)
    setValue('lng', lng)
  }

  const handleUseMyLocation = () => {
    if (!navigator.geolocation) {
      toast.error('Geolocation not supported by this browser')
      return
    }

    setGettingLocation(true)
    
    const options = {
      enableHighAccuracy: true,
      timeout: 10000, // 10 seconds
      maximumAge: 60000 // 1 minute
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords
        handleLocationSelect(latitude, longitude)
        toast.success(`📍 Location set: ${latitude.toFixed(5)}, ${longitude.toFixed(5)}`)
        setGettingLocation(false)
      },
      (error) => {
        let message = 'Could not get your location'
        
        switch (error.code) {
          case error.PERMISSION_DENIED:
            message = 'Location access denied. Please enable location permissions in your browser.'
            break
          case error.POSITION_UNAVAILABLE:
            message = 'Location information unavailable. Please try again later.'
            break
          case error.TIMEOUT:
            message = 'Location request timed out. Please try again.'
            break
          default:
            message = 'An unknown error occurred while getting location.'
            break
        }
        
        toast.error(message)
        console.error('Geolocation error:', error)
        setGettingLocation(false)
      },
      options
    )
  }

  const onSubmit = async (values: ReportValues) => {
    setSubmitting(true)
    try {
      const supabase = createClient()
      const { data: { user: authUser } } = await supabase.auth.getUser()
      if (!authUser) { toast.error('Please log in'); return }

      const reportData = {
        title: values.title,
        description: values.description,
        category_name: values.category,
        incident_date: values.incident_date,
        lat: values.lat,
        lng: values.lng,
        address: values.address,
        landmark: values.landmark,
        is_anonymous: values.is_anonymous,
        reporter_id: authUser.id,
        reporter_name: values.is_anonymous ? null : (values.reporter_name || user?.full_name),
        reporter_contact: values.is_anonymous ? null : values.reporter_contact,
        status: 'pending',
        severity: aiResult?.severity || 'low',
        priority: aiResult?.priority || 'low',
        ai_summary: aiResult?.summary,
        ai_keywords: aiResult?.keywords,
        ai_department: aiResult?.suggested_department,
        ai_processed: !!aiResult,
      }

      const { data: report, error } = await supabase.from('incident_reports').insert(reportData).select().single()
      if (error) throw error

      // Upload images
      if (images.length > 0 && report) {
        for (const img of images) {
          const path = `${report.id}/${Date.now()}-${img.name}`
          const { data: upload } = await supabase.storage.from('incident-images').upload(path, img)
          if (upload) {
            const { data: { publicUrl } } = supabase.storage.from('incident-images').getPublicUrl(path)
            await supabase.from('incident_images').insert({ report_id: report.id, image_url: publicUrl, file_path: path })
          }
        }
      }

      toast.success('Report submitted successfully!')
      router.push(`/reports/${report.id}`)
    } catch (err) {
      toast.error('Failed to submit report. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen">
      <Header title="Submit Report" />
      <div className="p-6">
        <div className="max-w-5xl mx-auto">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <FileText className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h1 className="text-xl font-bold">Submit Incident Report</h1>
              <p className="text-sm text-muted-foreground">Report an incident with AI-assisted classification</p>
            </div>
          </div>

          <form onSubmit={handleSubmit(onSubmit as any)}>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Left: form */}
              <div className="space-y-6">
                <Card>
                  <CardHeader><CardTitle className="text-sm flex items-center gap-2"><FileText className="w-4 h-4" /> Incident Details</CardTitle></CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label htmlFor="title">Incident Title *</Label>
                      <Input id="title" placeholder="e.g., Fire near Barangay Hall" {...register('title')} className="mt-1" />
                      {errors.title && <p className="text-xs text-destructive mt-1">{errors.title.message}</p>}
                    </div>
                    <div>
                      <Label htmlFor="description">Description *</Label>
                      <Textarea id="description" placeholder="Describe what happened in detail..." {...register('description')} rows={4} className="mt-1" />
                      {errors.description && <p className="text-xs text-destructive mt-1">{errors.description.message}</p>}
                    </div>
                    <Button type="button" variant="outline" onClick={handleAIClassify} disabled={classifying} className="w-full">
                      {classifying ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Sparkles className="w-4 h-4 mr-2" />}
                      AI Classify
                    </Button>

                    {aiResult && (
                      <div className="p-3 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 text-sm space-y-1">
                        <p><span className="font-medium">Category:</span> {aiResult.category}</p>
                        <p><span className="font-medium">Severity:</span> {aiResult.severity}</p>
                        <p><span className="font-medium">Department:</span> {aiResult.suggested_department}</p>
                        {aiResult.summary && <p className="text-muted-foreground">{aiResult.summary}</p>}
                      </div>
                    )}

                    <div>
                      <Label htmlFor="category">Category</Label>
                      <select id="category" {...register('category')} className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                        {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                      </select>
                    </div>

                    <div>
                      <Label htmlFor="incident_date">Date & Time</Label>
                      <Input id="incident_date" type="datetime-local" {...register('incident_date')} className="mt-1" />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader><CardTitle className="text-sm flex items-center gap-2"><MapPin className="w-4 h-4" /> Location</CardTitle></CardHeader>
                  <CardContent className="space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label>Address</Label>
                        <Input placeholder="Street, Brgy, City" {...register('address')} className="mt-1" />
                      </div>
                      <div>
                        <Label>Landmark</Label>
                        <Input placeholder="Near..." {...register('landmark')} className="mt-1" />
                      </div>
                    </div>
                    <Button type="button" variant="outline" size="sm" onClick={handleUseMyLocation} disabled={gettingLocation}>
                      {gettingLocation ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Getting Location...
                        </>
                      ) : (
                        <>
                          <Navigation className="w-4 h-4 mr-2" />
                          Use My Location
                        </>
                      )}
                    </Button>
                    {selectedLat && <p className="text-xs text-muted-foreground">📍 {selectedLat.toFixed(5)}, {selectedLng?.toFixed(5)}</p>}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader><CardTitle className="text-sm flex items-center gap-2"><Upload className="w-4 h-4" /> Attachments</CardTitle></CardHeader>
                  <CardContent className="space-y-3">
                    <div>
                      <Label>Images</Label>
                      <input type="file" accept="image/*" multiple className="mt-1 block w-full text-sm" onChange={e => setImages(Array.from(e.target.files || []))} />
                      {images.length > 0 && <p className="text-xs text-muted-foreground">{images.length} file(s) selected</p>}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader><CardTitle className="text-sm">Reporter Info</CardTitle></CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center gap-3">
                      <Switch id="anonymous" checked={isAnonymous} onCheckedChange={v => setValue('is_anonymous', v)} />
                      <Label htmlFor="anonymous">Anonymous Report</Label>
                    </div>
                    {!isAnonymous && (
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <Label>Name</Label>
                          <Input placeholder="Your name" {...register('reporter_name')} className="mt-1" />
                        </div>
                        <div>
                          <Label>Contact</Label>
                          <Input placeholder="Phone / Email" {...register('reporter_contact')} className="mt-1" />
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* Right: map + submit */}
              <div className="space-y-4">
                <Card>
                  <CardHeader><CardTitle className="text-sm flex items-center gap-2"><MapPin className="w-4 h-4" /> Select Location on Map</CardTitle></CardHeader>
                  <CardContent className="p-0 overflow-hidden rounded-b-xl">
                    <div className="px-4 pb-2 pt-0">
                      <p className="text-xs text-muted-foreground">Click on the map or use "My Location" to place the incident marker.</p>
                    </div>
                    <IncidentMap
                      incidents={[]}
                      height="380px"
                      selectable
                      onLocationSelect={handleLocationSelect}
                      selectedLat={selectedLat}
                      selectedLng={selectedLng}
                    />
                  </CardContent>
                </Card>

                <Button type="submit" className="w-full" size="lg" disabled={submitting}>
                  {submitting ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Submitting...</> : 'Submit Report'}
                </Button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
