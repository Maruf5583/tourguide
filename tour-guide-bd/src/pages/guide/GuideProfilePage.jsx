import { useParams, Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { guideApi } from '../../api/guide.api'
import LoadingSpinner from '../../components/common/LoadingSpinner'
import { formatBDT } from '../../utils/formatters'
import {
  Star, MapPin, MessageCircle, UserCheck,
  Clock, Users, Utensils, Bus, Hotel, Package
} from 'lucide-react'

function parseList(val) {
  if (!val) return []
  if (Array.isArray(val)) return val
  return val.split(',').map(s => s.trim()).filter(Boolean)
}

export default function GuideProfilePage() {
  const { guideId } = useParams()

  const { data: guide, isLoading } = useQuery({
    queryKey: ['guide-profile', guideId],
    queryFn: () => guideApi.getGuideProfile(guideId).then(r => r.data),
    enabled: !!guideId,
  })

  if (isLoading) return <LoadingSpinner center />
  if (!guide) return (
    <div className="text-center py-16 text-gray-400">Guide not found</div>
  )

  const languages    = parseList(guide.languages)
  const specialities = parseList(guide.specialities)

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8 space-y-6">

      {/* Header */}
      <div className="card p-6">
        <div className="flex items-start gap-5">
          <div className="w-20 h-20 rounded-2xl bg-primary-100 flex items-center justify-center text-primary-700 font-black text-3xl shrink-0 overflow-hidden">
            {guide.profilePhotoUrl
              ? <img src={guide.profilePhotoUrl} alt={guide.fullName} className="w-full h-full object-cover" />
              : guide.fullName?.[0]?.toUpperCase()}
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-xl font-black text-gray-900">{guide.fullName}</h1>
              {guide.badge && (
                <span className="inline-flex items-center gap-1 text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium">
                  <UserCheck size={11} /> {guide.badge}
                </span>
              )}
            </div>
            <div className="flex items-center gap-4 mt-2 flex-wrap text-sm text-gray-500">
              {guide.averageRating > 0 && (
                <span className="flex items-center gap-1 text-amber-600 font-medium">
                  <Star size={14} className="fill-amber-400 text-amber-400" />
                  {guide.averageRating?.toFixed(1)} ({guide.totalReviews} reviews)
                </span>
              )}
              {guide.experienceYears > 0 && (
                <span className="flex items-center gap-1">
                  <Clock size={14} /> {guide.experienceYears} yrs experience
                </span>
              )}
              {guide.totalToursCompleted > 0 && (
                <span className="text-green-600 font-medium">
                  {guide.totalToursCompleted} tours completed
                </span>
              )}
            </div>
          </div>
        </div>

        {guide.bio && (
          <p className="mt-4 text-sm text-gray-600 leading-relaxed">{guide.bio}</p>
        )}

        {(languages.length > 0 || specialities.length > 0) && (
          <div className="mt-4 flex flex-wrap gap-2">
            {languages.map(l => (
              <span key={l} className="flex items-center gap-1 text-xs bg-blue-50 text-blue-700 px-2.5 py-1 rounded-full">
                <MessageCircle size={10} /> {l}
              </span>
            ))}
            {specialities.map(s => (
              <span key={s} className="text-xs bg-primary-50 text-primary-700 px-2.5 py-1 rounded-full">
                {s}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Packages */}
      {guide.packages?.length > 0 ? (
        <div>
          <h2 className="text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
            <Package size={18} className="text-primary-600" /> Tour packages
          </h2>
          <div className="space-y-3">
            {guide.packages.map(pkg => (
              <div key={pkg.id} className="card p-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <h3 className="font-bold text-gray-900">{pkg.title}</h3>
                    <p className="text-sm text-gray-500 mt-1 line-clamp-2">{pkg.description}</p>
                    <div className="flex items-center gap-3 mt-3 flex-wrap text-xs text-gray-500">
                      <span className="flex items-center gap-1">
                        <Clock size={11} /> {pkg.durationDays} day{pkg.durationDays > 1 ? 's' : ''}
                      </span>
                      <span className="flex items-center gap-1">
                        <Users size={11} /> Max {pkg.maxPeople}
                      </span>
                      {pkg.includesFood && (
                        <span className="flex items-center gap-1 text-green-600">
                          <Utensils size={11} /> Food
                        </span>
                      )}
                      {pkg.includesTransport && (
                        <span className="flex items-center gap-1 text-blue-600">
                          <Bus size={11} /> Transport
                        </span>
                      )}
                      {pkg.includesAccommodation && (
                        <span className="flex items-center gap-1 text-purple-600">
                          <Hotel size={11} /> Stay
                        </span>
                      )}
                    </div>
                    {pkg.meetingPoint && (
                      <p className="text-xs text-gray-400 mt-2 flex items-center gap-1">
                        <MapPin size={10} /> {pkg.meetingPoint}
                      </p>
                    )}
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-lg font-black text-primary-600">
                      {formatBDT(pkg.pricePerPerson)}
                    </p>
                    <p className="text-xs text-gray-400">per person</p>
                    <Link
                      to={`/guide/book/${pkg.id}`}
                      className="btn-primary text-sm px-4 py-1.5 mt-2 inline-block"
                    >
                      Book
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="card p-8 text-center text-gray-400">
          <Package size={28} className="mx-auto mb-2 opacity-40" />
          <p className="text-sm">No packages available yet</p>
        </div>
      )}
    </div>
  )
}