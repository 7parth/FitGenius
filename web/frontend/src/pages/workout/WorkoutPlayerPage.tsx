import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Play, Pause, CheckCircle2, ArrowLeftRight, StopCircle, Timer, ChevronDown, ChevronUp } from 'lucide-react'
import { api, getErrorMessage } from '@/lib/api'
import { cn, formatDuration } from '@/lib/utils'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'

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
    return () => { if (timerRef.current) clearInterval(timerRef.current) }
  }, [running])

  const logSetMutation = useMutation({
    mutationFn: ({ seId, body }: { seId: string; body: object }) =>
      api.post(`/workouts/sessions/${sessionId}/exercises/${seId}/log`, body).then(r => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['session', sessionId] }),
  })

  const completeMutation = useMutation({
    mutationFn: () => api.post(`/workouts/sessions/${sessionId}/complete`).then(r => r.data),
    onSuccess: () => navigate(`/workout/summary/${sessionId}`, { replace: true }),
  })

  const abandonMutation = useMutation({
    mutationFn: () => api.post(`/workouts/sessions/${sessionId}/abandon`).then(r => r.data),
    onSuccess: () => navigate('/dashboard', { replace: true }),
  })

  const swapMutation = useMutation({
    mutationFn: ({ seId, newExId }: { seId: string; newExId: string }) =>
      api.post(`/workouts/sessions/${sessionId}/swap`, { session_exercise_id: seId, new_exercise_id: newExId }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['session', sessionId] }),
  })

  if (isLoading || !session) return <div className="flex justify-center py-20"><LoadingSpinner size="lg" /></div>

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

  const loggedSets = (seId: string) =>
    (activeEx?.performances ?? []).filter((p: any) => p.session_exercise_id === seId || activeEx?.id === seId).length

  return (
    <div className="max-w-2xl mx-auto space-y-4">
      {/* Session header */}
      <div className="card p-4 flex items-center justify-between">
        <div>
          <h1 className="font-bold text-white">{session.name}</h1>
          <p className="text-sm text-gray-400">{exercises.length} exercises</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 text-primary-400 font-mono text-lg" aria-label="Elapsed time" aria-live="polite">
            <Timer className="w-4 h-4" aria-hidden="true" />
            {formatDuration(elapsed)}
          </div>
          <button onClick={() => setRunning(r => !r)} className="btn-ghost p-2" aria-label={running ? 'Pause timer' : 'Resume timer'}>
            {running ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Exercise list */}
      <div className="grid grid-cols-1 gap-2" role="list" aria-label="Workout exercises">
        {exercises.map((se: any, idx: number) => {
          const isActive = idx === activeExIdx
          const doneCount = (se.performances ?? []).length
          const totalSets = se.planned_sets
          const isDone = doneCount >= totalSets

          return (
            <div
              key={se.id}
              role="listitem"
              className={cn(
                'card overflow-hidden transition-all duration-200',
                isActive ? 'border-primary-500/50 bg-primary-500/5' : 'opacity-70 hover:opacity-90'
              )}
            >
              {/* Exercise header */}
              <button
                className="w-full flex items-center justify-between p-4 text-left"
                onClick={() => setActiveExIdx(idx)}
                aria-expanded={isActive}
                aria-label={`${se.exercise?.name}, ${doneCount} of ${totalSets} sets done`}
              >
                <div className="flex items-center gap-3">
                  <div className={cn(
                    'w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold',
                    isDone ? 'bg-emerald-500/20 text-emerald-400' : isActive ? 'bg-primary-500/20 text-primary-400' : 'bg-surface-600 text-gray-400'
                  )} aria-hidden="true">
                    {isDone ? '✓' : idx + 1}
                  </div>
                  <div>
                    <p className="font-medium text-white">{se.exercise?.name}</p>
                    <p className="text-xs text-gray-500">
                      {se.planned_sets} sets × {se.planned_reps ? `${se.planned_reps} reps` : `${se.planned_duration_seconds}s`}
                      {' '}· {se.rest_seconds}s rest
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-500">{doneCount}/{totalSets}</span>
                  {isActive ? <ChevronUp className="w-4 h-4 text-gray-400" aria-hidden="true" /> : <ChevronDown className="w-4 h-4 text-gray-400" aria-hidden="true" />}
                </div>
              </button>

              {/* Expanded set logging */}
              {isActive && (
                <div className="px-4 pb-4 space-y-3">
                  {Array.from({ length: totalSets }, (_, i) => i + 1).map(setNum => {
                    const key = `${se.id}-${setNum}`
                    const inputs = setInputs[key] ?? { reps: '', weight: '', rpe: '' }
                    const isLogged = (se.performances ?? []).some((p: any) => p.set_number === setNum)
                    return (
                      <div key={setNum} className={cn(
                        'flex items-center gap-2 p-3 rounded-xl',
                        isLogged ? 'bg-emerald-500/10 border border-emerald-500/20' : 'bg-surface-700'
                      )}>
                        <span className="text-xs text-gray-500 w-12 flex-shrink-0">Set {setNum}</span>
                        <input
                          type="number"
                          placeholder="Reps"
                          value={inputs.reps}
                          onChange={e => setSetInputs(prev => ({ ...prev, [key]: { ...inputs, reps: e.target.value } }))}
                          className="input w-20 text-sm py-1.5"
                          aria-label={`Set ${setNum} reps`}
                          disabled={isLogged}
                        />
                        <input
                          type="number"
                          placeholder="kg"
                          value={inputs.weight}
                          onChange={e => setSetInputs(prev => ({ ...prev, [key]: { ...inputs, weight: e.target.value } }))}
                          className="input w-20 text-sm py-1.5"
                          aria-label={`Set ${setNum} weight in kg`}
                          disabled={isLogged}
                        />
                        <select
                          value={inputs.rpe}
                          onChange={e => setSetInputs(prev => ({ ...prev, [key]: { ...inputs, rpe: e.target.value } }))}
                          className="input text-sm py-1.5"
                          aria-label={`Set ${setNum} RPE`}
                          disabled={isLogged}
                        >
                          <option value="">RPE</option>
                          {[6,7,8,9,10].map(r => <option key={r} value={r}>{r}</option>)}
                        </select>
                        {isLogged ? (
                          <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0" aria-label="Set logged" />
                        ) : (
                          <button
                            onClick={() => logSet(se.id, setNum)}
                            disabled={logSetMutation.isPending}
                            className="btn-primary py-1.5 px-3 text-sm flex-shrink-0"
                            aria-label={`Log set ${setNum}`}
                          >
                            Log
                          </button>
                        )}
                      </div>
                    )
                  })}

                  {/* Next exercise button */}
                  {idx < exercises.length - 1 && (
                    <button
                      onClick={() => setActiveExIdx(idx + 1)}
                      className="btn-ghost w-full text-sm mt-1"
                      aria-label="Move to next exercise"
                    >
                      Next exercise →
                    </button>
                  )}
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Actions */}
      <div className="flex gap-3 pb-8">
        <button
          onClick={() => {
            if (window.confirm('Abandon this workout? Progress will be saved.')) abandonMutation.mutate()
          }}
          className="btn-ghost flex items-center gap-2 flex-1 justify-center text-red-400 hover:text-red-300"
        >
          <StopCircle className="w-4 h-4" aria-hidden="true" /> Abandon
        </button>
        <button
          onClick={() => completeMutation.mutate()}
          disabled={completeMutation.isPending}
          className="btn-primary flex items-center gap-2 flex-1 justify-center"
        >
          <CheckCircle2 className="w-4 h-4" aria-hidden="true" />
          {completeMutation.isPending ? 'Finishing…' : 'Complete Workout'}
        </button>
      </div>
    </div>
  )
}
