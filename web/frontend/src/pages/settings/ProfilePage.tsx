import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { useAuthStore } from '@/store/authStore'
import { api, getErrorMessage } from '@/lib/api'
import { User, Save, Target, MapPin } from 'lucide-react'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { cn } from '@/lib/utils'

export default function ProfilePage() {
  const qc = useQueryClient()
  const { user } = useAuthStore()

  const { data: profile, isLoading } = useQuery({
    queryKey: ['my-profile'],
    queryFn: () => api.get('/profile/me').then(r => r.data),
  })

  const { register, handleSubmit, watch, setValue, reset, formState: { isDirty } } = useForm({
    defaultValues: profile ?? {},
  })
  if (profile && !isDirty && Object.keys(watch()).length === 0) reset(profile)

  const basicMutation = useMutation({
    mutationFn: (data: any) => api.put('/profile/basic', data).then(r => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['my-profile'] }),
  })

  const fitnessMutation = useMutation({
    mutationFn: (data: any) => api.put('/profile/fitness', data).then(r => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['my-profile'] }),
  })

  if (isLoading) return <div className="flex justify-center py-16"><LoadingSpinner /></div>

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Profile</h1>
        <p className="text-gray-400 text-sm mt-1">{user?.email}</p>
      </div>

      {/* Basic info */}
      <section className="card p-6 space-y-4" aria-labelledby="basic-heading">
        <h2 id="basic-heading" className="font-semibold text-white flex items-center gap-2">
          <User className="w-4 h-4 text-primary-400" aria-hidden="true" /> Basic Information
        </h2>
        <form
          onSubmit={handleSubmit((d) => basicMutation.mutate({ age: d.age || undefined, gender: d.gender || undefined, height_cm: d.height_cm || undefined, weight_kg: d.weight_kg || undefined }))}
          noValidate
        >
          <div className="grid grid-cols-2 gap-4 mb-4">
            <Field label="Age" type="number" placeholder="25" {...register('age', { valueAsNumber: true })} />
            <div>
              <label className="block text-sm text-gray-400 mb-1.5">Gender</label>
              <select {...register('gender')} className="input w-full">
                <option value="">Prefer not to say</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="non-binary">Non-binary</option>
                <option value="other">Other</option>
              </select>
            </div>
            <Field label="Height (cm)" type="number" placeholder="170" {...register('height_cm', { valueAsNumber: true })} />
            <Field label="Weight (kg)" type="number" placeholder="70" {...register('weight_kg', { valueAsNumber: true })} />
          </div>
          <button type="submit" disabled={basicMutation.isPending} className="btn-primary flex items-center gap-2 text-sm">
            <Save className="w-4 h-4" aria-hidden="true" /> {basicMutation.isPending ? 'Saving…' : 'Save'}
          </button>
          {basicMutation.isSuccess && <p className="text-xs text-emerald-400 mt-2" role="status">Saved!</p>}
        </form>
      </section>

      {/* Fitness profile */}
      <section className="card p-6 space-y-4" aria-labelledby="fitness-heading">
        <h2 id="fitness-heading" className="font-semibold text-white flex items-center gap-2">
          <Target className="w-4 h-4 text-primary-400" aria-hidden="true" /> Fitness Profile
        </h2>
        <form
          onSubmit={handleSubmit((d) => fitnessMutation.mutate({
            fitness_level: d.fitness_level,
            primary_goal: d.primary_goal,
            workout_frequency_per_week: d.workout_frequency_per_week,
            preferred_duration_minutes: d.preferred_duration_minutes,
            training_location: d.training_location,
          }))}
          noValidate
        >
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm text-gray-400 mb-1.5">Fitness Level</label>
              <select {...register('fitness_level')} className="input w-full">
                <option value="beginner">Beginner</option>
                <option value="intermediate">Intermediate</option>
                <option value="advanced">Advanced</option>
              </select>
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1.5">Primary Goal</label>
              <select {...register('primary_goal')} className="input w-full">
                <option value="weight_loss">Weight Loss</option>
                <option value="muscle_gain">Muscle Gain</option>
                <option value="endurance">Endurance</option>
                <option value="flexibility">Flexibility</option>
                <option value="general">General Fitness</option>
              </select>
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1.5">
                Workouts/week: <span className="text-white">{watch('workout_frequency_per_week')}</span>
              </label>
              <input type="range" min={1} max={7} {...register('workout_frequency_per_week', { valueAsNumber: true })} className="w-full accent-primary-500" />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1.5">
                Session length: <span className="text-white">{watch('preferred_duration_minutes')} min</span>
              </label>
              <input type="range" min={10} max={120} step={5} {...register('preferred_duration_minutes', { valueAsNumber: true })} className="w-full accent-primary-500" />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1.5">Location</label>
              <select {...register('training_location')} className="input w-full">
                <option value="home">Home</option>
                <option value="gym">Gym</option>
                <option value="outdoor">Outdoor</option>
                <option value="any">Any</option>
              </select>
            </div>
          </div>
          <button type="submit" disabled={fitnessMutation.isPending} className="btn-primary flex items-center gap-2 text-sm">
            <Save className="w-4 h-4" aria-hidden="true" /> {fitnessMutation.isPending ? 'Saving…' : 'Save'}
          </button>
          {fitnessMutation.isSuccess && <p className="text-xs text-emerald-400 mt-2" role="status">Saved!</p>}
          {fitnessMutation.isError && <p className="text-xs text-red-400 mt-2" role="alert">{getErrorMessage(fitnessMutation.error)}</p>}
        </form>
      </section>
    </div>
  )
}

import { forwardRef } from 'react'

const Field = forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement> & { label: string }>(
  ({ label, ...props }, ref) => (
    <div>
      <label className="block text-sm text-gray-400 mb-1.5">{label}</label>
      <input ref={ref} {...props} className="input w-full" />
    </div>
  )
)
Field.displayName = 'Field'
