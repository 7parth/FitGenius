import { useParams, Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { formatDuration } from '@/lib/utils'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'

export default function WorkoutSummaryPage() {
  const { sessionId } = useParams<{ sessionId: string }>()

  const { data: session, isLoading } = useQuery({
    queryKey: ['session', sessionId],
    queryFn: () => api.get(`/workouts/sessions/${sessionId}`).then(r => r.data),
    enabled: !!sessionId,
  })

  if (isLoading || !session) {
    return (
      <div className="flex justify-center items-center py-24">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  const exercises = session.exercises ?? []
  const totalSets = exercises.reduce((acc: number, se: any) => acc + (se.performances?.length ?? 0), 0)

  return (
    <div className="max-w-2xl mx-auto space-y-6 py-6 pb-16">
      {/* Hero Achievement Card */}
      <div className="relative overflow-hidden rounded-2xl bg-surface-container-low p-8 text-center shadow-[0_8px_32px_rgba(0,0,0,0.6)] border border-primary-container/20">
        <div className="absolute -top-20 left-1/2 -translate-x-1/2 w-64 h-64 bg-primary-container/15 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-primary-container to-secondary flex items-center justify-center mx-auto mb-4 shadow-[0_0_24px_rgba(0,240,255,0.4)]">
            <span className="material-symbols-outlined text-3xl text-on-primary-fixed" style={{ fontVariationSettings: "'FILL' 1" }}>
              emoji_events
            </span>
          </div>

          <span className="px-3 py-1 rounded-full bg-secondary-container/20 text-secondary font-code-stat text-code-stat font-semibold uppercase tracking-wider">
            Biometrics Logged • Telemetry Verified
          </span>

          <h1 className="font-headline-lg text-headline-lg text-on-surface mt-2">Workout Completed!</h1>
          <p className="font-body-md text-body-md text-on-surface-variant mt-1">{session.name}</p>

          {session.points_earned > 0 && (
            <div className="mt-4 inline-flex items-center gap-2 bg-primary-container/15 text-primary px-4 py-2 rounded-full font-label-md text-label-md font-bold shadow-[0_0_12px_rgba(0,240,255,0.3)]">
              <span className="material-symbols-outlined text-base">bolt</span>
              <span>+{session.points_earned} XP Points Earned</span>
            </div>
          )}
        </div>
      </div>

      {/* 4 Stat Bento Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-4 rounded-xl bg-surface-container-low border border-surface-container-high/40 text-center">
          <span className="material-symbols-outlined text-primary text-xl mx-auto block mb-1">timer</span>
          <p className="font-stat-xl text-headline-sm text-on-surface font-bold tracking-tight">
            {formatDuration(session.duration_seconds ?? 0)}
          </p>
          <p className="font-label-sm text-label-sm text-on-surface-variant mt-0.5 uppercase">Duration</p>
        </div>

        <div className="p-4 rounded-xl bg-surface-container-low border border-surface-container-high/40 text-center">
          <span className="material-symbols-outlined text-secondary text-xl mx-auto block mb-1">fitness_center</span>
          <p className="font-stat-xl text-headline-sm text-on-surface font-bold tracking-tight">
            {Math.round(session.total_volume_kg).toLocaleString()} <span className="font-label-sm text-xs font-normal">kg</span>
          </p>
          <p className="font-label-sm text-label-sm text-on-surface-variant mt-0.5 uppercase">Total Volume</p>
        </div>

        <div className="p-4 rounded-xl bg-surface-container-low border border-surface-container-high/40 text-center">
          <span className="material-symbols-outlined text-error text-xl mx-auto block mb-1" style={{ fontVariationSettings: "'FILL' 1" }}>
            local_fire_department
          </span>
          <p className="font-stat-xl text-headline-sm text-on-surface font-bold tracking-tight">
            ~{Math.round(session.total_calories)}
          </p>
          <p className="font-label-sm text-label-sm text-on-surface-variant mt-0.5 uppercase">Burn (kcal)</p>
        </div>

        <div className="p-4 rounded-xl bg-surface-container-low border border-surface-container-high/40 text-center">
          <span className="material-symbols-outlined text-tertiary-fixed-dim text-xl mx-auto block mb-1">task_alt</span>
          <p className="font-stat-xl text-headline-sm text-on-surface font-bold tracking-tight">
            {totalSets}
          </p>
          <p className="font-label-sm text-label-sm text-on-surface-variant mt-0.5 uppercase">Sets Logged</p>
        </div>
      </div>

      {/* Movement Breakdown */}
      {exercises.length > 0 && (
        <div className="p-5 rounded-2xl bg-surface-container-low border border-surface-container-high/40 space-y-3">
          <div className="flex items-center justify-between pb-1">
            <h2 className="font-headline-sm text-headline-sm text-on-surface">Movement Telemetry</h2>
            <span className="font-code-stat text-code-stat text-primary">{exercises.length} Exercises</span>
          </div>

          <div className="divide-y divide-surface-container-high/40">
            {exercises.map((se: any) => {
              const sets = se.performances ?? []
              const maxWeight = sets.reduce((m: number, p: any) => Math.max(m, p.weight_kg ?? 0), 0)

              return (
                <div key={se.id} className="py-3 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="w-2 h-2 rounded-full bg-secondary shadow-[0_0_6px_rgba(78,222,163,0.8)]" />
                    <div>
                      <p className="font-label-md text-label-md text-on-surface font-semibold">{se.exercise?.name}</p>
                      <p className="font-code-stat text-code-stat text-on-surface-variant">
                        {sets.length} sets completed • {se.rest_seconds}s rest intervals
                      </p>
                    </div>
                  </div>
                  {maxWeight > 0 && (
                    <span className="font-code-stat text-code-stat text-primary font-bold bg-surface-container px-2.5 py-1 rounded-lg">
                      {maxWeight} kg peak
                    </span>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Navigation CTAs */}
      <div className="flex flex-col gap-3 pt-2">
        <Link
          to="/workout/recommend"
          className="w-full py-3.5 px-4 rounded-xl bg-primary-container text-on-primary-container font-headline-sm text-headline-sm font-bold flex items-center justify-center gap-2 shadow-[0_0_24px_rgba(0,240,255,0.4)] hover:shadow-[0_0_32px_rgba(0,240,255,0.6)] transition-all"
        >
          <span className="material-symbols-outlined text-xl">refresh</span>
          <span>Start Next Protocol</span>
        </Link>
        <Link
          to="/progress"
          className="w-full py-3 px-4 rounded-xl bg-surface-container-high hover:bg-surface-container-highest text-on-surface font-label-md text-label-md transition-colors flex items-center justify-center gap-2"
        >
          <span>View Longitudinal Progress</span>
          <span className="material-symbols-outlined text-base">arrow_forward</span>
        </Link>
        <Link
          to="/dashboard"
          className="w-full py-2.5 px-4 rounded-xl text-on-surface-variant hover:text-on-surface font-label-md text-label-md text-center transition-colors"
        >
          Back to Command Center
        </Link>
      </div>
    </div>
  )
}
