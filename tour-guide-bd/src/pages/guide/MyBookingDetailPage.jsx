import { useParams, Link } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { guideApi } from '../../api/guide.api'
import LoadingSpinner from '../../components/common/LoadingSpinner'
import { formatDate } from '../../utils/formatters'
import {
  Calendar, Users, MapPin, Phone, Star, BadgeCheck,
  Utensils, Bus, Home, ExternalLink, XCircle, ArrowLeft,
} from 'lucide-react'
import toast from 'react-hot-toast'

export default function MyBookingDetailPage() {
  const { bookingId } = useParams()
  const qc = useQueryClient()

  const { data: b, isLoading } = useQuery({
    queryKey: ['guide-my-booking', bookingId],
    queryFn: () => guideApi.getMyBookingById(bookingId).then((r) => r.data),
  })

  const cancelMutation = useMutation({
    mutationFn: () => guideApi.cancelBooking(bookingId), // backend e endpoint thakle
    onSuccess: () => {
      toast.success('Booking cancelled')
      qc.invalidateQueries(['guide-my-booking', bookingId])
    },
    onError: () => toast.error('Cancel failed'),
  })

  if (isLoading) return <LoadingSpinner center />
  if (!b) return null

  const includes = [
    { label: 'Food', value: b.includesFood, icon: Utensils },
    { label: 'Transport', value: b.includesTransport, icon: Bus },
    { label: 'Accommodation', value: b.includesAccommodation, icon: Home },
  ].filter((i) => i.value)

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8 space-y-5">
      <Link to="/guide/my-bookings" className="text-sm text-gray-500 flex items-center gap-1 hover:text-gray-700">
        <ArrowLeft size={14} /> Back to bookings
      </Link>

      <div className="card p-6 space-y-5">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-lg font-bold text-gray-900">{b.packageTitle}</h1>
            <p className="text-sm text-gray-500 mt-1">{b.packageDescription}</p>
          </div>
          <span className="badge bg-primary-50 text-primary-700 shrink-0">{b.status}</span>
        </div>

        {/* booking info */}
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="flex items-center gap-2 text-gray-700">
            <Calendar size={14} className="text-gray-400" /> {formatDate(b.tourDate)}
          </div>
          <div className="flex items-center gap-2 text-gray-700">
            <Users size={14} className="text-gray-400" /> {b.numberOfPeople} people
          </div>
          <div className="flex items-center gap-2 text-gray-700">
            ৳ {b.totalAmount} total
          </div>
          <div className="flex items-center gap-2 text-gray-700">
            {b.isPaid ? (
              <span className="flex items-center gap-1 text-green-600">
                <BadgeCheck size={14} /> Paid {b.paidAt && `on ${formatDate(b.paidAt)}`}
              </span>
            ) : (
              <span className="text-amber-600">Payment pending</span>
            )}
          </div>
        </div>

        {/* meeting point */}
        <div>
          <p className="text-xs font-medium text-gray-500 mb-1">Meeting point</p>
          <div className="flex items-center justify-between bg-gray-50 rounded-lg p-3">
            <div className="flex items-center gap-2 text-sm text-gray-700">
              <MapPin size={14} className="text-primary-500" /> {b.meetingPoint}
            </div>
            {b.meetingGoogleMapsUrl && (
              <a href={b.meetingGoogleMapsUrl} target="_blank" rel="noreferrer"
                className="text-primary-600 text-xs flex items-center gap-1 hover:underline">
                Map <ExternalLink size={11} />
              </a>
            )}
          </div>
        </div>

        {/* what's included */}
        {includes.length > 0 && (
          <div>
            <p className="text-xs font-medium text-gray-500 mb-2">Includes</p>
            <div className="flex gap-2 flex-wrap">
              {includes.map(({ label, icon: Icon }) => (
                <span key={label} className="badge bg-gray-50 text-gray-600 flex items-center gap-1">
                  <Icon size={12} /> {label}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* cancellation info */}
        {b.status === 'Cancelled' && b.cancellationReason && (
          <div className="bg-red-50 rounded-lg p-3 text-sm text-red-700">
            <p className="font-medium">Cancelled {b.cancelledAt && `on ${formatDate(b.cancelledAt)}`}</p>
            <p className="text-xs mt-1">{b.cancellationReason}</p>
          </div>
        )}

        {/* actions */}
        {b.canCancel && (
          <button
            onClick={() => cancelMutation.mutate()}
            disabled={cancelMutation.isPending}
            className="btn-secondary text-red-600 flex items-center gap-2"
          >
            <XCircle size={16} /> {cancelMutation.isPending ? 'Cancelling…' : 'Cancel booking'}
          </button>
        )}
      </div>
    </div>
  )
}