import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { Users, Dumbbell, Activity, Clock, TrendingUp, Shield } from 'lucide-react'
import { api } from '@/lib/api'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { cn } from '@/lib/utils'

export default function AdminDashboardPage() {
  const { data: stats, isLoading } = useQuery({
    queryKey: ['admin-stats'],
    queryFn: () => api.get('/admin/stats').then(r => r.data),
    refetchInterval: 60_000,
  })

  const cards = stats ? [
    { icon: Users, label: 'Total Users', value: stats.total_users, sub: `${stats.active_users_7d} active this week`, color: 'text-blue-400' },
    { icon: Activity, label: 'Total Sessions', value: stats.total_sessions, sub: `${stats.sessions_today} today`, color: 'text-emerald-400' },
    { icon: Dumbbell, label: 'Exercises', value: stats.total_exercises, sub: 'in library', color: 'text-purple-400' },
    { icon: Clock, label: 'Avg Session', value: `${Math.round(stats.avg_session_duration_minutes)}m`, sub: 'per workout', color: 'text-amber-400' },
  ] : []

  const quickLinks = [
    { to: '/admin/users', icon: Users, label: 'Manage Users', description: 'View, search, and update user roles' },
    { to: '/admin/exercises', icon: Dumbbell, label: 'Exercise Library', description: 'Add, edit, or deactivate exercises' },
    { to: '/admin/challenges', icon: TrendingUp, label: 'Challenges', description: 'Create and manage community challenges' },
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-primary-500/20 flex items-center justify-center">
          <Shield className="w-5 h-5 text-primary-400" aria-hidden="true" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-white">Admin Dashboard</h1>
          <p className="text-gray-400 text-sm">Platform overview and management</p>
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-10"><LoadingSpinner /></div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {cards.map(card => (
            <div key={card.label} className="card p-5">
              <card.icon className={cn('w-5 h-5 mb-3', card.color)} aria-hidden="true" />
              <p className="text-2xl font-bold text-white">{card.value}</p>
              <p className="text-sm font-medium text-gray-300 mt-0.5">{card.label}</p>
              <p className="text-xs text-gray-500 mt-1">{card.sub}</p>
            </div>
          ))}
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {quickLinks.map(link => (
          <Link
            key={link.to}
            to={link.to}
            className="card p-5 hover:border-primary-500/40 transition-all group focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:outline-none"
          >
            <link.icon className="w-6 h-6 text-primary-400 mb-3 group-hover:scale-110 transition-transform" aria-hidden="true" />
            <p className="font-semibold text-white group-hover:text-primary-200 transition-colors">{link.label}</p>
            <p className="text-xs text-gray-500 mt-1">{link.description}</p>
          </Link>
        ))}
      </div>
    </div>
  )
}
