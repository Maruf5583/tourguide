import { useState, useCallback } from 'react'
import { useQuery } from '@tanstack/react-query'
import {
  Search, Filter, X, Eye, CheckCircle,
  Clock, XCircle, Star, DollarSign,
  Users, TrendingUp, CreditCard, Calendar
} from 'lucide-react'
import { adminBookingApi } from '../../api/adminBooking.api'
import LoadingSpinner from '../../components/common/LoadingSpinner'
import Pagination from '../../components/common/Pagination'
import Modal from '../../components/common/Modal'
import { usePagination } from '../../hooks/usePagination'

// ── helpers ──────────────────────────────────────────────
var STATUS_OPTIONS = [
  { value: '', label: 'All Status' },
  { value: 0, label: 'Pending' },
  { value: 1, label: 'Confirmed' },
  { value: 2, label: 'Completed' },
  { value: 3, label: 'Cancelled' },
]

var PAID_OPTIONS = [
  { value: '', label: 'All' },
  { value: 'true', label: 'Paid' },
  { value: 'false', label: 'Unpaid' },
]

function getStatusBadgeCls(status) {
  var base = 'inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium '
  if (status === 'Confirmed') return base + 'bg-green-100 text-green-700'
  if (status === 'Completed') return base + 'bg-blue-100 text-blue-700'
  if (status === 'Cancelled' || status === 'CancelledByUser' || status === 'CancelledByGuide')
    return base + 'bg-red-100 text-red-700'
  return base + 'bg-amber-100 text-amber-700'
}

function getStatusIcon(status) {
  if (status === 'Confirmed') return CheckCircle
  if (status === 'Completed') return Star
  if (status === 'Cancelled' || status === 'CancelledByUser' || status === 'CancelledByGuide')
    return XCircle
  return Clock
}

function fmt(amount) {
  return '৳' + Number(amount).toLocaleString()
}

function fmtDate(date) {
  if (!date) return '—'
  return new Date(date).toLocaleDateString('en-BD', {
    year: 'numeric', month: 'short', day: 'numeric',
  })
}

// ── Summary Cards ────────────────────────────────────────
function SummaryCard(props) {
  var icon = props.icon
  var label = props.label
  var value = props.value
  var color = props.color
  var Icon = icon
  var colors = {
    blue:   'bg-blue-50 text-blue-600',
    green:  'bg-green-50 text-green-600',
    amber:  'bg-amber-50 text-amber-600',
    purple: 'bg-purple-50 text-purple-600',
    red:    'bg-red-50 text-red-600',
  }
  var iconCls = ['w-10 h-10 rounded-xl flex items-center justify-center shrink-0', colors[color] || colors.blue].join(' ')
  return (
    <div className="bg-white border border-gray-100 rounded-2xl p-4 flex items-center gap-3">
      <div className={iconCls}><Icon size={18} /></div>
      <div>
        <p className="text-lg font-bold text-gray-900">{value}</p>
        <p className="text-xs text-gray-400">{label}</p>
      </div>
    </div>
  )
}

