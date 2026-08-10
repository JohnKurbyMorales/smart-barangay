import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { classifyIncident } from '@/lib/ai/classify'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { title, description } = await request.json()
    if (!description?.trim()) {
      return NextResponse.json({ error: 'Description is required' }, { status: 400 })
    }

    if (description.length > 2000) {
      return NextResponse.json({ error: 'Description too long (max 2000 chars)' }, { status: 400 })
    }

    // classifyIncident never throws - always returns a result (AI or keyword-based)
    const result = await classifyIncident(title?.trim() || '', description.trim())
    return NextResponse.json(result)

  } catch (error: any) {
    console.error('AI classify route error:', error)
    return NextResponse.json({ 
      error: 'Classification service unavailable. Please select category manually.' 
    }, { status: 500 })
  }
}
