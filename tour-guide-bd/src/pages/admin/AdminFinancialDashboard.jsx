// src/pages/admin/AdminFinancialDashboard.jsx
import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { DollarSign, TrendingUp, Clock, CheckCircle, Users, ArrowRight } from 'lucide-react'
import { adminFinanceApi } from '../../api/adminFinance.api'
import LoadingSpinner from '../../components/common/LoadingSpinner'

function fmt(n) { return '৳' + Number(n || 0).toLocaleString() }

function StatCard(props) {
  var Icon = props.icon, label = props.label, value = props.value, color = props.color
  var colors = { green: 'bg-green-50 text-green-600', blue: 'bg-blue-50 text-blue-600', amber: 'bg-amber-50 text-amber-600', purple: 'bg-purple-50 text-purple-600' }
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

function MonthlyRevenueChart(props) {
  var monthly = props.monthly
  if (!monthly || monthly.length === 0) return null
  var max = Math.max.apply(null, monthly.map(function(m) { return m.revenue }))
  if (max === 0) max = 1
  return (
    <div className="bg-white border border-gray-100 rounded-2xl p-5">
      <h3 className="font-semibold text-gray-900 mb-4">Monthly Platform Revenue</h3>
      <div className="flex items-end gap-2 h-40">
        {monthly.map(function(m) {
          var h = Math.max((m.revenue / max) * 100, 4)
          return (
            <div key={m.monthName} className="flex-1 flex flex-col items-center gap-1">
              <div className="w-full flex items-end" style={{ height: '120px' }}>
                <div className="w-full bg-primary-500 rounded-t-lg" style={{ height: h + '%' }} title={fmt(m.revenue)} />
              </div>
              <span className="text-xs text-gray-400">{m.monthName.split(' ')[0].slice(0, 3)}</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function GuideStatsTable(props) {
  var stats = props.stats
  if (!stats || stats.length === 0) return null
  return (
    <div className="bg-white border border-gray-100 rounded-2xl p-5 overflow-x-auto">
      <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2"><Users size={16} className="text-primary-600" /> Per-Guide Earnings</h3>
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left text-xs text-gray-400 border-b border-gray-50">
            <th className="pb-2">Guide</th>
            <th className="pb-2">Tours</th>
            <th className="pb-2">Rating</th>
            <th className="pb-2">Total Earned</th>
            <th className="pb-2">Available</th>
            <th className="pb-2">Withdrawn</th>
          </tr>
        </thead>
        <tbody>
          {stats.map(function(g) {
            return (
              <tr key={g.guideProfileId} className="border-b border-gray-50 last:border-0">
                <td className="py-2 font-medium text-gray-900">{g.guideName}</td>
                <td className="py-2 text-gray-500">{g.totalToursCompleted}</td>
                <td className="py-2 text-gray-500">{g.averageRating ? g.averageRating.toFixed(1) : '—'}</td>
                <td className="py-2 font-semibold text-primary-600">{fmt(g.totalEarned)}</td>
                <td className="py-2 text-gray-500">{fmt(g.availableBalance)}</td>
                <td className="py-2 text-gray-500">{fmt(g.withdrawnAmount)}</td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

export default function AdminFinancialDashboard() {
  var currentYear = new Date().getFullYear()
  var [year, setYear] = useState(currentYear)
  var yearOptions = []
  for (var y = currentYear; y >= currentYear - 3; y--) yearOptions.push(y)

  var queryResult = useQuery({
    queryKey: ['admin-financial-dashboard', year],
    queryFn: function() { return adminFinanceApi.getFinancialDashboard(year).then(function(r) { return r.data }) },
    retry: false,
  })

  if (queryResult.isLoading) return <LoadingSpinner center />
  if (queryResult.isError) return <div className="text-center py-16 text-gray-400">Financial data load kora jayni.</div>

  var d = queryResult.data

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Financial Dashboard</h1>
          <p className="text-sm text-gray-400 mt-0.5">Platform-wide revenue overview</p>
        </div>
        <select value={year} onChange={function(e) { setYear(Number(e.target.value)) }} className="border border-gray-200 rounded-xl px-3 py-2 text-sm">
          {yearOptions.map(function(y) { return <option key={y} value={y}>{y}</option> })}
        </select>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
        <StatCard icon={DollarSign} label="Total Platform Revenue" value={fmt(d.totalPlatformRevenue)} color="green" />
        <StatCard icon={TrendingUp} label="This Month" value={fmt(d.thisMonthRevenue)} color="blue" />
        <StatCard icon={Users} label="Total Guide Earnings" value={fmt(d.totalGuideEarnings)} color="purple" />
        <StatCard icon={Clock} label="Pending Withdrawals" value={fmt(d.pendingWithdrawals)} color="amber" />
        <StatCard icon={CheckCircle} label="Total Paid Out" value={fmt(d.totalPaidOut)} color="green" />
        <StatCard icon={CheckCircle} label="Completed Bookings" value={d.completedBookings + ' / ' + d.totalBookings} color="blue" />
      </div>

      <MonthlyRevenueChart monthly={d.monthlyRevenue} />
      <GuideStatsTable stats={d.guideStats} />

      {d.pendingWithdrawalList && d.pendingWithdrawalList.length > 0 && (
        <div className="bg-white border border-gray-100 rounded-2xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-900">Pending Withdrawals ({d.pendingWithdrawalList.length})</h3>
            <Link to="/admin/withdrawals" className="text-sm text-primary-600 hover:underline flex items-center gap-1">
              Process all <ArrowRight size={14} />
            </Link>
          </div>
          <div className="space-y-2">
            {d.pendingWithdrawalList.slice(0, 5).map(function(w) {
              return (
                <div key={w.id} className="flex items-center justify-between text-sm py-2 border-b border-gray-50 last:border-0">
                  <span className="font-medium text-gray-900">{w.guideName}</span>
                  <span className="text-gray-500">{w.paymentMethodType}</span>
                  <span className="font-semibold text-primary-600">{fmt(w.requestedAmount)}</span>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}