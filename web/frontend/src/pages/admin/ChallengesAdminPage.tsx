import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Plus, Trash2, Flag } from 'lucide-react'
import { api, getErrorMessage } from '@/lib/api'
import { cn } from '@/lib/utils'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { useState } from 'react'

const schema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters'),
  description: z.string().min(10, 'Description must be at least 10 characters'),
  challenge_type: z.enum(['daily', 'weekly', 'monthly', 'special']),
  points_reward: z.coerce.number().min(1),
  starts_at: z.string().min(1, 'Start date required'),
  ends_at: z.string().min(1, 'End date required'),
})

type ChallengeFormData = z.infer<typeof schema>

export default function ChallengesAdminPage() {
  const qc = useQueryClient()
  const [showForm, setShowForm] = useState(false)

  const { data: challenges = [], isLoading } = useQuery({
    queryKey: ['admin-challenges'],
    queryFn: () => api.get('/gamification/challenges').then(r => r.data),
  })

  const { register, handleSubmit, reset, formState: { errors } } = useForm<ChallengeFormData>({
    resolver: zodResolver(schema),
    defaultValues: { challenge_type: 'weekly', points_reward: 100, title: '', description: '', starts_at: '', ends_at: '' },
  })

  const createMutation = useMutation<any, Error, ChallengeFormData>({
    mutationFn: (data) => api.post('/admin/challenges', {
      ...data,
      starts_at: new Date(data.starts_at).toISOString(),
      ends_at: new Date(data.ends_at).toISOString(),
      goal_criteria: { type: 'workouts_completed', target: 5 },
    }).then(r => r.data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin-challenges'] }); reset(); setShowForm(false) },
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/admin/challenges/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-challenges'] }),
  })

  const typeColors: Record<string, string> = {
    daily: 'bg-emerald-500/20 text-emerald-300',
    weekly: 'bg-blue-500/20 text-blue-300',
    monthly: 'bg-purple-500/20 text-purple-300',
    special: 'bg-amber-500/20 text-amber-300',
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Challenges</h1>
          <p className="text-gray-400 text-sm mt-1">Manage community challenges</p>
        </div>
        <button onClick={() => setShowForm(s => !s)} className="btn-primary flex items-center gap-2">
          <Plus className="w-4 h-4" aria-hidden="true" /> New Challenge
        </button>
      </div>

      {/* Create form */}
      {showForm && (
        <form onSubmit={handleSubmit(d => createMutation.mutate(d))} className="card p-6 space-y-4" noValidate>
          <h2 className="font-semibold text-white">Create Challenge</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-sm text-gray-400 mb-1.5">Title</label>
              <input {...register('title')} className="input w-full" placeholder="7-Day Consistency Challenge" />
              {errors.title && <p className="text-xs text-red-400 mt-1">{errors.title.message}</p>}
            </div>
            <div className="sm:col-span-2">
              <label className="block text-sm text-gray-400 mb-1.5">Description</label>
              <textarea {...register('description')} rows={2} className="input w-full resize-none" placeholder="Complete 5 workouts this week to earn bonus points." />
              {errors.description && <p className="text-xs text-red-400 mt-1">{errors.description.message}</p>}
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1.5">Type</label>
              <select {...register('challenge_type')} className="input w-full">
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
                <option value="special">Special</option>
              </select>
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1.5">Points Reward</label>
              <input type="number" {...register('points_reward')} className="input w-full" placeholder="500" />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1.5">Starts At</label>
              <input type="datetime-local" {...register('starts_at')} className="input w-full" />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1.5">Ends At</label>
              <input type="datetime-local" {...register('ends_at')} className="input w-full" />
            </div>
          </div>
          {createMutation.isError && (
            <p className="text-sm text-red-400" role="alert">{getErrorMessage(createMutation.error)}</p>
          )}
          <div className="flex gap-3">
            <button type="button" onClick={() => setShowForm(false)} className="btn-ghost">Cancel</button>
            <button type="submit" disabled={createMutation.isPending} className="btn-primary">
              {createMutation.isPending ? 'Creating…' : 'Create Challenge'}
            </button>
          </div>
        </form>
      )}

      {isLoading ? (
        <div className="flex justify-center py-10"><LoadingSpinner /></div>
      ) : challenges.length === 0 ? (
        <div className="card p-12 text-center">
          <Flag className="w-10 h-10 text-gray-600 mx-auto mb-3" aria-hidden="true" />
          <p className="text-gray-400">No challenges yet. Create one above.</p>
        </div>
      ) : (
        <div className="card overflow-hidden">
          <table className="w-full text-sm" aria-label="Challenges admin table">
            <thead>
              <tr className="border-b border-surface-700 text-left">
                <th className="p-4 text-xs font-medium text-gray-500 uppercase tracking-wide">Challenge</th>
                <th className="p-4 text-xs font-medium text-gray-500 uppercase tracking-wide hidden sm:table-cell">Type</th>
                <th className="p-4 text-xs font-medium text-gray-500 uppercase tracking-wide">Points</th>
                <th className="p-4 text-xs font-medium text-gray-500 uppercase tracking-wide hidden md:table-cell">Participants</th>
                <th className="p-4 text-xs font-medium text-gray-500 uppercase tracking-wide">Actions</th>
              </tr>
            </thead>
            <tbody>
              {challenges.map((ch: any) => (
                <tr key={ch.id} className="border-b border-surface-700/50 last:border-0 hover:bg-surface-700/20">
                  <td className="p-4">
                    <p className="font-medium text-white">{ch.title}</p>
                    <p className="text-xs text-gray-500 truncate max-w-xs">{ch.description}</p>
                  </td>
                  <td className="p-4 hidden sm:table-cell">
                    <span className={cn('badge text-xs', typeColors[ch.challenge_type] ?? '')}>{ch.challenge_type}</span>
                  </td>
                  <td className="p-4 text-primary-400 font-medium">+{ch.points_reward}</td>
                  <td className="p-4 text-gray-400 hidden md:table-cell">{ch.participant_count}</td>
                  <td className="p-4">
                    <button
                      onClick={() => { if (window.confirm(`Delete "${ch.title}"?`)) deleteMutation.mutate(ch.id) }}
                      className="btn-ghost p-1.5"
                      aria-label={`Delete challenge: ${ch.title}`}
                    >
                      <Trash2 className="w-4 h-4 text-red-400" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
