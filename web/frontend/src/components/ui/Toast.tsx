import { create } from 'zustand'
import { CheckCircle2, XCircle, AlertTriangle, Info, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useEffect } from 'react'

type ToastType = 'success' | 'error' | 'warning' | 'info'

interface Toast {
  id: string
  type: ToastType
  message: string
  duration?: number
}

interface ToastStore {
  toasts: Toast[]
  add: (toast: Omit<Toast, 'id'>) => void
  remove: (id: string) => void
}

export const useToastStore = create<ToastStore>((set) => ({
  toasts: [],
  add: (toast) =>
    set((state) => ({
      toasts: [...state.toasts, { ...toast, id: Math.random().toString(36).slice(2) }],
    })),
  remove: (id) =>
    set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) })),
}))

export const toast = {
  success: (message: string, duration = 4000) =>
    useToastStore.getState().add({ type: 'success', message, duration }),
  error: (message: string, duration = 6000) =>
    useToastStore.getState().add({ type: 'error', message, duration }),
  warning: (message: string, duration = 5000) =>
    useToastStore.getState().add({ type: 'warning', message, duration }),
  info: (message: string, duration = 4000) =>
    useToastStore.getState().add({ type: 'info', message, duration }),
}

const icons = {
  success: CheckCircle2,
  error: XCircle,
  warning: AlertTriangle,
  info: Info,
}

const styles = {
  success: 'border-emerald-500/40 bg-emerald-900/30 text-emerald-200',
  error: 'border-red-500/40 bg-red-900/30 text-red-200',
  warning: 'border-amber-500/40 bg-amber-900/30 text-amber-200',
  info: 'border-blue-500/40 bg-blue-900/30 text-blue-200',
}

function ToastItem({ toast }: { toast: Toast }) {
  const remove = useToastStore((s) => s.remove)
  const Icon = icons[toast.type]

  useEffect(() => {
    if (!toast.duration) return
    const timer = setTimeout(() => remove(toast.id), toast.duration)
    return () => clearTimeout(timer)
  }, [toast.id, toast.duration, remove])

  return (
    <div
      role="alert"
      aria-live="polite"
      className={cn(
        'flex items-start gap-3 rounded-xl border px-4 py-3 shadow-lg text-sm',
        'animate-slide-in-right backdrop-blur-sm',
        styles[toast.type]
      )}
    >
      <Icon className="h-5 w-5 flex-shrink-0 mt-0.5" aria-hidden="true" />
      <span className="flex-1">{toast.message}</span>
      <button
        onClick={() => remove(toast.id)}
        className="ml-2 rounded-full p-0.5 hover:bg-white/10 transition-colors"
        aria-label="Dismiss notification"
      >
        <X className="h-4 w-4" aria-hidden="true" />
      </button>
    </div>
  )
}

export function ToastContainer() {
  const toasts = useToastStore((s) => s.toasts)
  return (
    <div
      aria-label="Notifications"
      className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 w-80 max-w-[calc(100vw-2rem)]"
    >
      {toasts.map((t) => <ToastItem key={t.id} toast={t} />)}
    </div>
  )
}
