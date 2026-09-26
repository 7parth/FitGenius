import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { useState } from 'react'
import { Sidebar } from './Sidebar'
import { ToastContainer } from '@/components/ui/Toast'
import { NotificationBell } from './NotificationBell'
import { useAuthStore } from '@/store/authStore'

const bottomNavItems = [
  { to: '/dashboard', icon: 'dashboard', label: 'Home' },
  { to: '/workout/pose', icon: 'videocam', label: 'Pose' },
  { to: '/nutrition', icon: 'restaurant', label: 'Nutrition' },
  { to: '/coach', icon: 'psychology', label: 'Coach' },
  { to: '/leaderboard', icon: 'emoji_events', label: 'League' },
]

export function AppLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const { user } = useAuthStore()
  const navigate = useNavigate()

  return (
    <div className="flex h-screen overflow-hidden bg-surface text-on-surface font-body-md text-body-md antialiased selection:bg-primary-container selection:text-on-primary-container">
      {/* Desktop Sidebar (Fixed Left 72) */}
      <div className="hidden lg:block lg:w-72 lg:flex-shrink-0">
        <Sidebar />
      </div>

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true" aria-label="Navigation menu">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setSidebarOpen(false)} aria-hidden="true" />
          <div className="absolute left-0 top-0 h-full w-72 z-50 animate-slide-in-right">
            <Sidebar onClose={() => setSidebarOpen(false)} />
          </div>
        </div>
      )}

      {/* Main Layout Container */}
      <div className="flex-1 flex flex-col overflow-hidden lg:pl-0">
        {/* Desktop & Mobile Header */}
        <header className="h-16 bg-surface/80 backdrop-blur-xl border-b border-surface-container-high/40 z-40 flex items-center justify-between px-4 lg:px-8 flex-shrink-0">
          {/* Mobile hamburger button */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 rounded-lg text-on-surface-variant hover:text-white hover:bg-surface-container-high"
              aria-label="Open navigation menu"
            >
              <span className="material-symbols-outlined text-2xl">menu</span>
            </button>

            {/* Left Telemetry Chips */}
            <div className="hidden xl:flex items-center gap-2 px-3 py-1.5 rounded-full bg-surface-container-low border border-surface-container-high/40">
              <span className="w-2 h-2 rounded-full bg-primary-container shadow-[0_0_8px_rgba(0,240,255,0.7)] animate-pulse"></span>
              <span className="font-code-stat text-code-stat text-on-surface-variant">Telemetry Synced • Camera Engine 60 FPS Standby</span>
            </div>

            <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-secondary-container/20 border border-secondary-container/30">
              <span className="material-symbols-outlined text-sm text-secondary">vital_signs</span>
              <span className="font-label-sm text-label-sm text-secondary font-semibold">Recovery: 94% • Optimal</span>
            </div>
          </div>

          {/* Right Action Icons & Profile */}
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/workout/recommend')}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary-container text-on-primary-container font-label-md text-label-md font-bold shadow-[0_0_16px_rgba(0,240,255,0.35)] hover:shadow-[0_0_24px_rgba(0,240,255,0.55)] transition-all"
              type="button"
            >
              <span className="material-symbols-outlined text-lg leading-none">add</span>
              <span className="hidden sm:inline">Log Workout</span>
            </button>

            <NotificationBell />

            <div
              onClick={() => navigate('/settings/profile')}
              className="flex items-center gap-3 pl-1 cursor-pointer group"
            >
              <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-primary-container to-secondary flex items-center justify-center font-bold text-xs text-on-primary-fixed shadow-[0_0_10px_rgba(0,240,255,0.4)]">
                {user?.display_name?.[0]?.toUpperCase() || 'A'}
              </div>
              <div className="hidden sm:flex flex-col text-left">
                <span className="font-label-md text-label-md text-on-surface leading-tight group-hover:text-primary transition-colors">
                  {user?.display_name || 'Parth Waradkar'}
                </span>
                <span className="font-label-sm text-label-sm text-on-surface-variant leading-none mt-0.5 uppercase tracking-wide">
                  {user?.role === 'admin' ? 'System Admin' : 'Pro Biohacker'}
                </span>
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main id="main-content" className="flex-1 overflow-y-auto pb-16 lg:pb-0 bg-surface">
          <Outlet />
        </main>

        {/* Mobile bottom nav */}
        <nav
          className="lg:hidden fixed bottom-0 left-0 right-0 bg-surface-container-low/95 backdrop-blur-md border-t border-surface-container-high z-30"
          aria-label="Bottom navigation"
        >
          <div className="flex items-center justify-around px-2 py-2">
            {bottomNavItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === '/dashboard'}
                className={({ isActive }) =>
                  `flex flex-col items-center gap-1 px-3 py-1.5 rounded-xl text-xs transition-colors min-w-0 ${
                    isActive ? 'text-primary-container font-bold' : 'text-on-surface-variant hover:text-white'
                  }`
                }
              >
                <span className="material-symbols-outlined text-xl">{item.icon}</span>
                <span className="text-[10px] tracking-tight">{item.label}</span>
              </NavLink>
            ))}
          </div>
        </nav>
      </div>

      <ToastContainer />
    </div>
  )
}
