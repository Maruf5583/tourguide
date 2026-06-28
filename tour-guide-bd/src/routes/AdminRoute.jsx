import { Navigate, Outlet } from 'react-router-dom'
import { useAuthStore } from '../store/auth.store'

export default function AdminRoute() {
  const user = useAuthStore((s) => s.user)

  console.log('AdminRoute check — user:', user, 'roles:', user?.roles)

  const roles = (user?.roles || []).map(r => r.toLowerCase())
  const isAdmin = roles.includes('admin') || roles.includes('moderator')

  if (!user) return <Navigate to="/login" replace />
  if (!isAdmin) return <Navigate to="/" replace />

  return <Outlet />
}