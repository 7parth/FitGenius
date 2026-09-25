import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Crown, Medal, User } from 'lucide-react'
import { api } from '@/lib/api'
import { cn } from '@/lib/utils'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'

export default function LeaderboardPage() {
  const [limit, setLimit] = useState(50)

  const { data, isLoading } = useQuery({
    queryKey: ['leaderboard', limit],
    queryFn: () => api.get('/gamification/leaderboard', { params: { limit } }).then(r => r.data),
    refetchInterval: 60_000,
  })

  const entries: any[] = data?.entries ?? []
  const myRank: number = data?.current_user_rank ?? 0
  const total: number = data?.total_users ?? 0

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Leaderboard</h1>
        <p className="text-gray-400 text-sm mt-1">Weekly points · {total} participants</p>
      </div>

      {myRank > 0 && (
        <div className="card p-4 border-primary-500/30 bg-primary-500/5 flex items-center justify-between">
          <span className="text-sm text-gray-300">Your rank this week</span>
          <span className="text-2xl font-bold text-primary-400">#{myRank}</span>
        </div>
      )}

      {isLoading ? (
        <div className="flex justify-center py-10"><LoadingSpinner /></div>
      ) : (
        <div className="card overflow-hidden">
          <table className="w-full" aria-label="Weekly leaderboard">
            <thead>
              <tr className="border-b border-surface-700">
                <th className="text-left p-4 text-xs font-medium text-gray-500 uppercase tracking-wide w-12">#</th>
                <th className="text-left p-4 text-xs font-medium text-gray-500 uppercase tracking-wide">Player</th>
                <th className="text-right p-4 text-xs font-medium text-gray-500 uppercase tracking-wide">Points</th>
                <th className="text-right p-4 text-xs font-medium text-gray-500 uppercase tracking-wide hidden sm:table-cell">Streak</th>
                <th className="text-right p-4 text-xs font-medium text-gray-500 uppercase tracking-wide hidden sm:table-cell">Level</th>
              </tr>
            </thead>
            <tbody>
              {entries.map((entry: any) => (
                <tr
                  key={entry.rank}
                  className={cn(
                    'border-b border-surface-700/50 last:border-0 transition-colors',
                    entry.is_current_user ? 'bg-primary-500/10' : 'hover:bg-surface-700/30'
                  )}
                  aria-current={entry.is_current_user ? 'true' : undefined}
                >
                  <td className="p-4 font-bold">
                    {entry.rank === 1 ? (
                      <Crown className="w-5 h-5 text-yellow-400" aria-label="1st place" />
                    ) : entry.rank === 2 ? (
                      <Medal className="w-5 h-5 text-gray-300" aria-label="2nd place" />
                    ) : entry.rank === 3 ? (
                      <Medal className="w-5 h-5 text-amber-600" aria-label="3rd place" />
                    ) : (
                      <span className="text-sm text-gray-500">{entry.rank}</span>
                    )}
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <div className={cn(
                        'w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0',
                        entry.is_current_user ? 'bg-primary-500/20' : 'bg-surface-600'
                      )} aria-hidden="true">
                        <User className="w-4 h-4 text-gray-400" />
                      </div>
                      <span className={cn('font-medium text-sm', entry.is_current_user ? 'text-primary-300' : 'text-white')}>
                        {entry.display_name}
                        {entry.is_current_user && <span className="ml-2 text-xs text-primary-500">(you)</span>}
                      </span>
                    </div>
                  </td>
                  <td className="p-4 text-right font-bold text-white">{entry.total_points.toLocaleString()}</td>
                  <td className="p-4 text-right text-gray-400 text-sm hidden sm:table-cell">
                    {entry.current_streak_days > 0 ? `🔥 ${entry.current_streak_days}d` : '–'}
                  </td>
                  <td className="p-4 text-right text-gray-400 text-sm hidden sm:table-cell">Lv.{entry.level}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
