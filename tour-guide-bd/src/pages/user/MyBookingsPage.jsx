import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useSearchParams, Link } from 'react-router-dom'
import {
  Calendar, Users, MapPin, Star,
  CheckCircle, Clock, XCircle, Package,
  ExternalLink, Utensils, Car, Home, Phone
} from 'lucide-react'
import { bookingApi } from '../../api/booking.api'
import { useAuthStore } from '../../store/auth.store'
import LoadingSpinner from '../../components/common/LoadingSpinner'
import Pagination from '../../components/common/Pagination'
import { usePagination } from '../../hooks/usePagination'

var STATUS_OPTIONS = [
  { value: '', label: 'All' },
  { value: 'Pending', label: 'Pending' },
  { value: 'Confirmed', label: 'Confirmed' },
  { value: 'Completed', label: 'Completed' },
  { value: 'Cancelled', label: 'Cancelled' },
]

function getStatusBadgeCls(status) {
  var base = 'inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium '
  if (status === 'Confirmed') return base + 'bg-green-100 text-green-700'
  if (status === 'Completed') return base + 'bg-blue-100 text-blue-700'
  if (status === 'Cancelled') return base + 'bg-red-100 text-red-700'
  return base + 'bg-amber-100 text-amber-700'
}

function getStatusIcon(status) {
  if (status === 'Confirmed') return CheckCircle
  if (status === 'Completed') return Star
  if (status === 'Cancelled') return XCircle
  return Clock
}

