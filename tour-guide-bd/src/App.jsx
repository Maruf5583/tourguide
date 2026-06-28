import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import Navbar from './components/layout/Navbar'
import Sidebar from './components/layout/Sidebar'
import PrivateRoute from './routes/PrivateRoute'
import AdminRoute from './routes/AdminRoute'



import HomePage from './pages/HomePage'

import LoginPage            from './pages/auth/LoginPage'
import RegisterPage         from './pages/auth/RegisterPage'
import PlacesListPage       from './pages/places/PlacesListPage'
import PlaceDetailPage      from './pages/places/PlaceDetailPage'
import CreatePlacePage      from './pages/places/CreatePlacePage'
import EditPlacePage        from './pages/places/EditPlacePage'
import MapPage               from './pages/places/MapPage'
import ProfilePage          from './pages/user/ProfilePage'
import FavouritesPage       from './pages/user/FavouritesPage'
import CheckInsPage         from './pages/user/CheckInsPage'
import VisitHistoryPage     from './pages/user/VisitHistoryPage'
import SavedDistrictsPage   from './pages/user/SavedDistrictsPage'
import TripPlannerPage      from './pages/trip/TripPlannerPage'
import ItineraryBuilderPage from './pages/trip/ItineraryBuilderPage'
import ItineraryViewPage    from './pages/trip/ItineraryViewPage'
import DashboardPage        from './pages/admin/DashboardPage'
import UsersPage            from './pages/admin/UsersPage'
import PendingPlacesPage    from './pages/admin/PendingPlacesPage'
import PendingReviewsPage   from './pages/admin/PendingReviewsPage'
import ReportsPage          from './pages/admin/ReportsPage'
import AuditLogsPage        from './pages/admin/AuditLogsPage'
import BroadcastPage        from './pages/admin/BroadcastPage'
import Footer               from './components/layout/Footer'

function AdminLayout({ children }) {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 flex gap-6">
      <Sidebar />
      <main className="flex-1 min-w-0">{children}</main>
    </div>
  )
}

export default function App() {
  return (
    <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <Toaster position="top-right" toastOptions={{ duration: 3000 }} />
      <Navbar />
      <Routes>
        {/* Public */}
        <Route path="/"          element={<HomePage />} />
        <Route path="/login"     element={<LoginPage />} />
        <Route path="/register"  element={<RegisterPage />} />
        <Route path="/"          element={<PlacesListPage />} />
        <Route path="/places"    element={<PlacesListPage />} />
        <Route path="/places/:id" element={<PlaceDetailPage />} />
        <Route path="/map"       element={<MapPage />} />
        <Route path="/trip-planner" element={<TripPlannerPage />} />


        {/* Private */}
        <Route element={<PrivateRoute />}>
          <Route path="/places/create"   element={<CreatePlacePage />} />
          <Route path="/places/:id/edit" element={<EditPlacePage />} />
          <Route path="/trip-planner/build"          element={<ItineraryBuilderPage />} />
          <Route path="/trip-planner/itinerary/:id"  element={<ItineraryViewPage />} />
          <Route path="/profile"         element={<ProfilePage />} />
          <Route path="/favourites"      element={<FavouritesPage />} />
          <Route path="/checkins"        element={<CheckInsPage />} />
          <Route path="/visit-history"   element={<VisitHistoryPage />} />
          <Route path="/saved-districts" element={<SavedDistrictsPage />} />
        </Route>

        {/* Admin */}
        <Route element={<AdminRoute />}>
          <Route path="/admin"           element={<AdminLayout><DashboardPage /></AdminLayout>} />
          <Route path="/admin/users"     element={<AdminLayout><UsersPage /></AdminLayout>} />
          <Route path="/admin/places"    element={<AdminLayout><PendingPlacesPage /></AdminLayout>} />
          <Route path="/admin/reviews"   element={<AdminLayout><PendingReviewsPage /></AdminLayout>} />
          <Route path="/admin/reports"   element={<AdminLayout><ReportsPage /></AdminLayout>} />
          <Route path="/admin/audit"     element={<AdminLayout><AuditLogsPage /></AdminLayout>} />
          <Route path="/admin/broadcast" element={<AdminLayout><BroadcastPage /></AdminLayout>} />
        </Route>
      </Routes>
      <Footer />
    </BrowserRouter>
  )
}