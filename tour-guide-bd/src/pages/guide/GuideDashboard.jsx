// src/pages/guide/GuideDashboard.jsx
import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Calendar, Wallet, CreditCard, Send, CheckCircle,
  Star, Clock, TrendingUp, Plus, Smartphone, Landmark, X, Trash2, History, XCircle
} from 'lucide-react'
import toast from 'react-hot-toast'
import { guideDashboardApi } from '../../api/guideDashboard.api'
import { guideRevenueApi } from '../../api/adminBooking.api'
import LoadingSpinner from '../../components/common/LoadingSpinner'

function fmt(n) { return '৳' + Number(n || 0).toLocaleString() }

// ─────────────────────────────────────────────
// Tabs config
// ─────────────────────────────────────────────
var TABS = [
  { key: 'bookings', label: 'My Bookings', icon: Calendar },
  { key: 'revenue', label: 'Revenue', icon: TrendingUp },
  { key: 'balance', label: 'Balance', icon: Wallet },
  { key: 'payment', label: 'Payment Methods', icon: CreditCard },
  { key: 'withdraw', label: 'Withdraw', icon: Send },
  { key: 'history', label: 'Transaction History', icon: History, hidden: true }, // ⚠️ tab bar-e dekhabe na, Withdraw tab er button diye ashbe
]

export default function GuideDashboard() {
  var [activeTab, setActiveTab] = useState('bookings')

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-1">Guide Dashboard</h1>
      <p className="text-sm text-gray-400 mb-6">Bookings, revenue, balance, payment methods আর withdrawal — সব এক জায়গায়</p>

      {/* Tab bar */}
      <div className="flex gap-1 border-b border-gray-100 mb-6 overflow-x-auto">
        {TABS.filter(function(t) { return !t.hidden }).map(function(t) {
          var Icon = t.icon
          var isActive = activeTab === t.key
          return (
            <button
              key={t.key}
              onClick={function() { setActiveTab(t.key) }}
              className={
                'flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium border-b-2 whitespace-nowrap transition-colors ' +
                (isActive ? 'border-primary-600 text-primary-700' : 'border-transparent text-gray-500 hover:text-gray-700')
              }
            >
              <Icon size={15} /> {t.label}
            </button>
          )
        })}
      </div>

      {activeTab === 'bookings' && <BookingsTab />}
      {activeTab === 'revenue' && <RevenueTab />}
      {activeTab === 'balance' && <BalanceTab />}
      {activeTab === 'payment' && <PaymentMethodsTab />}
      {activeTab === 'withdraw' && <WithdrawTab onViewHistory={function() { setActiveTab('history') }} />}
      {activeTab === 'history' && <TransactionHistoryPage onBack={function() { setActiveTab('withdraw') }} />}
    </div>
  )
}

// ─────────────────────────────────────────────
// Tab: My Bookings
// ─────────────────────────────────────────────
var STATUS_OPTIONS = ['', 'Pending', 'Confirmed', 'Completed', 'Cancelled']

function statusBadgeCls(status) {
  var map = {
    Pending: 'bg-amber-50 text-amber-600',
    Confirmed: 'bg-blue-50 text-blue-600',
    Completed: 'bg-green-50 text-green-600',
    Cancelled: 'bg-red-50 text-red-500',
    Approved: 'bg-blue-50 text-blue-600',
    Rejected: 'bg-red-50 text-red-500',
    Processing: 'bg-amber-50 text-amber-600',
    Paid: 'bg-green-50 text-green-600',
  }
  return 'text-xs px-2 py-0.5 rounded-full font-medium ' + (map[status] || 'bg-gray-50 text-gray-500')
}

