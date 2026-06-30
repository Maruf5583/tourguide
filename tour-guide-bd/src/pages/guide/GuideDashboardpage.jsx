import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Link, Navigate } from 'react-router-dom'
import { guideApi } from '../../api/guide.api'
import { useAuthStore } from '../../store/auth.store'
import LoadingSpinner from '../../components/common/LoadingSpinner'
import Modal from '../../components/common/Modal'
import { formatBDT } from '../../utils/formatters'
import {
  TrendingUp, MapPin, Navigation, Package,
  DollarSign, BarChart2, XCircle, Plus, Clock, Users,
  Pencil, Trash2, AlertTriangle
} from 'lucide-react'
import toast from 'react-hot-toast'

export default function GuideDashboardPage() {
  const { user } = useAuthStore()
  const qc = useQueryClient()
  const currentYear = new Date().getFullYear()
  const [trackingBookingId, setTrackingBookingId] = useState('')
  const [tracking, setTracking] = useState(false)
  const [watchId, setWatchId] = useState(null)
  // ✅ NEW: which package is pending delete confirmation
  const [pendingDelete, setPendingDelete] = useState(null)

  if (!user?.roles?.includes('TourGuide')) {
    return <Navigate to="/profile" replace />
  }

  const { data: revenue, isLoading } = useQuery({
    queryKey: ['guide-revenue', currentYear],
    queryFn: () => guideApi.getRevenue(currentYear).then(r => r.data),
  })

  // ✅ Guide এর নিজের packages
  const { data: myPackages } = useQuery({
    queryKey: ['my-packages', user?.id],
    // ✅ array directly আসবে
    queryFn: () => guideApi.getMyPackages().then(r => r.data),
  })

  // ✅ NEW: delete package mutation
  const deleteMutation = useMutation({
    mutationFn: (packageId) => guideApi.deletePackage(packageId),
    onSuccess: () => {
      toast.success('Package deleted')
      qc.invalidateQueries({ queryKey: ['my-packages'] })
      setPendingDelete(null)
    },
    onError: () => {
      toast.error('Could not delete package')
      setPendingDelete(null)
    },
  })

  // ✅ 404 আসছে তাই getMyBookings সরিয়ে fallback input রাখলাম
  const updateLocationMutation = useMutation({
    mutationFn: (data) => guideApi.updateLocation(data),
  })

  const stopLocationMutation = useMutation({
    mutationFn: (bookingId) => guideApi.stopLocation(bookingId),
    onSuccess: () => {
      if (watchId) navigator.geolocation.clearWatch(watchId)
      setTracking(false)
      setTrackingBookingId('')
      setWatchId(null)
      toast.success('Location sharing stopped')
    },
  })

  const startTracking = () => {
    if (!trackingBookingId) return toast.error('Enter a booking ID')
    setTracking(true)
    const id = navigator.geolocation.watchPosition(
      pos => {
        updateLocationMutation.mutate({
          bookingId: Number(trackingBookingId),
          latitude:  pos.coords.latitude,
          longitude: pos.coords.longitude,
        })
      },
      () => { toast.error('Location access denied'); setTracking(false) },
      { enableHighAccuracy: true, maximumAge: 10000 }
    )
    setWatchId(id)
    toast.success('Live location sharing started!')
  }

  const stopTracking = () => {
    stopLocationMutation.mutate(Number(trackingBookingId))
  }

  if (isLoading) return <LoadingSpinner center />

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 space-y-6">

      {/* Header */}
      <div>
        <h1 className="text-2xl font-black text-gray-900">Guide Dashboard</h1>
        <p className="text-sm text-gray-500 mt-1">Welcome, {user?.fullName}</p>
      </div>

      {/* Revenue cards */}
      {revenue && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: 'Total earnings', value: formatBDT(revenue.totalEarnings),        icon: DollarSign, color: 'text-primary-600', bg: 'bg-primary-50' },
            { label: 'This month',     value: formatBDT(revenue.currentMonthEarnings),  icon: TrendingUp, color: 'text-green-600',   bg: 'bg-green-50'  },
            { label: 'Total bookings', value: revenue.totalBookings,                    icon: Package,    color: 'text-blue-600',    bg: 'bg-blue-50'   },
            { label: 'Avg rating',     value: revenue.averageRating?.toFixed(1) || '—', icon: BarChart2,  color: 'text-amber-600',  bg: 'bg-amber-50'  },
          ].map(({ label, value, icon: Icon, color, bg }) => (
            <div key={label} className="card p-4">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${bg}`}>
                <Icon size={20} className={color} />
              </div>
              <p className="text-xs text-gray-500">{label}</p>
              <p className={`text-xl font-black ${color}`}>{value}</p>
            </div>
          ))}
        </div>
      )}

      {/* ✅ My packages */}
      <div className="card p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-bold text-gray-900 flex items-center gap-2">
            <Package size={16} className="text-primary-600" /> My packages
          </h2>
          <Link to="/guide/packages" className="btn-primary flex items-center gap-2 px-4 py-2 text-sm">
            <Plus size={15} /> Create package
          </Link>
        </div>

        {!myPackages?.length ? (
          <div className="text-center py-8 text-gray-400">
            <Package size={28} className="mx-auto mb-2 opacity-40" />
            <p className="text-sm">No packages yet</p>
            <Link to="/guide/packages" className="text-primary-600 text-sm hover:underline mt-1 inline-block">
              Create your first package →
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {myPackages.map(pkg => (
              <div key={pkg.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-900 truncate">{pkg.title}</p>
                  <div className="flex items-center gap-3 mt-1 text-xs text-gray-400">
                    <span className="flex items-center gap-1">
                      <Clock size={10} /> {pkg.durationDays} day{pkg.durationDays > 1 ? 's' : ''}
                    </span>
                    <span className="flex items-center gap-1">
                      <Users size={10} /> Max {pkg.maxPeople}
                    </span>
                  </div>
                </div>
                <p className="text-primary-600 font-black text-sm shrink-0 ml-3 mr-3">
                  {formatBDT(pkg.pricePerPerson)}<span className="text-gray-400 font-normal">/person</span>
                </p>
                {/* ✅ NEW: Edit / Delete actions */}
                <div className="flex gap-2 shrink-0">
                  <Link
                    to={`/guide/packages/${pkg.id}`}
                    className="p-2 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-600"
                    title="Edit package"
                  >
                    <Pencil size={14} />
                  </Link>
                  <button
                    onClick={() => setPendingDelete(pkg)}
                    className="p-2 rounded-lg bg-red-50 hover:bg-red-100 text-red-600"
                    title="Delete package"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Monthly chart */}
      {revenue?.monthlyBreakdown?.length > 0 && (
        <div className="card p-5">
          <h2 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
            <BarChart2 size={16} className="text-primary-600" /> Monthly earnings {currentYear}
          </h2>
          <div className="flex items-end gap-2 h-32">
            {revenue.monthlyBreakdown.map((m) => {
              const max = Math.max(...revenue.monthlyBreakdown.map(x => x.earnings))
              const pct = max > 0 ? (m.earnings / max) * 100 : 0
              return (
                <div key={m.month} className="flex-1 flex flex-col items-center gap-1">
                  <div className="w-full bg-primary-100 rounded-t-lg relative" style={{ height: '96px' }}>
                    <div className="absolute bottom-0 w-full bg-primary-500 rounded-t-lg transition-all duration-500"
                      style={{ height: `${pct}%` }} />
                  </div>
                  <span className="text-xs text-gray-400">{m.monthName?.slice(0, 3)}</span>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Live location */}
      <div className="card p-5">
        <h2 className="font-bold text-gray-900 mb-1 flex items-center gap-2">
          <Navigation size={16} className="text-primary-600" /> Live location sharing
        </h2>
        <p className="text-sm text-gray-500 mb-4">Share your live location with a tourist during an active booking.</p>
        <div className="flex gap-3">
          <input
            type="number"
            value={trackingBookingId}
            onChange={e => setTrackingBookingId(e.target.value)}
            placeholder="Booking ID"
            className="input flex-1"
            disabled={tracking}
          />
          {!tracking ? (
            <button onClick={startTracking} className="btn-primary flex items-center gap-2 px-5">
              <MapPin size={15} /> Start sharing
            </button>
          ) : (
            <button onClick={stopTracking} disabled={stopLocationMutation.isPending}
              className="btn-danger flex items-center gap-2 px-5">
              <XCircle size={15} /> Stop
            </button>
          )}
        </div>
        {tracking && (
          <div className="mt-3 flex items-center gap-2 text-sm text-green-600 font-medium">
            <div className="w-2.5 h-2.5 bg-green-500 rounded-full animate-pulse" />
            Live location active — booking #{trackingBookingId}
          </div>
        )}
      </div>

      {/* ✅ NEW: Delete confirmation modal */}
      <Modal isOpen={!!pendingDelete} onClose={() => setPendingDelete(null)} title="Delete package">
        {pendingDelete && (
          <div className="space-y-4">
            <div className="flex items-start gap-3 bg-red-50 text-red-700 rounded-xl p-4">
              <AlertTriangle size={18} className="shrink-0 mt-0.5" />
              <p className="text-sm">
                Are you sure you want to delete <span className="font-bold">"{pendingDelete.title}"</span>?
                This action cannot be undone, and any related availability dates will be removed.
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setPendingDelete(null)}
                disabled={deleteMutation.isPending}
                className="btn-secondary flex-1 py-2.5"
              >
                Cancel
              </button>
              <button
                onClick={() => deleteMutation.mutate(pendingDelete.id)}
                disabled={deleteMutation.isPending}
                className="btn-danger flex-1 py-2.5 flex items-center justify-center gap-2"
              >
                {deleteMutation.isPending
                  ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  : <Trash2 size={15} />}
                Delete
              </button>
            </div>
          </div>
        )}
      </Modal>

    </div>
  )
}