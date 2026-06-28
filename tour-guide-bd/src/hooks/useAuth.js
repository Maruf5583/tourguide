import { useAuthStore } from '../store/auth.store'
import { authApi } from '../api/auth.api'
import toast from 'react-hot-toast'
import { useNavigate } from 'react-router-dom'
import { useQueryClient } from '@tanstack/react-query'

export const useAuth = () => {
  const { user, isAuthenticated, setAuth, logout: clearAuth } = useAuthStore()
  const navigate = useNavigate()
  const qc = useQueryClient()

  const login = async (email, password) => {
    const { data } = await authApi.login({ email, password })

    const accessToken  = data.accessToken  || data.token
    const refreshToken = data.refreshToken
    const userObj = {
      id:        data.userId   || data.id,
      fullName:  data.fullName || data.name || email,
      email:     data.email    || email,
      roles:     data.roles    || [],
      avatarUrl: data.avatarUrl || null,
    }

    if (!accessToken) {
      throw new Error('No access token received from server')
    }

    // IMPORTANT: clear any stale cached data from a previous user
    qc.clear()

    setAuth(userObj, accessToken, refreshToken)
    toast.success(`Welcome, ${userObj.fullName}!`)
    navigate('/')
  }

  const register = async (fullName, email, password) => {
    await authApi.register({ fullName, email, password })
    toast.success('Account created! Please log in.')
    navigate('/login')
  }

  const logout = async () => {
    try {
      await authApi.logout({ userId: user?.id })
    } catch {}
    clearAuth()
    qc.clear() // wipe all cached queries (me, favourites, checkins, etc.)
    toast.success('Logged out')
    navigate('/login')
  }

  const isAdmin     = user?.roles?.includes('Admin')
  const isModerator = user?.roles?.includes('Moderator') || isAdmin

  return { user, isAuthenticated, isAdmin, isModerator, login, register, logout }
}