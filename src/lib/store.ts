'use client'
import { create } from 'zustand'
import type { User } from '@/lib/types'

interface AppState {
  user: User | null
  loading: boolean
  setUser: (u: User | null) => void
  setLoading: (b: boolean) => void
  // current view - SPA routing within single route
  view: string
  params: Record<string, any>
  navigate: (view: string, params?: Record<string, any>) => void
}

export const useAppStore = create<AppState>((set) => ({
  user: null,
  loading: true,
  setUser: (user) => set({ user }),
  setLoading: (loading) => set({ loading }),
  view: 'dashboard',
  params: {},
  navigate: (view, params = {}) => {
    set({ view, params })
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  },
}))
