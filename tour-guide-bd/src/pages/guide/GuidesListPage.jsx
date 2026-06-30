import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { guideApi } from '../../api/guide.api'
import LoadingSpinner from '../../components/common/LoadingSpinner'
import { formatBDT } from '../../utils/formatters'
import { Star, MapPin, MessageCircle, UserCheck, Search, SlidersHorizontal } from 'lucide-react'
import { usePagination } from '../../hooks/usePagination'
import Pagination from '../../components/common/Pagination'

// ✅ languages/specialities string হলেও handle করবে
function parseList(val) {
  if (!val) return []
  if (Array.isArray(val)) return val
  return val.split(',').map(s => s.trim()).filter(Boolean)
}

function GuideCard({ guide }) {
  const languages    = parseList(guide.languages)
  const districtNames = parseList(guide.districtNames)

  return (
    <div className="card p-5 hover:shadow-md transition-shadow">
      <div className="flex items-start gap-4">
        <div className="w-14 h-14 rounded-2xl bg-primary-100 flex items-center justify-center text-primary-700 font-black text-xl shrink-0 overflow-hidden">
          {guide.profilePhotoUrl
            ? <img src={guide.profilePhotoUrl} alt={guide.fullName} className="w-full h-full object-cover" />
            : guide.fullName?.[0]?.toUpperCase()}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="font-bold text-gray-900">{guide.fullName}</h3>
            {guide.badge && (
              <span className="inline-flex items-center gap-1 text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium">
                <UserCheck size={11} /> {guide.badge}
              </span>
            )}
          </div>
          {guide.bio && (
            <p className="text-sm text-gray-500 mt-1 line-clamp-2">{guide.bio}</p>
          )}
          <div className="flex items-center gap-3 mt-2 flex-wrap">
            {guide.averageRating > 0 && (
              <span className="flex items-center gap-1 text-xs text-amber-600 font-medium">
                <Star size={12} className="fill-amber-400 text-amber-400" />
                {guide.averageRating?.toFixed(1)} ({guide.totalReviews})
              </span>
            )}
            {districtNames.length > 0 && (
              <span className="flex items-center gap-1 text-xs text-gray-400">
                <MapPin size={11} />
                {districtNames.slice(0, 2).join(', ')}
                {districtNames.length > 2 && ` +${districtNames.length - 2}`}
              </span>
            )}
            {languages.length > 0 && (
              <span className="flex items-center gap-1 text-xs text-gray-400">
                <MessageCircle size={11} />
                {languages.slice(0, 2).join(', ')}
              </span>
            )}
          </div>
        </div>
        <div className="text-right shrink-0">
          {guide.totalPackages > 0 && (
            <p className="text-xs text-gray-400">{guide.totalPackages} packages</p>
          )}
          {guide.experienceYears > 0 && (
            <p className="text-xs text-gray-400 mt-0.5">{guide.experienceYears} yrs exp</p>
          )}
        </div>
      </div>

      <div className="mt-4 flex gap-2">
        <Link
          to={`/guide/${guide.id}`}
          className="btn-secondary flex-1 text-sm text-center py-2"
        >
          View profile
        </Link>
        <Link
          to={`/guide/${guide.id}`}
          className="btn-primary flex-1 text-sm text-center py-2"
        >
          Book guide
        </Link>
      </div>
    </div>
  )
}

export default function GuidesListPage() {
  const [search, setSearch] = useState('')
  const [query, setQuery]   = useState('')
  const { pageNumber, pageSize, nextPage, prevPage, goToPage, reset } = usePagination()

  const { data, isLoading } = useQuery({
    queryKey: ['guides', query, pageNumber],
    queryFn: () => guideApi.getGuides({
      search: query || undefined,
      pageNumber,
      pageSize,
    }).then(r => r.data),
    retry: false,
  })

  const handleSearch = (e) => {
    e.preventDefault()
    setQuery(search.trim())
    reset()
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-black text-gray-900">Find a tour guide</h1>
        <p className="text-sm text-gray-500 mt-1">
          Connect with verified local guides across Bangladesh
        </p>
      </div>

      {/* Search */}
      <form onSubmit={handleSearch} className="flex gap-2 mb-6">
        <div className="relative flex-1">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by name, district or language…"
            className="input pl-9"
          />
        </div>
        <button type="submit" className="btn-primary px-6">Search</button>
      </form>

      {/* Apply CTA */}
      <div className="bg-gradient-to-r from-primary-600 to-teal-500 rounded-2xl p-5 flex items-center justify-between mb-6">
        <div>
          <p className="text-white font-bold">Are you a local expert?</p>
          <p className="text-white/70 text-sm mt-0.5">
            Become a verified guide and earn money sharing Bangladesh
          </p>
        </div>
        <Link
          to="/guide/apply"
          className="bg-white hover:bg-gray-50 text-primary-700 font-bold px-5 py-2.5 rounded-xl text-sm transition-colors shrink-0"
        >
          Apply as guide
        </Link>
      </div>

      {/* List */}
      {isLoading ? (
        <LoadingSpinner center />
      ) : !data?.items?.length ? (
        <div className="text-center py-16 text-gray-400">
          <SlidersHorizontal size={32} className="mx-auto mb-2 opacity-40" />
          <p>No guides found{query ? ` for "${query}"` : ''}.</p>
          <Link to="/guide/apply" className="text-primary-600 hover:underline text-sm mt-2 inline-block">
            Be the first guide →
          </Link>
        </div>
      ) : (
        <>
          <p className="text-sm text-gray-500 mb-4">{data.totalCount} guides available</p>
          <div className="space-y-4">
            {data.items.map(guide => (
              <GuideCard key={guide.id} guide={guide} />
            ))}
          </div>
          <Pagination
            pageNumber={pageNumber}
            totalPages={data?.totalPages}
            hasPrev={data?.hasPreviousPage}
            hasNext={data?.hasNextPage}
            onPrev={prevPage}
            onNext={nextPage}
            onPage={goToPage}
          />
        </>
      )}
    </div>
  )
}