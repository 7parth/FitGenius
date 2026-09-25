import React, { useState, useEffect, useRef } from 'react'
import { Bell, CheckCheck, Trash2, Award, Zap, HeartPulse, Info } from 'lucide-react'
import { notificationsApi } from '@/lib/api'
import { AppNotification } from '@/types'

export const NotificationBell: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false)
  const [unreadCount, setUnreadCount] = useState(0)
  const [notifications, setNotifications] = useState<AppNotification[]>([])
  const [loading, setLoading] = useState(false)
  const popoverRef = useRef<HTMLDivElement>(null)

  const fetchUnreadCount = async () => {
    try {
      const data = await notificationsApi.getUnreadCount()
      setUnreadCount(data.unread_count)
    } catch {
      // Ignore errors silently if unauthenticated or offline
    }
  }

  const fetchNotifications = async () => {
    setLoading(true)
    try {
      const data = await notificationsApi.getNotifications(false, 1)
      setNotifications(data.items || [])
      setUnreadCount(data.unread_count || 0)
    } catch {
      // Ignore silently
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchUnreadCount()
    const interval = setInterval(fetchUnreadCount, 45000)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    if (isOpen) {
      fetchNotifications()
    }
  }, [isOpen])

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleMarkAsRead = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    try {
      await notificationsApi.markAsRead(id)
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
      )
      setUnreadCount((prev) => Math.max(0, prev - 1))
    } catch {
      // ignore
    }
  }

  const handleMarkAllRead = async () => {
    try {
      await notificationsApi.markAllAsRead()
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })))
      setUnreadCount(0)
    } catch {
      // ignore
    }
  }

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    try {
      await notificationsApi.deleteNotification(id)
      setNotifications((prev) => {
        const item = prev.find((n) => n.id === id)
        if (item && !item.is_read) {
          setUnreadCount((count) => Math.max(0, count - 1))
        }
        return prev.filter((n) => n.id !== id)
      })
    } catch {
      // ignore
    }
  }

  const getIcon = (type: string) => {
    switch (type) {
      case 'achievement_unlocked':
        return <Award className="w-4 h-4 text-amber-400" />
      case 'streak_milestone':
        return <Zap className="w-4 h-4 text-emerald-400" />
      case 'workout_reminder':
      case 'recommendation_ready':
        return <HeartPulse className="w-4 h-4 text-primary-400" />
      default:
        return <Info className="w-4 h-4 text-surface-300" />
    }
  }

  return (
    <div className="relative" ref={popoverRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-surface-400 hover:text-white rounded-lg hover:bg-surface-800/60 transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500/50"
        aria-label={`Notifications ${unreadCount > 0 ? `(${unreadCount} unread)` : ''}`}
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute top-1.5 right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-primary-500 text-[10px] font-bold text-white shadow-sm shadow-primary-500/50 animate-pulse">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-xl bg-surface-900 border border-surface-800 shadow-2xl shadow-black/80 z-50 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-surface-800/80 bg-surface-900/90 backdrop-blur-sm">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-sm text-white">Notifications</span>
              {unreadCount > 0 && (
                <span className="px-2 py-0.5 text-xs bg-primary-500/20 text-primary-400 rounded-full font-medium">
                  {unreadCount} new
                </span>
              )}
            </div>
            {notifications.some((n) => !n.is_read) && (
              <button
                onClick={handleMarkAllRead}
                className="text-xs text-primary-400 hover:text-primary-300 flex items-center gap-1 transition-colors"
              >
                <CheckCheck className="w-3.5 h-3.5" />
                Mark all read
              </button>
            )}
          </div>

          <div className="max-h-80 overflow-y-auto divide-y divide-surface-800/40">
            {loading ? (
              <div className="p-6 text-center text-xs text-surface-400">Loading notifications...</div>
            ) : notifications.length === 0 ? (
              <div className="p-8 text-center text-surface-400">
                <Bell className="w-8 h-8 mx-auto mb-2 opacity-30 text-surface-400" />
                <p className="text-sm font-medium text-surface-300">No notifications yet</p>
                <p className="text-xs text-surface-500 mt-1">We'll alert you on milestone updates and AI recommendations.</p>
              </div>
            ) : (
              notifications.map((n) => (
                <div
                  key={n.id}
                  className={`p-3.5 transition-colors flex items-start gap-3 group ${
                    n.is_read ? 'bg-surface-900/40 opacity-75' : 'bg-surface-850/60'
                  } hover:bg-surface-800/50`}
                >
                  <div className="mt-0.5 p-1.5 rounded-lg bg-surface-800/80 shrink-0">
                    {getIcon(n.notification_type)}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-1">
                      <h4 className={`text-xs font-semibold ${n.is_read ? 'text-surface-300' : 'text-white'}`}>
                        {n.title}
                      </h4>
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        {!n.is_read && (
                          <button
                            onClick={(e) => handleMarkAsRead(n.id, e)}
                            title="Mark as read"
                            className="p-1 text-surface-400 hover:text-primary-400 transition-colors"
                          >
                            <CheckCheck className="w-3.5 h-3.5" />
                          </button>
                        )}
                        <button
                          onClick={(e) => handleDelete(n.id, e)}
                          title="Delete"
                          className="p-1 text-surface-400 hover:text-red-400 transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                    <p className="text-xs text-surface-400 mt-0.5 line-clamp-2 leading-relaxed">
                      {n.body}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}
