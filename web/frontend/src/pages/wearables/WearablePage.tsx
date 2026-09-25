import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { Activity, Heart, Moon, Zap, Plus, Info } from 'lucide-react'
import { api, getErrorMessage } from '@/lib/api'
import { cn, formatDate } from '@/lib/utils'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'

const FATIGUE_CONFIG = {
  NORMAL:   { color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/20', label: 'Well Recovered', emoji: '✅' },
  REDUCED:  { color: 'text-amber-400',   bg: 'bg-amber-500/10 border-amber-500/20',   label: 'Moderately Fatigued', emoji: '⚡' },
  RECOVERY: { color: 'text-red-400',     bg: 'bg-red-500/10 border-red-500/20',       label: 'High Fatigue', emoji: '🛑' },
}

export default function WearablePage() {
  const qc = useQueryClient()
  const [showForm, setShowForm] = useState(false)

  const { data: fatigue, isLoading: fatigueLoading } = useQuery({
    queryKey: ['fatigue'],
    queryFn: () => api.get('/wearables/fatigue').then(r => r.data),
    refetchInterval: 5 * 60_000,
  })

  const { data: history = [], isLoading: historyLoading } = useQuery({
    queryKey: ['wearable-data'],
    queryFn: () => api.get('/wearables/data').then(r => r.data),
  })

  const { register, handleSubmit, reset, formState: { errors } } = useForm({
    defaultValues: {
      source: 'manual',
      recorded_at: new Date().toISOString().slice(0, 16),
      steps: '', active_calories: '', resting_heart_rate: '',
      hrv_ms: '', sleep_hours: '', sleep_quality_score: '', recovery_score: '',
    },
  })

  const submitMutation = useMutation({
    mutationFn: (data: any) => {
      const payload: any = { source: data.source, recorded_at: new Date(data.recorded_at).toISOString() }
      if (data.steps) payload.steps = parseInt(data.steps)
      if (data.active_calories) payload.active_calories = parseFloat(data.active_calories)
      if (data.resting_heart_rate) payload.resting_heart_rate = parseInt(data.resting_heart_rate)
      if (data.hrv_ms) payload.hrv_ms = parseFloat(data.hrv_ms)
      if (data.sleep_hours) payload.sleep_hours = parseFloat(data.sleep_hours)
      if (data.sleep_quality_score) payload.sleep_quality_score = parseInt(data.sleep_quality_score)
      if (data.recovery_score) payload.recovery_score = parseInt(data.recovery_score)
      return api.post('/wearables/data', payload).then(r => r.data)
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['fatigue'] })
      qc.invalidateQueries({ queryKey: ['wearable-data'] })
      reset()
      setShowForm(false)
    },
  })

  const fatigueLevel = fatigue?.fatigue_level ?? 'NORMAL'
  const fatigueConf = FATIGUE_CONFIG[fatigueLevel as keyof typeof FATIGUE_CONFIG] ?? FATIGUE_CONFIG.NORMAL

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Wearables & Recovery</h1>
          <p className="text-gray-400 text-sm mt-1">Track your recovery metrics to optimise training intensity</p>
        </div>
        <button onClick={() => setShowForm(s => !s)} className="btn-primary flex items-center gap-2">
          <Plus className="w-4 h-4" aria-hidden="true" /> Log Data
        </button>
      </div>

      {/* Medical disclaimer */}
      <div className="flex gap-2 p-3 rounded-xl bg-blue-500/10 border border-blue-500/20 text-xs text-blue-300" role="note">
        <Info className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" aria-hidden="true" />
        <p>{fatigue?.disclaimer ?? 'Fatigue indicators are for general wellness guidance only — not a medical diagnosis.'}</p>
      </div>

      {/* Fatigue status */}
      {fatigueLoading ? (
        <div className="flex justify-center py-8"><LoadingSpinner /></div>
      ) : (
        <div className={cn('card p-6 border', fatigueConf.bg)}>
          <div className="flex items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-2xl" aria-hidden="true">{fatigueConf.emoji}</span>
                <h2 className={cn('text-xl font-bold', fatigueConf.color)}>{fatigueConf.label}</h2>
              </div>
              <p className="text-sm text-gray-400">{fatigue?.recommendation_note}</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-gray-500">Confidence</p>
              <p className={cn('text-lg font-bold', fatigueConf.color)}>
                {fatigue?.fatigue_confidence ? `${Math.round(fatigue.fatigue_confidence * 100)}%` : '–'}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Log form */}
      {showForm && (
        <form onSubmit={handleSubmit((d) => submitMutation.mutate(d))} className="card p-6 space-y-4" noValidate>
          <h2 className="font-semibold text-white">Log Wearable Data</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <NumberField label="Steps" placeholder="8000" {...register('steps')} />
            <NumberField label="Active Cal." placeholder="400" {...register('active_calories')} />
            <NumberField label="Resting HR" placeholder="60" {...register('resting_heart_rate')} />
            <NumberField label="HRV (ms)" placeholder="45" {...register('hrv_ms')} />
            <NumberField label="Sleep (hrs)" placeholder="7.5" step="0.5" {...register('sleep_hours')} />
            <NumberField label="Sleep Quality (0–100)" placeholder="80" {...register('sleep_quality_score')} />
            <NumberField label="Recovery Score (0–100)" placeholder="75" {...register('recovery_score')} />
            <div>
              <label className="block text-xs text-gray-400 mb-1.5">Recorded at</label>
              <input type="datetime-local" {...register('recorded_at')} className="input w-full text-sm" />
            </div>
          </div>
          {submitMutation.isError && (
            <p className="text-sm text-red-400" role="alert">{getErrorMessage(submitMutation.error)}</p>
          )}
          <div className="flex gap-3">
            <button type="button" onClick={() => setShowForm(false)} className="btn-ghost">Cancel</button>
            <button type="submit" disabled={submitMutation.isPending} className="btn-primary">
              {submitMutation.isPending ? 'Saving…' : 'Save Data'}
            </button>
          </div>
        </form>
      )}

      {/* History */}
      {historyLoading ? (
        <div className="flex justify-center py-8"><LoadingSpinner /></div>
      ) : history.length === 0 ? (
        <div className="card p-10 text-center">
          <Activity className="w-10 h-10 text-gray-600 mx-auto mb-3" aria-hidden="true" />
          <p className="text-gray-400 text-sm">No data logged yet. Add your first entry above.</p>
        </div>
      ) : (
        <div className="card overflow-hidden">
          <table className="w-full text-sm" aria-label="Wearable data history">
            <thead>
              <tr className="border-b border-surface-700">
                <th className="text-left p-4 text-xs text-gray-500 font-medium uppercase tracking-wide">Date</th>
                <th className="text-right p-4 text-xs text-gray-500 font-medium uppercase tracking-wide hidden sm:table-cell">HR</th>
                <th className="text-right p-4 text-xs text-gray-500 font-medium uppercase tracking-wide hidden sm:table-cell">HRV</th>
                <th className="text-right p-4 text-xs text-gray-500 font-medium uppercase tracking-wide">Sleep</th>
                <th className="text-right p-4 text-xs text-gray-500 font-medium uppercase tracking-wide">Fatigue</th>
              </tr>
            </thead>
            <tbody>
              {history.slice(0, 20).map((row: any) => {
                const conf = FATIGUE_CONFIG[row.fatigue_level as keyof typeof FATIGUE_CONFIG] ?? FATIGUE_CONFIG.NORMAL
                return (
                  <tr key={row.id} className="border-b border-surface-700/50 last:border-0">
                    <td className="p-4 text-gray-300">{formatDate(row.recorded_at)}</td>
                    <td className="p-4 text-right text-gray-400 hidden sm:table-cell">{row.resting_heart_rate ?? '–'}</td>
                    <td className="p-4 text-right text-gray-400 hidden sm:table-cell">{row.hrv_ms ?? '–'}</td>
                    <td className="p-4 text-right text-gray-400">{row.sleep_hours != null ? `${row.sleep_hours}h` : '–'}</td>
                    <td className={cn('p-4 text-right font-medium text-xs', conf.color)}>{row.fatigue_level}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

import { forwardRef } from 'react'

const NumberField = forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement> & { label: string }>(
  ({ label, ...props }, ref) => (
    <div>
      <label className="block text-xs text-gray-400 mb-1.5">{label}</label>
      <input ref={ref} type="number" {...props} className="input w-full text-sm" />
    </div>
  )
)
NumberField.displayName = 'NumberField'
