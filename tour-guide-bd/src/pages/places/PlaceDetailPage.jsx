import { useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { placesApi } from '../../api/places.api'
import { reviewsApi } from '../../api/reviews.api'
import { usersApi } from '../../api/users.api'
import { realtimeApi } from '../../api/realtime.api'
import LoadingSpinner from '../../components/common/LoadingSpinner'
import StarRating from '../../components/common/StarRating'
import Badge from '../../components/common/Badge'
import LiveVisitorCounter from '../../components/places/LiveVisitorCounter'
import { formatBDT, formatDate, timeAgo } from '../../utils/formatters'
import { BEST_SEASON } from '../../utils/constants'
import { resolveImageUrl } from '../../utils/imageUrl'
import { MapPin, Ticket, Calendar, Users, Heart, LogIn, Edit, Clock, Route, ArrowRight } from 'lucide-react'
import { useAuthStore } from '../../store/auth.store'
import toast from 'react-hot-toast'
import { usePagination } from '../../hooks/usePagination'
import Pagination from '../../components/common/Pagination'

export default function PlaceDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user, isAuthenticated } = useAuthStore()
  const qc = useQueryClient()
  const { pageNumber, pageSize, nextPage, prevPage, goToPage } = usePagination()
  const [reviewForm, setReviewForm] = useState({ rating: 0, commentEn: '' })
  const [submitting, setSubmitting] = useState(false)
  const [activePhotoIdx, setActivePhotoIdx] = useState(0)

  const { data: place, isLoading, isError } = useQuery({
    queryKey: ['place', id],
    queryFn: () => placesApi.getById(id).then(r => r.data),
    retry: false,
  })

  const { data: crowd } = useQuery({
    queryKey: ['crowd', id],
    queryFn: () => realtimeApi.getCrowdLevel(id).then(r => r.data),
    refetchInterval: 30000,
  })

  const { data: reviews } = useQuery({
    queryKey: ['reviews', id, pageNumber],
    queryFn: () => reviewsApi.getByPlace(id, { pageNumber, pageSize }).then(r => r.data),
    enabled: !!id,
  })

  const checkInMutation = useMutation({
    mutationFn: () => usersApi.checkIn(id, {}),
    onSuccess: () => toast.success('Checked in!'),
    onError: () => toast.error('Check-in failed'),
  })

  const handleReview = async (e) => {
    e.preventDefault()
    if (!reviewForm.rating) return toast.error('Please give a rating')
    setSubmitting(true)
    try {
      await reviewsApi.create({ placeId: Number(id), ...reviewForm, userId: user?.id })
      toast.success('Review submitted for approval')
      setReviewForm({ rating: 0, commentEn: '' })
      qc.invalidateQueries(['reviews', id])
    } catch {
      toast.error('Failed to submit review')
    } finally {
      setSubmitting(false)
    }
  }

  const handlePlanTrip = () => {
    navigate('/trip-planner', { state: { destinationPlace: place } })
  }

  if (isLoading) return <LoadingSpinner center />

  if (isError || !place) {
    return (
      <div className="text-center py-20 text-gray-400">
        <MapPin size={32} className="mx-auto mb-2 opacity-40" />
        <p>This place doesn't exist or was removed.</p>
        <Link to="/places" className="text-primary-600 hover:underline text-sm mt-2 inline-block">
          Back to Explore
        </Link>
      </div>
    )
  }

  const photos = place.photos || []
  const activePhoto = photos[activePhotoIdx] || photos[0]
  const canEdit = user?.id === place.submittedByUserId || user?.roles?.includes('Admin')

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6">

      {/* ── Photo gallery ── */}
      <div className="mb-3">
        <div className="h-56 sm:h-80 rounded-2xl overflow-hidden bg-gradient-to-br from-primary-100 to-primary-200">
          {activePhoto?.url ? (
            <img
              src={resolveImageUrl(activePhoto.url)}
              alt={place.name}
              className="w-full h-full object-cover transition-opacity duration-200"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <MapPin size={48} className="text-primary-300" />
            </div>
          )}
        </div>
      </div>

      {photos.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-1 mb-6">
          {photos.map((photo, idx) => (
            <button
              key={photo.id ?? idx}
              type="button"
              onClick={() => setActivePhotoIdx(idx)}
              className={`shrink-0 w-20 h-16 rounded-lg overflow-hidden border-2 transition-all ${
                idx === activePhotoIdx
                  ? 'border-primary-600 opacity-100'
                  : 'border-transparent opacity-60 hover:opacity-100'
              }`}
            >
              <img
                src={resolveImageUrl(photo.url)}
                alt={`${place.name} ${idx + 1}`}
                className="w-full h-full object-cover"
              />
            </button>
          ))}
        </div>
      )}

      {photos.length <= 1 && <div className="mb-6" />}

      <div className="grid sm:grid-cols-3 gap-6">
        {/* Main */}
        <div className="sm:col-span-2 space-y-6">
          <div>
            <div className="flex items-start justify-between gap-3">
              <div>
                <h1 className="text-2xl sm:text-3xl font-black text-gray-900 leading-tight">{place.name}</h1>
                {place.nameBn && <p className="text-gray-400 mt-1 text-base">{place.nameBn}</p>}
              </div>
              {canEdit && (
                <Link
                  to={`/places/${id}/edit`}
                  className="btn-secondary text-sm flex items-center gap-1.5 shrink-0"
                >
                  <Edit size={14} /> Edit
                </Link>
              )}
            </div>
            <div className="flex items-center gap-1.5 mt-2 text-sm text-gray-500">
              <MapPin size={14} />
              <span>{[place.upazilaName, place.districtName, place.divisionName].filter(Boolean).join(', ')}</span>
            </div>
            <div className="flex items-center gap-3 mt-3">
              <StarRating value={Math.round(place.averageRating)} />
              <span className="text-sm font-semibold text-gray-700">{place.averageRating?.toFixed(1)}</span>
              <span className="text-sm text-gray-400">({place.totalReviews} reviews)</span>
            </div>
          </div>

          {place.description && (
            <div>
              <h2 className="font-semibold text-gray-900 mb-2">About</h2>
              <p className="text-sm text-gray-600 leading-relaxed">{place.description}</p>
            </div>
          )}

          {place.categories?.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {place.categories.map((c) => <Badge key={c} variant="green">{c}</Badge>)}
              {place.tags?.map((t) => <Badge key={t} variant="gray">{t}</Badge>)}
            </div>
          )}

          {/* Reviews */}
          <div>
            <h2 className="font-semibold text-gray-900 mb-3">Reviews</h2>
            {isAuthenticated ? (
              <form onSubmit={handleReview} className="card p-4 mb-4 space-y-3">
                <StarRating value={reviewForm.rating} onChange={(v) => setReviewForm({ ...reviewForm, rating: v })} size={22} />
                <textarea value={reviewForm.commentEn}
                  onChange={(e) => setReviewForm({ ...reviewForm, commentEn: e.target.value })}
                  placeholder="Write your review…" rows={3} className="input resize-none" />
                <button type="submit" disabled={submitting} className="btn-primary">
                  {submitting ? 'Submitting…' : 'Submit review'}
                </button>
              </form>
            ) : (
              <div className="card p-4 text-center text-sm text-gray-500 mb-4 flex items-center justify-center gap-2">
                <LogIn size={16} /> Log in to write a review
              </div>
            )}
            <div className="space-y-3">
              {reviews?.items?.map((r) => (
                <div key={r.id} className="card p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center text-xs font-semibold text-primary-700">
                      {r.userName?.[0]?.toUpperCase()}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">{r.userName}</p>
                      <p className="text-xs text-gray-400">{timeAgo(r.createdAt)}</p>
                    </div>
                    <StarRating value={r.rating} size={12} />
                  </div>
                  {r.commentEn && <p className="text-sm text-gray-600">{r.commentEn}</p>}
                </div>
              ))}
            </div>
            <Pagination pageNumber={pageNumber} totalPages={reviews?.totalPages}
              hasPrev={reviews?.hasPreviousPage} hasNext={reviews?.hasNextPage}
              onPrev={prevPage} onNext={nextPage} onPage={goToPage} />
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          {/* Plan a trip CTA */}
          <button
            onClick={handlePlanTrip}
            className="w-full bg-gradient-to-br from-primary-600 to-teal-500 rounded-2xl p-4 text-left text-white shadow-sm hover:shadow-md transition-shadow group"
          >
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2 text-white/80 text-xs font-medium mb-1">
                  <Route size={14} />
                  <span>Plan a trip</span>
                </div>
                <p className="font-bold text-sm leading-snug">
                  Get cost &amp; route to {place.name}
                </p>
              </div>
              <ArrowRight size={18} className="text-white/70 group-hover:translate-x-0.5 group-hover:text-white transition-all shrink-0 ml-2" />
            </div>
          </button>

          <div className="card p-4 space-y-3">
            <div className="flex items-center gap-2 text-sm">
              <Ticket size={16} className="text-primary-600" />
              <span className="text-gray-600">Entry fee</span>
              <span className="ml-auto font-semibold">{place.entryFee > 0 ? formatBDT(place.entryFee) : 'Free'}</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Calendar size={16} className="text-primary-600" />
              <span className="text-gray-600">Best season</span>
              <span className="ml-auto font-semibold">{BEST_SEASON[place.bestSeason] || '—'}</span>
            </div>
            {(place.openingHours || place.closingHours) && (
              <div className="flex items-center gap-2 text-sm">
                <Clock size={16} className="text-primary-600" />
                <span className="text-gray-600">Hours</span>
                <span className="ml-auto font-semibold">
                  {place.openingHours || '—'} – {place.closingHours || '—'}
                </span>
              </div>
            )}
            {crowd && (
              <div className="flex items-center gap-2 text-sm">
                <Users size={16} className="text-primary-600" />
                <span className="text-gray-600">Crowd level</span>
                <span className="ml-auto font-semibold">{crowd.crowdLevel}</span>
              </div>
            )}
          </div>

          {crowd && (
            <LiveVisitorCounter placeId={id} currentCount={crowd.currentCount} />
          )}

          {isAuthenticated && (
            <button onClick={() => checkInMutation.mutate()}
              disabled={checkInMutation.isPending}
              className="btn-primary w-full flex items-center justify-center gap-2">
              <Heart size={16} />
              {checkInMutation.isPending ? 'Checking in…' : 'Check in here'}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}