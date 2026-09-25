import { useState, forwardRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useMutation } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { motion, AnimatePresence } from 'framer-motion'
import {
  User, Target, Dumbbell, Accessibility, CheckCircle2, ChevronRight, ChevronLeft
} from 'lucide-react'
import { api, getErrorMessage } from '@/lib/api'
import { useAuthStore } from '@/store/authStore'
import { cn } from '@/lib/utils'

// ── Step schemas ──────────────────────────────────────────────────────────────

const step1Schema = z.object({
  age: z.coerce.number().min(13).max(120).optional(),
  gender: z.string().optional(),
  height_cm: z.coerce.number().min(50).max(300).optional(),
  weight_kg: z.coerce.number().min(20).max(500).optional(),
})

const step2Schema = z.object({
  fitness_level: z.enum(['beginner', 'intermediate', 'advanced']),
  primary_goal: z.enum(['weight_loss', 'muscle_gain', 'endurance', 'flexibility', 'general']),
  workout_frequency_per_week: z.coerce.number().min(1).max(7),
  preferred_duration_minutes: z.coerce.number().min(10).max(180),
})

const step3Schema = z.object({
  training_location: z.enum(['home', 'gym', 'outdoor', 'any']),
  available_equipment: z.array(z.string()),
  preferred_exercise_types: z.array(z.string()),
})

const step4Schema = z.object({
  has_visual_impairment: z.boolean(),
  has_hearing_impairment: z.boolean(),
  has_mobility_limitation: z.boolean(),
  mobility_notes: z.string().optional(),
  reduced_motion: z.boolean(),
  high_contrast_mode: z.boolean(),
  font_size_preference: z.enum(['sm', 'md', 'lg', 'xl']),
})

type Step1 = z.infer<typeof step1Schema>
type Step2 = z.infer<typeof step2Schema>
type Step3 = z.infer<typeof step3Schema>
type Step4 = z.infer<typeof step4Schema>

const EQUIPMENT_OPTIONS = [
  { value: 'dumbbells', label: 'Dumbbells' },
  { value: 'barbell', label: 'Barbell' },
  { value: 'pull_up_bar', label: 'Pull-up Bar' },
  { value: 'resistance_bands', label: 'Resistance Bands' },
  { value: 'kettlebell', label: 'Kettlebell' },
  { value: 'bench', label: 'Bench' },
  { value: 'yoga_mat', label: 'Yoga Mat' },
  { value: 'plyo_box', label: 'Plyometric Box' },
  { value: 'jump_rope', label: 'Jump Rope' },
]

const EXERCISE_TYPE_OPTIONS = [
  { value: 'strength', label: 'Strength Training' },
  { value: 'cardio', label: 'Cardio' },
  { value: 'hiit', label: 'HIIT' },
  { value: 'yoga', label: 'Yoga' },
  { value: 'flexibility', label: 'Flexibility' },
  { value: 'balance', label: 'Balance' },
]

const STEPS = [
  { title: 'About You', icon: User },
  { title: 'Goals', icon: Target },
  { title: 'Equipment', icon: Dumbbell },
  { title: 'Accessibility', icon: Accessibility },
  { title: 'Done!', icon: CheckCircle2 },
]

// ── Shared sub-components ─────────────────────────────────────────────────────

function StepHeader({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div>
      <h2 className="text-xl font-semibold text-white">{title}</h2>
      <p className="text-sm text-gray-400 mt-1">{subtitle}</p>
    </div>
  )
}

function StepFooter({
  onBack, isFirst, submitLabel = 'Continue', isLoading,
}: {
  onBack?: () => void; isFirst?: boolean; submitLabel?: string; isLoading?: boolean
}) {
  return (
    <div className={cn('flex mt-8 gap-3', onBack ? 'justify-between' : 'justify-end')}>
      {onBack && (
        <button type="button" onClick={onBack} className="btn-ghost flex items-center gap-1">
          <ChevronLeft className="w-4 h-4" aria-hidden="true" /> Back
        </button>
      )}
      {isFirst && <div />}
      <button type="submit" disabled={isLoading} className="btn-primary flex items-center gap-1">
        {isLoading ? 'Saving\u2026' : submitLabel}
        {!isLoading && <ChevronRight className="w-4 h-4" aria-hidden="true" />}
      </button>
    </div>
  )
}

const Field = forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement> & { label: string }>(
  ({ label, ...props }, ref) => (
    <div>
      <label className="block text-sm text-gray-400 mb-1.5">{label}</label>
      <input ref={ref} {...props} className="input w-full" />
    </div>
  )
)
Field.displayName = 'Field'

