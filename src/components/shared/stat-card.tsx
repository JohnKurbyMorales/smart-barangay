import { Card, CardContent } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import type { LucideIcon } from 'lucide-react'

interface StatCardProps {
  title: string
  value: string | number
  icon: LucideIcon
  color?: string
  subtitle?: string
  className?: string
}

export function StatCard({ title, value, icon: Icon, color = '#2176FF', subtitle, className }: StatCardProps) {
  return (
    <Card className={cn('hover:shadow-md transition-shadow', className)}>
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{title}</p>
            <p className="text-2xl font-bold mt-1">{value}</p>
            {subtitle && <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>}
          </div>
          <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ backgroundColor: color + '20' }}>
            <Icon className="w-5 h-5" style={{ color }} />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
