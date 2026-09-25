import { cn } from '@/lib/utils'
import type { LucideIcon } from 'lucide-react'

interface EmptyStateProps {
  icon?: LucideIcon
  title: string
  description?: string
  action?: React.ReactNode
  className?: string
}

export function EmptyState({ icon: Icon, title, description, action, className }: EmptyStateProps) {
  return (
    <div className={cn('flex flex-col items-center justify-center text-center py-16 px-4', className)}>
      {Icon && (
        <div className="mb-4 rounded-2xl bg-gray-800 p-5" aria-hidden="true">
          <Icon className="h-10 w-10 text-gray-500" />
        </div>
      )}
      <h3 className="text-base font-semibold text-gray-200 mb-2">{title}</h3>
      {description && <p className="text-sm text-gray-400 max-w-sm mb-6">{description}</p>}
      {action}
    </div>
  )
}