function ToggleCard({ selected, onClick, label, small }: {
  value: string; selected: boolean; onClick: () => void; label: string; small?: boolean
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      className={cn(
        'rounded-xl border text-sm font-medium transition-all text-left',
        small ? 'px-3 py-2' : 'px-4 py-3',
        selected
          ? 'border-primary-500 bg-primary-500/10 text-primary-300'
          : 'border-surface-600 bg-surface-700 text-gray-400 hover:border-gray-500'
      )}
    >
      {label}
    </button>
  )
}

const ToggleCheck = forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement> & { label: string; id: string }>(
  ({ label, id, ...props }, ref) => (
    <label
      htmlFor={id}
      className="flex items-center gap-3 rounded-xl border border-surface-600 bg-surface-700 px-4 py-3 cursor-pointer hover:border-gray-500 transition-colors"
    >
      <input ref={ref} id={id} type="checkbox" {...props} className="w-4 h-4 rounded accent-primary-500" />
      <span className="text-sm text-gray-300">{label}</span>
    </label>
  )
)
ToggleCheck.displayName = 'ToggleCheck'

// ── Step forms ────────────────────────────────────────────────────────────────

function Step1Form({ defaultValues, onNext }: { defaultValues: Partial<Step1>; onNext: (d: Step1) => void }) {
  const { register, handleSubmit } = useForm<Step1>({ resolver: zodResolver(step1Schema), defaultValues })
  return (
    <form onSubmit={handleSubmit(onNext)} noValidate>
      <StepHeader title="Tell us about yourself" subtitle="Helps us calculate accurate fitness metrics. All fields optional." />
      <div className="grid grid-cols-2 gap-4 mt-6">
        <Field label="Age" type="number" placeholder="25" {...register('age')} />
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
        <Field label="Height (cm)" type="number" placeholder="170" {...register('height_cm')} />
        <Field label="Weight (kg)" type="number" placeholder="70" {...register('weight_kg')} />
      </div>
      <StepFooter isFirst />
    </form>
  )
}

function Step2Form({ defaultValues, onNext, onBack }: { defaultValues: Partial<Step2>; onNext: (d: Step2) => void; onBack: () => void }) {
  const { register, handleSubmit, watch, setValue } = useForm<Step2>({
    resolver: zodResolver(step2Schema),
    defaultValues: { fitness_level: 'beginner', primary_goal: 'general', workout_frequency_per_week: 3, preferred_duration_minutes: 30, ...defaultValues },
  })
  const freq = watch('workout_frequency_per_week')
  const dur = watch('preferred_duration_minutes')
  const fitnessLevel = watch('fitness_level')
  const primaryGoal = watch('primary_goal')

  return (
    <form onSubmit={handleSubmit(onNext)} noValidate>
      <StepHeader title="Your fitness goals" subtitle="We'll tailor recommendations to your level and objective." />
      <div className="space-y-5 mt-6">
        <div>
          <label className="block text-sm text-gray-400 mb-2">Fitness level</label>
          <div className="grid grid-cols-3 gap-3">
            {(['beginner', 'intermediate', 'advanced'] as const).map(l => (
              <ToggleCard key={l} value={l} selected={fitnessLevel === l} onClick={() => setValue('fitness_level', l)}
                label={l.charAt(0).toUpperCase() + l.slice(1)} />
            ))}
          </div>
        </div>
        <div>
          <label className="block text-sm text-gray-400 mb-2">Primary goal</label>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {([
              { value: 'weight_loss', label: 'Lose Weight' },
              { value: 'muscle_gain', label: 'Build Muscle' },
              { value: 'endurance', label: 'Endurance' },
              { value: 'flexibility', label: 'Flexibility' },
              { value: 'general', label: 'General Fitness' },
            ] as const).map(g => (
              <ToggleCard key={g.value} value={g.value} selected={primaryGoal === g.value} onClick={() => setValue('primary_goal', g.value)} label={g.label} />
            ))}
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm text-gray-400 mb-1.5">
              Workouts per week: <span className="text-white font-medium">{freq}</span>
            </label>
            <input type="range" min={1} max={7} {...register('workout_frequency_per_week', { valueAsNumber: true })} className="w-full accent-primary-500" />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1.5">
              Session length: <span className="text-white font-medium">{dur} min</span>
            </label>
            <input type="range" min={10} max={120} step={5} {...register('preferred_duration_minutes', { valueAsNumber: true })} className="w-full accent-primary-500" />
          </div>
        </div>
      </div>
      <StepFooter onBack={onBack} />
    </form>
  )
}

