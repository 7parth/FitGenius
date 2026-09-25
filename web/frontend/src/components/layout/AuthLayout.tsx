import { Outlet } from 'react-router-dom'
import { Activity } from 'lucide-react'
import { ToastContainer } from '@/components/ui/Toast'

export function AuthLayout() {
  return (
    <div className="min-h-screen bg-surface-900 flex">
      {/* Left panel — branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-primary-900 via-surface-900 to-surface-900 flex-col items-center justify-center p-12 relative overflow-hidden" aria-hidden="true">
        <div className="absolute inset-0 bg-grid-pattern opacity-10" />
        <div className="relative z-10 text-center">
          <div className="flex items-center justify-center gap-3 mb-8">
            <div className="rounded-2xl bg-primary-500 p-3">
              <Activity className="h-10 w-10 text-white" />
            </div>
            <span className="text-4xl font-bold text-white">FitGenius</span>
          </div>
          <h1 className="text-3xl font-bold text-white mb-4">AI Fitness for Everyone</h1>
          <p className="text-gray-400 text-lg max-w-md">
            Personalized workouts, real-time form analysis, and an AI coach — built with accessibility at its core.
          </p>
          <div className="mt-12 grid grid-cols-2 gap-4 text-left">
            {[
              { icon: '🤖', label: 'AI-Powered Plans', desc: 'Personalized to your goals' },
              { icon: '📸', label: 'Pose Analysis', desc: 'Real-time form feedback' },
              { icon: '♿', label: 'Fully Accessible', desc: 'WCAG 2.1 AA compliant' },
              { icon: '🏆', label: 'Gamification', desc: 'Earn badges and compete' },
            ].map((f) => (
              <div key={f.label} className="rounded-xl bg-white/5 border border-white/10 p-4">
                <div className="text-2xl mb-2">{f.icon}</div>
                <div className="text-sm font-medium text-white">{f.label}</div>
                <div className="text-xs text-gray-400">{f.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right panel — auth form */}
      <div className="flex-1 flex flex-col items-center justify-center p-6">
        {/* Mobile logo */}
        <div className="flex items-center gap-2 mb-8 lg:hidden">
          <div className="rounded-xl bg-primary-500 p-2">
            <Activity className="h-6 w-6 text-white" />
          </div>
          <span className="text-2xl font-bold text-white">FitGenius</span>
        </div>
        <div className="w-full max-w-md">
          <main id="main-content">
            <Outlet />
          </main>
        </div>
      </div>

      <ToastContainer />
    </div>
  )
}
