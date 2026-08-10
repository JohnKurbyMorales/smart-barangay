import { Badge } from '@/components/ui/badge'
import { STATUS_COLORS, STATUS_LABELS, SEVERITY_COLORS, CATEGORY_COLORS } from '@/lib/constants'
import { cn } from '@/lib/utils'

export function StatusBadge({ status }: { status: string }) {
  const color = STATUS_COLORS[status] || '#6b7280'
  const label = STATUS_LABELS[status] || status
  return (
    <span
      className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium"
      style={{ backgroundColor: color + '20', color }}
    >
      {label}
    </span>
  )
}

export function SeverityBadge({ severity }: { severity: string }) {
  const color = SEVERITY_COLORS[severity] || '#6b7280'
  return (
    <span
      className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium capitalize"
      style={{ backgroundColor: color + '20', color }}
    >
      {severity}
    </span>
  )
}

export function CategoryBadge({ category }: { category: string }) {
  const color = CATEGORY_COLORS[category] || '#6b7280'
  return (
    <span
      className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium"
      style={{ backgroundColor: color + '20', color }}
    >
      {category}
    </span>
  )
}
