'use client'
import { Moon, Sun } from 'lucide-react'
import { useTheme } from 'next-themes'
import { Button } from '@/components/ui/button'
import { useUser } from '@/hooks/use-user'
import { cn } from '@/lib/utils'

interface AdminHeaderProps {
  title: string
}

export function AdminHeader({ title }: AdminHeaderProps) {
  const { theme, setTheme } = useTheme()
  const { user } = useUser()

  return (
    <header className="h-14 border-b border-border bg-background/95 backdrop-blur flex items-center justify-between px-6 sticky top-0 z-30">
      <div>
        <h1 className="font-semibold text-lg">{title}</h1>
      </div>
      <div className="flex items-center gap-3">
        <span className="text-xs text-muted-foreground hidden sm:block">
          Logged in as <span className="font-medium text-foreground">{user?.full_name}</span>
        </span>
        <span className={cn(
          'text-xs px-2 py-0.5 rounded-full font-medium capitalize',
          user?.role === 'admin'
            ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
            : 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
        )}>
          {user?.role}
        </span>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
        >
          {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
        </Button>
      </div>
    </header>
  )
}
