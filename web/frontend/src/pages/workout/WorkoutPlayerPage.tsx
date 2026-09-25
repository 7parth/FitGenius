import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { formatDuration } from '@/lib/utils'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { toast } from '@/components/ui/Toast'

export default function WorkoutPlayerPage() {
  const { sessionId } = useParams<{ sessionId: string }>()
  const navigate = useNavigate()
  const qc = useQueryClient()
  const [activeExIdx, setActiveExIdx] = useState(0)
  const [setInputs, setSetInputs] = useState<Record<string, { reps: string; weight: string; rpe: string }>>({})
  const [elapsed, setElapsed] = useState(0)
  const [running, setRunning] = useState(true)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const { data: session, isLoading } = useQuery({
    queryKey: ['session', sessionId],
    queryFn: () => api.get(`/workouts/sessions/${sessionId}`).then(r => r.data),
    enabled: !!sessionId,
  })

  useEffect(() => {
    if (running) {
      timerRef.current = setInterval(() => setElapsed(e => e + 1), 1000)
    } else {
      if (timerRef.current) clearInterval(timerRef.current)
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [running])

  const logSetMutation = useMutation({
    mutationFn: ({ seId, body }: { seId: string; body: object }) =>
      api.post(`/workouts/sessions/${sessionId}/exercises/${seId}/log`, body).then(r => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['session', sessionId] })
      toast.success('Set recorded into live telemetry!')
    },
  })

  const completeMutation = useMutation({
    mutationFn: () => api.post(`/workouts/sessions/${sessionId}/complete`).then(r => r.data),
    onSuccess: () => {
      toast.success('Workout complete! Generating biometric summary...')
      navigate(`/workout/summary/${sessionId}`, { replace: true })
    },
  })

  const abandonMutation = useMutation({
    mutationFn: () => api.post(`/workouts/sessions/${sessionId}/abandon`).then(r => r.data),
    onSuccess: () => {
      toast.info('Workout abandoned. Partial session saved.')
      navigate('/dashboard', { replace: true })
    },
  })

  if (isLoading || !session) {
    return (
      <div className="flex justify-center items-center py-24">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  const exercises = session.exercises ?? []
  const activeEx = exercises[activeExIdx]

  const logSet = (seId: string, setNum: number) => {
    const inputs = setInputs[`${seId}-${setNum}`] ?? {}
    logSetMutation.mutate({
      seId,
      body: {
        set_number: setNum,
        reps_completed: inputs.reps ? parseInt(inputs.reps) : undefined,
        weight_kg: inputs.weight ? parseFloat(inputs.weight) : undefined,
        rpe: inputs.rpe ? parseInt(inputs.rpe) : undefined,
      },
    })
  }

  return (
    <div className="flex flex-col w-full max-w-4xl mx-auto pb-16 space-y-6">
      {/* Session Telemetry Header Card */}
      <div className="p-6 rounded-2xl bg-surface-container-low shadow-[0_4px_24px_rgba(0,0,0,0.5)] border border-surface-container-high/40 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-primary-container/20 flex items-center justify-center text-primary-container shadow-[0_0_16px_rgba(0,240,255,0.3)]">
            <span className="material-symbols-outlined text-2xl">fitness_center</span>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full bg-primary-container/15 text-primary font-code-stat text-code-stat font-semibold">
                LIVE SESSION
              </span>
              <span className="font-code-stat text-code-stat text-on-surface-variant">
                {exercises.length} Protocol Movements
              </span>
            </div>
            <h1 className="font-headline-lg text-headline-lg text-on-surface mt-0.5">{session.name}</h1>
          </div>
        </div>

        {/* Live Elapsed Timer */}
        <div className="flex items-center gap-3 self-start md:self-auto bg-surface-container px-4 py-2 rounded-xl border border-surface-container-high">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-secondary shadow-[0_0_8px_rgba(78,222,163,0.9)] animate-pulse" />
            <span className="font-stat-xl text-stat-xl text-primary font-mono tracking-tight">
              {formatDuration(elapsed)}
            </span>
          </div>
          <button
            onClick={() => setRunning(r => !r)}
            className="p-1.5 rounded-lg bg-surface-container-high hover:bg-surface-container-highest text-on-surface transition-colors"
            title={running ? 'Pause Timer' : 'Resume Timer'}
            type="button"
          >
            <span className="material-symbols-outlined text-lg">{running ? 'pause' : 'play_arrow'}</span>
          </button>
        </div>
      </div>

      {/* Protocol Movements List */}
      <div className="flex flex-col gap-3" role="list">
        {exercises.map((se: any, idx: number) => {
          const isActive = idx === activeExIdx
          const doneCount = (se.performances ?? []).length
          const totalSets = se.planned_sets
          const isDone = doneCount >= totalSets

          return (
            <div
              key={se.id}
              role="listitem"
              className={`rounded-2xl transition-all duration-300 overflow-hidden border ${
                isActive
                  ? 'bg-surface-container-low border-primary-container/40 shadow-[0_4px_24px_rgba(0,240,255,0.15)]'
                  : 'bg-surface-container-low/60 border-surface-container-high/30 hover:bg-surface-container-low'
              }`}
            >
              {/* Exercise Bar */}
              <button
                className="w-full flex items-center justify-between p-5 text-left transition-colors"
                onClick={() => setActiveExIdx(idx)}
                type="button"
              >
                <div className="flex items-center gap-4">
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center font-code-stat text-code-stat font-bold ${
                      isDone
                        ? 'bg-secondary-container/20 text-secondary'
                        : isActive
                        ? 'bg-primary-container text-on-primary-container shadow-[0_0_12px_rgba(0,240,255,0.5)]'
                        : 'bg-surface-container text-on-surface-variant'
                    }`}
                  >
                    {isDone ? '✓' : idx + 1}
                  </div>
                  <div>
                    <h3 className="font-headline-sm text-headline-sm text-on-surface">{se.exercise?.name}</h3>
                    <p className="font-code-stat text-code-stat text-on-surface-variant mt-0.5">
                      {se.planned_sets} sets × {se.planned_reps ? `${se.planned_reps} reps` : `${se.planned_duration_seconds}s`} • Rest: {se.rest_seconds}s
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <span className={`font-code-stat text-code-stat px-2.5 py-1 rounded-full ${isDone ? 'bg-secondary/15 text-secondary' : 'bg-surface-container text-on-surface-variant'}`}>
                    {doneCount} / {totalSets} Sets
                  </span>
                  <span className="material-symbols-outlined text-on-surface-variant">
                    {isActive ? 'expand_less' : 'expand_more'}
                  </span>
                </div>
              </button>

              {/* Set Logging Table when expanded */}
              {isActive && (
                <div className="px-5 pb-5 space-y-3 pt-1 border-t border-surface-container-high/40">
                  <div className="grid grid-cols-12 gap-2 text-on-surface-variant font-label-sm text-label-sm uppercase tracking-wider px-3">
                    <span className="col-span-2">Set</span>
                    <span className="col-span-3">Reps</span>
                    <span className="col-span-3">Load (kg)</span>
                    <span className="col-span-2">RPE</span>
                    <span className="col-span-2 text-right">Status</span>
                  </div>

                  {Array.from({ length: totalSets }, (_, i) => i + 1).map(setNum => {
                    const key = `${se.id}-${setNum}`
                    const inputs = setInputs[key] ?? { reps: '', weight: '', rpe: '' }
                    const isLogged = (se.performances ?? []).some((p: any) => p.set_number === setNum)

                    return (
                      <div
                        key={setNum}
                        className={`grid grid-cols-12 items-center gap-2 p-3 rounded-xl transition-colors ${
                          isLogged
                            ? 'bg-secondary-container/10 border border-secondary-container/20'
                            : 'bg-surface-container border border-surface-container-high/60'
                        }`}
                      >
                        <span className="col-span-2 font-code-stat text-code-stat text-on-surface font-semibold">
                          Set {setNum}
                        </span>

                        <div className="col-span-3">
                          <input
                            type="number"
                            placeholder={se.planned_reps ? String(se.planned_reps) : 'Reps'}
                            value={inputs.reps}
                            onChange={e =>
                              setSetInputs(prev => ({
                                ...prev,
                                [key]: { ...inputs, reps: e.target.value },
                              }))
                            }
                            className="w-full px-3 py-1.5 rounded-lg bg-surface-container-high text-on-surface text-body-sm font-code-stat border border-surface-container-highest focus:outline-none focus:ring-1 focus:ring-primary-container"
                            disabled={isLogged}
                          />
                        </div>

                        <div className="col-span-3">
                          <input
                            type="number"
                            placeholder="kg"
                            value={inputs.weight}
                            onChange={e =>
                              setSetInputs(prev => ({
                                ...prev,
                                [key]: { ...inputs, weight: e.target.value },
                              }))
                            }
                            className="w-full px-3 py-1.5 rounded-lg bg-surface-container-high text-on-surface text-body-sm font-code-stat border border-surface-container-highest focus:outline-none focus:ring-1 focus:ring-primary-container"
                            disabled={isLogged}
                          />
                        </div>

                        <div className="col-span-2">
                          <select
                            value={inputs.rpe}
                            onChange={e =>
                              setSetInputs(prev => ({
                                ...prev,
                                [key]: { ...inputs, rpe: e.target.value },
                              }))
                            }
                            className="w-full px-2 py-1.5 rounded-lg bg-surface-container-high text-on-surface text-body-sm font-code-stat border border-surface-container-highest focus:outline-none focus:ring-1 focus:ring-primary-container"
                            disabled={isLogged}
                          >
                            <option value="">RPE</option>
                            {[6, 7, 8, 9, 10].map(r => (
                              <option key={r} value={r}>
                                {r}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div className="col-span-2 flex justify-end">
                          {isLogged ? (
                            <span className="flex items-center gap-1 text-secondary font-label-sm text-label-sm font-semibold">
                              <span className="material-symbols-outlined text-base">verified</span> Done
                            </span>
                          ) : (
                            <button
                              onClick={() => logSet(se.id, setNum)}
                              disabled={logSetMutation.isPending}
                              className="px-3 py-1.5 rounded-lg bg-primary-container text-on-primary-container font-label-sm text-label-sm font-bold shadow-[0_0_10px_rgba(0,240,255,0.3)] hover:shadow-[0_0_16px_rgba(0,240,255,0.5)] transition-all"
                              type="button"
                            >
                              Log
                            </button>
                          )}
                        </div>
                      </div>
                    )
                  })}

                  {idx < exercises.length - 1 && (
                    <button
                      onClick={() => setActiveExIdx(idx + 1)}
                      className="w-full py-2.5 rounded-xl bg-surface-container-high hover:bg-surface-container-highest text-primary font-label-md text-label-md transition-colors flex items-center justify-center gap-1.5 mt-2"
                      type="button"
                    >
                      <span>Next Movement: {exercises[idx + 1]?.exercise?.name}</span>
                      <span className="material-symbols-outlined text-base">arrow_forward</span>
                    </button>
                  )}
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Global Actions Footer */}
      <div className="flex flex-col sm:flex-row items-center gap-4 pt-4">
        <button
          onClick={() => {
            if (window.confirm('Abandon this workout session? Current logged sets will be retained.')) {
              abandonMutation.mutate()
            }
          }}
          className="w-full sm:w-auto px-5 py-3 rounded-xl bg-surface-container text-error hover:bg-error-container/20 transition-colors font-label-md text-label-md flex items-center justify-center gap-2"
          type="button"
        >
          <span className="material-symbols-outlined text-lg">stop</span>
          <span>Abandon Session</span>
        </button>

        <button
          onClick={() => completeMutation.mutate()}
          disabled={completeMutation.isPending}
          className="flex-1 w-full py-3.5 px-6 rounded-xl bg-primary-container text-on-primary-container font-headline-sm text-headline-sm font-bold flex items-center justify-center gap-2 shadow-[0_0_24px_rgba(0,240,255,0.4)] hover:shadow-[0_0_32px_rgba(0,240,255,0.6)] transition-all"
          type="button"
        >
          <span className="material-symbols-outlined text-2xl font-bold">check_circle</span>
          <span>{completeMutation.isPending ? 'Finalizing Telemetry…' : 'Complete Workout Protocol'}</span>
        </button>
      </div>
    </div>
  )
}
