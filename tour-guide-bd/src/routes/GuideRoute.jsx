import { Navigate, Outlet } from 'react-router-dom'
import { useAuthStore } from '../store/auth.store'

export default function GuideRoute() {
  const user = useAuthStore((s) => s.user)
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)

  if (!isAuthenticated) return <Navigate to="/login" replace />

  const roles = user?.roles || []
  const hasAccess = roles.includes('TourGuide') || roles.includes('Admin')
  if (!hasAccess) return <Navigate to="/" replace />

  return <Outlet />
}