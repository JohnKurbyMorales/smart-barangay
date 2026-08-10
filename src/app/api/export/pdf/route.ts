import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    // Check user role - only admin/staff can export
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (!profile || !['admin', 'staff'].includes(profile.role)) {
      return NextResponse.json({ error: 'Access denied. Admin or staff required.' }, { status: 403 })
    }

    const { data: reports } = await supabase
      .from('incident_reports')
      .select('report_number, title, category_name, severity, status, address, created_at, reporter_name')
      .order('created_at', { ascending: false })
      .limit(500)

    // Return JSON for client-side PDF generation
    return NextResponse.json({ reports, generated_at: new Date().toISOString() })
  } catch (error) {
    return NextResponse.json({ error: 'Export failed' }, { status: 500 })
  }
}
