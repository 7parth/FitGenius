import { NavLink, useNavigate } from 'react-router-dom'
import {
  Activity, LayoutDashboard, Dumbbell, Brain, TrendingUp,
  Trophy, Swords, Users, Settings, LogOut, ChevronRight,
  Zap, Camera, Watch, Shield, ListOrdered, Utensils
} from 'lucide-react'

import { cn } from '@/lib/utils'
import { useAuthStore } from '@/store/authStore'
import api from '@/lib/api'
import { toast } from '@/components/ui/Toast'

import { NotificationBell } from './NotificationBell'

interface NavItem {
  to: string
  icon: React.ElementType
  label: string
  badge?: string
  adminOnly?: boolean
  secondary?: boolean
}

const navItems: NavItem[] = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/workout/recommend', icon: Dumbbell, label: 'Workout' },
  { to: '/nutrition', icon: Utensils, label: 'Nutrition' },
  { to: '/exercises', icon: ListOrdered, label: 'Exercises' },
  { to: '/workout/pose', icon: Camera, label: 'Form Analysis' },
  { to: '/coach', icon: Brain, label: 'AI Coach' },
  { to: '/progress', icon: TrendingUp, label: 'Progress' },
  { to: '/achievements', icon: Trophy, label: 'Achievements', secondary: true },
  { to: '/leaderboard', icon: Swords, label: 'Leaderboard', secondary: true },
  { to: '/challenges', icon: Zap, label: 'Challenges', secondary: true },
  { to: '/wearables', icon: Watch, label: 'Wearables', secondary: true },
]

const adminItems: NavItem[] = [
  { to: '/admin', icon: Shield, label: 'Admin Dashboard', adminOnly: true },
  { to: '/admin/users', icon: Users, label: 'Users', adminOnly: true },
  { to: '/admin/exercises', icon: Dumbbell, label: 'Exercises DB', adminOnly: true },
  { to: '/admin/challenges', icon: Swords, label: 'Challenges', adminOnly: true },
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
    <nav className="flex flex-col h-full bg-surface-900 border-r border-gray-800" aria-label="Main navigation">
      {/* Logo & Notification Bell */}
      <div className="flex items-center justify-between px-6 py-5 border-b border-gray-800">
        <div className="flex items-center gap-3">
          <div className="rounded-xl bg-primary-500 p-2 flex-shrink-0">
            <Activity className="h-5 w-5 text-white" aria-hidden="true" />
          </div>
          <span className="text-lg font-bold text-white">FitGenius</span>
        </div>
        <NotificationBell />
      </div>

      {/* Nav items */}
      <div className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
        {navItems.map((item) => {
          if (item.secondary) return null // shown below
          return <SidebarLink key={item.to} item={item} onClose={onClose} />
        })}

        {/* Secondary section */}
        <div className="pt-4">
          <p className="px-3 mb-2 text-xs font-medium text-gray-500 uppercase tracking-wider nav-item-secondary">Community</p>
          {navItems.filter((i) => i.secondary).map((item) => (
            <SidebarLink key={item.to} item={item} onClose={onClose} secondary />
          ))}
        </div>

        {/* Admin section */}
        {user?.role === 'admin' && (
          <div className="pt-4">
            <p className="px-3 mb-2 text-xs font-medium text-amber-500/80 uppercase tracking-wider">Admin</p>
            {adminItems.map((item) => (
              <SidebarLink key={item.to} item={item} onClose={onClose} />
            ))}
          </div>
        )}
      </div>

      {/* User section */}
      <div className="border-t border-gray-800 p-3 space-y-1">
        <NavLink
          to="/settings/accessibility"
          className={({ isActive }) => cn(
            'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors',
            isActive ? 'bg-primary-500/20 text-primary-300' : 'text-gray-400 hover:text-gray-200 hover:bg-white/5'
          )}
          onClick={onClose}
        >
          <Settings className="h-4 w-4 flex-shrink-0" aria-hidden="true" />
          <span>Accessibility</span>
        </NavLink>
        <NavLink
          to="/settings/profile"
          className={({ isActive }) => cn(
            'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors',
            isActive ? 'bg-primary-500/20 text-primary-300' : 'text-gray-400 hover:text-gray-200 hover:bg-white/5'
          )}
          onClick={onClose}
        >
          <div className="h-6 w-6 rounded-full bg-primary-500/30 flex items-center justify-center flex-shrink-0">
            <span className="text-xs font-bold text-primary-300" aria-hidden="true">
              {user?.display_name?.[0]?.toUpperCase() || '?'}
            </span>
          </div>
          <span className="text-gray-300 truncate max-w-32">{user?.display_name || 'Profile'}</span>
          <ChevronRight className="h-3 w-3 ml-auto opacity-50" aria-hidden="true" />
        </NavLink>
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-gray-400 hover:text-red-400 hover:bg-red-500/10 transition-colors"
          aria-label="Log out"
        >
          <LogOut className="h-4 w-4 flex-shrink-0" aria-hidden="true" />
          <span>Log Out</span>
        </button>
      </div>
    </nav>
  )
}

function SidebarLink({ item, onClose, secondary }: { item: NavItem; onClose?: () => void; secondary?: boolean }) {
  const Icon = item.icon
  return (
    <NavLink
      to={item.to}
      end={item.to === '/dashboard' || item.to === '/admin'}
      aria-current="page"
      className={({ isActive }) => cn(
        'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary-500',
        isActive
          ? 'bg-primary-500/20 text-primary-300 font-medium'
          : 'text-gray-400 hover:text-gray-200 hover:bg-white/5',
        secondary && 'nav-item-secondary'
      )}
      onClick={onClose}
    >
      {({ isActive }) => (
        <>
          <Icon className={cn('h-4 w-4 flex-shrink-0', isActive ? 'text-primary-400' : '')} aria-hidden="true" />
          <span>{item.label}</span>
          {isActive && <ChevronRight className="h-3 w-3 ml-auto" aria-hidden="true" />}
        </>
      )}
    </NavLink>
  )
}
