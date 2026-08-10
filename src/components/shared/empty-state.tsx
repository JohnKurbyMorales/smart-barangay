import { FileText } from 'lucide-react'

interface EmptyStateProps {
  title?: string
  description?: string
  icon?: React.ReactNode
}

export function EmptyState({
  title = 'No data found',
  description = 'There is nothing to show here yet.',
  icon
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
        {icon || <FileText className="w-8 h-8 text-muted-foreground" />}
      </div>
      <h3 className="font-semibold text-foreground mb-1">{title}</h3>
      <p className="text-sm text-muted-foreground max-w-sm">{description}</p>
    </div>
  )
}