function Step3Form({ defaultValues, onNext, onBack }: { defaultValues: Partial<Step3>; onNext: (d: Step3) => void; onBack: () => void }) {
  const { handleSubmit, watch, setValue } = useForm<Step3>({
    defaultValues: { available_equipment: [], preferred_exercise_types: [], training_location: 'any', ...defaultValues },
  })
  const equipment = watch('available_equipment') ?? []
  const types = watch('preferred_exercise_types') ?? []
  const location = watch('training_location')

  const toggle = (key: 'available_equipment' | 'preferred_exercise_types', val: string) => {
    const arr = watch(key) ?? []
    setValue(key, arr.includes(val) ? arr.filter((v: string) => v !== val) : [...arr, val])
  }

  return (
    <form onSubmit={handleSubmit(onNext)} noValidate>
      <StepHeader title="Your setup" subtitle="We'll filter exercises to what's practical for you." />
      <div className="space-y-5 mt-6">
        <div>
          <label className="block text-sm text-gray-400 mb-2">Training location</label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {(['home', 'gym', 'outdoor', 'any'] as const).map(l => (
              <ToggleCard key={l} value={l} selected={location === l} onClick={() => setValue('training_location', l)}
                label={l.charAt(0).toUpperCase() + l.slice(1)} />
            ))}
          </div>
        </div>
        <div>
          <label className="block text-sm text-gray-400 mb-2">
            Equipment available <span className="text-gray-600">(select all that apply)</span>
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {EQUIPMENT_OPTIONS.map(e => (
              <ToggleCard key={e.value} value={e.value} selected={equipment.includes(e.value)}
                onClick={() => toggle('available_equipment', e.value)} label={e.label} small />
            ))}
          </div>
        </div>
        <div>
          <label className="block text-sm text-gray-400 mb-2">Preferred exercise types</label>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {EXERCISE_TYPE_OPTIONS.map(e => (
              <ToggleCard key={e.value} value={e.value} selected={types.includes(e.value)}
                onClick={() => toggle('preferred_exercise_types', e.value)} label={e.label} small />
            ))}
          </div>
        </div>
      </div>
      <StepFooter onBack={onBack} />
    </form>
  )
}

function Step4Form({ defaultValues, onNext, onBack, isLoading, error }: {
  defaultValues: Partial<Step4>; onNext: (d: Step4) => void; onBack: () => void; isLoading: boolean; error?: string
}) {
  const { register, handleSubmit, watch, setValue } = useForm<Step4>({
    resolver: zodResolver(step4Schema),
    defaultValues: { has_visual_impairment: false, has_hearing_impairment: false, has_mobility_limitation: false, reduced_motion: false, high_contrast_mode: false, font_size_preference: 'md', ...defaultValues },
  })
  const hasMobility = watch('has_mobility_limitation')
  const fontSize = watch('font_size_preference')

  return (
    <form onSubmit={handleSubmit(onNext)} noValidate>
      <StepHeader title="Accessibility preferences" subtitle="Entirely optional. Used only to adapt your experience." />
      <p className="text-xs text-amber-400/80 bg-amber-400/10 border border-amber-400/20 rounded-lg p-3 mt-4" role="note">
        These settings reflect your personal preferences, not a medical assessment. Always consult a healthcare professional before starting a new exercise programme.
      </p>
      <div className="space-y-4 mt-5">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <ToggleCheck label="Visual impairment" id="vi" {...register('has_visual_impairment')} />
          <ToggleCheck label="Hearing impairment" id="hi" {...register('has_hearing_impairment')} />
          <ToggleCheck label="Mobility limitation" id="ml" {...register('has_mobility_limitation')} />
        </div>
        {hasMobility && (
          <div>
            <label htmlFor="mobility_notes" className="block text-sm text-gray-400 mb-1.5">
              Describe your mobility needs (optional)
            </label>
            <textarea
              id="mobility_notes"
              {...register('mobility_notes')}
              rows={2}
              className="input w-full resize-none"
              placeholder="e.g. lower back issues, avoid jumping exercises"
            />
          </div>
        )}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
          <ToggleCheck label="Reduced motion (fewer animations)" id="rm" {...register('reduced_motion')} />
          <ToggleCheck label="High contrast mode" id="hc" {...register('high_contrast_mode')} />
        </div>
        <div>
          <label className="block text-sm text-gray-400 mb-2">Text size preference</label>
          <div className="grid grid-cols-4 gap-2">
            {(['sm', 'md', 'lg', 'xl'] as const).map(s => (
              <ToggleCard key={s} value={s} selected={fontSize === s} onClick={() => setValue('font_size_preference', s)} label={s.toUpperCase()} small />
            ))}
          </div>
        </div>
      </div>
      {error && <p className="mt-4 text-sm text-red-400" role="alert">{error}</p>}
      <StepFooter onBack={onBack} submitLabel="Complete Setup" isLoading={isLoading} />
    </form>
  )
}

