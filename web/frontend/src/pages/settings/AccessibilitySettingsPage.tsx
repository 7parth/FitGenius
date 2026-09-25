import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { Eye, Ear, Accessibility, Monitor, Type, Save } from 'lucide-react'
import { api, getErrorMessage } from '@/lib/api'
import { useAccessibilityStore } from '@/store/accessibilityStore'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { cn } from '@/lib/utils'

export default function AccessibilitySettingsPage() {
  const qc = useQueryClient()
  const { updateProfile } = useAccessibilityStore()

  const { data: profile, isLoading } = useQuery({
    queryKey: ['accessibility-profile'],
    queryFn: () => api.get('/profile/accessibility').then(r => r.data),
  })

  const { register, handleSubmit, watch, setValue, reset } = useForm({
    defaultValues: profile ?? {},
  })

  // Sync form when data loads
  if (profile && Object.keys(watch()).length === 0) reset(profile)

  const saveMutation = useMutation({
    mutationFn: (data: any) => api.put('/profile/accessibility', data).then(r => r.data),
    onSuccess: (saved) => {
      qc.setQueryData(['accessibility-profile'], saved)
      // Apply to DOM immediately
      updateProfile(saved)
    },
  })

  if (isLoading) return <div className="flex justify-center py-16"><LoadingSpinner /></div>

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Accessibility Settings</h1>
        <p className="text-gray-400 text-sm mt-1">Adapt FitGenius to suit your needs</p>
      </div>

      <form onSubmit={handleSubmit((d) => saveMutation.mutate(d))} noValidate>
        {/* Impairments */}
        <section className="card p-6 mb-4 space-y-4" aria-labelledby="impairments-heading">
          <h2 id="impairments-heading" className="font-semibold text-white flex items-center gap-2">
            <Accessibility className="w-4 h-4 text-primary-400" aria-hidden="true" /> Physical Preferences
          </h2>
          <p className="text-xs text-gray-500">
            These are personal preferences to adapt your experience — not a medical assessment.
          </p>
          <div className="space-y-3">
            <CheckRow id="visual" label="Visual impairment" description="Enable screen-reader optimisations and larger touch targets" {...register('has_visual_impairment')} />
            <CheckRow id="hearing" label="Hearing impairment" description="Enable captions and visual cues for audio content" {...register('has_hearing_impairment')} />
            <CheckRow id="mobility" label="Mobility limitation" description="Filter out high-impact exercises by default" {...register('has_mobility_limitation')} />
          </div>
        </section>

        {/* Display */}
        <section className="card p-6 mb-4 space-y-4" aria-labelledby="display-heading">
          <h2 id="display-heading" className="font-semibold text-white flex items-center gap-2">
            <Monitor className="w-4 h-4 text-primary-400" aria-hidden="true" /> Display
          </h2>
          <div className="space-y-3">
            <CheckRow id="contrast" label="High contrast mode" description="Increase colour contrast for better visibility" {...register('high_contrast_mode')} />
            <CheckRow id="motion" label="Reduce motion" description="Minimise animations and transitions" {...register('reduced_motion')} />
            <CheckRow id="simplified" label="Simplified interface" description="Hide non-essential decorative elements" {...register('simplified_ui')} />
          </div>
        </section>

        {/* Text size */}
        <section className="card p-6 mb-6 space-y-4" aria-labelledby="text-heading">
          <h2 id="text-heading" className="font-semibold text-white flex items-center gap-2">
            <Type className="w-4 h-4 text-primary-400" aria-hidden="true" /> Text Size
          </h2>
          <div className="grid grid-cols-4 gap-3" role="group" aria-label="Text size preference">
            {(['sm', 'md', 'lg', 'xl'] as const).map(size => (
              <button
                key={size}
                type="button"
                onClick={() => setValue('font_size_preference', size)}
                aria-pressed={watch('font_size_preference') === size}
                className={cn(
                  'rounded-xl border py-3 font-medium transition-all',
                  watch('font_size_preference') === size
                    ? 'border-primary-500 bg-primary-500/10 text-primary-300'
                    : 'border-surface-600 bg-surface-700 text-gray-400 hover:border-gray-500'
                )}
                style={{ fontSize: size === 'sm' ? 12 : size === 'md' ? 14 : size === 'lg' ? 16 : 18 }}
              >
                {size.toUpperCase()}
              </button>
            ))}
          </div>
          <p className="text-xs text-gray-500">
            Sample:{' '}
            <span style={{ fontSize: watch('font_size_preference') === 'xl' ? 18 : watch('font_size_preference') === 'lg' ? 16 : 14 }}>
              The quick brown fox
            </span>
          </p>
        </section>

        {saveMutation.isError && (
          <p className="text-sm text-red-400 mb-4" role="alert">{getErrorMessage(saveMutation.error)}</p>
        )}
        {saveMutation.isSuccess && (
          <p className="text-sm text-emerald-400 mb-4" role="status">Preferences saved!</p>
        )}

        <button type="submit" disabled={saveMutation.isPending} className="btn-primary flex items-center gap-2">
          <Save className="w-4 h-4" aria-hidden="true" />
          {saveMutation.isPending ? 'Saving…' : 'Save Preferences'}
        </button>
      </form>
    </div>
  )
}

import { forwardRef } from 'react'

const CheckRow = forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement> & { id: string; label: string; description: string }>(
  ({ id, label, description, ...props }, ref) => (
    <label
      htmlFor={id}
      className="flex items-start gap-4 p-4 rounded-xl bg-surface-700 cursor-pointer hover:bg-surface-600 transition-colors group"
    >
      <input ref={ref} id={id} type="checkbox" {...props} className="mt-1 w-4 h-4 rounded accent-primary-500 flex-shrink-0" />
      <div>
        <p className="text-sm font-medium text-white group-hover:text-primary-200 transition-colors">{label}</p>
        <p className="text-xs text-gray-500 mt-0.5">{description}</p>
      </div>
    </label>
  )
)
CheckRow.displayName = 'CheckRow'
