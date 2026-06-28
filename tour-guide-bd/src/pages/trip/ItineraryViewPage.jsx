import { useParams, Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { tripPlannerApi } from '../../api/tripPlanner.api'
import LoadingSpinner from '../../components/common/LoadingSpinner'
import { formatBDT, formatKm, formatMinutes, formatDate } from '../../utils/formatters'
import { Calendar, Wallet, MapPin } from 'lucide-react'

export default function ItineraryViewPage() {
  const { id } = useParams()

  const { data: itinerary, isLoading } = useQuery({
    queryKey: ['itinerary', id],
    queryFn: () => tripPlannerApi.getItinerary(id).then(r => r.data),
  })

  if (isLoading) return <LoadingSpinner center />
  if (!itinerary) return <div className="text-center py-12 text-gray-400">Itinerary not found</div>

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">{itinerary.title}</h1>
        <div className="flex items-center gap-1.5 text-sm text-gray-500 mt-1">
          <Calendar size={14} /> {formatDate(itinerary.tripDate)}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="card p-4">
          <Wallet size={16} className="text-primary-600 mb-2" />
          <p className="text-xs text-gray-500">Total cost</p>
          <p className="text-xl font-bold text-gray-900">{formatBDT(itinerary.estimatedTotalCost)}</p>
        </div>
        <div className="card p-4">
          <Wallet size={16} className="text-amber-600 mb-2" />
          <p className="text-xs text-gray-500">Food cost</p>
          <p className="text-xl font-bold text-gray-900">{formatBDT(itinerary.estimatedFoodCost)}</p>
        </div>
      </div>

      <h2 className="font-semibold text-gray-900 mb-3">Route</h2>
      <div className="space-y-3">
        {itinerary.stops?.map((stop, i) => (
          <div key={i} className="card p-4 flex items-center gap-4">
            <div className="w-8 h-8 rounded-full bg-primary-600 text-white flex items-center justify-center text-sm font-bold shrink-0">
              {stop.order}
            </div>
            <div className="flex-1 min-w-0">
              <Link to={`/places/${stop.placeId}`} className="font-medium text-gray-900 hover:text-primary-600 transition-colors">
                {stop.placeName}
              </Link>
              <p className="text-xs text-gray-500 mt-0.5">
                {stop.transportTypeName} · {formatKm(stop.distanceFromPreviousKm)} · {formatMinutes(stop.travelTimeMinutes)}
              </p>
            </div>
            <div className="text-right shrink-0">
              <p className="text-sm font-semibold text-gray-900">{formatBDT(stop.transportCost)}</p>
              {stop.entryFeeAtThisStop > 0 && (
                <p className="text-xs text-gray-400">+{formatBDT(stop.entryFeeAtThisStop)} entry</p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}