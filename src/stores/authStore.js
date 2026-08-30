import { create } from 'zustand'
import { apiFetch } from '../services/apiClient'

export const useAuthStore = create((set) => ({
  email: null,
  status: 'loading', // 'loading' | 'authenticated' | 'unauthenticated'

  init: async () => {
    try {
      const data = await apiFetch('/auth/session')
      set({ status: 'authenticated', email: data.email })
    } catch {
      set({ status: 'unauthenticated', email: null })
    }
  },

  signIn: async (email, password) => {
    const data = await apiFetch('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    })
    set({ status: 'authenticated', email: data.email })
  },

  signOut: async () => {
    await apiFetch('/auth/logout', { method: 'POST' })
    set({ status: 'unauthenticated', email: null })
  },
}))
