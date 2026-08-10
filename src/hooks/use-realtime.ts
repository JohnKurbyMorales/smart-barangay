'use client'
import { useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'

export function useRealtime(
  table: string,
  callback: (payload: any) => void,
  filter?: string
) {
  const callbackRef = useRef(callback)
  
  // Keep the callback ref up to date without triggering re-subscription
  useEffect(() => {
    callbackRef.current = callback
  }, [callback])

  useEffect(() => {
    const supabase = createClient()
    const channelName = `${table}-changes-${filter ?? 'all'}`
    
    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table, ...(filter ? { filter } : {}) },
        (payload) => callbackRef.current(payload)
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  // Only re-subscribe when table or filter changes, not callback
  }, [table, filter])
}
