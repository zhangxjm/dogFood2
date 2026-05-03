import { create } from 'zustand'
import { persist } from 'zustand/middleware'

const useAuthStore = create(
  persist(
    (set, get) => ({
      token: null,
      refreshToken: null,
      user: null,
      isAuthenticated: false,
      
      setTokens: (token, refreshToken) => set({ token, refreshToken, isAuthenticated: true }),
      
      setUser: (user) => set({ user }),
      
      logout: () => set({ 
        token: null, 
        refreshToken: null, 
        user: null, 
        isAuthenticated: false 
      }),
    }),
    {
      name: 'auth-storage',
    }
  )
)

export default useAuthStore
