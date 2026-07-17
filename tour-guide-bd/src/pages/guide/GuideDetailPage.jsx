import { useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { useAuthStore } from '../../store/auth.store'
import BookingModal from './BookingModal'
import { useQuery } from '@tanstack/react-query'
import {
  Star, MapPin, Briefcase, Globe, Users, CheckCircle,
  Clock, Utensils, Car, Home, ExternalLink, ChevronLeft,
  Award, MessageSquare, Package
} from 'lucide-react'
import { guideApi } from '../../api/guide.api'
import LoadingSpinner from '../../components/common/LoadingSpinner'

const BADGE_STYLE = {
  Verified: 'bg-blue-100 text-blue-700',
  Expert:   'bg-purple-100 text-purple-700',
  default:  'bg-gray-100 text-gray-600',
}

function StarRating({ value, size = 14, showNumber = false }) {
  return (
    <span className="flex items-center gap-1">
      <span className="flex items-center gap-0.5">
        {[1, 2, 3, 4, 5].map((i) => (
          <Star
            key={i}
            size={size}
            className={
              i <= Math.round(value)
                ? 'text-amber-400 fill-amber-400'
                : 'text-gray-200 fill-gray-200'
            }
          />
        ))}
      </span>
      {showNumber && (
        <span className="text-sm font-semibold text-gray-700">{value}</span>
      )}
    </span>
  )
}

function StatCard({ icon: Icon, label, value, color }) {
  const colors = {
    primary: 'bg-primary-50 text-primary-600',
    amber:   'bg-amber-50 text-amber-600',
    green:   'bg-green-50 text-green-600',
    purple:  'bg-purple-50 text-purple-600',
  }
  const cls = colors[color] || colors.primary
  return (
    <div className="bg-white border border-gray-100 rounded-2xl p-4 flex items-center gap-3">
      <div className={['w-10 h-10 rounded-xl flex items-center justify-center', cls].join(' ')}>
        <Icon size={18} />
      </div>
      <div>
        <p className="text-xl font-bold text-gray-900">{value}</p>
        <p className="text-xs text-gray-400">{label}</p>
      </div>
    </div>
  )
}

function RatingBar({ label, value }) {
  const pct = (value / 5) * 100
  return (
    <div className="flex items-center gap-3">
      <span className="text-xs text-gray-500 w-28 shrink-0">{label}</span>
      <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
        <div
          className="h-full bg-amber-400 rounded-full transition-all"
          style={{ width: pct + '%' }}
        />
      </div>
      <span className="text-xs font-semibold text-gray-700 w-6 text-right">{value}</span>
    </div>
  )
}

function PackageCard({ pkg, onBook }) {
  const inclusions = [
    pkg.includesFood          && { icon: Utensils, label: 'Food' },
    pkg.includesTransport     && { icon: Car,      label: 'Transport' },
    pkg.includesAccommodation && { icon: Home,     label: 'Stay' },
  ].filter(Boolean)

  const meetingCls = 'flex items-center gap-1 text-xs text-primary-600 hover:underline mb-4'

  return (
    <div className="bg-white border border-gray-100 rounded-2xl p-5 hover:shadow-md transition-all">
      {/* Title + Price */}
      <div className="flex items-start justify-between gap-2 mb-3">
        <h4 className="font-semibold text-gray-900">{pkg.title}</h4>
        <div className="text-right shrink-0">
          <p className="text-lg font-bold text-primary-600">
            {'৳' + pkg.pricePerPerson.toLocaleString()}
          </p>
          <p className="text-xs text-gray-400">per person</p>
        </div>
      </div>

      {/* Description */}
      <p className="text-xs text-gray-500 leading-relaxed mb-4 line-clamp-3">
        {pkg.description}
      </p>

      {/* Meta */}
      <div className="flex flex-wrap gap-3 text-xs text-gray-500 mb-4">
        <span className="flex items-center gap-1">
          <Clock size={12} />
          {pkg.durationDays} {pkg.durationDays > 1 ? 'days' : 'day'}
        </span>
        <span className="flex items-center gap-1">
          <Users size={12} />
          Max {pkg.maxPeople} people
        </span>
        <span className="flex items-center gap-1">
          <CheckCircle size={12} className="text-green-500" />
          {pkg.completedBookings} completed
        </span>
      </div>

      {/* Inclusions */}
      {inclusions.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-4">
          {inclusions.map(function(item) {
            var Icon = item.icon
            return (
              <span
                key={item.label}
                className="flex items-center gap-1 text-xs bg-green-50 text-green-700 px-2 py-1 rounded-full"
              >
                <Icon size={11} />
                {item.label}
              </span>
            )
          })}
        </div>
      )}

      {/* Additional includes */}
      {pkg.additionalIncludes && (
        <p className="text-xs text-gray-400 mb-3">+ {pkg.additionalIncludes}</p>
      )}

      {/* Meeting point */}
      {pkg.meetingPoint && (
        <a
          href={pkg.meetingGoogleMapsUrl}
          target="_blank"
          rel="noreferrer"
          className={meetingCls}
        >
          <MapPin size={12} />
          <span>{pkg.meetingPoint}</span>
          <ExternalLink size={11} />
        </a>
      )}

      {/* Availability dates */}
      {pkg.upcomingAvailabilities && pkg.upcomingAvailabilities.length > 0 && (
        <div>
          <p className="text-xs text-gray-400 mb-2 font-medium">Upcoming availability</p>
          <div className="flex flex-wrap gap-1">
            {pkg.upcomingAvailabilities.slice(0, 6).map(function(a) {
              var dateCls = a.isAvailable
                ? 'text-xs px-2 py-0.5 rounded-lg border bg-primary-50 border-primary-200 text-primary-700'
                : 'text-xs px-2 py-0.5 rounded-lg border bg-gray-50 border-gray-200 text-gray-400 line-through'
              var dateStr = new Date(a.date).toLocaleDateString('en-BD', {
                month: 'short',
                day: 'numeric',
              })
              return (
                <span key={a.date} className={dateCls}>
                  {dateStr}
                  {a.isAvailable && (
                    <span className="ml-1 text-primary-400">{a.remainingSlots}&#10003;</span>
                  )}
                </span>
              )
            })}
          </div>
        </div>
      )}

      {/* Book Now Button */}
      <button
        onClick={() => onBook(pkg)}
        className="w-full mt-3 bg-primary-600 text-white rounded-xl py-2 text-sm font-medium hover:bg-primary-700 transition-colors"
      >
        Book Now
      </button>
    </div>
  )
}

