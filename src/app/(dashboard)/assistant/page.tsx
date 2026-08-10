'use client'
import { useState, useRef, useEffect } from 'react'
import { Header } from '@/components/layout/header'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Bot, Send, Loader2, User } from 'lucide-react'
import { cn } from '@/lib/utils'

interface Message { role: 'user' | 'assistant'; content: string }

const QUICK_PROMPTS = [
  'How do I file a complaint?',
  'What are the barangay office hours?',
  'What documents do I need for a clearance?',
  'What are the emergency contacts?',
]

export default function AssistantPage() {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const endRef = useRef<HTMLDivElement>(null)

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages])

  const sendMessage = async (text?: string) => {
    const content = text || input.trim()
    if (!content || loading) return
    setInput('')
    const newMessages: Message[] = [...messages, { role: 'user', content }]
    setMessages(newMessages)
    setLoading(true)

    try {
      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: content, history: messages }),
      })
      if (!res.ok) throw new Error()
      const data = await res.json()
      setMessages([...newMessages, { role: 'assistant', content: data.response }])
    } catch {
      setMessages([...newMessages, { role: 'assistant', content: 'Sorry, I encountered an error. Please try again.' }])
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header title="AI Assistant" />
      <div className="flex-1 p-6">
        <div className="max-w-3xl mx-auto flex flex-col h-full">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
              <Bot className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <h1 className="text-xl font-bold">AI Assistant</h1>
              <p className="text-sm text-muted-foreground">Ask about barangay services, requirements, and more</p>
            </div>
          </div>

          <Card className="flex-1 flex flex-col">
            <CardContent className="flex-1 flex flex-col p-4">
              {/* Messages */}
              <div className="flex-1 overflow-y-auto space-y-4 mb-4 min-h-64">
                {messages.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full py-12 text-center">
                    <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
                      <Bot className="w-8 h-8 text-muted-foreground" />
                    </div>
                    <p className="text-muted-foreground mb-6">Hello! How can I help you today?</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 w-full max-w-md">
                      {QUICK_PROMPTS.map(q => (
                        <button
                          key={q}
                          onClick={() => sendMessage(q)}
                          className="text-sm px-4 py-2 rounded-lg border border-border hover:bg-muted transition-colors text-left"
                        >
                          {q}
                        </button>
                      ))}
                    </div>
                  </div>
                ) : (
                  messages.map((msg, i) => (
                    <div key={i} className={cn('flex gap-3', msg.role === 'user' ? 'justify-end' : 'justify-start')}>
                      {msg.role === 'assistant' && (
                        <div className="w-7 h-7 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center flex-shrink-0 mt-1">
                          <Bot className="w-4 h-4 text-purple-600" />
                        </div>
                      )}
                      <div className={cn(
                        'max-w-[80%] rounded-2xl px-4 py-2.5 text-sm',
                        msg.role === 'user'
                          ? 'bg-primary text-primary-foreground rounded-tr-sm'
                          : 'bg-muted rounded-tl-sm'
                      )}>
                        {msg.content}
                      </div>
                      {msg.role === 'user' && (
                        <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-1">
                          <User className="w-4 h-4 text-primary" />
                        </div>
                      )}
                    </div>
                  ))
                )}
                {loading && (
                  <div className="flex gap-3">
                    <div className="w-7 h-7 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center flex-shrink-0">
                      <Bot className="w-4 h-4 text-purple-600" />
                    </div>
                    <div className="bg-muted rounded-2xl rounded-tl-sm px-4 py-3">
                      <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
                    </div>
                  </div>
                )}
                <div ref={endRef} />
              </div>

              {/* Input */}
              <div className="flex gap-2 border-t border-border pt-4">
                <Input
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && !e.shiftKey && sendMessage()}
                  placeholder="Type your message..."
                  disabled={loading}
                  className="flex-1"
                />
                <Button onClick={() => sendMessage()} disabled={loading || !input.trim()} size="icon">
                  <Send className="w-4 h-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