function BookingsTab() {
  var qc = useQueryClient()
  var [status, setStatus] = useState('')
  var [page, setPage] = useState(1)
  var pageSize = 10

  var queryResult = useQuery({
    queryKey: ['guide-my-bookings', status, page],
    queryFn: function() {
      var params = { pageNumber: page, pageSize: pageSize }
      if (status) params.status = status
      return guideDashboardApi.getMyBookings(params).then(function(r) { return r.data })
    },
    retry: false,
  })

  var completeMutation = useMutation({
    mutationFn: function(bookingId) { return guideDashboardApi.completeBooking(bookingId) },
    onSuccess: function() {
      toast.success('Booking completed hishebe mark kora holo')
      qc.invalidateQueries({ queryKey: ['guide-my-bookings'] })
      qc.invalidateQueries({ queryKey: ['guide-balance'] })
    },
    onError: function(err) {
      toast.error(err.response && err.response.data && err.response.data.message ? err.response.data.message : 'Complete korte problem hoyeche')
    },
  })

  if (queryResult.isLoading) return <LoadingSpinner center />
  if (queryResult.isError) return <div className="text-center py-12 text-gray-400">Bookings load korte parlam na.</div>

  var data = queryResult.data
  var items = (data && data.items) || []
  var totalPages = data ? Math.ceil(data.totalCount / pageSize) : 1

  return (
    <div className="space-y-4">
      {/* Status filter */}
      <div className="flex flex-wrap gap-2">
        {STATUS_OPTIONS.map(function(s) {
          var isActive = status === s
          return (
            <button
              key={s || 'all'}
              onClick={function() { setStatus(s); setPage(1) }}
              className={
                'text-xs px-3 py-1.5 rounded-full border transition-colors ' +
                (isActive ? 'bg-primary-600 text-white border-primary-600' : 'border-gray-200 text-gray-600 hover:bg-gray-50')
              }
            >
              {s || 'All'}
            </button>
          )
        })}
      </div>

      {items.length === 0 && (
        <div className="text-center py-16 border-2 border-dashed border-gray-100 rounded-2xl">
          <Calendar size={40} className="mx-auto text-gray-200 mb-3" />
          <p className="text-gray-400 font-medium">Kono booking nai</p>
        </div>
      )}

      <div className="space-y-3">
        {items.map(function(b) {
          return (
            <div key={b.bookingId} className="bg-white border border-gray-100 rounded-2xl p-4">
              <div className="flex items-start justify-between gap-3 mb-2">
                <div>
                  <p className="font-semibold text-gray-900">{b.packageTitle}</p>
                  <p className="text-xs text-gray-400">{b.userName} · {b.userEmail}</p>
                </div>
                <span className={statusBadgeCls(b.status)}>{b.status}</span>
              </div>

              <div className="flex flex-wrap gap-3 text-xs text-gray-500 mb-3">
                <span className="inline-flex items-center gap-1"><Calendar size={12} />{new Date(b.tourDate).toLocaleDateString('en-BD', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                <span>{b.numberOfPeople} people</span>
                <span className="font-medium text-primary-600">{fmt(b.totalAmount)}</span>
                <span className={b.isPaid ? 'text-green-600' : 'text-amber-500'}>{b.isPaid ? 'Paid' : 'Unpaid'}</span>
              </div>

              {b.hasReview && (
                <div className="bg-amber-50 rounded-xl px-3 py-2 mb-3">
                  <div className="flex items-center gap-1 mb-1">
                    {Array.from({ length: 5 }).map(function(_, i) {
                      return <Star key={i} size={12} className={i < b.reviewRating ? 'fill-amber-400 text-amber-400' : 'text-gray-200'} />
                    })}
                  </div>
                  {b.reviewComment && <p className="text-xs text-gray-600">{b.reviewComment}</p>}
                </div>
              )}

              {b.canComplete && (
                <button
                  onClick={function() { completeMutation.mutate(b.bookingId) }}
                  disabled={completeMutation.isPending}
                  className="inline-flex items-center gap-1.5 bg-green-600 text-white px-3 py-1.5 rounded-xl text-xs font-medium hover:bg-green-700 disabled:opacity-50 transition-colors"
                >
                  <CheckCircle size={13} /> Mark Complete
                </button>
              )}
            </div>
          )
        })}
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 pt-2">
          <button disabled={page <= 1} onClick={function() { setPage(page - 1) }} className="px-3 py-1.5 text-sm border border-gray-200 rounded-lg disabled:opacity-40">Prev</button>
          <span className="text-sm text-gray-500">{page} / {totalPages}</span>
          <button disabled={page >= totalPages} onClick={function() { setPage(page + 1) }} className="px-3 py-1.5 text-sm border border-gray-200 rounded-lg disabled:opacity-40">Next</button>
        </div>
      )}
    </div>
  )
}