function BookingCard(props) {
  var b = props.booking
  var Icon = getStatusIcon(b.status)
  var badgeCls = getStatusBadgeCls(b.status)

  var tourDateStr = new Date(b.tourDate).toLocaleDateString('en-BD', {
    weekday: 'short', year: 'numeric', month: 'short', day: 'numeric',
  })
  var bookedAtStr = new Date(b.bookedAt).toLocaleDateString('en-BD', {
    month: 'short', day: 'numeric', year: 'numeric',
  })

  var inclusions = []
  if (b.includesFood) inclusions.push('Food')
  if (b.includesTransport) inclusions.push('Transport')
  if (b.includesAccommodation) inclusions.push('Stay')

  return (
    <div className="bg-white border border-gray-100 rounded-2xl p-5 hover:shadow-md transition-all">
      {/* Header */}
      <div className="flex items-start justify-between gap-3 mb-4">
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-gray-900 text-base">{b.packageTitle}</p>
          <p className="text-xs text-gray-400 mt-0.5">
            {'Booked on ' + bookedAtStr + ' · #' + b.bookingId}
          </p>
        </div>
        <span className={badgeCls}>
          <Icon size={11} />{b.status}
        </span>
      </div>

      {/* Guide info */}
      <div className="flex items-center gap-3 mb-4 p-3 bg-gray-50 rounded-xl">
        <img
          src={b.guidePhotoUrl || '/default-avatar.png'}
          alt={b.guideName}
          className="w-10 h-10 rounded-full object-cover shrink-0"
        />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-gray-900">{b.guideName}</p>
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <span className="flex items-center gap-0.5">
              <Star size={11} className="text-amber-400 fill-amber-400" />
              {b.guideAverageRating.toFixed(1)}
            </span>
            {b.guidePhoneNumber && (
              <span className="flex items-center gap-0.5">
                <Phone size={10} />{b.guidePhoneNumber}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Booking details */}
      <div className="grid grid-cols-2 gap-3 text-sm mb-4">
        <div className="flex items-center gap-2 text-gray-600">
          <Calendar size={14} className="text-primary-500 shrink-0" />
          <span>{tourDateStr}</span>
        </div>
        <div className="flex items-center gap-2 text-gray-600">
          <Users size={14} className="text-primary-500 shrink-0" />
          <span>{b.numberOfPeople + ' ' + (b.numberOfPeople === 1 ? 'person' : 'people')}</span>
        </div>
      </div>

      {/* Meeting point */}
      {b.meetingPoint && (
        <a
          href={b.meetingGoogleMapsUrl}
          target="_blank"
          rel="noreferrer"
          className="flex items-center gap-1 text-xs text-primary-600 hover:underline mb-3"
        >
          <MapPin size={12} />
          <span>{b.meetingPoint}</span>
          <ExternalLink size={10} />
        </a>
      )}

      {/* Inclusions */}
      {inclusions.length > 0 && (
        <div className="flex gap-2 mb-3">
          {inclusions.map(function(item) {
            return (
              <span key={item} className="text-xs bg-green-50 text-green-700 px-2 py-0.5 rounded-full">
                {item}
              </span>
            )
          })}
        </div>
      )}

      {/* Payment + Total */}
      <div className="flex items-center justify-between pt-3 border-t">
        <div>
          <span className="text-xl font-bold text-primary-600">
            {'৳' + Number(b.totalAmount).toLocaleString()}
          </span>
          {b.isPaid ? (
            <span className="ml-2 text-xs text-green-600 font-medium">Paid</span>
          ) : (
            <span className="ml-2 text-xs text-amber-600 font-medium">Unpaid</span>
          )}
        </div>
        {b.canReview && (
          <Link
            to={'/guides/' + b.guideProfileId + '?review=' + b.bookingId}
            className="px-3 py-1 bg-amber-500 text-white text-xs rounded-xl hover:bg-amber-600 transition-colors flex items-center gap-1"
          >
            <Star size={12} /> Review
          </Link>
        )}
      </div>

      {/* Cancellation info */}
      {b.cancellationReason && (
        <div className="mt-3 bg-red-50 rounded-xl px-3 py-2 text-xs text-red-600">
          {'Cancelled: ' + b.cancellationReason}
        </div>
      )}
    </div>
  )
}

export default function MyBookingsPage() {
  var searchParamsResult = useSearchParams()
  var searchParams = searchParamsResult[0]
  var successId = searchParams.get('success')
  var user = useAuthStore(function(s) { return s.user })
  var [status, setStatus] = useState('')
  var pagination = usePagination()
  var pageNumber = pagination.pageNumber
  var pageSize = pagination.pageSize
  var nextPage = pagination.nextPage
  var prevPage = pagination.prevPage
  var goToPage = pagination.goToPage
  var reset = pagination.reset

  var queryResult = useQuery({
    queryKey: ['my-bookings', status, pageNumber],
    queryFn: function() {
      return bookingApi.getMyBookings({
        status: status || undefined,
        pageNumber: pageNumber,
        pageSize: pageSize,
      }).then(function(r) { return r.data })
    },
    enabled: !!user,
    retry: false,
  })

  var data = queryResult.data
  var isLoading = queryResult.isLoading

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Success banner */}
      {successId && (
        <div className="bg-green-50 border border-green-100 rounded-2xl p-4 mb-6 flex items-center gap-3">
          <CheckCircle size={20} className="text-green-600 shrink-0" />
          <div>
            <p className="font-semibold text-green-800">Payment Successful!</p>
            <p className="text-sm text-green-600">
              {'Booking #' + successId + ' confirmed. Guide will contact you soon.'}
            </p>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">My Bookings</h1>
          <p className="text-sm text-gray-400 mt-0.5">
            {data ? data.totalCount + ' bookings' : ''}
          </p>
        </div>
        <Link to="/guides" className="text-sm text-primary-600 hover:underline">
          Browse Guides
        </Link>
      </div>

      {/* Status filter */}
      <div className="flex flex-wrap gap-2 mb-6">
        {STATUS_OPTIONS.map(function(s) {
          var btnCls = s.value === status
            ? 'px-3 py-1 rounded-xl text-sm font-medium bg-primary-600 text-white'
            : 'px-3 py-1 rounded-xl text-sm bg-white border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors'
          return (
            <button
              key={s.label}
              onClick={function() { setStatus(s.value); reset() }}
              className={btnCls}
            >
              {s.label}
            </button>
          )
        })}
      </div>

      {isLoading && <LoadingSpinner center />}

      {!isLoading && data && data.items && data.items.length === 0 && (
        <div className="text-center py-16 border-2 border-dashed border-gray-100 rounded-2xl">
          <Package size={40} className="mx-auto text-gray-200 mb-3" />
          <p className="text-gray-400 font-medium">No bookings found</p>
          <Link
            to="/guides"
            className="inline-flex items-center gap-2 mt-4 bg-primary-600 text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-primary-700 transition-colors"
          >
            Find a Guide
          </Link>
        </div>
      )}

      {!isLoading && data && data.items && data.items.length > 0 && (
        <>
          <div className="grid gap-4">
            {data.items.map(function(b) {
              return <BookingCard key={b.bookingId} booking={b} />
            })}
          </div>
          <div className="mt-6">
            <Pagination
              pageNumber={pageNumber}
              totalPages={data.totalPages}
              hasPrev={data.hasPreviousPage}
              hasNext={data.hasNextPage}
              onPrev={prevPage}
              onNext={nextPage}
              onPage={goToPage}
            />
          </div>
        </>
      )}
    </div>
  )
}