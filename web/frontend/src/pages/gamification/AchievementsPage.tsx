import { useQuery } from '@tanstack/react-query'
import { Trophy, Lock } from 'lucide-react'
import { api } from '@/lib/api'
import { cn, badgeTierColor, capitalize } from '@/lib/utils'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'

export default function AchievementsPage() {
  const { data: earned = [], isLoading: earnedLoading } = useQuery({
    queryKey: ['my-achievements'],
    queryFn: () => api.get('/gamification/achievements').then(r => r.data),
  })

  const { data: summary } = useQuery({
    queryKey: ['gamification-summary'],
    queryFn: () => api.get('/gamification/summary').then(r => r.data),
  })

  const earnedIds = new Set(earned.map((ua: any) => ua.achievement?.id))

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Achievements</h1>
          <p className="text-gray-400 text-sm mt-1">
            {earned.length} earned · {summary?.total_points ?? 0} total points
          </p>
        </div>
        <div className="card px-4 py-2 text-center">
          <p className="text-2xl font-bold text-primary-400">Lv.{summary?.level ?? 1}</p>
          <p className="text-xs text-gray-500">Current level</p>
        </div>
      </div>

      {/* Streak banner */}
      {summary?.current_streak_days > 0 && (
        <div className="card p-4 border-amber-500/30 bg-amber-500/5 flex items-center gap-4">
          <div className="text-3xl" aria-hidden="true">🔥</div>
          <div>
            <p className="font-semibold text-white">{summary.current_streak_days}-day streak!</p>
            <p className="text-xs text-gray-400">
              Longest ever: {summary.longest_streak_days} days · Keep it up!
            </p>
          </div>
        </div>
      )}

      {earnedLoading ? (
        <div className="flex justify-center py-10"><LoadingSpinner /></div>
      ) : earned.length === 0 ? (
        <div className="card p-12 text-center">
          <Trophy className="w-12 h-12 text-gray-600 mx-auto mb-3" aria-hidden="true" />
          <h3 className="font-semibold text-white mb-1">No achievements yet</h3>
          <p className="text-sm text-gray-400">Complete workouts to start earning badges!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4" role="list">
          {earned.map((ua: any) => {
            const ach = ua.achievement
            if (!ach) return null
            return (
              <div
                key={ach.id}
                role="listitem"
                className={cn(
                  'card p-5 border transition-all',
                  badgeTierColor(ach.tier).includes('amber') ? 'border-amber-600/30' :
                  badgeTierColor(ach.tier).includes('gray') ? 'border-gray-500/30' :
                  badgeTierColor(ach.tier).includes('yellow') ? 'border-yellow-400/30' :
                  'border-cyan-400/30'
                )}
              >
                <div className="flex items-start gap-4">
                  <div className={cn('w-12 h-12 rounded-full flex items-center justify-center text-xl flex-shrink-0 border', badgeTierColor(ach.tier))} aria-hidden="true">
                    🏆
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <h3 className="font-semibold text-white truncate">{ach.name}</h3>
                      <span className={cn('badge text-xs border flex-shrink-0', badgeTierColor(ach.tier))}>
                        {ach.tier}
                      </span>
                    </div>
                    <p className="text-sm text-gray-400 mt-1 leading-snug">{ach.description}</p>
                    <div className="flex items-center justify-between mt-3">
                      <span className="text-xs text-primary-400 font-medium">+{ach.points_value} pts</span>
                      <span className="text-xs text-gray-600">
                        {new Date(ua.earned_at).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
