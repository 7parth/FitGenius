import { useParams, useNavigate, Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { Trophy, Flame, Clock, Dumbbell, ChevronRight, RotateCcw } from 'lucide-react'
import { api } from '@/lib/api'
import { formatDuration } from '@/lib/utils'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'

export default function WorkoutSummaryPage() {
  const { sessionId } = useParams<{ sessionId: string }>()
  const navigate = useNavigate()

  const { data: session, isLoading } = useQuery({
    queryKey: ['session', sessionId],
    queryFn: () => api.get(`/workouts/sessions/${sessionId}`).then(r => r.data),
    enabled: !!sessionId,
  })

  if (isLoading || !session) return <div className="flex justify-center py-20"><LoadingSpinner size="lg" /></div>

  const exercises = session.exercises ?? []
  const totalSets = exercises.reduce((acc: number, se: any) => acc + (se.performances?.length ?? 0), 0)

  return (
    <div className="max-w-lg mx-auto space-y-6 py-4">
      {/* Hero */}
      <div className="card p-8 text-center">
        <div className="w-16 h-16 rounded-full bg-primary-500/20 flex items-center justify-center mx-auto mb-4">
          <Trophy className="w-8 h-8 text-primary-400" aria-hidden="true" />
        </div>
        <h1 className="text-2xl font-bold text-white mb-1">Workout Complete!</h1>
        <p className="text-gray-400">{session.name}</p>
        {session.points_earned > 0 && (
          <div className="mt-4 inline-flex items-center gap-1.5 bg-accent-500/20 text-accent-300 px-4 py-2 rounded-full text-sm font-medium" role="status" aria-live="polite">
            <Flame className="w-4 h-4" aria-hidden="true" /> +{session.points_earned} points earned
          </div>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4">
        <StatCard icon={Clock} label="Duration" value={formatDuration(session.duration_seconds ?? 0)} />
        <StatCard icon={Dumbbell} label="Total Volume" value={`${Math.round(session.total_volume_kg)} kg`} />
        <StatCard icon={Flame} label="Calories" value={`~${Math.round(session.total_calories)}`} />
        <StatCard icon={Trophy} label="Sets Completed" value={totalSets.toString()} />
      </div>

      {/* Exercise breakdown */}
      {exercises.length > 0 && (
        <div className="card p-5">
          <h2 className="font-semibold text-white mb-4">Exercise Breakdown</h2>
          <div className="space-y-3">
            {exercises.map((se: any) => {
              const sets = se.performances ?? []
              const maxWeight = sets.reduce((m: number, p: any) => Math.max(m, p.weight_kg ?? 0), 0)
              return (
                <div key={se.id} className="flex items-center justify-between py-2 border-b border-surface-700 last:border-0">
                  <div>
                    <p className="text-sm font-medium text-white">{se.exercise?.name}</p>
                    <p className="text-xs text-gray-500">{sets.length} sets completed</p>
                  </div>
                  {maxWeight > 0 && (
                    <span className="text-sm text-gray-400">{maxWeight} kg max</span>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex flex-col gap-3">
        <Link to="/workout/recommend" className="btn-primary flex items-center justify-center gap-2">
          <RotateCcw className="w-4 h-4" aria-hidden="true" /> Start New Workout
        </Link>
        <Link to="/progress" className="btn-ghost flex items-center justify-center gap-2">
          View Progress <ChevronRight className="w-4 h-4" aria-hidden="true" />
        </Link>
        <Link to="/dashboard" className="btn-ghost flex items-center justify-center gap-2">
          Back to Dashboard
        </Link>
      </div>
    </div>
  )
}

function StatCard({ icon: Icon, label, value }: { icon: React.ComponentType<{ className?: string }>; label: string; value: string }) {
  return (
    <div className="card p-4 text-center">
      <Icon className="w-5 h-5 text-primary-400 mx-auto mb-2" aria-hidden="true" />
      <p className="text-xl font-bold text-white">{value}</p>
      <p className="text-xs text-gray-500 mt-0.5">{label}</p>
    </div>
  )
}
