import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { Dumbbell, Brain, TrendingUp, Zap, Trophy, Watch, ChevronRight, Flame } from 'lucide-react'
import api from '@/lib/api'
import { useAuthStore } from '@/store/authStore'
import { PageLoader } from '@/components/ui/LoadingSpinner'
import type { ProgressSummary, GamificationSummary, FatigueAssessment } from '@/types'
import { formatMinutes } from '@/lib/utils'

export default function DashboardPage() {
  const user = useAuthStore((s) => s.user)

  const { data: progress, isLoading: loadingProgress } = useQuery({
    queryKey: ['progress-summary'],
    queryFn: () => api.get<ProgressSummary>('/progress/summary').then((r) => r.data),
  })

  const { data: gamification, isLoading: loadingGamification } = useQuery({
    queryKey: ['gamification-summary'],
    queryFn: () => api.get<GamificationSummary>('/gamification/summary').then((r) => r.data),
  })

  const { data: fatigue } = useQuery({
    queryKey: ['fatigue'],
    queryFn: () => api.get<FatigueAssessment>('/wearables/fatigue').then((r) => r.data),
  })

  const isLoading = loadingProgress || loadingGamification

  if (isLoading) return <PageLoader message="Loading your dashboard..." />

  const getGreeting = () => {
    const hour = new Date().getHours()
    if (hour < 12) return 'Good morning'
    if (hour < 17) return 'Good afternoon'
    return 'Good evening'
  }

  const fatigueBadgeColor = {
    NORMAL: 'badge-success',
    REDUCED: 'badge-warning',
    RECOVERY: 'badge-danger',
  }[fatigue?.level || 'NORMAL']

  return (
    <div className="page-container animate-fade-in">
      {/* Greeting */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white">
          {getGreeting()}, {user?.display_name?.split(' ')[0] || 'there'} 👋
        </h1>
        <p className="text-gray-400 mt-1">Here's your fitness overview for today</p>
      </div>

      {/* Fatigue banner */}
      {fatigue && fatigue.level !== 'NORMAL' && (
        <div className={`disclaimer-banner mb-6 ${fatigue.level === 'RECOVERY' ? 'border-red-500/30 bg-red-500/10 text-red-200' : ''}`}>
          <Zap className="h-5 w-5 flex-shrink-0" aria-hidden="true" />
          <div>
            <p className="font-medium">Recovery Day Recommended</p>
            <p className="text-sm opacity-80">{fatigue.recommendation}</p>
          </div>
        </div>
      )}

      {/* Stats row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard
          icon={Flame}
          iconColor="text-orange-400"
          label="Current Streak"
          value={`${gamification?.current_streak || 0} days`}
        />
        <StatCard
          icon={Trophy}
          iconColor="text-yellow-400"
          label="Total Points"
          value={(gamification?.total_points || 0).toLocaleString()}
        />
        <StatCard
          icon={Dumbbell}
          iconColor="text-blue-400"
          label="Total Workouts"
          value={progress?.total_workouts || 0}
        />
        <StatCard
          icon={TrendingUp}
          iconColor="text-emerald-400"
          label="Total Minutes"
          value={formatMinutes(progress?.total_minutes || 0)}
        />
      </div>

      {/* Main grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Today's workout CTA */}
        <div className="lg:col-span-2 card bg-gradient-to-br from-primary-900/50 to-surface-800 border-primary-500/30">
          <h2 className="section-title mb-2">Ready to train?</h2>
          <p className="text-gray-400 text-sm mb-6">
            {fatigue?.level === 'RECOVERY'
              ? "Your AI coach recommends a recovery workout today."
              : "Get a personalized workout plan tailored to your goals and fitness level."}
          </p>
          <div className="flex flex-wrap gap-3">
            <Link to="/workout/recommend" className="btn-primary btn-lg">
              <Dumbbell className="h-4 w-4" aria-hidden="true" />
              Get Today's Workout
            </Link>
            <Link to="/workout/pose" className="btn-secondary">
              <Brain className="h-4 w-4" aria-hidden="true" />
              Form Analysis
            </Link>
          </div>

          {fatigue?.level && (
            <div className="mt-4 flex items-center gap-2">
              <span className={`badge ${fatigueBadgeColor}`}>
                {fatigue.level === 'NORMAL' ? '✓ Good to go' : fatigue.level === 'REDUCED' ? '⚠ Take it easy' : '🔴 Rest day'}
              </span>
              <span className="text-xs text-gray-500">Based on your recent activity</span>
            </div>
          )}
        </div>

        {/* Quick links */}
        <div className="card space-y-2">
          <h2 className="section-title">Quick Access</h2>
          {[
            { to: '/coach', icon: Brain, label: 'Ask AI Coach', desc: 'Get personalized advice' },
            { to: '/progress', icon: TrendingUp, label: 'View Progress', desc: 'Charts & analytics' },
            { to: '/achievements', icon: Trophy, label: 'Achievements', desc: `${gamification?.badges_earned || 0} earned` },
            { to: '/wearables', icon: Watch, label: 'Wearables', desc: 'Health data' },
          ].map((item) => (
            <Link
              key={item.to}
              to={item.to}
              className="flex items-center gap-3 p-3 rounded-xl hover:bg-white/5 transition-colors group"
            >
              <div className="rounded-xl bg-surface-700 p-2 group-hover:bg-primary-500/20 transition-colors">
                <item.icon className="h-4 w-4 text-gray-400 group-hover:text-primary-300 transition-colors" aria-hidden="true" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-200">{item.label}</p>
                <p className="text-xs text-gray-500 truncate">{item.desc}</p>
              </div>
              <ChevronRight className="h-4 w-4 text-gray-600 group-hover:text-gray-400" aria-hidden="true" />
            </Link>
          ))}
        </div>

        {/* Goal progress */}
        {progress?.goal_progress && (
          <div className="card">
            <h2 className="section-title">Goal Progress</h2>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-400 capitalize">{progress.goal_progress.goal_type.replace('_', ' ')}</span>
                <span className="text-white font-medium">{Math.round(progress.goal_progress.percent)}%</span>
              </div>
              <div className="h-3 bg-gray-800 rounded-full overflow-hidden" role="progressbar"
                aria-valuenow={Math.round(progress.goal_progress.percent)} aria-valuemin={0} aria-valuemax={100}
                aria-label={`Goal progress: ${Math.round(progress.goal_progress.percent)}%`}>
                <div
                  className="h-full bg-gradient-to-r from-primary-500 to-primary-400 rounded-full transition-all duration-500"
                  style={{ width: `${Math.min(progress.goal_progress.percent, 100)}%` }}
                />
              </div>
              <p className="text-xs text-gray-500">{progress.goal_progress.current_value} / {progress.goal_progress.target_value} workouts</p>
            </div>
          </div>
        )}

        {/* Weekly summary */}
        <div className="card">
          <h2 className="section-title">This Week</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-3xl font-bold text-white">{progress?.this_week_workouts || 0}</p>
              <p className="text-xs text-gray-400 mt-1">Workouts</p>
            </div>
            <div>
              <p className="text-3xl font-bold text-white">{gamification?.gamification?.total_points || 0}</p>
              <p className="text-xs text-gray-400 mt-1">Points</p>
            </div>
          </div>
          {progress?.recent_trend && (
            <div className={`mt-4 flex items-center gap-2 text-sm ${
              progress.recent_trend.direction === 'improving' ? 'text-emerald-400' :
              progress.recent_trend.direction === 'declining' ? 'text-red-400' : 'text-gray-400'
            }`}>
              <TrendingUp className="h-4 w-4" aria-hidden="true" />
              <span className="capitalize">{progress.recent_trend.direction}: {progress.recent_trend.metric}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function StatCard({ icon: Icon, iconColor, label, value }: {
  icon: React.ElementType
  iconColor: string
  label: string
  value: string | number
}) {
  return (
    <div className="card-hover">
      <div className={`${iconColor} mb-3`}>
        <Icon className="h-5 w-5" aria-hidden="true" />
      </div>
      <p className="text-2xl font-bold text-white">{value}</p>
      <p className="text-xs text-gray-400 mt-1">{label}</p>
    </div>
  )
}
