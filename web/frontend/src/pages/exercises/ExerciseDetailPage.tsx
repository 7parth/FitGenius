import { useParams, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { EmptyState } from '@/components/ui/EmptyState'

import { Dumbbell } from 'lucide-react'

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
    <div className="p-8">
      <EmptyState
        icon={Dumbbell}
        title="Movement not found"
        description="This movement may have been archived or removed from the neural atlas."
        action={<button onClick={() => navigate('/exercises')} className="px-4 py-2 rounded-xl bg-primary-container text-on-primary-container font-bold text-sm mt-4">Back to movement atlas</button>}
      />
    </div>
  )

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-16 text-on-surface">
      {/* Back button */}
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-2 text-on-surface-variant hover:text-primary transition-colors text-sm font-label-md"
      >
        <span className="material-symbols-outlined text-base">arrow_back</span>
        <span>Back to Movement Atlas</span>
      </button>

      {/* Hero Header Card */}
      <div className="p-6 md:p-8 rounded-3xl bg-surface-container-low border border-outline-variant/30 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-primary-container/10 rounded-full blur-3xl pointer-events-none"></div>

        <div className="relative z-10 flex flex-col md:flex-row md:items-start justify-between gap-6">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-secondary-container/20 text-secondary border border-secondary/30 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-secondary"></span>
                33-Keypoint Track Ready
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-mono bg-surface-container-high text-primary border border-primary-container/20 uppercase">
                {exercise.category}
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-mono bg-surface-container-high text-on-surface-variant border border-outline-variant/20 uppercase">
                {exercise.difficulty}
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold text-on-surface tracking-tight mt-1">
              {exercise.name}
            </h1>
            <p className="text-on-surface-variant text-sm leading-relaxed max-w-2xl">
              {exercise.description}
            </p>
          </div>

          <button
            onClick={() => navigate('/workout/pose')}
            className="shrink-0 px-5 py-3 rounded-xl bg-gradient-to-r from-primary-container to-secondary text-on-primary-container font-bold text-sm shadow-[0_0_20px_rgba(0,240,255,0.3)] hover:brightness-110 active:scale-95 transition-all flex items-center gap-2"
          >
            <span className="material-symbols-outlined text-lg">videocam</span>
            <span>Track Form Live (Pose AI)</span>
          </button>
        </div>

        {/* Quick specs grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6 pt-6 border-t border-surface-container-highest font-mono text-center">
          <div className="p-3 rounded-xl bg-surface-container border border-outline-variant/20">
            <span className="text-[10px] text-on-surface-variant uppercase block">Target Sets</span>
            <span className="text-lg font-bold text-on-surface">{exercise.default_sets ?? 4}</span>
          </div>
          <div className="p-3 rounded-xl bg-surface-container border border-outline-variant/20">
            <span className="text-[10px] text-on-surface-variant uppercase block">Prescribed Reps</span>
            <span className="text-lg font-bold text-primary-container">{exercise.default_reps ?? (exercise.default_duration_seconds ? `${exercise.default_duration_seconds}s` : '8-10')}</span>
          </div>
          <div className="p-3 rounded-xl bg-surface-container border border-outline-variant/20">
            <span className="text-[10px] text-on-surface-variant uppercase block">Intra-Set Rest</span>
            <span className="text-lg font-bold text-secondary">{exercise.rest_seconds ?? 90}s</span>
          </div>
          <div className="p-3 rounded-xl bg-surface-container border border-outline-variant/20">
            <span className="text-[10px] text-on-surface-variant uppercase block">Metabolic Burn</span>
            <span className="text-lg font-bold text-tertiary-container">{exercise.calories_per_minute ? `~${exercise.calories_per_minute} kcal/m` : '~8 kcal/m'}</span>
          </div>
        </div>
      </div>

      {/* Muscles Worked */}
      {(exercise.primary_muscles?.length > 0 || exercise.secondary_muscles?.length > 0) && (
        <div className="p-6 rounded-2xl bg-surface-container-low border border-outline-variant/30 shadow-xl space-y-4">
          <h2 className="font-headline-sm text-headline-sm text-on-surface flex items-center gap-2">
            <span className="material-symbols-outlined text-primary text-xl">accessibility_new</span>
            Electromyographic Recruitment Vectors
          </h2>
          <div className="space-y-4">
            {exercise.primary_muscles?.length > 0 && (
              <div>
                <p className="text-xs font-mono text-secondary uppercase tracking-wider mb-2 font-bold">Primary Agonist Drivers</p>
                <div className="flex flex-wrap gap-2">
                  {exercise.primary_muscles.map((m: string) => (
                    <span key={m} className="px-3 py-1 rounded-full text-xs font-semibold bg-primary-container/15 text-primary-container border border-primary-container/30">
                      {m}
                    </span>
                  ))}
                </div>
              </div>
            )}
            {exercise.secondary_muscles?.length > 0 && (
              <div>
                <p className="text-xs font-mono text-on-surface-variant uppercase tracking-wider mb-2">Secondary Stabilizers</p>
                <div className="flex flex-wrap gap-2">
                  {exercise.secondary_muscles.map((m: string) => (
                    <span key={m} className="px-3 py-1 rounded-full text-xs bg-surface-container text-on-surface-variant border border-outline-variant/30">
                      {m}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Instructions / Execution Guide */}
      {exercise.instructions?.length > 0 && (
        <div className="p-6 rounded-2xl bg-surface-container-low border border-outline-variant/30 shadow-xl space-y-4">
          <h2 className="font-headline-sm text-headline-sm text-on-surface flex items-center gap-2">
            <span className="material-symbols-outlined text-secondary text-xl">fact_check</span>
            Kinetic Execution Steps
          </h2>
          <ol className="space-y-3">
            {exercise.instructions.map((step: string, i: number) => (
              <li key={i} className="flex gap-3 text-sm text-on-surface-variant leading-relaxed p-3 rounded-xl bg-surface-container border border-outline-variant/20">
                <span className="w-6 h-6 rounded-lg bg-primary-container/20 text-primary-container font-mono font-bold text-xs flex items-center justify-center shrink-0">
                  {i + 1}
                </span>
                <span>{step}</span>
              </li>
            ))}
          </ol>
        </div>
      )}

      {/* Alternatives */}
      {alternatives?.length > 0 && (
        <div className="p-6 rounded-2xl bg-surface-container-low border border-outline-variant/30 shadow-xl space-y-4">
          <h2 className="font-headline-sm text-headline-sm text-on-surface">Biomechanical Alternatives</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {alternatives.map((alt: any) => (
              <button
                key={alt.id}
                onClick={() => navigate(`/exercises/${alt.id}`)}
                className="p-3.5 rounded-xl bg-surface-container hover:bg-surface-container-high border border-outline-variant/20 text-left transition-all group flex items-center justify-between"
              >
                <div>
                  <h4 className="text-sm font-bold text-on-surface group-hover:text-primary transition-colors">{alt.name}</h4>
                  <span className="text-xs text-on-surface-variant uppercase font-mono">{alt.category}</span>
                </div>
                <span className="material-symbols-outlined text-on-surface-variant group-hover:text-primary transition-transform group-hover:translate-x-1">
                  chevron_right
                </span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
