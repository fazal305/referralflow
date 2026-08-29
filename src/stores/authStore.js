import { create } from 'zustand'
import { supabase } from '../services/supabaseClient'

export const useAuthStore = create((set) => ({
  session: null,
  status: 'loading', // 'loading' | 'authenticated' | 'unauthenticated'

  init: async () => {
    if (!supabase) {
      set({ status: 'unauthenticated', session: null })
      return
    }
    const { data } = await supabase.auth.getSession()
    set({
      session: data.session,
      status: data.session ? 'authenticated' : 'unauthenticated',
    })
    supabase.auth.onAuthStateChange((_event, session) => {
      set({ session, status: session ? 'authenticated' : 'unauthenticated' })
    })
  },

  signIn: async (email, password) => {
    if (!supabase) throw new Error('Supabase is not configured.')
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })
    if (error) throw error
    set({ session: data.session, status: 'authenticated' })
  },

  signOut: async () => {
    if (!supabase) return
    await supabase.auth.signOut()
    set({ session: null, status: 'unauthenticated' })
  },
}))
