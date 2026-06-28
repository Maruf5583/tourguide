import { useQuery } from '@tanstack/react-query'
import { adminApi } from '../../api/admin.api'
import StatCard from '../../components/admin/StatCard'
import LoadingSpinner from '../../components/common/LoadingSpinner'
import { Users, MapPin, Clock, Star, AlertTriangle, BarChart2 } from 'lucide-react'

export default function DashboardPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['analytics'],
    queryFn: () => adminApi.getAnalytics().then(r => r.data),
  })

  if (isLoading) return <LoadingSpinner center />

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold text-gray-900">Dashboard</h1>
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        <StatCard label="Total users"    value={data?.totalUsers}    icon={Users}         color="primary" />
        <StatCard label="Total places"   value={data?.totalPlaces}   icon={MapPin}         color="blue" />
        <StatCard label="Pending places" value={data?.pendingPlaces} icon={Clock}          color="amber" />
        <StatCard label="Pending reviews"value={data?.pendingReviews}icon={Star}           color="purple" />
        <StatCard label="Open reports"   value={data?.openReports}   icon={AlertTriangle}  color="red" />
      </div>

      {data?.districtStats?.length > 0 && (
        <div className="card p-6">
          <h2 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <BarChart2 size={18} className="text-primary-600" /> District statistics
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 text-left">
                  {['District', 'Places', 'Visits', 'Check-ins', 'Reviews', 'Avg rating'].map(h => (
                    <th key={h} className="py-2 px-3 text-xs font-medium text-gray-500 uppercase tracking-wide">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {data.districtStats.map((s) => (
                  <tr key={s.districtId} className="hover:bg-gray-50">
                    <td className="py-2 px-3 font-medium">{s.districtName}</td>
                    <td className="py-2 px-3">{s.totalPlaces}</td>
                    <td className="py-2 px-3">{s.totalVisits}</td>
                    <td className="py-2 px-3">{s.totalCheckIns}</td>
                    <td className="py-2 px-3">{s.totalReviews}</td>
                    <td className="py-2 px-3">{s.averageRating?.toFixed(1)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}