import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getChatResponse } from '@/lib/ai/chat'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { message, history } = await request.json()
    if (!message?.trim()) return NextResponse.json({ error: 'Message required' }, { status: 400 })

    // getChatResponse never throws - uses fallback if OpenAI unavailable
    const response = await getChatResponse(message.trim(), history || [])

    // Save to chat history (non-blocking, ignore errors)
    void supabase.from('chat_history').insert([
      { user_id: user.id, role: 'user', content: message },
      { user_id: user.id, role: 'assistant', content: response },
    ])

    return NextResponse.json({ response })
  } catch (error) {
    console.error('AI chat error:', error)
    return NextResponse.json({ 
      response: 'I\'m having trouble right now. Please try again or contact the barangay office directly.' 
    })
  }
}
