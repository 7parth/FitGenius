import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDuration(seconds: number): string {
  if (seconds < 60) return `${seconds}s`
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  if (secs === 0) return `${mins}m`
  return `${mins}m ${secs}s`
}

export function formatMinutes(minutes: number): string {
  if (minutes < 60) return `${minutes} min`
  const hours = Math.floor(minutes / 60)
  const mins = minutes % 60
  if (mins === 0) return `${hours}h`
  return `${hours}h ${mins}m`
}

export function formatDate(dateStr: string): string {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  }).format(new Date(dateStr))
}

export function formatRelativeTime(dateStr: string): string {
  const now = new Date()
  const date = new Date(dateStr)
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMins / 60)
  const diffDays = Math.floor(diffHours / 24)

  if (diffMins < 1) return 'just now'
  if (diffMins < 60) return `${diffMins}m ago`
  if (diffHours < 24) return `${diffHours}h ago`
  if (diffDays < 7) return `${diffDays}d ago`
  return formatDate(dateStr)
}

export function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1).replace(/_/g, ' ')
}

export function difficultyColor(difficulty: string): string {
  switch (difficulty) {
    case 'beginner': return 'text-emerald-400'
    case 'intermediate': return 'text-amber-400'
    case 'advanced': return 'text-red-400'
    default: return 'text-gray-400'
  }
}

export function difficultyBadgeClass(difficulty: string): string {
  switch (difficulty) {
    case 'beginner': return 'badge-success'
    case 'intermediate': return 'badge-warning'
    case 'advanced': return 'badge-danger'
    default: return 'badge-neutral'
  }
}

export function categoryColor(category: string): string {
  const colors: Record<string, string> = {
    strength: 'text-blue-400',
    cardio: 'text-orange-400',
    flexibility: 'text-purple-400',
    balance: 'text-cyan-400',
    rehabilitation: 'text-green-400',
  }
  return colors[category] || 'text-gray-400'
}

export function badgeTierColor(tier: string): string {
  switch (tier) {
    case 'bronze': return 'text-amber-600 bg-amber-600/20 border-amber-600/40'
    case 'silver': return 'text-gray-300 bg-gray-500/20 border-gray-500/40'
    case 'gold': return 'text-yellow-400 bg-yellow-400/20 border-yellow-400/40'
    case 'platinum': return 'text-cyan-300 bg-cyan-400/20 border-cyan-400/40'
    default: return 'text-gray-400 bg-gray-700 border-gray-600'
  }
}

export function pluralize(count: number, singular: string, plural?: string): string {
  return count === 1 ? `${count} ${singular}` : `${count} ${plural || singular + 's'}`
}
