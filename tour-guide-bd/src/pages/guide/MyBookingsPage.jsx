import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { guideApi } from '../../api/guide.api'
import { useAuthStore } from '../../store/auth.store'
import LoadingSpinner from '../../components/common/LoadingSpinner'
import { formatDate } from '../../utils/formatters'
import { Calendar, ChevronRight, Users, BadgeCheck } from 'lucide-react'

const STATUS_OPTIONS = ['All', 'Pending', 'Confirmed', 'Completed', 'Cancelled']

export default function MyBookingsPage() {
  const { user } = useAuthStore()
  const [status, setStatus] = useState('All')
  const [page, setPage] = useState(1)

  const { data, isLoading } = useQuery({
    queryKey: ['guide-my-bookings', user?.id, status, page],
    queryFn: () =>
      guideApi
        .getMyBookings({
          status: status === 'All' ? undefined : status,
          pageNumber: page,
          pageSize: 10,
        })
        .then((r) => r.data),
    enabled: !!user?.id,
  })

  if (isLoading) return <LoadingSpinner center />

  const bookings = data?.items ?? []

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8 space-y-5">
      <h1 className="text-xl font-bold text-gray-900">My bookings</h1>

      {/* status filter */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {STATUS_OPTIONS.map((s) => (
          <button
            key={s}
            onClick={() => {
              setStatus(s)
              setPage(1)
            }}
            className={`px-3 py-1.5 rounded-full text-sm whitespace-nowrap transition-colors ${
              status === s
                ? 'bg-primary-600 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {s}
          </button>
        ))}
      </div>

      {bookings.length === 0 ? (
        <p className="text-sm text-gray-400 py-6 text-center">No bookings found</p>
      ) : (
        <div className="space-y-2">
          {bookings.map((b) => (
            <Link
              key={b.bookingId}
              to={`/guide/my-bookings/${b.bookingId}`}
              className="card p-4 flex items-center gap-3 hover:shadow-md transition-shadow"
            >
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">{b.packageTitle}</p>
                <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
                  <span className="flex items-center gap-1">
                    <Calendar size={11} /> {formatDate(b.tourDate)}
                  </span>
                  <span className="flex items-center gap-1">
                    <Users size={11} /> {b.numberOfPeople}
                  </span>
                  {b.isPaid && (
                    <span className="flex items-center gap-1 text-green-600">
                      <BadgeCheck size={11} /> Paid
                    </span>
                  )}
                </div>
              </div>
              <div className="text-right shrink-0">
                <p className="text-sm font-semibold text-gray-900">৳{b.totalAmount}</p>
                <span className="badge bg-primary-50 text-primary-700">{b.status}</span>
              </div>
              <ChevronRight size={16} className="text-gray-300 shrink-0" />
            </Link>
          ))}
        </div>
      )}

      {/* pagination */}
      {data?.totalPages > 1 && (
        <div className="flex justify-center gap-2 pt-2">
          <button
            disabled={page <= 1}
            onClick={() => setPage((p) => p - 1)}
            className="btn-secondary disabled:opacity-40"
          >
            Prev
          </button>
          <span className="text-sm text-gray-500 self-center">
            {page} / {data.totalPages}
          </span>
          <button
            disabled={page >= data.totalPages}
            onClick={() => setPage((p) => p + 1)}
            className="btn-secondary disabled:opacity-40"
          >
            Next
          </button>
        </div>
      )}
    </div>
  )
}