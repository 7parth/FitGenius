import { useParams, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { ArrowLeft, CheckCircle, Info, Dumbbell, Zap } from 'lucide-react'
import { api } from '@/lib/api'
import { cn, difficultyColor } from '@/lib/utils'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { EmptyState } from '@/components/ui/EmptyState'

export default function ExerciseDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()

  const { data: exercise, isLoading, isError } = useQuery({
    queryKey: ['exercise', id],
    queryFn: () => api.get(`/exercises/${id}`).then(r => r.data),
    enabled: !!id,
  })

  const { data: alternatives } = useQuery({
    queryKey: ['exercise-alternatives', id],
    queryFn: () => api.get(`/exercises/${id}/alternatives`).then(r => r.data),
    enabled: !!id,
  })

  if (isLoading) return <div className="flex justify-center py-20"><LoadingSpinner size="lg" /></div>
  if (isError || !exercise) return (
    <EmptyState icon={Dumbbell} title="Exercise not found" description="This exercise may have been removed"
      action={<button onClick={() => navigate('/exercises')} className="btn-primary mt-4">Back to exercises</button>}
    />
  )

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Back */}
      <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors text-sm">
        <ArrowLeft className="w-4 h-4" aria-hidden="true" /> Back
      </button>

      {/* Header */}
      <div className="card p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-white">{exercise.name}</h1>
            <p className="text-gray-400 mt-2 leading-relaxed">{exercise.description}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <span className={cn('badge text-sm', difficultyColor(exercise.difficulty))}>
              {exercise.difficulty}
            </span>
            <span className="badge bg-surface-600 text-gray-300 text-sm">{exercise.category}</span>
            {exercise.supports_pose_analysis && (
              <span className="badge bg-accent-500/20 text-accent-300 text-sm">
                <Zap className="w-3 h-3 mr-1 inline" aria-hidden="true" />Pose AI
              </span>
            )}
          </div>
        </div>

        {/* Quick stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6 pt-6 border-t border-surface-700">
          <Stat label="Sets" value={exercise.default_sets ?? '–'} />
          <Stat label="Reps" value={exercise.default_reps ?? (exercise.default_duration_seconds ? `${exercise.default_duration_seconds}s` : '–')} />
          <Stat label="Rest" value={`${exercise.rest_seconds}s`} />
          <Stat label="Calories/min" value={exercise.calories_per_minute ? `~${exercise.calories_per_minute}` : '–'} />
        </div>
      </div>

      {/* Muscles */}
      {(exercise.primary_muscles?.length > 0 || exercise.secondary_muscles?.length > 0) && (
        <div className="card p-6">
          <h2 className="font-semibold text-white mb-4">Muscles Worked</h2>
          <div className="space-y-3">
            {exercise.primary_muscles?.length > 0 && (
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wide mb-2">Primary</p>
                <div className="flex flex-wrap gap-2">
                  {exercise.primary_muscles.map((m: string) => (
                    <span key={m} className="badge bg-primary-500/20 text-primary-300">{m}</span>
                  ))}
                </div>
              </div>
            )}
            {exercise.secondary_muscles?.length > 0 && (
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wide mb-2">Secondary</p>
                <div className="flex flex-wrap gap-2">
                  {exercise.secondary_muscles.map((m: string) => (
                    <span key={m} className="badge bg-surface-600 text-gray-300">{m}</span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Instructions */}
      {exercise.instructions?.length > 0 && (
        <div className="card p-6">
          <h2 className="font-semibold text-white mb-4">How to Perform</h2>
          <ol className="space-y-3" aria-label="Exercise instructions">
            {exercise.instructions.map((step: string, i: number) => (
              <li key={i} className="flex gap-3">
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary-500/20 text-primary-400 text-xs flex items-center justify-center font-semibold" aria-hidden="true">
                  {i + 1}
                </span>
                <p className="text-gray-300 text-sm leading-relaxed">{step}</p>
              </li>
            ))}
          </ol>
        </div>
      )}

      {/* Tips */}
      {exercise.tips?.length > 0 && (
        <div className="card p-6 border-amber-500/20 bg-amber-500/5">
          <h2 className="font-semibold text-white mb-3 flex items-center gap-2">
            <Info className="w-4 h-4 text-amber-400" aria-hidden="true" /> Coaching Tips
          </h2>
          <ul className="space-y-2">
            {exercise.tips.map((tip: string, i: number) => (
              <li key={i} className="flex gap-2 text-sm text-gray-300">
                <CheckCircle className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" aria-hidden="true" />
                {tip}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Equipment */}
      {exercise.equipment_required?.length > 0 && (
        <div className="card p-6">
          <h2 className="font-semibold text-white mb-3">Equipment Needed</h2>
          <div className="flex flex-wrap gap-2">
            {exercise.equipment_required.map((e: string) => (
              <span key={e} className="badge bg-surface-600 text-gray-300">
                <Dumbbell className="w-3 h-3 mr-1 inline" aria-hidden="true" />{e.replace('_', ' ')}
              </span>
            ))}
          </div>
          {exercise.is_bodyweight && (
            <p className="text-sm text-emerald-400 mt-2">✓ Can be done without equipment</p>
          )}
        </div>
      )}

      {/* Contraindications */}
      {exercise.contraindications?.length > 0 && (
        <div className="card p-4 border-red-500/20 bg-red-500/5">
          <p className="text-sm text-red-400 font-medium mb-1">Caution</p>
          <p className="text-xs text-gray-400">
            Avoid if you have: {exercise.contraindications.map((c: string) => c.replace('_', ' ')).join(', ')}.
            Always consult a healthcare professional before starting a new exercise programme.
          </p>
        </div>
      )}

      {/* Alternatives */}
      {alternatives && alternatives.length > 0 && (
        <div className="card p-6">
          <h2 className="font-semibold text-white mb-4">Alternative Exercises</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {alternatives.map((alt: any) => (
              <button
                key={alt.id}
                onClick={() => navigate(`/exercises/${alt.id}`)}
                className="flex items-center justify-between p-3 rounded-xl bg-surface-700 hover:bg-surface-600 transition-colors text-left group"
              >
                <div>
                  <p className="text-sm font-medium text-white group-hover:text-primary-300 transition-colors">{alt.name}</p>
                  <p className="text-xs text-gray-500">{alt.difficulty}</p>
                </div>
                <ArrowLeft className="w-4 h-4 text-gray-500 rotate-180 group-hover:text-primary-400 transition-colors" aria-hidden="true" />
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="text-center">
      <p className="text-xl font-bold text-white">{value}</p>
      <p className="text-xs text-gray-500 mt-0.5">{label}</p>
    </div>
  )
}