// ── Booking Detail Modal ─────────────────────────────────
function BookingDetailModal(props) {
  var booking = props.booking
  var onClose = props.onClose

  if (!booking) return null

  var Icon = getStatusIcon(booking.status)
  var badgeCls = getStatusBadgeCls(booking.status)

  return (
    <Modal isOpen={!!booking} onClose={onClose} title={'Booking #' + booking.bookingId}>
      <div className="space-y-4 max-h-screen overflow-y-auto">
        {/* Status */}
        <div className="flex items-center justify-between">
          <span className={badgeCls}><Icon size={11} />{booking.status}</span>
          <span className={booking.isPaid
            ? 'text-xs font-medium text-green-600 bg-green-50 px-2 py-0.5 rounded-full'
            : 'text-xs font-medium text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full'}>
            {booking.isPaid ? 'Paid' : 'Unpaid'}
          </span>
        </div>

        {/* User + Guide */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-gray-50 rounded-xl p-3">
            <p className="text-xs text-gray-400 mb-1 font-medium">Customer</p>
            <p className="text-sm font-semibold text-gray-900">{booking.userName}</p>
            <p className="text-xs text-gray-500">{booking.userEmail}</p>
          </div>
          <div className="bg-gray-50 rounded-xl p-3">
            <p className="text-xs text-gray-400 mb-1 font-medium">Guide</p>
            <p className="text-sm font-semibold text-gray-900">{booking.guideName}</p>
            <p className="text-xs text-gray-500">{booking.guidePhoneNumber}</p>
          </div>
        </div>

        {/* Package + Tour details */}
        <div className="bg-gray-50 rounded-xl p-3 space-y-2 text-sm">
          {[
            ['Package', booking.packageTitle],
            ['Tour Date', fmtDate(booking.tourDate)],
            ['Booked At', fmtDate(booking.bookedAt)],
            ['People', booking.numberOfPeople],
          ].map(function(row) {
            return (
              <div key={row[0]} className="flex justify-between gap-2">
                <span className="text-gray-500 shrink-0">{row[0]}</span>
                <span className="font-medium text-right">{row[1]}</span>
              </div>
            )
          })}
        </div>

        {/* Payment breakdown */}
        <div className="bg-primary-50 rounded-xl p-3 space-y-2 text-sm">
          <p className="font-semibold text-gray-800 mb-2">Payment Breakdown</p>
          {[
            ['Total Amount', fmt(booking.totalAmount)],
            ['Platform Fee (10%)', fmt(booking.platformFee)],
            ['Guide Earning', fmt(booking.guideEarning)],
          ].map(function(row) {
            return (
              <div key={row[0]} className="flex justify-between gap-2">
                <span className="text-gray-500 shrink-0">{row[0]}</span>
                <span className="font-semibold text-primary-700">{row[1]}</span>
              </div>
            )
          })}
          {booking.paidAt && (
            <div className="flex justify-between gap-2 border-t pt-2 mt-1">
              <span className="text-gray-500">Paid At</span>
              <span className="font-medium">{fmtDate(booking.paidAt)}</span>
            </div>
          )}
        </div>

        {/* Stripe IDs */}
        {booking.stripePaymentIntentId && (
          <div className="text-xs text-gray-400 space-y-1 bg-gray-50 rounded-xl p-3">
            <p>Payment Intent: <span className="font-mono">{booking.stripePaymentIntentId}</span></p>
            {booking.stripeChargeId && (
              <p>Charge ID: <span className="font-mono">{booking.stripeChargeId}</span></p>
            )}
          </div>
        )}

        {/* Cancellation */}
        {booking.cancellationReason && (
          <div className="bg-red-50 rounded-xl p-3 text-sm text-red-600">
            <p className="font-medium mb-1">Cancellation Reason</p>
            <p>{booking.cancellationReason}</p>
            {booking.cancelledAt && (
              <p className="text-xs mt-1 opacity-70">{fmtDate(booking.cancelledAt)}</p>
            )}
          </div>
        )}
      </div>
    </Modal>
  )
}

// ── Main Page ────────────────────────────────────────────
export default function AdminBookingsPage() {
  var [search, setSearch] = useState('')
  var [searchInput, setSearchInput] = useState('')
  var [statusFilter, setStatusFilter] = useState('')
  var [paidFilter, setPaidFilter] = useState('')
  var [fromDate, setFromDate] = useState('')
  var [toDate, setToDate] = useState('')
  var [selected, setSelected] = useState(null)
  var pagination = usePagination({ pageSize: 20 })
  var pageNumber = pagination.pageNumber
  var pageSize = pagination.pageSize
  var nextPage = pagination.nextPage
  var prevPage = pagination.prevPage
  var goToPage = pagination.goToPage
  var reset = pagination.reset

  var queryResult = useQuery({
    queryKey: ['admin-bookings', search, statusFilter, paidFilter, fromDate, toDate, pageNumber],
    queryFn: function() {
      var params = {
        pageNumber: pageNumber,
        pageSize: pageSize,
      }
      if (search) params.search = search
      if (statusFilter !== '') params.status = Number(statusFilter)
      if (paidFilter !== '') params.isPaid = paidFilter === 'true'
      if (fromDate) params.fromDate = fromDate
      if (toDate) params.toDate = toDate
      return adminBookingApi.getAll(params).then(function(r) { return r.data })
    },
    keepPreviousData: true,
  })

  var data = queryResult.data
  var isLoading = queryResult.isLoading
  var bookings = data && data.bookings && data.bookings.items ? data.bookings.items : []

  function handleSearch(e) {
    e.preventDefault()
    setSearch(searchInput)
    reset()
  }

  function clearFilters() {
    setSearch('')
    setSearchInput('')
    setStatusFilter('')
    setPaidFilter('')
    setFromDate('')
    setToDate('')
    reset()
  }

  var hasFilter = search || statusFilter || paidFilter || fromDate || toDate

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
          <CreditCard size={20} className="text-primary-600" /> Bookings
        </h1>
        {hasFilter && (
          <button
            onClick={clearFilters}
            className="text-xs text-gray-500 hover:text-red-500 flex items-center gap-1 transition-colors"
          >
            <X size={13} /> Clear filters
          </button>
        )}
      </div>

      {/* Summary Cards */}
      {data && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <SummaryCard icon={Users}      label="Total Bookings"  value={data.totalBookings}             color="blue" />
          <SummaryCard icon={CheckCircle} label="Confirmed"      value={data.confirmedBookings}         color="green" />
          <SummaryCard icon={TrendingUp} label="Total Revenue"   value={fmt(data.totalRevenue)}         color="purple" />
          <SummaryCard icon={DollarSign} label="Platform Fees"   value={fmt(data.totalPlatformFee)}     color="amber" />
        </div>
      )}

      {/* Sub stats */}
      {data && (
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-white border border-gray-100 rounded-xl p-3 text-center">
            <p className="text-lg font-bold text-amber-600">{data.pendingBookings}</p>
            <p className="text-xs text-gray-400">Pending</p>
          </div>
          <div className="bg-white border border-gray-100 rounded-xl p-3 text-center">
            <p className="text-lg font-bold text-blue-600">{data.completedBookings}</p>
            <p className="text-xs text-gray-400">Completed</p>
          </div>
          <div className="bg-white border border-gray-100 rounded-xl p-3 text-center">
            <p className="text-lg font-bold text-red-500">{data.cancelledBookings}</p>
            <p className="text-xs text-gray-400">Cancelled</p>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white border border-gray-100 rounded-2xl p-4 space-y-3">
        <form onSubmit={handleSearch} className="flex gap-2">
          <div className="relative flex-1">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              value={searchInput}
              onChange={function(e) { setSearchInput(e.target.value) }}
              placeholder="Search by guide name or package..."
              className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-300"
            />
          </div>
          <button type="submit" className="px-3 py-2 bg-primary-600 text-white rounded-xl text-sm font-medium hover:bg-primary-700 transition-colors">
            Search
          </button>
        </form>

        <div className="flex flex-wrap gap-2">
          <select
            value={statusFilter}
            onChange={function(e) { setStatusFilter(e.target.value); reset() }}
            className="border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-300"
          >
            {STATUS_OPTIONS.map(function(s) {
              return <option key={s.label} value={s.value}>{s.label}</option>
            })}
          </select>

          <select
            value={paidFilter}
            onChange={function(e) { setPaidFilter(e.target.value); reset() }}
            className="border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-300"
          >
            {PAID_OPTIONS.map(function(p) {
              return <option key={p.label} value={p.value}>{p.label}</option>
            })}
          </select>

          <input
            type="date"
            value={fromDate}
            onChange={function(e) { setFromDate(e.target.value); reset() }}
            className="border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-300"
          />
          <span className="flex items-center text-gray-400 text-sm">to</span>
          <input
            type="date"
            value={toDate}
            onChange={function(e) { setToDate(e.target.value); reset() }}
            className="border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-300"
          />
        </div>
      </div>

      {/* Bookings List */}
      {isLoading ? (
        <LoadingSpinner center />
      ) : bookings.length === 0 ? (
        <div className="text-center py-12 text-gray-400 bg-white border border-gray-100 rounded-2xl">
          No bookings found
        </div>
      ) : (
        <div className="space-y-2">
          {bookings.map(function(b) {
            var Icon = getStatusIcon(b.status)
            var badgeCls = getStatusBadgeCls(b.status)
            return (
              <div
                key={b.bookingId}
                className="bg-white border border-gray-100 rounded-2xl p-4 flex items-center gap-4 hover:shadow-sm transition-all"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <span className="font-semibold text-gray-900 text-sm">#{b.bookingId}</span>
                    <span className={badgeCls}><Icon size={11} />{b.status}</span>
                    <span className={b.isPaid
                      ? 'text-xs text-green-600 font-medium'
                      : 'text-xs text-amber-500 font-medium'}>
                      {b.isPaid ? 'Paid' : 'Unpaid'}
                    </span>
                  </div>
                  <p className="text-sm text-gray-700 truncate">{b.packageTitle}</p>
                  <div className="flex flex-wrap gap-3 text-xs text-gray-400 mt-1">
                    <span>{b.userName}</span>
                    <span>Guide: {b.guideName}</span>
                    <span className="flex items-center gap-0.5">
                      <Calendar size={11} />{fmtDate(b.tourDate)}
                    </span>
                    <span>{b.numberOfPeople} people</span>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <p className="font-bold text-primary-600">{fmt(b.totalAmount)}</p>
                  <p className="text-xs text-gray-400">Fee: {fmt(b.platformFee)}</p>
                </div>
                <button
                  onClick={function() { setSelected(b) }}
                  className="p-2 rounded-xl bg-gray-50 hover:bg-gray-100 text-gray-600 transition-colors shrink-0"
                >
                  <Eye size={15} />
                </button>
              </div>
            )
          })}
        </div>
      )}

      {/* Pagination */}
      {data && data.bookings && (
        <Pagination
          pageNumber={pageNumber}
          totalPages={data.bookings.totalPages}
          hasPrev={data.bookings.hasPreviousPage}
          hasNext={data.bookings.hasNextPage}
          onPrev={prevPage}
          onNext={nextPage}
          onPage={goToPage}
        />
      )}

      {/* Detail Modal */}
      <BookingDetailModal booking={selected} onClose={function() { setSelected(null) }} />
    </div>
  )
}