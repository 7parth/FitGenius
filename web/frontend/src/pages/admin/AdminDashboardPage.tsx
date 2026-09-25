import { useQuery, useMutation } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { Users, Dumbbell, Activity, Clock, TrendingUp, Shield, Brain, CheckCircle2, AlertCircle } from 'lucide-react'
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

  const trainMutation = useMutation({
    mutationFn: () => api.post('/admin/ml/train').then(r => r.data),
  })

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

      {/* ML Model Training */}
      <div className="card p-5 border-primary-500/20">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h2 className="font-semibold text-white flex items-center gap-2 mb-1">
              <Brain className="w-4 h-4 text-primary-400" aria-hidden="true" /> ML Recommendation Model
            </h2>
            <p className="text-sm text-gray-400">
              Retrain the TruncatedSVD model on current session data. Requires 20+ completed sessions.
              Once trained, users with 20+ sessions get Stage 3 ML recommendations.
            </p>
          </div>
          <button
            onClick={() => trainMutation.mutate()}
            disabled={trainMutation.isPending}
            className="btn-primary flex items-center gap-2 flex-shrink-0"
          >
            <Brain className="w-4 h-4" aria-hidden="true" />
            {trainMutation.isPending ? 'Training…' : 'Train Model'}
          </button>
        </div>
        {trainMutation.data && (
          <div className={`mt-4 flex items-start gap-2 text-sm p-3 rounded-xl ${trainMutation.data.success ? 'bg-emerald-500/10 text-emerald-300' : 'bg-amber-500/10 text-amber-300'}`} role="status">
            {trainMutation.data.success
              ? <CheckCircle2 className="w-4 h-4 flex-shrink-0 mt-0.5" aria-hidden="true" />
              : <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" aria-hidden="true" />
            }
            <p>{trainMutation.data.message}</p>
          </div>
        )}
      </div>

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