function CompletedStep({ onGo }: { onGo: () => void }) {
  return (
    <div className="text-center py-8">
      <div className="w-20 h-20 rounded-full bg-primary-500/20 flex items-center justify-center mx-auto mb-6">
        <CheckCircle2 className="w-10 h-10 text-primary-400" aria-hidden="true" />
      </div>
      <h2 className="text-2xl font-bold text-white mb-2">You're all set!</h2>
      <p className="text-gray-400 mb-8">Your personalised fitness journey starts now.</p>
      <button onClick={onGo} className="btn-primary px-8">Go to Dashboard</button>
    </div>
  )
}

// ── Main ──────────────────────────────────────────────────────────────────────

export default function OnboardingPage() {
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const [step, setStep] = useState(0)
  const [formData, setFormData] = useState<{
    step1: Partial<Step1>; step2: Partial<Step2>; step3: Partial<Step3>; step4: Partial<Step4>
  }>({
    step1: {},
    step2: { fitness_level: 'beginner', primary_goal: 'general', workout_frequency_per_week: 3, preferred_duration_minutes: 30 },
    step3: { training_location: 'any', available_equipment: [], preferred_exercise_types: [] },
    step4: { has_visual_impairment: false, has_hearing_impairment: false, has_mobility_limitation: false, reduced_motion: false, high_contrast_mode: false, font_size_preference: 'md' },
  })

  const completeMutation = useMutation({
    mutationFn: () => api.post('/profile/onboarding/complete', {
      basic: formData.step1,
      fitness: formData.step2,
      accessibility: formData.step4,
    }),
    onSuccess: () => {
      setStep(4)
    },
  })

  const handleNext = (stepKey: 'step1' | 'step2' | 'step3' | 'step4', stepData: Partial<Step1 | Step2 | Step3 | Step4>) => {
    const updated = { ...formData, [stepKey]: stepData }
    setFormData(updated)
    if (stepKey === 'step4') {
      completeMutation.mutate()
    } else {
      setStep(s => s + 1)
    }
  }

  return (
    <div className="min-h-screen bg-surface-900 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-white mb-1">
            Welcome, {user?.display_name?.split(' ')[0] ?? 'there'}!
          </h1>
          <p className="text-gray-400 text-sm">Let's personalise your experience — takes about 2 minutes</p>
        </div>

        {/* Progress bar */}
        <div className="flex items-center justify-between mb-8 px-2" role="list" aria-label="Setup progress">
          {STEPS.map((s, i) => {
            const Icon = s.icon
            const done = i < step
            const active = i === step
            return (
              <div key={i} className="flex items-center flex-1" role="listitem">
                <div className="flex flex-col items-center gap-1">
                  <div
                    className={cn(
                      'w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300',
                      done ? 'bg-primary-500 text-white' :
                      active ? 'bg-primary-500/20 border-2 border-primary-500 text-primary-400' :
                      'bg-surface-700 text-gray-500'
                    )}
                    aria-current={active ? 'step' : undefined}
                  >
                    {done ? <CheckCircle2 className="w-5 h-5" aria-hidden="true" /> : <Icon className="w-5 h-5" aria-hidden="true" />}
                  </div>
                  <span className={cn(
                    'text-xs hidden sm:block',
                    active ? 'text-primary-400' : done ? 'text-gray-300' : 'text-gray-600'
                  )}>
                    {s.title}
                  </span>
                </div>
                {i < STEPS.length - 1 && (
                  <div className={cn('flex-1 h-0.5 mx-2 mb-4 transition-colors duration-300', i < step ? 'bg-primary-500' : 'bg-surface-700')} />
                )}
              </div>
            )
          })}
        </div>

        <div className="card p-6 md:p-8">
          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
            >
              {step === 0 && (
                <Step1Form
                  defaultValues={formData.step1}
                  onNext={(d) => handleNext('step1', d)}
                />
              )}
              {step === 1 && (
                <Step2Form
                  defaultValues={formData.step2}
                  onNext={(d) => handleNext('step2', d)}
                  onBack={() => setStep(0)}
                />
              )}
              {step === 2 && (
                <Step3Form
                  defaultValues={formData.step3}
                  onNext={(d) => handleNext('step3', d)}
                  onBack={() => setStep(1)}
                />
              )}
              {step === 3 && (
                <Step4Form
                  defaultValues={formData.step4}
                  onNext={(d) => handleNext('step4', d)}
                  onBack={() => setStep(2)}
                  isLoading={completeMutation.isPending}
                  error={completeMutation.isError ? getErrorMessage(completeMutation.error) : undefined}
                />
              )}
              {step === 4 && (
                <CompletedStep onGo={() => navigate('/dashboard', { replace: true })} />
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        {step < 4 && (
          <p className="text-center mt-4">
            <button
              onClick={() => navigate('/dashboard')}
              className="text-sm text-gray-600 hover:text-gray-400 transition-colors"
            >
              Skip for now
            </button>
          </p>
        )}
      </div>
    </div>
  )
}
