import { Outlet, NavLink } from 'react-router-dom'
import { useState } from 'react'
import { Menu, X, LayoutDashboard, Dumbbell, Brain, TrendingUp, Trophy } from 'lucide-react'
import { Sidebar } from './Sidebar'
import { ToastContainer } from '@/components/ui/Toast'
import { NotificationBell } from './NotificationBell'
import { cn } from '@/lib/utils'

const bottomNavItems = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Home' },
  { to: '/workout/recommend', icon: Dumbbell, label: 'Workout' },
  { to: '/coach', icon: Brain, label: 'Coach' },
  { to: '/progress', icon: TrendingUp, label: 'Progress' },
  { to: '/achievements', icon: Trophy, label: 'Rewards' },
]

export function AppLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div className="flex h-screen overflow-hidden bg-surface-900">
      {/* Desktop Sidebar */}
      <div className="hidden lg:flex lg:w-64 lg:flex-shrink-0">
        <Sidebar />
      </div>

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 lg:hidden" role="dialog" aria-modal="true" aria-label="Navigation menu">
          <div className="absolute inset-0 bg-black/60" onClick={() => setSidebarOpen(false)} aria-hidden="true" />
          <div className="absolute left-0 top-0 h-full w-72 z-50 animate-slide-in-right">
            <Sidebar onClose={() => setSidebarOpen(false)} />
          </div>
        </div>
      )}

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Mobile header */}
        <header className="lg:hidden flex items-center justify-between px-4 py-3 border-b border-gray-800 bg-surface-900 flex-shrink-0">
          <button
            onClick={() => setSidebarOpen(true)}
            className="btn-ghost btn-icon"
            aria-label="Open navigation menu"
            aria-expanded={sidebarOpen}
            aria-controls="mobile-nav"
          >
            {sidebarOpen ? <X className="h-5 w-5" aria-hidden="true" /> : <Menu className="h-5 w-5" aria-hidden="true" />}
          </button>
          <span className="text-base font-semibold text-white">FitGenius</span>
          <NotificationBell />
        </header>

        {/* Page content */}
        <main id="main-content" className="flex-1 overflow-y-auto pb-16 lg:pb-0">
          <Outlet />
        </main>

        {/* Mobile bottom nav */}
        <nav
          className="lg:hidden fixed bottom-0 left-0 right-0 bg-surface-900 border-t border-gray-800 z-30"
          aria-label="Bottom navigation"
        >
          <div className="flex items-center justify-around px-2 py-2">
            {bottomNavItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === '/dashboard'}
                className={({ isActive }) => cn(
                  'flex flex-col items-center gap-1 px-3 py-1.5 rounded-xl text-xs transition-colors min-w-0',
                  isActive ? 'text-primary-400' : 'text-gray-500 hover:text-gray-300'
                )}
              >
                {({ isActive }: { isActive: boolean }) => (
                  <>
                    <item.icon className={cn('h-5 w-5', isActive ? 'text-primary-400' : '')} aria-hidden="true" />
                    <span className="truncate">{item.label}</span>
                  </>
                )}
              </NavLink>
            ))}
          </div>
        </nav>
      </div>

      <ToastContainer />
    </div>
  )
}
