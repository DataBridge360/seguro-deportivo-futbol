import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { User } from '@/types'

const MOCK_USERS: Record<string, { password: string; user: User }> = {
  'admin@test.com': {
    password: 'test',
    user: { id: '1', email: 'admin@test.com', name: 'Administrador', role: 'admin' }
  },
  'productor@test.com': {
    password: 'test',
    user: { id: '2', email: 'productor@test.com', name: 'Juan Productor', role: 'productor' }
  },
  'club@test.com': {
    password: 'test',
    user: { id: '3', email: 'club@test.com', name: 'Club Atlético', role: 'club' }
  },
  'jugador@test.com': {
    password: 'test',
    user: { id: '4', email: 'jugador@test.com', name: 'Carlos Jugador', role: 'jugador' }
  },
}

interface AuthState {
  user: User | null
  isAuthenticated: boolean
  isLoading: boolean
  error: string | null
  login: (email: string, password: string) => Promise<boolean>
  logout: () => void
  clearError: () => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,

      login: async (email: string, password: string) => {
        set({ isLoading: true, error: null })

        await new Promise(resolve => setTimeout(resolve, 500))

        const mockUser = MOCK_USERS[email.toLowerCase()]

        if (mockUser && mockUser.password === password) {
          set({
            user: mockUser.user,
            isAuthenticated: true,
            isLoading: false
          })
          return true
        } else {
          set({
            error: 'Credenciales inválidas',
            isLoading: false
          })
          return false
        }
      },

      logout: () => {
        set({ user: null, isAuthenticated: false, error: null })
      },

      clearError: () => set({ error: null })
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated
      })
    }
  )
)
