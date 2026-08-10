'use client'
import { useEffect, useState, useCallback, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Notification } from '@/types'

export function useNotifications(userId?: string) {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)

  const fetchNotifications = useCallback(async () => {
    if (!userId) return
    const supabase = createClient()
    const { data } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(20)
    if (data) {
      setNotifications(data)
      setUnreadCount(data.filter(n => !n.is_read).length)
    }
  }, [userId])

  useEffect(() => {
    fetchNotifications()
  }, [fetchNotifications])

  useEffect(() => {
    if (!userId) return

    const supabase = createClient()
    // Use a unique channel name per user + timestamp to avoid StrictMode conflicts
    const channelName = `notifs-${userId}-${Math.random().toString(36).slice(2)}`

    const channel = supabase.channel(channelName)

    // Register ALL listeners BEFORE calling subscribe()
    channel.on(
      'postgres_changes' as any,
      {
        event: 'INSERT',
        schema: 'public',
        table: 'notifications',
        filter: `user_id=eq.${userId}`,
      },
      (payload: any) => {
        setNotifications(prev => [payload.new as Notification, ...prev])
        setUnreadCount(prev => prev + 1)
      }
    )

    channel.on(
      'postgres_changes' as any,
      {
        event: 'UPDATE',
        schema: 'public',
        table: 'notifications',
        filter: `user_id=eq.${userId}`,
      },
      (payload: any) => {
        const updated = payload.new as Notification
        setNotifications(prev =>
          prev.map(n => n.id === updated.id ? { ...n, ...updated } : n)
        )
        if (!payload.old.is_read && updated.is_read) {
          setUnreadCount(prev => Math.max(0, prev - 1))
        }
      }
    )

    // Subscribe AFTER all listeners are registered
    channel.subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [userId])

  const markAsRead = async (id: string) => {
    const supabase = createClient()
    await supabase.from('notifications').update({ is_read: true }).eq('id', id)
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n))
    setUnreadCount(prev => Math.max(0, prev - 1))
  }

  const markAllAsRead = async () => {
    if (!userId) return
    const supabase = createClient()
    await supabase.from('notifications').update({ is_read: true }).eq('user_id', userId)
    setNotifications(prev => prev.map(n => ({ ...n, is_read: true })))
    setUnreadCount(0)
  }

  return { notifications, unreadCount, markAsRead, markAllAsRead, refetch: fetchNotifications }
}
