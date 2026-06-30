import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import Navbar from './components/layout/Navbar'
import Sidebar from './components/layout/Sidebar'
import PrivateRoute from './routes/PrivateRoute'
import AdminRoute from './routes/AdminRoute'
import GuideRoute from './routes/GuideRoute'

import HomePage from './pages/HomePage'
import LoginPage from './pages/auth/LoginPage'
import RegisterPage from './pages/auth/RegisterPage'
import PlacesListPage from './pages/places/PlacesListPage'
import PlaceDetailPage from './pages/places/PlaceDetailPage'
import CreatePlacePage from './pages/places/CreatePlacePage'
import EditPlacePage from './pages/places/EditPlacePage'
import MapPage from './pages/places/MapPage'
import ProfilePage from './pages/user/ProfilePage'
import FavouritesPage from './pages/user/FavouritesPage'
import CheckInsPage from './pages/user/CheckInsPage'
import VisitHistoryPage from './pages/user/VisitHistoryPage'
import SavedDistrictsPage from './pages/user/SavedDistrictsPage'
import TripPlannerPage from './pages/trip/TripPlannerPage'
import ItineraryBuilderPage from './pages/trip/ItineraryBuilderPage'
import ItineraryViewPage from './pages/trip/ItineraryViewPage'
import DashboardPage from './pages/admin/DashboardPage'
import UsersPage from './pages/admin/UsersPage'
import PendingPlacesPage from './pages/admin/PendingPlacesPage'
import PendingReviewsPage from './pages/admin/PendingReviewsPage'
import ReportsPage from './pages/admin/ReportsPage'
import AuditLogsPage from './pages/admin/AuditLogsPage'
import BroadcastPage from './pages/admin/BroadcastPage'
import Footer from './components/layout/Footer'

import ApplyGuidePage from './pages/guide/ApplyGuidePage'
import GuideDashboardPage from './pages/guide/GuideDashboardPage'
import GuidePackagesPage from './pages/guide/GuidePackagesPage'
import EditPackagePage from './pages/guide/EditPackagePage'
import BookGuidePage from './pages/guide/BookGuidePage'
import GuideApplicationsPage from './pages/admin/GuideApplicationsPage'
import GuidesListPage from './pages/guide/GuidesListPage'
import GuideProfilePage from './pages/guide/GuideProfilePage'

// ✅ If these files don't exist yet, comment out these 3 lines + the 2 routes below
import BookingPaymentPage from './pages/guide/BookingPaymentPage'
import BookingSuccessPage from './pages/guide/BookingSuccessPage'


import MyBookingsPage from "./pages/guide/MyBookingsPage";
import MyBookingDetailPage from "./pages/guide/MyBookingDetailPage";
// ...


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
        <Route path="/" element={<HomePage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/places" element={<PlacesListPage />} />
        <Route path="/places/:id" element={<PlaceDetailPage />} />
        <Route path="/map" element={<MapPage />} />
        <Route path="/trip-planner" element={<TripPlannerPage />} />
        <Route path="/guides" element={<GuidesListPage />} />
        <Route path="/guide/:guideId" element={<GuideProfilePage />} />

        {/* Private */}
        <Route element={<PrivateRoute />}>
          <Route path="/places/create" element={<CreatePlacePage />} />
          <Route path="/places/:id/edit" element={<EditPlacePage />} />
          <Route path="/trip-planner/build" element={<ItineraryBuilderPage />} />
          <Route path="/trip-planner/itinerary/:id" element={<ItineraryViewPage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/favourites" element={<FavouritesPage />} />
          <Route path="/checkins" element={<CheckInsPage />} />
          <Route path="/visit-history" element={<VisitHistoryPage />} />
          <Route path="/saved-districts" element={<SavedDistrictsPage />} />
          <Route path="/guide/apply" element={<ApplyGuidePage />} />
          <Route path="/guide/book/:packageId" element={<BookGuidePage />} />
          {/* ✅ Comment out these 2 if files don't exist yet */}
          <Route path="/booking/:bookingId/payment" element={<BookingPaymentPage />} />
          <Route path="/booking/:bookingId/success" element={<BookingSuccessPage />} />
          <Route path="/guide/my-bookings" element={<MyBookingsPage />} />
          <Route path="/guide/my-bookings/:bookingId" element={<MyBookingDetailPage />} />
        </Route>

        {/* Guide-only routes */}
        <Route element={<GuideRoute />}>
          <Route path="/guide/dashboard" element={<GuideDashboardPage />} />
          <Route path="/guide/packages" element={<GuidePackagesPage />} />
          {/* ✅ Edit mode uses EditPackagePage, not GuidePackagesPage */}
          <Route path="/guide/packages/:packageId" element={<EditPackagePage />} />
        </Route>

        {/* Admin */}
        <Route element={<AdminRoute />}>
          <Route path="/admin" element={<AdminLayout><DashboardPage /></AdminLayout>} />
          <Route path="/admin/users" element={<AdminLayout><UsersPage /></AdminLayout>} />
          <Route path="/admin/places" element={<AdminLayout><PendingPlacesPage /></AdminLayout>} />
          <Route path="/admin/reviews" element={<AdminLayout><PendingReviewsPage /></AdminLayout>} />
          <Route path="/admin/reports" element={<AdminLayout><ReportsPage /></AdminLayout>} />
          <Route path="/admin/audit" element={<AdminLayout><AuditLogsPage /></AdminLayout>} />
          <Route path="/admin/broadcast" element={<AdminLayout><BroadcastPage /></AdminLayout>} />
          <Route path="/admin/guide-apps" element={<AdminLayout><GuideApplicationsPage /></AdminLayout>} />
        </Route>
      </Routes>
      <Footer />
    </BrowserRouter>
  )
}