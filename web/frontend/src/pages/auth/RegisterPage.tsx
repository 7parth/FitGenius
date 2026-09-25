import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Eye, EyeOff, UserPlus } from 'lucide-react'
import api, { getErrorMessage } from '@/lib/api'
import { useAuthStore } from '@/store/authStore'
import { toast } from '@/components/ui/Toast'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import type { AuthResponse } from '@/types'

const schema = z.object({
  display_name: z.string().min(2, 'Name must be at least 2 characters').max(60),
  email: z.string().email('Invalid email address'),
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[a-zA-Z]/, 'Must contain at least one letter')
    .regex(/[0-9]/, 'Must contain at least one number'),
  confirm_password: z.string(),
}).refine((d) => d.password === d.confirm_password, {
  message: "Passwords don't match",
  path: ['confirm_password'],
})
type FormData = z.infer<typeof schema>

export default function RegisterPage() {
  const navigate = useNavigate()
  const setAuth = useAuthStore((s) => s.setAuth)
  const [showPassword, setShowPassword] = useState(false)

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema)
  })

  const onSubmit = async (data: FormData) => {
    try {
      const res = await api.post<AuthResponse>('/auth/register', {
        display_name: data.display_name,
        email: data.email,
        password: data.password,
      })
      setAuth(res.data.user, res.data.access_token, res.data.refresh_token)
      toast.success('Account created! Let\'s set up your profile.')
      navigate('/onboarding')
    } catch (err) {
      toast.error(getErrorMessage(err))
    }
  }

  return (
    <div className="animate-fade-in">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white">Create your account</h1>
        <p className="text-gray-400 mt-1">Start your accessible fitness journey today</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
        <div>
          <label htmlFor="display_name" className="label">Your name</label>
          <input
            id="display_name"
            type="text"
            autoComplete="name"
            className={`input ${errors.display_name ? 'input-error' : ''}`}
            placeholder="Alex Johnson"
            aria-describedby={errors.display_name ? 'name-error' : undefined}
            aria-invalid={!!errors.display_name}
            {...register('display_name')}
          />
          {errors.display_name && <p id="name-error" className="error-message" role="alert">{errors.display_name.message}</p>}
        </div>

        <div>
          <label htmlFor="email" className="label">Email address</label>
          <input
            id="email"
            type="email"
            autoComplete="email"
            className={`input ${errors.email ? 'input-error' : ''}`}
            placeholder="you@example.com"
            aria-describedby={errors.email ? 'email-error' : undefined}
            aria-invalid={!!errors.email}
            {...register('email')}
          />
          {errors.email && <p id="email-error" className="error-message" role="alert">{errors.email.message}</p>}
        </div>

        <div>
          <label htmlFor="password" className="label">Password</label>
          <div className="relative">
            <input
              id="password"
              type={showPassword ? 'text' : 'password'}
              autoComplete="new-password"
              className={`input pr-10 ${errors.password ? 'input-error' : ''}`}
              placeholder="Min. 8 chars, letter + number"
              aria-describedby={errors.password ? 'password-error' : 'password-hint'}
              aria-invalid={!!errors.password}
              {...register('password')}
            />
            <button
              type="button"
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-200"
              onClick={() => setShowPassword((v) => !v)}
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? <EyeOff className="h-4 w-4" aria-hidden="true" /> : <Eye className="h-4 w-4" aria-hidden="true" />}
            </button>
          </div>
          {errors.password
            ? <p id="password-error" className="error-message" role="alert">{errors.password.message}</p>
            : <p id="password-hint" className="mt-1 text-xs text-gray-500">At least 8 characters with a letter and number</p>}
        </div>

        <div>
          <label htmlFor="confirm_password" className="label">Confirm password</label>
          <input
            id="confirm_password"
            type={showPassword ? 'text' : 'password'}
            autoComplete="new-password"
            className={`input ${errors.confirm_password ? 'input-error' : ''}`}
            placeholder="••••••••"
            aria-describedby={errors.confirm_password ? 'confirm-error' : undefined}
            aria-invalid={!!errors.confirm_password}
            {...register('confirm_password')}
          />
          {errors.confirm_password && <p id="confirm-error" className="error-message" role="alert">{errors.confirm_password.message}</p>}
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="btn-primary w-full btn-lg mt-2"
          aria-busy={isSubmitting}
        >
          {isSubmitting ? <LoadingSpinner size="sm" /> : <UserPlus className="h-4 w-4" aria-hidden="true" />}
          {isSubmitting ? 'Creating account...' : 'Create account'}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-gray-400">
        Already have an account?{' '}
        <Link to="/login" className="text-primary-400 hover:text-primary-300 font-medium underline-offset-4 hover:underline">
          Sign in
        </Link>
      </p>
    </div>
  )
}
