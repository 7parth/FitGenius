import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { AccessibilityProfile } from '@/types'

interface AccessibilityState {
  profile: AccessibilityProfile | null
  setProfile: (profile: AccessibilityProfile) => void
  updateProfile: (updates: Partial<AccessibilityProfile>) => void
  applyToDOM: (profile: AccessibilityProfile) => void
}

export const useAccessibilityStore = create<AccessibilityState>()(
  persist(
    (set, get) => ({
      profile: null,

      setProfile: (profile) => {
        set({ profile })
        get().applyToDOM(profile)
      },

      updateProfile: (updates) => {
        const current = get().profile
        if (!current) return
        const updated = { ...current, ...updates }
        set({ profile: updated })
        get().applyToDOM(updated)
      },

      applyToDOM: (profile) => {
        const root = document.documentElement
        // High contrast
        root.classList.toggle('theme-high-contrast', profile.high_contrast_mode)
        // Font size
        root.classList.remove('font-sm', 'font-md', 'font-lg', 'font-xl')
        root.classList.add(`font-${profile.font_size_preference}`)
        // Reduced motion
        root.classList.toggle('reduce-motion', profile.reduced_motion)
        // Simplified UI
        root.classList.toggle('simplified-ui', profile.simplified_ui)
      },
    }),
    {
      name: 'fitgenius-accessibility',
    }
  )
)
