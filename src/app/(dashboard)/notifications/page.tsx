'use client'
import { useUser } from '@/hooks/use-user'
import { useNotifications } from '@/hooks/use-notifications'
import { Header } from '@/components/layout/header'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Bell, Check, CheckCheck } from 'lucide-react'
import { formatRelative } from '@/lib/utils'
import { cn } from '@/lib/utils'
import Link from 'next/link'

const TYPE_COLORS = { info: '#3b82f6', success: '#22c55e', warning: '#f59e0b', error: '#ef4444' }

export default function NotificationsPage() {
  const { user } = useUser()
  const { notifications, markAsRead, markAllAsRead } = useNotifications(user?.id)

  return (
    <div className="min-h-screen">
      <Header title="Notifications" />
      <div className="p-6">
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <Bell className="w-5 h-5 text-primary" />
              </div>
              <h1 className="text-xl font-bold">Notifications</h1>
            </div>
            <Button variant="ghost" size="sm" onClick={markAllAsRead}>
              <CheckCheck className="w-4 h-4 mr-2" /> Mark all read
            </Button>
          </div>

          {notifications.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground">No notifications yet</div>
          ) : (
            <div className="space-y-2">
              {notifications.map(n => (
                <Card
                  key={n.id}
                  className={cn('cursor-pointer hover:shadow-sm transition-shadow', !n.is_read && 'border-primary/30 bg-primary/5')}
                  onClick={() => markAsRead(n.id)}
                >
                  <CardContent className="p-4 flex items-start gap-3">
                    <div className="w-2 h-2 rounded-full mt-2 flex-shrink-0" style={{ backgroundColor: TYPE_COLORS[n.type] || '#6b7280' }} />
                    <div className="flex-1 min-w-0">
                      <p className={cn('text-sm', !n.is_read && 'font-medium')}>{n.title}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{n.message}</p>
                      <p className="text-xs text-muted-foreground mt-1">{formatRelative(n.created_at)}</p>
                    </div>
                    {!n.is_read && <Check className="w-4 h-4 text-muted-foreground flex-shrink-0 mt-1" />}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
