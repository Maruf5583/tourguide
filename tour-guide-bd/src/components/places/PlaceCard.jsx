import { Link } from 'react-router-dom'
import { MapPin, Star, Ticket } from 'lucide-react'
import { formatBDT, formatKm } from '../../utils/formatters'

export default function PlaceCard({ place }) {
  return (
    <Link to={`/places/${place.id}`} className="card block hover:shadow-md transition-shadow duration-200 group overflow-hidden">
      <div className="h-40 bg-gradient-to-br from-primary-100 to-primary-200 relative overflow-hidden">
        {place.coverPhotoUrl ? (
          <img src={place.coverPhotoUrl} alt={place.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <MapPin size={32} className="text-primary-400" />
          </div>
        )}
        {place.distanceKm != null && (
          <span className="absolute top-2 right-2 bg-black/60 text-white text-xs px-2 py-1 rounded-full">
            {formatKm(place.distanceKm)}
          </span>
        )}
      </div>
      <div className="p-3">
        <h3 className="font-semibold text-gray-900 text-sm truncate">{place.name}</h3>
        <div className="flex items-center gap-1 mt-1 text-xs text-gray-500">
          <MapPin size={11} />
          <span className="truncate">{place.districtName}, {place.divisionName}</span>
        </div>
        <div className="flex items-center justify-between mt-2">
          <div className="flex items-center gap-1 text-xs">
            <Star size={12} className="fill-amber-400 text-amber-400" />
            <span className="font-medium text-gray-700">{place.averageRating?.toFixed(1) || '—'}</span>
            <span className="text-gray-400">({place.totalReviews})</span>
          </div>
          <div className="flex items-center gap-1 text-xs text-gray-500">
            <Ticket size={11} />
            <span>{place.entryFee > 0 ? formatBDT(place.entryFee) : 'Free'}</span>
          </div>
        </div>
        {place.categories?.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-2">
            {place.categories.slice(0, 2).map((c) => (
              <span key={c} className="badge bg-primary-50 text-primary-700">{c}</span>
            ))}
          </div>
        )}
      </div>
    </Link>
  )
}