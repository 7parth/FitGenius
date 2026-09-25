import { NavLink, useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/store/authStore'
import api from '@/lib/api'
import { toast } from '@/components/ui/Toast'

interface NavItem {
  to: string
  icon: string
  label: string
  adminOnly?: boolean
}

const navItems: NavItem[] = [
  { to: '/dashboard', icon: 'dashboard', label: 'Dashboard' },
  { to: '/workout/pose', icon: 'videocam', label: 'Pose Tracker' },
  { to: '/nutrition', icon: 'restaurant', label: 'Nutrition' },
  { to: '/coach', icon: 'psychology', label: 'AI Coach' },
  { to: '/leaderboard', icon: 'emoji_events', label: 'Leaderboard' },
  { to: '/workout/recommend', icon: 'fitness_center', label: 'Workouts' },
  { to: '/progress', icon: 'trending_up', label: 'Progress' },
  { to: '/wearables', icon: 'watch', label: 'Wearables' },
]

const adminItems: NavItem[] = [
  { to: '/admin', icon: 'admin_panel_settings', label: 'Admin Dashboard', adminOnly: true },
  { to: '/admin/users', icon: 'group', label: 'Users', adminOnly: true },
  { to: '/admin/exercises', icon: 'exercise', label: 'Exercises DB', adminOnly: true },
  { to: '/admin/challenges', icon: 'swords', label: 'Challenges', adminOnly: true },
]

export function Sidebar({ onClose }: { onClose?: () => void }) {
  const { user, logout } = useAuthStore()
  const navigate = useNavigate()

  const handleLogout = async () => {
    try {
      await api.post('/auth/logout')
    } catch {
      // ignore
    }
    logout()
    navigate('/login')
    toast.info('Logged out successfully')
  }

  return (
    <aside className="h-full w-72 bg-surface-container-low shadow-[0_1px_8px_rgba(0,0,0,0.4)] z-50 flex flex-col justify-between pt-6 pb-6 border-r border-surface-container-high/40">
      <div className="flex flex-col gap-6">
        {/* Logo */}
        <div className="px-6 flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-primary-container/20 flex items-center justify-center text-primary-container shadow-[0_0_12px_rgba(0,240,255,0.4)]">
            <span className="material-symbols-outlined text-xl">bolt</span>
          </div>
          <div className="flex flex-col">
            <span className="font-headline-sm text-headline-sm text-primary tracking-wide leading-none">FitGenius</span>
            <span className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-widest mt-1">Precision Bio-AI</span>
          </div>
        </div>

        {/* Navigation Links */}
        <div className="px-4">
          <nav className="flex flex-col gap-1.5" aria-label="Main Navigation">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === '/dashboard'}
                onClick={onClose}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-4 py-3 rounded-xl transition-all group ${
                    isActive
                      ? 'bg-primary-container text-on-primary-container font-bold shadow-[0_0_24px_rgba(0,240,255,0.25)]'
                      : 'text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface'
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    <span
                      className={`material-symbols-outlined text-xl transition-colors ${
                        isActive ? 'text-on-primary-container' : 'group-hover:text-primary'
                      }`}
                    >
                      {item.icon}
                    </span>
                    <span className="font-label-md text-label-md">{item.label}</span>
                  </>
                )}
              </NavLink>
            ))}

            {user?.role === 'admin' && (
              <div className="pt-4 border-t border-surface-container-high/50 mt-2">
                <span className="px-4 mb-2 text-xs font-semibold text-secondary uppercase tracking-wider block">
                  Admin
                </span>
                {adminItems.map((item) => (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    onClick={onClose}
                    className={({ isActive }) =>
                      `flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all group ${
                        isActive
                          ? 'bg-primary-container text-on-primary-container font-bold shadow-[0_0_24px_rgba(0,240,255,0.25)]'
                          : 'text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface'
                      }`
                    }
                  >
                    <span className="material-symbols-outlined text-xl group-hover:text-primary">
                      {item.icon}
                    </span>
                    <span className="font-label-md text-label-md">{item.label}</span>
                  </NavLink>
                ))}
              </div>
            )}
          </nav>
        </div>
      </div>

      {/* Bottom Neural Engine & Settings/Logout */}
      <div className="px-4 flex flex-col gap-3">
        {/* Neural Engine Status Badge */}
        <div className="bg-surface-container p-4 rounded-xl flex flex-col gap-2 shadow-[0_4px_20px_-2px_rgba(0,0,0,0.5)]">
          <div className="flex items-center justify-between">
            <span className="font-label-sm text-label-sm text-on-surface-variant uppercase">Neural Engine</span>
            <span className="w-2 h-2 rounded-full bg-secondary shadow-[0_0_8px_rgba(78,222,163,0.8)]"></span>
          </div>
          <span className="font-code-stat text-code-stat text-primary">v4.2.0-ULTRA • 60 FPS</span>
        </div>

        <nav className="flex flex-col gap-1">
          <NavLink
            to="/settings/accessibility"
            onClick={onClose}
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all ${
                isActive
                  ? 'bg-primary-container text-on-primary-container font-bold'
                  : 'text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface'
              }`
            }
          >
            <span className="material-symbols-outlined text-xl">tune</span>
            <span className="font-label-md text-label-md">Accessibility</span>
          </NavLink>

          <NavLink
            to="/settings/profile"
            onClick={onClose}
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all ${
                isActive
                  ? 'bg-primary-container text-on-primary-container font-bold'
                  : 'text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface'
              }`
            }
          >
            <span className="material-symbols-outlined text-xl">settings</span>
            <span className="font-label-md text-label-md">Settings</span>
          </NavLink>

          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-on-surface-variant hover:text-error hover:bg-error-container/20 transition-all text-left"
          >
            <span className="material-symbols-outlined text-xl">logout</span>
            <span className="font-label-md text-label-md">Log Out</span>
          </button>
        </nav>
      </div>
    </aside>
  )
}
