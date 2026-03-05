import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { User } from '@/types'
import { loginWithUsuario, loginWithDNI } from '@/lib/api'

interface AuthState {
  user: User | null
  token: string | null
  isAuthenticated: boolean
  isLoading: boolean
  error: string | null
  _hasHydrated: boolean
  login: (usuario: string, password: string) => Promise<boolean>
  loginDNI: (dni: string, password: string) => Promise<boolean>
  logout: () => void
  clearError: () => void
  setHasHydrated: (val: boolean) => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,
      _hasHydrated: false,

      setHasHydrated: (val: boolean) => set({ _hasHydrated: val }),

      login: async (usuario: string, password: string) => {
        set({ isLoading: true, error: null })

        try {
          const data = await loginWithUsuario(usuario, password)

          localStorage.setItem('token', data.token)

          set({
            user: data.user as User,
            token: data.token,
            isAuthenticated: true,
            isLoading: false
          })
          return true
        } catch (err) {
          set({
            error: err instanceof Error ? err.message : 'Error al iniciar sesión',
            isLoading: false
          })
          return false
        }
      },

      loginDNI: async (dni: string, password: string) => {
        set({ isLoading: true, error: null })

        try {
          const data = await loginWithDNI(dni, password)

          localStorage.setItem('token', data.token)

          set({
            user: data.user as User,
            token: data.token,
            isAuthenticated: true,
            isLoading: false
          })
          return true
        } catch (err) {
          set({
            error: err instanceof Error ? err.message : 'Error al iniciar sesión',
            isLoading: false
          })
          return false
        }
      },

      logout: () => {
        localStorage.removeItem('token')
        set({ user: null, token: null, isAuthenticated: false, error: null })
      },

      clearError: () => set({ error: null })
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        isAuthenticated: state.isAuthenticated
      }),
      onRehydrateStorage: () => (state) => {
        if (state?.token) {
          localStorage.setItem('token', state.token)
        }
        state?.setHasHydrated(true)
      }
    }
  )
)
