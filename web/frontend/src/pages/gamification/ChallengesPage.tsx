import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Flag, Users, Clock, CheckCircle2, Zap } from 'lucide-react'
import { api, getErrorMessage } from '@/lib/api'
import { cn } from '@/lib/utils'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'

export default function ChallengesPage() {
  const qc = useQueryClient()

  const { data: challenges = [], isLoading } = useQuery({
    queryKey: ['challenges'],
    queryFn: () => api.get('/gamification/challenges').then(r => r.data),
  })

  const joinMutation = useMutation({
    mutationFn: (challengeId: string) =>
      api.post('/gamification/challenges/join', { challenge_id: challengeId }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['challenges'] }),
  })

  const typeColors: Record<string, string> = {
    daily: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
    weekly: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
    monthly: 'bg-purple-500/20 text-purple-300 border-purple-500/30',
    special: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
  }

  const daysLeft = (endsAt: string) => {
    const diff = new Date(endsAt).getTime() - Date.now()
    return Math.max(0, Math.ceil(diff / 86400000))
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Challenges</h1>
        <p className="text-gray-400 text-sm mt-1">Join community challenges to earn bonus points and badges</p>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-10"><LoadingSpinner /></div>
      ) : challenges.length === 0 ? (
        <div className="card p-12 text-center">
          <Flag className="w-12 h-12 text-gray-600 mx-auto mb-3" aria-hidden="true" />
          <h3 className="font-semibold text-white mb-1">No active challenges</h3>
          <p className="text-sm text-gray-400">Check back soon — new challenges are added regularly.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4" role="list">
          {challenges.map((ch: any) => {
            const left = daysLeft(ch.ends_at)
            const isUrgent = left <= 2
            return (
              <div key={ch.id} role="listitem" className="card p-5 flex flex-col gap-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap gap-2 mb-2">
                      <span className={cn('badge border text-xs', typeColors[ch.challenge_type] ?? 'bg-surface-600 text-gray-300')}>
                        {ch.challenge_type}
                      </span>
                      {isUrgent && (
                        <span className="badge bg-red-500/20 text-red-300 border-red-500/30 text-xs">
                          Ends soon
                        </span>
                      )}
                    </div>
                    <h3 className="font-semibold text-white">{ch.title}</h3>
                    <p className="text-sm text-gray-400 mt-1 leading-snug">{ch.description}</p>
                  </div>
                  <div className="text-center flex-shrink-0">
                    <div className="w-12 h-12 rounded-full bg-primary-500/20 flex items-center justify-center">
                      <Zap className="w-5 h-5 text-primary-400" aria-hidden="true" />
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs text-gray-500">
                  <span className="flex items-center gap-1">
                    <Users className="w-3 h-3" aria-hidden="true" />
                    {ch.participant_count} joined
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3" aria-hidden="true" />
                    {left > 0 ? `${left}d left` : 'Ended'}
                  </span>
                  <span className="text-primary-400 font-medium">+{ch.points_reward} pts</span>
                </div>

                <button
                  onClick={() => joinMutation.mutate(ch.id)}
                  disabled={joinMutation.isPending}
                  className="btn-primary w-full text-sm py-2 flex items-center justify-center gap-2"
                >
                  <CheckCircle2 className="w-4 h-4" aria-hidden="true" />
                  {joinMutation.isPending ? 'Joining…' : 'Join Challenge'}
                </button>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
