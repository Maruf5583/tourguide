import { create } from 'zustand'
import { tokenStorage } from '../utils/tokenStorage'

export const useAuthStore = create((set) => ({
  user:            tokenStorage.getUser(),
  accessToken:     tokenStorage.getAccess(),
  isAuthenticated: !!tokenStorage.getAccess(),

  setAuth: (user, accessToken, refreshToken) => {
    tokenStorage.setUser(user)
    tokenStorage.setAccess(accessToken)
    if (refreshToken) tokenStorage.setRefresh(refreshToken)
    set({ user, accessToken, isAuthenticated: true })
  },

  logout: () => {
    tokenStorage.clearAll()
    set({ user: null, accessToken: null, isAuthenticated: false })
  },

  updateUser: (updates) => {
    const updated = { ...tokenStorage.getUser(), ...updates }
    tokenStorage.setUser(updated)
    set({ user: updated })
  },
}))