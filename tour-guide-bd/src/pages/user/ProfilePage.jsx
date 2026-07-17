import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { usersApi } from '../../api/users.api'
import { bookingApi } from '../../api/booking.api'
import { useAuthStore } from '../../store/auth.store'
import LoadingSpinner from '../../components/common/LoadingSpinner'
import { formatDate, formatTime } from '../../utils/formatters'
import { resolveImageUrl } from '../../utils/imageUrl'
import { User, Camera, Save, Heart, CheckCircle, History, MapPinned, ChevronRight, Calendar } from 'lucide-react'
import toast from 'react-hot-toast'


export default function ProfilePage() {
  const { user, updateUser } = useAuthStore()
  const qc = useQueryClient()
  const [form, setForm] = useState({ fullName: user?.fullName || '' })
  const [saving, setSaving] = useState(false)

  // query key includes user.id — prevents stale cross-user cache
  const { data: profile, isLoading } = useQuery({
    queryKey: ['me', user?.id],
    queryFn: () => usersApi.getMe().then(r => r.data),
    enabled: !!user?.id,
  })

  const { data: favourites } = useQuery({
    queryKey: ['favourites', user?.id],
    queryFn: () => usersApi.getFavourites().then(r => r.data),
    enabled: !!user?.id,
  })

  const { data: checkIns } = useQuery({
    queryKey: ['checkins', user?.id, 1],
    queryFn: () => usersApi.getCheckIns({ pageNumber: 1, pageSize: 5 }).then(r => r.data),
    enabled: !!user?.id,
  })

  const { data: visitHistory } = useQuery({
    queryKey: ['visit-history', user?.id, 1],
    queryFn: () => usersApi.getVisitHistory({ pageNumber: 1, pageSize: 5 }).then(r => r.data),
    enabled: !!user?.id,
  })

  const { data: savedDistricts } = useQuery({
    queryKey: ['saved-districts', user?.id],
    queryFn: () => usersApi.getSavedDistricts().then(r => r.data),
    enabled: !!user?.id,
  })

  // NOTE: bookingApi.getMyBookings + response shape (items/totalCount/packageName/
  // guideName/status/bookingDate) is assumed to follow the same pattern as the other
  // endpoints above. Adjust field names here to match your actual booking.api.js.
  const { data: bookings } = useQuery({
    queryKey: ['my-bookings', user?.id, 1],
    queryFn: () => bookingApi.getMyBookings({ pageNumber: 1, pageSize: 5 }).then(r => r.data),
    enabled: !!user?.id,
  })

  // keep form in sync if profile data arrives/changes
  useEffect(() => {
    if (profile?.fullName) {
      setForm({ fullName: profile.fullName })
    }
  }, [profile])

  const avatarMutation = useMutation({
    mutationFn: (file) => usersApi.uploadAvatar(file),
    onSuccess: () => { toast.success('Avatar updated'); qc.invalidateQueries(['me', user?.id]) },
    onError: () => toast.error('Upload failed'),
  })

  const handleSave = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      const { data } = await usersApi.updateMe({ userId: user?.id, fullName: form.fullName })
      updateUser(data)
      qc.invalidateQueries(['me', user?.id])
      toast.success('Profile updated')
    } catch {
      toast.error('Update failed')
    } finally {
      setSaving(false)
    }
  }

  if (isLoading) return <LoadingSpinner center />

  const favouritePlaces = favourites?.flatMap(d => d.places || []) || []
  const favouriteCount  = favouritePlaces.length

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8 space-y-6">
      <h1 className="text-xl font-bold text-gray-900">My profile</h1>

      {/* ── Basic info card ── */}
      <div className="card p-6">
        <div className="flex items-center gap-4 mb-6">
          <div className="relative">
            <div className="w-16 h-16 rounded-2xl bg-primary-100 flex items-center justify-center overflow-hidden">
            {profile?.avatarUrl ? (
              <img src={resolveImageUrl(profile.avatarUrl)} alt="avatar" className="w-full h-full object-cover" />
                 ) : (
                        <User size={28} className="text-primary-500" />
                  )}
                </div>
            <label className="absolute -bottom-1 -right-1 w-6 h-6 bg-primary-600 rounded-full flex items-center justify-center cursor-pointer hover:bg-primary-700 transition-colors">
              <Camera size={12} className="text-white" />
              <input type="file" accept="image/*" className="hidden"
                onChange={(e) => e.target.files?.[0] && avatarMutation.mutate(e.target.files[0])} />
            </label>
          </div>
          <div>
            <p className="font-semibold text-gray-900">{profile?.fullName}</p>
            <p className="text-sm text-gray-500">{profile?.email}</p>
            <p className="text-xs text-gray-400 mt-0.5">Joined {formatDate(profile?.createdAt)}</p>
          </div>
        </div>

        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Full name</label>
            <input value={form.fullName} onChange={(e) => setForm({ fullName: e.target.value })}
              className="input" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Roles</label>
            <div className="flex gap-2">
              {profile?.roles?.map((r) => (
                <span key={r} className="badge bg-primary-50 text-primary-700">{r}</span>
              ))}
            </div>
          </div>
          <button type="submit" disabled={saving} className="btn-primary flex items-center gap-2">
            <Save size={16} />
            {saving ? 'Saving…' : 'Save changes'}
          </button>
        </form>
      </div>

      {/* ── Quick stats ── */}
      <div className="grid grid-cols-4 gap-3">
        <Link to="/favourites" className="card p-4 text-center hover:shadow-md transition-shadow">
          <Heart size={18} className="mx-auto mb-1 text-red-400" />
          <p className="text-lg font-bold text-gray-900">{favouriteCount}</p>
          <p className="text-xs text-gray-500">Favourites</p>
        </Link>
        <Link to="/checkins" className="card p-4 text-center hover:shadow-md transition-shadow">
          <CheckCircle size={18} className="mx-auto mb-1 text-green-500" />
          <p className="text-lg font-bold text-gray-900">{checkIns?.totalCount ?? 0}</p>
          <p className="text-xs text-gray-500">Check-ins</p>
        </Link>
        <Link to="/visit-history" className="card p-4 text-center hover:shadow-md transition-shadow">
          <History size={18} className="mx-auto mb-1 text-blue-500" />
          <p className="text-lg font-bold text-gray-900">{visitHistory?.totalCount ?? 0}</p>
          <p className="text-xs text-gray-500">Visits</p>
        </Link>
        <Link to="/my-bookings" className="card p-4 text-center hover:shadow-md transition-shadow">
          <Calendar size={18} className="mx-auto mb-1 text-primary-500" />
          <p className="text-lg font-bold text-gray-900">{bookings?.totalCount ?? 0}</p>
          <p className="text-xs text-gray-500">Bookings</p>
        </Link>
      </div>

      {/* ── Favourites preview ── */}
      <div className="card p-5">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-semibold text-gray-900 flex items-center gap-2">
            <Heart size={16} className="text-red-400" /> Favourites
          </h2>
          <Link to="/favourites" className="text-xs text-primary-600 hover:underline flex items-center gap-0.5">
            View all <ChevronRight size={12} />
          </Link>
        </div>
        {favouriteCount === 0 ? (
          <p className="text-sm text-gray-400 py-2">No favourites yet</p>
        ) : (
          <div className="flex gap-3 overflow-x-auto pb-1">
            {favouritePlaces.slice(0, 6).map((fav) => (
              <Link key={fav.favouriteId} to={`/places/${fav.place.id}`}
                className="shrink-0 w-24 group">
                <div className="w-24 h-20 rounded-xl overflow-hidden bg-gray-100">
                  {fav.place.coverPhotoUrl ? (
                    <img src={fav.place.coverPhotoUrl} alt={fav.place.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                  ) : (
                    <MapPinned size={18} className="m-auto mt-7 text-gray-300" />
                  )}
                </div>
                <p className="text-xs text-gray-700 mt-1 truncate">{fav.place.name}</p>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* ── Check-ins preview ── */}
      <div className="card p-5">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-semibold text-gray-900 flex items-center gap-2">
            <CheckCircle size={16} className="text-green-500" /> Recent check-ins
          </h2>
          <Link to="/checkins" className="text-xs text-primary-600 hover:underline flex items-center gap-0.5">
            View all <ChevronRight size={12} />
          </Link>
        </div>
        {!checkIns?.items?.length ? (
          <p className="text-sm text-gray-400 py-2">No check-ins yet</p>
        ) : (
          <div className="space-y-2">
            {checkIns.items.slice(0, 4).map((c) => (
              <Link key={c.id} to={`/places/${c.placeId}`}
                className="flex items-center gap-3 p-2 -mx-2 rounded-lg hover:bg-gray-50 transition-colors">
                <div className="w-9 h-9 rounded-lg overflow-hidden bg-primary-50 shrink-0">
                  {c.placeCoverPhotoUrl ? (
                    <img src={c.placeCoverPhotoUrl} alt={c.placeName} className="w-full h-full object-cover" />
                  ) : <MapPinned size={14} className="m-auto mt-2.5 text-primary-300" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{c.placeName}</p>
                </div>
                <p className="text-xs text-gray-400 shrink-0">{formatTime(c.checkedInAt)}</p>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* ── Bookings preview ── */}
      <div className="card p-5">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-semibold text-gray-900 flex items-center gap-2">
            <Calendar size={16} className="text-primary-500" /> My bookings
          </h2>
          <Link to="/my-bookings" className="text-xs text-primary-600 hover:underline flex items-center gap-0.5">
            View all <ChevronRight size={12} />
          </Link>
        </div>
        {!bookings?.items?.length ? (
          <p className="text-sm text-gray-400 py-2">No bookings yet</p>
        ) : (
          <div className="space-y-2">
            {bookings.items.slice(0, 4).map((b) => (
              <Link key={b.id} to={`/my-bookings/${b.id}`}
                className="flex items-center gap-3 p-2 -mx-2 rounded-lg hover:bg-gray-50 transition-colors">
                <div className="w-9 h-9 rounded-lg overflow-hidden bg-primary-50 shrink-0 flex items-center justify-center">
                  <Calendar size={14} className="text-primary-300" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{b.packageName || b.guideName}</p>
                  <p className="text-xs text-gray-400">{b.status}</p>
                </div>
                <p className="text-xs text-gray-400 shrink-0">{formatDate(b.bookingDate)}</p>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* ── Saved districts ── */}
      <div className="card p-5">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-semibold text-gray-900 flex items-center gap-2">
            <MapPinned size={16} className="text-primary-600" /> Saved districts
          </h2>
          <Link to="/saved-districts" className="text-xs text-primary-600 hover:underline flex items-center gap-0.5">
            Manage <ChevronRight size={12} />
          </Link>
        </div>
        {!savedDistricts?.length ? (
          <p className="text-sm text-gray-400 py-2">No saved districts yet</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {savedDistricts.map((d) => (
              <span key={d.districtId} className="badge bg-primary-50 text-primary-700">{d.districtName}</span>
            ))}
          </div>
        )}
      </div>
    </div>
  )
} 