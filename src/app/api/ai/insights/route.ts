import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { openai } from '@/lib/ai/openai'

export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    // Check user role - only admin/staff can access insights
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
      .select('category_name, status, priority, landmark, address, created_at, resolved_at')
      .order('created_at', { ascending: false })
      .limit(100)

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{
        role: 'system',
        content: 'Analyze barangay incident data. Return JSON with: most_common_incident, top_area, peak_hours, avg_resolution_hours, trends (array of strings), recommendations (array of strings).'
      }, {
        role: 'user',
        content: JSON.stringify(reports)
      }],
      response_format: { type: 'json_object' },
    })

    return NextResponse.json(JSON.parse(completion.choices[0].message.content!))
  } catch (error) {
    console.error('AI insights error:', error)
    return NextResponse.json({ error: 'Insights failed' }, { status: 500 })
  }
}
