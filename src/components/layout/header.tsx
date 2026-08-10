'use client'
import { Bell, Moon, Sun } from 'lucide-react'
import { useTheme } from 'next-themes'
import { Button } from '@/components/ui/button'
import { useNotifications } from '@/hooks/use-notifications'
import { useUser } from '@/hooks/use-user'
import Link from 'next/link'
import { Badge } from '@/components/ui/badge'

interface HeaderProps {
  title: string
}

export function Header({ title }: HeaderProps) {
  const { theme, setTheme } = useTheme()
  const { user } = useUser()
  const { unreadCount } = useNotifications(user?.id)

  return (
    <header className="h-14 border-b border-border bg-background/95 backdrop-blur flex items-center justify-between px-6 sticky top-0 z-30">
      <h1 className="font-semibold text-lg">{title}</h1>
      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
        >
          {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
        </Button>
        <Link href="/notifications">
          <Button variant="ghost" size="icon" className="relative">
            <Bell className="w-4 h-4" />
            {unreadCount > 0 && (
              <Badge className="absolute -top-1 -right-1 w-5 h-5 p-0 flex items-center justify-center text-xs bg-destructive">
                {unreadCount > 9 ? '9+' : unreadCount}
              </Badge>
            )}
          </Button>
        </Link>
      </div>
    </header>
  )
}
