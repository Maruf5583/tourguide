import { Navigate, Outlet } from 'react-router-dom'
import { useAuthStore } from '../store/auth.store'

export default function GuideRoute() {
  const { isAuthenticated, user } = useAuthStore()

  if (!isAuthenticated) return <Navigate to="/login" replace />

  // ✅ TourGuide role না থাকলে profile এ পাঠাও
  if (!user?.roles?.includes('TourGuide')) {
    return <Navigate to="/profile" replace />
  }

  return <Outlet />
}