function ReviewCard({ review }) {
  var initial = review.userName
    ? review.userName[0].toUpperCase()
    : '?'
  var dateStr = new Date(review.createdAt).toLocaleDateString('en-BD', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })

  return (
    <div className="bg-white border border-gray-100 rounded-2xl p-5">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-primary-100 text-primary-700 font-bold text-sm flex items-center justify-center">
            {initial}
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-900">{review.userName}</p>
            <p className="text-xs text-gray-400">{dateStr}</p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <Star size={13} className="text-amber-400 fill-amber-400" />
          <span className="text-sm font-bold text-gray-800">{review.overallRating}</span>
        </div>
      </div>

      {review.comment && (
        <p className="text-sm text-gray-600 leading-relaxed mb-4">{review.comment}</p>
      )}

      <div className="space-y-1 border-t pt-3">
        <RatingBar label="Punctuality"   value={review.punctualityRating} />
        <RatingBar label="Knowledge"     value={review.knowledgeRating} />
        <RatingBar label="Communication" value={review.communicationRating} />
        <RatingBar label="Safety"        value={review.safetyRating} />
        <RatingBar label="Value"         value={review.valueRating} />
      </div>
    </div>
  )
}

export default function GuideDetailPage() {
  var params = useParams()
  var guideId = params.guideId
  var navigate = useNavigate()
  var isAuthenticated = useAuthStore(function(s) { return s.isAuthenticated })
  var [bookingPkg, setBookingPkg] = useState(null)
  
  var queryResult = useQuery({
    queryKey: ['guide', guideId],
    queryFn: function() {
      return guideApi.getGuideDetail(guideId).then(function(r) { return r.data })
    },
    enabled: !!guideId,
  })

  var guide = queryResult.data
  var isLoading = queryResult.isLoading
  var isError = queryResult.isError

  if (isLoading) return <LoadingSpinner center />
  if (isError || !guide) {
    return (
      <div className="text-center py-20 text-gray-400">Guide not found.</div>
    )
  }

  var languages = guide.languages
    ? guide.languages.split(',').map(function(l) { return l.trim() }).filter(Boolean)
    : []
  var specialities = guide.specialities
    ? guide.specialities.split(',').map(function(s) { return s.trim() }).filter(Boolean)
    : []
  var badgeClass = BADGE_STYLE[guide.badge] || BADGE_STYLE.default

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Back */}
      <Link
        to="/guides"
        className="inline-flex items-center gap-1 text-sm text-gray-400 hover:text-gray-700 mb-6 transition-colors"
      >
        <ChevronLeft size={16} />
        All Guides
      </Link>

      {/* Hero Card */}
      <div className="bg-white border border-gray-100 rounded-2xl p-6 mb-6">
        <div className="flex gap-5 items-start">
          <div className="relative shrink-0">
            <img
              src={guide.profilePhotoUrl || '/default-avatar.png'}
              alt={guide.fullName}
              className="w-24 h-24 rounded-2xl object-cover"
            />
            {guide.badge && (
              <span
                className={[
                  'absolute -bottom-2 left-1/2 -translate-x-1/2 text-xs px-2 py-0.5 rounded-full font-semibold whitespace-nowrap',
                  badgeClass,
                ].join(' ')}
              >
                <Award size={10} className="inline mr-0.5" />
                {guide.badge}
              </span>
            )}
          </div>

          <div className="flex-1 min-w-0">
            <h1 className="text-2xl font-bold text-gray-900">{guide.fullName}</h1>
            <div className="flex items-center gap-2 mt-1">
              <StarRating value={guide.averageRating} showNumber />
              <span className="text-sm text-gray-400">
                ({guide.totalReviews} reviews)
              </span>
            </div>

            <div className="flex flex-wrap gap-2 mt-3">
              {languages.map(function(l) {
                return (
                  <span
                    key={l}
                    className="text-xs bg-blue-50 text-blue-600 px-2 py-1 rounded-full flex items-center gap-1"
                  >
                    <Globe size={11} />
                    {l}
                  </span>
                )
              })}
              {specialities.map(function(s) {
                return (
                  <span
                    key={s}
                    className="text-xs bg-gray-50 text-gray-600 border border-gray-100 px-2 py-1 rounded-full"
                  >
                    {s}
                  </span>
                )
              })}
            </div>
          </div>
        </div>

        {guide.bio && (
          <p className="mt-5 text-sm text-gray-600 leading-relaxed border-t pt-4">
            {guide.bio}
          </p>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        <StatCard
          icon={Star}
          label="Avg Rating"
          value={guide.averageRating.toFixed(1)}
          color="amber"
        />
        <StatCard
          icon={MessageSquare}
          label="Reviews"
          value={guide.totalReviews}
          color="primary"
        />
        <StatCard
          icon={CheckCircle}
          label="Tours Done"
          value={guide.totalToursCompleted}
          color="green"
        />
        <StatCard
          icon={Package}
          label="Packages"
          value={guide.activePackages}
          color="purple"
        />
      </div>

      {/* Packages */}
      {guide.packages && guide.packages.length > 0 && (
        <section className="mb-8">
          <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
            <Package size={18} className="text-primary-600" />
            Tour Packages
          </h2>
          <div className="grid gap-4 sm:grid-cols-2">
            {guide.packages.map(function(pkg) {
              return (
                <PackageCard
                  key={pkg.id}
                  pkg={pkg}
                  onBook={function(p) {
                    if (!isAuthenticated) {
                      navigate('/login')
                      return
                    }
                    setBookingPkg(p)
                  }}
                />
              )
            })}
          </div>
        </section>
      )}

      {/* Reviews */}
      {guide.recentReviews && guide.recentReviews.length > 0 && (
        <section className="mb-8">
          <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
            <Star size={18} className="text-amber-400" />
            Reviews
          </h2>
          <div className="grid gap-4 sm:grid-cols-2">
            {guide.recentReviews.map(function(r) {
              return <ReviewCard key={r.id} review={r} />
            })}
          </div>
        </section>
      )}

      {guide.packages && guide.packages.length === 0 &&
       guide.recentReviews && guide.recentReviews.length === 0 && (
        <div className="text-center py-12 text-gray-400">
          No packages or reviews yet.
        </div>
      )}

      {/* Booking Modal */}
      <BookingModal
        isOpen={!!bookingPkg}
        onClose={function() { setBookingPkg(null) }}
        pkg={bookingPkg}
      />
    </div>
  )
}