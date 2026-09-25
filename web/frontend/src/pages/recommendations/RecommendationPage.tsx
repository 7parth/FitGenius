import { useNavigate } from 'react-router-dom'
import { useQuery, useMutation } from '@tanstack/react-query'
import { Sparkles, Play, ThumbsUp, ThumbsDown, RefreshCw, Clock, Dumbbell } from 'lucide-react'
import { api, getErrorMessage } from '@/lib/api'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { cn, difficultyColor } from '@/lib/utils'

export default function RecommendationPage() {
  const navigate = useNavigate()

  const { data: recommendation, isLoading, refetch, isFetching } = useQuery({
    queryKey: ['recommendation'],
    queryFn: () => api.post('/recommendations/generate', {}).then(r => r.data),
    staleTime: 0,
  })

  const feedbackMutation = useMutation({
    mutationFn: ({ is_accepted, rating }: { is_accepted: boolean; rating?: string }) =>
      api.post('/recommendations/feedback', {
        recommendation_id: recommendation?.id,
        is_accepted,
        rating,
      }),
  })

  const startMutation = useMutation({
    mutationFn: () => api.post('/workouts/sessions/start', {
      name: `AI Workout — ${new Date().toLocaleDateString()}`,
    }).then(r => r.data),
    onSuccess: (session) => {
      feedbackMutation.mutate({ is_accepted: true, rating: 'just_right' })
      navigate(`/workout/session/${session.id}`)
    },
  })

  const exercises: any[] = recommendation?.payload?.exercises ?? []

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-primary-400" aria-hidden="true" /> Today's Workout
          </h1>
          <p className="text-gray-400 text-sm mt-1">Personalised to your fitness level and goals</p>
        </div>
        <button
          onClick={() => refetch()}
          disabled={isFetching}
          className="btn-ghost flex items-center gap-2 text-sm"
          aria-label="Generate new recommendation"
        >
          <RefreshCw className={cn('w-4 h-4', isFetching && 'animate-spin')} aria-hidden="true" />
          Regenerate
        </button>
      </div>

      {isLoading || isFetching ? (
        <div className="card p-12 flex flex-col items-center gap-4">
          <LoadingSpinner size="lg" />
          <p className="text-gray-400 text-sm">Generating your personalised workout…</p>
        </div>
      ) : recommendation ? (
        <>
          {/* Rationale */}
          {recommendation.payload?.rationale && (
            <div className="card p-4 border-primary-500/20 bg-primary-500/5">
              <p className="text-sm text-gray-300">{recommendation.payload.rationale}</p>
              <div className="flex items-center gap-3 mt-2">
                <span className="text-xs text-gray-500">Stage: {recommendation.stage?.replace('_', ' ')}</span>
                {recommendation.payload?.adjustments?.fatigue_level && (
                  <span className={cn('text-xs px-2 py-0.5 rounded-full',
                    recommendation.payload.adjustments.fatigue_level === 'RECOVERY' ? 'bg-red-500/20 text-red-300' :
                    recommendation.payload.adjustments.fatigue_level === 'REDUCED' ? 'bg-amber-500/20 text-amber-300' :
                    'bg-emerald-500/20 text-emerald-300'
                  )}>
                    {recommendation.payload.adjustments.fatigue_level} recovery
                  </span>
                )}
              </div>
            </div>
          )}

          {/* Exercise list */}
          <div className="space-y-3" role="list" aria-label="Recommended exercises">
            {exercises.map((ex: any, i: number) => (
              <div key={ex.exercise_id} className="card p-4 flex items-center gap-4" role="listitem">
                <div className="w-8 h-8 rounded-full bg-surface-600 flex items-center justify-center text-sm font-bold text-gray-400 flex-shrink-0" aria-hidden="true">
                  {i + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-white">{ex.name}</p>
                  <div className="flex flex-wrap items-center gap-2 mt-1">
                    <span className={cn('badge text-xs', difficultyColor(ex.difficulty))}>{ex.difficulty}</span>
                    <span className="text-xs text-gray-500">
                      {ex.sets} sets × {ex.reps ? `${ex.reps} reps` : `${ex.duration_seconds}s`}
                    </span>
                    <span className="text-xs text-gray-600">· {ex.rest_seconds}s rest</span>
                  </div>
                </div>
                {ex.supports_pose_analysis && (
                  <span className="badge bg-accent-500/20 text-accent-300 text-xs flex-shrink-0">Pose AI</span>
                )}
              </div>
            ))}
          </div>

          {/* Duration estimate */}
          {recommendation.payload?.estimated_duration_minutes && (
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <Clock className="w-4 h-4" aria-hidden="true" />
              Estimated duration: ~{recommendation.payload.estimated_duration_minutes} minutes
            </div>
          )}

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={() => startMutation.mutate()}
              disabled={startMutation.isPending || exercises.length === 0}
              className="btn-primary flex items-center justify-center gap-2 flex-1"
            >
              <Play className="w-4 h-4" aria-hidden="true" />
              {startMutation.isPending ? 'Starting…' : 'Start Workout'}
            </button>
            <button
              onClick={() => { feedbackMutation.mutate({ is_accepted: false, rating: 'not_relevant' }); refetch() }}
              className="btn-ghost flex items-center justify-center gap-2"
              aria-label="This doesn't look right, regenerate"
            >
              <ThumbsDown className="w-4 h-4" aria-hidden="true" /> Not for me
            </button>
          </div>
        </>
      ) : (
        <div className="card p-12 text-center">
          <Dumbbell className="w-10 h-10 text-gray-600 mx-auto mb-3" aria-hidden="true" />
          <p className="text-gray-400">Couldn't generate a recommendation. Try again.</p>
          <button onClick={() => refetch()} className="btn-primary mt-4">Try Again</button>
        </div>
      )}
    </div>
  )
}
