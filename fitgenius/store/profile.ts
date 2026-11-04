import { create } from 'zustand';
import { Profile } from '@/types';
import { supabase } from '@/lib/supabase';

interface ProfileState {
  profile: Profile | null;
  loading: boolean;
  onboardingComplete: boolean;

  fetchProfile: (userId: string) => Promise<void>;
  updateProfile: (userId: string, updates: Partial<Profile>) => Promise<{ error?: string }>;
  createProfile: (userId: string, data: Partial<Profile>) => Promise<{ error?: string }>;
  setOnboardingComplete: (value: boolean) => void;
}

export const useProfileStore = create<ProfileState>((set, get) => ({
  profile: null,
  loading: false,
  onboardingComplete: false,

  fetchProfile: async (userId) => {
    set({ loading: true });
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching profile:', error);
        return;
      }

      set({
        profile: data ?? null,
        onboardingComplete: !!data,
      });
    } finally {
      set({ loading: false });
    }
  },

  updateProfile: async (userId, updates) => {
    set({ loading: true });
    try {
      const { data, error } = await supabase
        .from('profiles')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', userId)
        .select()
        .single();

      if (error) return { error: error.message };
      set({ profile: data });
      return {};
    } catch {
      return { error: 'Failed to update profile.' };
    } finally {
      set({ loading: false });
    }
  },

  createProfile: async (userId, data) => {
    set({ loading: true });
    try {
      const { data: created, error } = await supabase
        .from('profiles')
        .insert({
          id: userId,
          ...data,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) return { error: error.message };
      set({ profile: created, onboardingComplete: true });
      return {};
    } catch {
      return { error: 'Failed to create profile.' };
    } finally {
      set({ loading: false });
    }
  },

  setOnboardingComplete: (value) => set({ onboardingComplete: value }),
}));