// ─────────────────────────────────────────────
// Shared small stat card (used by Balance + Revenue tabs)
// ─────────────────────────────────────────────
function BalanceStatCard(props) {
  var Icon = props.icon
  var label = props.label
  var value = props.value
  var color = props.color
  var colors = { green: 'bg-green-50 text-green-600', amber: 'bg-amber-50 text-amber-600', blue: 'bg-blue-50 text-blue-600', gray: 'bg-gray-50 text-gray-500', purple: 'bg-purple-50 text-purple-600' }
  return (
    <div className="bg-white border border-gray-100 rounded-2xl p-5 flex items-center gap-4">
      <div className={'w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ' + (colors[color] || colors.blue)}><Icon size={20} /></div>
      <div>
        <p className="text-xl font-bold text-gray-900">{value}</p>
        <p className="text-xs text-gray-400">{label}</p>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────
// Tab: Balance
// ─────────────────────────────────────────────
function BalanceTab() {
  var queryResult = useQuery({
    queryKey: ['guide-balance'],
    queryFn: function() { return guideDashboardApi.getBalance().then(function(r) { return r.data }) },
    retry: false,
  })

  if (queryResult.isLoading) return <LoadingSpinner center />
  if (queryResult.isError) return <div className="text-center py-12 text-gray-400">Balance load hocche na.</div>

  var d = queryResult.data

  return (
    <div className="grid grid-cols-2 gap-3">
      <BalanceStatCard icon={TrendingUp} label="Total Earned" value={fmt(d.totalEarned)} color="green" />
      <BalanceStatCard icon={Clock} label="Pending (3 din por available)" value={fmt(d.pendingAmount)} color="amber" />
      <BalanceStatCard icon={Wallet} label="Available (withdraw jogyo)" value={fmt(d.availableAmount)} color="blue" />
      <BalanceStatCard icon={CheckCircle} label="Withdrawn" value={fmt(d.withdrawnAmount)} color="gray" />
      {d.pendingWithdrawal > 0 && (
        <div className="col-span-2 bg-amber-50 border border-amber-100 rounded-2xl px-4 py-3 text-sm text-amber-700">
          তোমার <strong>{fmt(d.pendingWithdrawal)}</strong> withdrawal request process hocche.
        </div>
      )}
    </div>
  )
}

// ─────────────────────────────────────────────
// Tab: Revenue (merged from GuideRevenuePage)
// ─────────────────────────────────────────────
function RevenueMonthlyChart(props) {
  var monthly = props.monthly
  if (!monthly || monthly.length === 0) return null

  var maxEarned = Math.max.apply(null, monthly.map(function(m) { return m.earned }))
  if (maxEarned === 0) maxEarned = 1

  return (
    <div className="bg-white border border-gray-100 rounded-2xl p-5">
      <h3 className="font-semibold text-gray-900 mb-4">Monthly Earnings</h3>
      <div className="flex items-end gap-2 h-40">
        {monthly.slice(0, 12).reverse().map(function(m) {
          var heightPct = (m.earned / maxEarned) * 100
          return (
            <div key={m.monthName} className="flex-1 flex flex-col items-center gap-1 group">
              <div className="relative w-full flex items-end justify-center" style={{ height: '120px' }}>
                <div
                  className="w-full bg-primary-500 rounded-t-lg group-hover:bg-primary-600 transition-colors relative"
                  style={{ height: Math.max(heightPct, 4) + '%' }}
                >
                  <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-gray-800 text-white text-xs px-2 py-1 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
                    {fmt(m.earned)}
                  </div>
                </div>
              </div>
              <span className="text-xs text-gray-400 text-center leading-tight">
                {m.monthName.split(' ')[0].slice(0, 3)}
              </span>
              <span className="text-xs text-gray-300">{m.bookings}</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function RevenuePackageStats(props) {
  var stats = props.stats
  if (!stats || stats.length === 0) return null

  return (
    <div className="bg-white border border-gray-100 rounded-2xl p-5">
      <h3 className="font-semibold text-gray-900 mb-4">Package Performance</h3>
      <div className="space-y-3">
        {stats.map(function(pkg) {
          return (
            <div key={pkg.packageId} className="flex items-center justify-between gap-3 py-2 border-b border-gray-50 last:border-0">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-900 truncate">{pkg.packageTitle}</p>
                <p className="text-xs text-gray-400">
                  {pkg.totalBookings} bookings · {fmt(pkg.pricePerPerson)}/person
                </p>
              </div>
              <div className="text-right shrink-0">
                <p className="font-bold text-primary-600">{fmt(pkg.totalEarned)}</p>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function RevenueTab() {
  var currentYear = new Date().getFullYear()
  var [year, setYear] = useState(currentYear)

  var yearOptions = []
  for (var y = currentYear; y >= currentYear - 3; y--) {
    yearOptions.push(y)
  }

  var queryResult = useQuery({
    queryKey: ['guide-revenue', year],
    queryFn: function() {
      return guideRevenueApi.getRevenue(year).then(function(r) { return r.data })
    },
    retry: false,
  })

  var data = queryResult.data
  var isLoading = queryResult.isLoading
  var isError = queryResult.isError

  if (isLoading) return <LoadingSpinner center />
  if (isError) return (
    <div className="text-center py-12 text-gray-400">
      Revenue data load hocche na. Guide profile active ache kina check koro.
    </div>
  )

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <select
          value={year}
          onChange={function(e) { setYear(Number(e.target.value)) }}
          className="border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-300"
        >
          {yearOptions.map(function(y) {
            return <option key={y} value={y}>{y}</option>
          })}
        </select>
      </div>

      {data && (
        <>
          {/* Summary Stats */}
          <div className="grid grid-cols-2 gap-3">
            <BalanceStatCard icon={TrendingUp} label="Total Earned" value={fmt(data.totalEarned)} color="green" />
            <BalanceStatCard icon={Clock} label="Pending Payout" value={fmt(data.pendingPayout)} color="amber" />
            <BalanceStatCard icon={Wallet} label="Paid Out" value={fmt(data.paidOut)} color="blue" />
            <BalanceStatCard icon={Star} label="Avg Rating" value={data.averageRating ? data.averageRating.toFixed(1) : 'N/A'} color="purple" />
          </div>

          {/* Booking counts */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-white border border-gray-100 rounded-2xl p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary-50 text-primary-600 flex items-center justify-center shrink-0">
                <Calendar size={18} />
              </div>
              <div>
                <p className="text-xl font-bold text-gray-900">{data.totalBookings}</p>
                <p className="text-xs text-gray-400">Total Bookings</p>
              </div>
            </div>
            <div className="bg-white border border-gray-100 rounded-2xl p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-green-50 text-green-600 flex items-center justify-center shrink-0">
                <CheckCircle size={18} />
              </div>
              <div>
                <p className="text-xl font-bold text-gray-900">{data.completedTours}</p>
                <p className="text-xs text-gray-400">Completed Tours</p>
              </div>
            </div>
          </div>

          {/* Monthly Chart */}
          {data.monthlyBreakdown && data.monthlyBreakdown.length > 0 && (
            <RevenueMonthlyChart monthly={data.monthlyBreakdown} />
          )}

          {/* Package Stats */}
          {data.packageStats && data.packageStats.length > 0 && (
            <RevenuePackageStats stats={data.packageStats} />
          )}

          {/* Empty state */}
          {data.totalBookings === 0 && (
            <div className="text-center py-12 border-2 border-dashed border-gray-100 rounded-2xl">
              <TrendingUp size={40} className="mx-auto text-gray-200 mb-3" />
              <p className="text-gray-400 font-medium">No earnings yet</p>
              <p className="text-sm text-gray-300">Create packages and start getting bookings</p>
            </div>
          )}
        </>
      )}
    </div>
  )
}

// ─────────────────────────────────────────────
// Tab: Payment Methods
// ─────────────────────────────────────────────
var PAYMENT_TYPES = [
  { value: 'BKash', label: 'bKash', icon: Smartphone },
  { value: 'Nagad', label: 'Nagad', icon: Smartphone },
  { value: 'Bank', label: 'Bank', icon: Landmark },
]

var PAYMENT_TYPE_MAP = { BKash: 1, Nagad: 2, Bank: 3 }

function PaymentMethodForm(props) {
  var onClose = props.onClose
  var onAdded = props.onAdded
  var [type, setType] = useState('BKash')
  var [mobileNumber, setMobileNumber] = useState('')
  var [bankName, setBankName] = useState('')
  var [accountName, setAccountName] = useState('')
  var [accountNumber, setAccountNumber] = useState('')
  var [branchName, setBranchName] = useState('')
  var [routingNumber, setRoutingNumber] = useState('')
  var [isDefault, setIsDefault] = useState(false)

  var addMutation = useMutation({
    mutationFn: function(data) { return guideDashboardApi.addPaymentMethod(data) },
    onSuccess: function(res) {
      toast.success('Payment method add hoyeche')
      onAdded({
        id: res.data,
        type: type, mobileNumber: mobileNumber, bankName: bankName,
        accountName: accountName, accountNumber: accountNumber,
        branchName: branchName, routingNumber: routingNumber, isDefault: isDefault,
      })
      onClose()
    },
    onError: function(err) {
      toast.error(err.response && err.response.data && err.response.data.message ? err.response.data.message : 'Add korte parlam na')
    },
  })

  function handleSubmit(e) {
    e.preventDefault()
    var payload = { type: PAYMENT_TYPE_MAP[type], isDefault: isDefault }
    if (type === 'BKash' || type === 'Nagad') {
      payload.mobileNumber = mobileNumber
    } else {
      payload.bankName = bankName
      payload.accountName = accountName
      payload.accountNumber = accountNumber
      payload.branchName = branchName
      payload.routingNumber = routingNumber
    }
    addMutation.mutate(payload)
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white border border-gray-100 rounded-2xl p-5 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-gray-900">Notun Payment Method</h3>
        <button type="button" onClick={onClose} className="text-gray-400 hover:text-gray-600"><X size={18} /></button>
      </div>

      <div className="flex gap-2">
        {PAYMENT_TYPES.map(function(pt) {
          var Icon = pt.icon
          var active = type === pt.value
          return (
            <button
              type="button" key={pt.value}
              onClick={function() { setType(pt.value) }}
              className={
                'flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-sm border transition-colors ' +
                (active ? 'bg-primary-50 border-primary-300 text-primary-700 font-medium' : 'border-gray-200 text-gray-600')
              }
            >
              <Icon size={14} /> {pt.label}
            </button>
          )
        })}
      </div>

      {(type === 'BKash' || type === 'Nagad') && (
        <input required value={mobileNumber} onChange={function(e) { setMobileNumber(e.target.value) }}
          placeholder="01XXXXXXXXX" className="input" />
      )}

      {type === 'Bank' && (
        <div className="grid grid-cols-2 gap-3">
          <input required value={bankName} onChange={function(e) { setBankName(e.target.value) }} placeholder="Bank Name" className="input col-span-2" />
          <input required value={accountName} onChange={function(e) { setAccountName(e.target.value) }} placeholder="Account Name" className="input col-span-2" />
          <input required value={accountNumber} onChange={function(e) { setAccountNumber(e.target.value) }} placeholder="Account Number" className="input" />
          <input required value={branchName} onChange={function(e) { setBranchName(e.target.value) }} placeholder="Branch Name" className="input" />
          <input value={routingNumber} onChange={function(e) { setRoutingNumber(e.target.value) }} placeholder="Routing Number (optional)" className="input col-span-2" />
        </div>
      )}

      <label className="flex items-center gap-2 text-sm text-gray-600">
        <input type="checkbox" checked={isDefault} onChange={function(e) { setIsDefault(e.target.checked) }} />
        Default payment method hishebe set koro
      </label>

      <button type="submit" disabled={addMutation.isPending} className="w-full bg-primary-600 text-white py-2 rounded-xl text-sm font-medium hover:bg-primary-700 disabled:opacity-50">
        {addMutation.isPending ? 'Adding...' : 'Save'}
      </button>
    </form>
  )
}

function PaymentMethodsTab() {
  var qc = useQueryClient()
  var [showForm, setShowForm] = useState(false)
  var [deletingId, setDeletingId] = useState(null)
  // ⚠️ Backend-e GET list endpoint na thakle, add howar por localList-e fallback hobe (refresh dile hariye jabe)
  var [localList, setLocalList] = useState([])

  var queryResult = useQuery({
    queryKey: ['guide-payment-methods'],
    queryFn: function() { return guideDashboardApi.getPaymentMethods().then(function(r) { return r.data }) },
    retry: false,
  })

  var backendList = Array.isArray(queryResult.data) ? queryResult.data : null
  var methods = backendList !== null ? backendList : localList

  function handleAdded(newMethod) {
    setLocalList(function(prev) { return prev.concat([newMethod]) })
  }

  var deleteMutation = useMutation({
    mutationFn: function(id) { return guideDashboardApi.deletePaymentMethod(id) },
    onMutate: function(id) { setDeletingId(id) },
    onSuccess: function(_res, id) {
      toast.success('Payment method delete kora hoyeche')
      setLocalList(function(prev) { return prev.filter(function(m) { return m.id !== id }) })
      qc.invalidateQueries({ queryKey: ['guide-payment-methods'] })
    },
    onError: function(err) {
      toast.error(err.response && err.response.data && err.response.data.message ? err.response.data.message : 'Delete korte parlam na')
    },
    onSettled: function() { setDeletingId(null) },
  })

  function handleDelete(id) {
    if (!id) return
    if (window.confirm('Ei payment method ta delete korte chao?')) {
      deleteMutation.mutate(id)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-gray-900">Payment Methods</h3>
        {!showForm && (
          <button onClick={function() { setShowForm(true) }} className="inline-flex items-center gap-1.5 bg-primary-600 text-white px-3 py-1.5 rounded-xl text-sm font-medium hover:bg-primary-700">
            <Plus size={14} /> Add New
          </button>
        )}
      </div>

      {showForm && <PaymentMethodForm onClose={function() { setShowForm(false) }} onAdded={handleAdded} />}

      {methods.length === 0 && !showForm && (
        <div className="text-center py-12 border-2 border-dashed border-gray-100 rounded-2xl">
          <CreditCard size={36} className="mx-auto text-gray-200 mb-2" />
          <p className="text-gray-400 text-sm">Kono payment method add kora hoyni</p>
        </div>
      )}

      <div className="space-y-2">
        {methods.map(function(m, idx) {
          var isDeleting = deletingId === m.id && deleteMutation.isPending
          return (
            <div key={m.id || idx} className="bg-white border border-gray-100 rounded-2xl p-4 flex items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="font-medium text-gray-900 text-sm">{m.type}{m.isDefault ? ' · Default' : ''}</p>
                <p className="text-xs text-gray-400 truncate">
                  {m.type === 'Bank' ? (m.bankName + ' · ' + m.accountNumber) : m.mobileNumber}
                </p>
              </div>
              <button
                type="button"
                onClick={function() { handleDelete(m.id) }}
                disabled={isDeleting || !m.id}
                title="Delete payment method"
                className="shrink-0 inline-flex items-center gap-1 text-red-500 hover:text-red-600 hover:bg-red-50 px-2.5 py-1.5 rounded-lg text-xs font-medium disabled:opacity-40 transition-colors"
              >
                <Trash2 size={14} /> {isDeleting ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────
// Transaction History (separate page, opened from a button on the Withdraw tab)
// ─────────────────────────────────────────────
function withdrawalStatusIcon(status) {
  if (status === 'Approved' || status === 'Paid' || status === 'Completed') return CheckCircle
  if (status === 'Rejected' || status === 'Cancelled') return XCircle
  return Clock
}

function fmtDateTime(iso) {
  if (!iso) return ''
  return new Date(iso).toLocaleDateString('en-BD', { day: 'numeric', month: 'short', year: 'numeric' })
}

function WithdrawalHistoryItem(props) {
  var w = props.item
  var StatusIcon = withdrawalStatusIcon(w.status)
  var [expanded, setExpanded] = useState(false)

  return (
    <div className="bg-white border border-gray-100 rounded-2xl p-4">
      <button
        type="button"
        onClick={function() { setExpanded(function(v) { return !v }) }}
        className="w-full flex items-center justify-between gap-3 text-left"
      >
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-9 h-9 rounded-xl bg-gray-50 text-gray-500 flex items-center justify-center shrink-0">
            <StatusIcon size={16} />
          </div>
          <div className="min-w-0">
            <p className="font-semibold text-gray-900 text-sm">{fmt(w.netAmount)}</p>
            <p className="text-xs text-gray-400 truncate">
              {w.paymentMethodDisplay || w.paymentMethodType}
              {w.requestedAt ? ' · ' + fmtDateTime(w.requestedAt) : ''}
            </p>
          </div>
        </div>
        <span className={statusBadgeCls(w.status)}>{w.status}</span>
      </button>

      {expanded && (
        <div className="mt-3 pt-3 border-t border-gray-50 space-y-1.5 text-xs text-gray-500">
          <div className="flex justify-between"><span>Requested Amount</span><span className="text-gray-700 font-medium">{fmt(w.requestedAmount)}</span></div>
          <div className="flex justify-between"><span>Processing Fee</span><span className="text-gray-700 font-medium">{fmt(w.processingFee)}</span></div>
          <div className="flex justify-between"><span>Net Amount</span><span className="text-primary-600 font-semibold">{fmt(w.netAmount)}</span></div>
          {w.transactionReference && (
            <div className="flex justify-between"><span>Transaction Ref</span><span className="text-gray-700 font-medium">{w.transactionReference}</span></div>
          )}
          {w.processedAt && (
            <div className="flex justify-between"><span>Processed</span><span className="text-gray-700 font-medium">{fmtDateTime(w.processedAt)}</span></div>
          )}
          {w.adminNote && (
            <div className="pt-1 text-gray-500 italic">"{w.adminNote}"</div>
          )}
        </div>
      )}
    </div>
  )
}

var WITHDRAWAL_STATUS_OPTIONS = [
  { label: 'All', value: '' },
  { label: 'Pending', value: '0' },
  { label: 'Approved', value: '1' },
  { label: 'Completed', value: '2' },
  { label: 'Rejected', value: '3' },
]

function TransactionHistoryPage(props) {
  var onBack = props.onBack
  var [status, setStatus] = useState('')
  var [page, setPage] = useState(1)
  var pageSize = 10

  var historyQuery = useQuery({
    queryKey: ['guide-withdrawal-history', status, page],
    queryFn: function() {
      var params = { pageNumber: page, pageSize: pageSize }
      if (status !== '') params.status = status
      return guideDashboardApi.getWithdrawalHistory(params).then(function(r) { return r.data })
    },
    retry: false,
  })

  var data = historyQuery.data
  var items = (data && data.items) || []
  var totalPages = data ? Math.ceil(data.totalCount / pageSize) : 1

  return (
    <div className="space-y-4 max-w-2xl">
      <button
        type="button"
        onClick={onBack}
        className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700"
      >
        ← Withdraw-e ferot jao
      </button>

      <h3 className="font-semibold text-gray-900 flex items-center gap-1.5"><History size={16} /> Transaction History</h3>

      {/* Status filter — ⚠️ value numbers (0/1/2/3) are a guess based on status=2 → Completed.
          Confirm the real enum and I'll correct these. */}
      <div className="flex flex-wrap gap-2">
        {WITHDRAWAL_STATUS_OPTIONS.map(function(opt) {
          var isActive = status === opt.value
          return (
            <button
              key={opt.label}
              type="button"
              onClick={function() { setStatus(opt.value); setPage(1) }}
              className={
                'text-xs px-3 py-1.5 rounded-full border transition-colors ' +
                (isActive ? 'bg-primary-600 text-white border-primary-600' : 'border-gray-200 text-gray-600 hover:bg-gray-50')
              }
            >
              {opt.label}
            </button>
          )
        })}
      </div>

      {historyQuery.isLoading && <div className="pt-2"><LoadingSpinner center /></div>}

      {historyQuery.isError && (
        <div className="text-center py-8 text-sm text-gray-400 border-2 border-dashed border-gray-100 rounded-2xl">
          Withdrawal history load hocche na.
        </div>
      )}

      {!historyQuery.isLoading && !historyQuery.isError && items.length === 0 && (
        <div className="text-center py-10 border-2 border-dashed border-gray-100 rounded-2xl">
          <Send size={32} className="mx-auto text-gray-200 mb-2" />
          <p className="text-gray-400 text-sm">Kono withdrawal request paoa jayni</p>
        </div>
      )}

      {!historyQuery.isLoading && !historyQuery.isError && items.length > 0 && (
        <div className="space-y-2">
          {items.map(function(w) {
            return <WithdrawalHistoryItem key={w.id} item={w} />
          })}
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 pt-1">
          <button disabled={page <= 1} onClick={function() { setPage(page - 1) }} className="px-3 py-1.5 text-sm border border-gray-200 rounded-lg disabled:opacity-40">Prev</button>
          <span className="text-sm text-gray-500">{page} / {totalPages}</span>
          <button disabled={page >= totalPages} onClick={function() { setPage(page + 1) }} className="px-3 py-1.5 text-sm border border-gray-200 rounded-lg disabled:opacity-40">Next</button>
        </div>
      )}
    </div>
  )
}

// ─────────────────────────────────────────────
// Tab: Withdraw
// ─────────────────────────────────────────────
function WithdrawTab(props) {
  var onViewHistory = props.onViewHistory
  var qc = useQueryClient()
  var [amount, setAmount] = useState('')
  var [paymentMethodId, setPaymentMethodId] = useState('')

  var balanceQuery = useQuery({
    queryKey: ['guide-balance'],
    queryFn: function() { return guideDashboardApi.getBalance().then(function(r) { return r.data }) },
    retry: false,
  })

  var methodsQuery = useQuery({
    queryKey: ['guide-payment-methods'],
    queryFn: function() { return guideDashboardApi.getPaymentMethods().then(function(r) { return r.data }) },
    retry: false,
  })

  var withdrawMutation = useMutation({
    mutationFn: function(data) { return guideDashboardApi.requestWithdrawal(data) },
    onSuccess: function() {
      toast.success('Withdrawal request pathano hoyeche')
      setAmount('')
      qc.invalidateQueries({ queryKey: ['guide-balance'] })
      qc.invalidateQueries({ queryKey: ['guide-withdrawal-history'] })
    },
    onError: function(err) {
      toast.error(err.response && err.response.data && err.response.data.message ? err.response.data.message : 'Request pathano jayni')
    },
  })

  var available = balanceQuery.data ? balanceQuery.data.availableAmount : 0
  var methods = Array.isArray(methodsQuery.data) ? methodsQuery.data : []

  function handleSubmit(e) {
    e.preventDefault()
    var amt = Number(amount)
    if (!amt || amt <= 0) return toast.error('Valid amount dao')
    if (amt > available) return toast.error('Available balance er beshi withdraw kora jabe na')
    if (!paymentMethodId) return toast.error('Payment method select koro')
    withdrawMutation.mutate({ paymentMethodId: Number(paymentMethodId), amount: amt })
  }

  return (
    <div className="space-y-4 max-w-md">
      <div className="bg-primary-50 border border-primary-100 rounded-2xl px-4 py-3">
        <p className="text-xs text-primary-600">Available Balance</p>
        <p className="text-2xl font-bold text-primary-700">{fmt(available)}</p>
      </div>

      {methods.length === 0 && (
        <p className="text-sm text-amber-600 bg-amber-50 px-3 py-2 rounded-xl">Withdraw korar age ekta Payment Method add koro.</p>
      )}

      <form onSubmit={handleSubmit} className="space-y-3">
        <input
          type="number" min="1" value={amount}
          onChange={function(e) { setAmount(e.target.value) }}
          placeholder="Amount (৳)" className="input"
        />
        <select value={paymentMethodId} onChange={function(e) { setPaymentMethodId(e.target.value) }} className="input">
          <option value="">Select payment method</option>
          {methods.map(function(m, idx) {
            return <option key={m.id || idx} value={m.id}>{m.type} — {m.type === 'Bank' ? m.accountNumber : m.mobileNumber}</option>
          })}
        </select>
        <button type="submit" disabled={withdrawMutation.isPending || methods.length === 0} className="w-full bg-primary-600 text-white py-2.5 rounded-xl text-sm font-medium hover:bg-primary-700 disabled:opacity-50">
          {withdrawMutation.isPending ? 'Sending...' : 'Request Withdrawal'}
        </button>
      </form>

      <button
        type="button"
        onClick={onViewHistory}
        className="w-full inline-flex items-center justify-center gap-1.5 border border-gray-200 text-gray-700 py-2.5 rounded-xl text-sm font-medium hover:bg-gray-50 transition-colors"
      >
        <History size={15} /> Transaction History
      </button>
    </div>
  )
}