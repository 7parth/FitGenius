import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import api, { getErrorMessage } from '@/lib/api'
import { useAuthStore } from '@/store/authStore'
import { toast } from '@/components/ui/Toast'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import type { AuthResponse } from '@/types'

const schema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
})
type FormData = z.infer<typeof schema>

export default function LoginPage() {
  const navigate = useNavigate()
  const setAuth = useAuthStore((s) => s.setAuth)
  const [showPassword, setShowPassword] = useState(false)

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema)
  })

  const onSubmit = async (data: FormData) => {
    try {
      const res = await api.post<AuthResponse>('/auth/login', data)
      setAuth(res.data.user, res.data.access_token, res.data.refresh_token)
      if (!res.data.user) {
        navigate('/onboarding')
      } else {
        navigate('/dashboard')
      }
    } catch (err) {
      toast.error(getErrorMessage(err))
    }
  }

  return (
    <div className="animate-fade-in text-on-surface">
      <div className="mb-6">
        <h1 className="text-2xl font-black text-on-surface font-headline-md tracking-tight">Authenticate Operator</h1>
        <p className="text-on-surface-variant text-sm mt-1">Sign in to initialize continuous biometric telemetry</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
        <div>
          <label htmlFor="email" className="block text-xs font-label-sm text-on-surface-variant uppercase tracking-wider mb-1.5">
            Email Address
          </label>
          <input
            id="email"
            type="email"
            autoComplete="email"
            className={`w-full px-4 py-2.5 rounded-xl bg-surface-container border text-sm text-on-surface transition-all focus:outline-none ${
              errors.email ? 'border-error focus:border-error' : 'border-outline-variant/40 focus:border-primary-container focus:ring-1 focus:ring-primary-container'
            }`}
            placeholder="you@example.com"
            aria-describedby={errors.email ? 'email-error' : undefined}
            aria-invalid={!!errors.email}
            {...register('email')}
          />
          {errors.email && (
            <p id="email-error" className="text-xs text-error mt-1" role="alert">{errors.email.message}</p>
          )}
        </div>

        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label htmlFor="password" className="block text-xs font-label-sm text-on-surface-variant uppercase tracking-wider">
              Password
            </label>
          </div>
          <div className="relative">
            <input
              id="password"
              type={showPassword ? 'text' : 'password'}
              autoComplete="current-password"
              className={`w-full px-4 py-2.5 rounded-xl bg-surface-container border text-sm text-on-surface pr-10 transition-all focus:outline-none ${
                errors.password ? 'border-error focus:border-error' : 'border-outline-variant/40 focus:border-primary-container focus:ring-1 focus:ring-primary-container'
              }`}
              placeholder="••••••••"
              aria-describedby={errors.password ? 'password-error' : undefined}
              aria-invalid={!!errors.password}
              {...register('password')}
            />
            <button
              type="button"
              className="absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-on-surface transition-colors"
              onClick={() => setShowPassword((v) => !v)}
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              <span className="material-symbols-outlined text-lg">
                {showPassword ? 'visibility_off' : 'visibility'}
              </span>
            </button>
          </div>
          {errors.password && (
            <p id="password-error" className="text-xs text-error mt-1" role="alert">{errors.password.message}</p>
          )}
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full py-3 px-4 rounded-xl bg-primary-container hover:bg-[#38f4ff] text-on-primary-container font-extrabold text-sm tracking-wide transition shadow-[0_0_20px_rgba(0,240,255,0.35)] flex items-center justify-center gap-2 disabled:opacity-60"
          aria-busy={isSubmitting}
        >
          {isSubmitting ? (
            <LoadingSpinner size="sm" />
          ) : (
            <>
              <span className="material-symbols-outlined text-base">login</span>
              <span>Sign In to Telemetry Engine</span>
            </>
          )}
        </button>
      </form>

      <p className="mt-6 text-center text-xs text-on-surface-variant">
        Don&apos;t have an active bio-profile?{' '}
        <Link to="/register" className="text-primary hover:underline font-semibold">
          Initialize Access
        </Link>
      </p>
    </div>
  )
}
