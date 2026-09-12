import { create } from 'zustand'
import { apiFetch, setSessionExpiredHandler } from '../services/apiClient'

export const useAuthStore = create((set) => ({
  email: null,
  status: 'loading', // 'loading' | 'authenticated' | 'unauthenticated'
  sessionExpired: false,

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
    set({ status: 'authenticated', email: data.email, sessionExpired: false })
  },

  signOut: async () => {
    await apiFetch('/auth/logout', { method: 'POST' })
    set({ status: 'unauthenticated', email: null })
  },

  handleSessionExpired: () => {
    set({ status: 'unauthenticated', email: null, sessionExpired: true })
  },
}))

// A 401 from any authenticated request (not the login/session-check requests
// themselves) means the session died mid-use — sign the user out locally and
// let the Login page know why.
setSessionExpiredHandler(() => useAuthStore.getState().handleSessionExpired())
