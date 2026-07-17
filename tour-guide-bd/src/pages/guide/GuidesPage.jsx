import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { Search, Star, MapPin, Briefcase, Globe, ChevronRight, Award } from 'lucide-react'
import { guideApi } from '../../api/guide.api'
import { useAuthStore } from '../../store/auth.store'
import { usePagination } from '../../hooks/usePagination'
import Pagination from '../../components/common/Pagination'
import LoadingSpinner from '../../components/common/LoadingSpinner'

const SORT_OPTIONS = [
  { value: 'rating', label: 'Top Rated' },
  { value: 'tours',  label: 'Most Tours' },
  { value: 'name',   label: 'Name A–Z' },
]

const BADGE_STYLE = {
  Verified: 'bg-blue-100 text-blue-700',
  Expert:   'bg-purple-100 text-purple-700',
  default:  'bg-gray-100 text-gray-600',
}

function StarRating({ value, size = 14 }) {
  return (
    <span className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          size={size}
          className={i <= Math.round(value) ? 'text-amber-400 fill-amber-400' : 'text-gray-200 fill-gray-200'}
        />
      ))}
    </span>
  )
}

function GuideCard({ guide }) {
  const badgeClass = BADGE_STYLE[guide.badge] || BADGE_STYLE.default
  const languages = guide.languages?.split(',').map(l => l.trim()).filter(Boolean) || []
  const specialities = guide.specialities?.split(',').map(s => s.trim()).filter(Boolean) || []

  return (
    <Link
      to={`/guides/${guide.id}`}
      className="group bg-white border border-gray-100 rounded-2xl p-5 flex gap-4 hover:shadow-md hover:border-primary-200 transition-all duration-200"
    >
      {/* Avatar */}
      <div className="relative shrink-0">
        <img
          src={guide.profilePhotoUrl || '/default-avatar.png'}
          alt={guide.fullName}
          className="w-16 h-16 rounded-xl object-cover"
        />
        {guide.badge && (
          <span className={`absolute -bottom-1 -right-1 text-[10px] px-1.5 py-0.5 rounded-full font-semibold ${badgeClass}`}>
            {guide.badge}
          </span>
        )}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <div>
            <p className="font-semibold text-gray-900 group-hover:text-primary-600 transition-colors">
              {guide.fullName}
            </p>
            <div className="flex items-center gap-2 mt-0.5">
              <StarRating value={guide.averageRating} />
              <span className="text-xs text-gray-500">
                {guide.averageRating.toFixed(1)} ({guide.totalReviews} reviews)
              </span>
            </div>
          </div>
          <ChevronRight size={16} className="text-gray-300 group-hover:text-primary-400 mt-1 shrink-0 transition-colors" />
        </div>

        <p className="text-xs text-gray-500 mt-2 line-clamp-2 leading-relaxed">{guide.bio}</p>

        <div className="flex flex-wrap gap-3 mt-3 text-xs text-gray-500">
          <span className="flex items-center gap-1">
            <Briefcase size={12} /> {guide.experienceYears} yrs exp
          </span>
          <span className="flex items-center gap-1">
            <MapPin size={12} /> {guide.totalToursCompleted} tours
          </span>
          <span className="flex items-center gap-1">
            <Globe size={12} /> {guide.totalPackages} packages
          </span>
        </div>

        {languages.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-2">
            {languages.slice(0, 3).map((l) => (
              <span key={l} className="text-[11px] bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full">
                {l}
              </span>
            ))}
          </div>
        )}

        {specialities.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-1">
            {specialities.slice(0, 3).map((s) => (
              <span key={s} className="text-[11px] bg-gray-50 text-gray-500 px-2 py-0.5 rounded-full border border-gray-100">
                {s}
              </span>
            ))}
          </div>
        )}
      </div>
    </Link>
  )
}

export default function GuidesPage() {
  const [search, setSearch] = useState('')
  const [sortBy, setSortBy] = useState('rating')
  const [searchInput, setSearchInput] = useState('')
  const { pageNumber, pageSize, nextPage, prevPage, goToPage, reset } = usePagination({ pageSize: 12 })

  const { user, isAuthenticated } = useAuthStore()
  const roles = (user?.roles || []).map(r => r.toLowerCase())
  const isGuide = roles.includes('tourguide')
  const isAdmin = roles.includes('admin') || roles.includes('moderator')

  const { data, isLoading } = useQuery({
    queryKey: ['guides', search, sortBy, pageNumber],
    queryFn: () =>
      guideApi.getGuides({ search, sortBy, pageNumber, pageSize }).then(r => r.data),
    keepPreviousData: true,
  })

  const handleSearch = (e) => {
    e.preventDefault()
    setSearch(searchInput)
    reset()
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-10">
      {/* Header */}
      <div className="mb-8 flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-1">Find a Tour Guide</h1>
          <p className="text-gray-500">Connect with verified local guides across Bangladesh</p>
        </div>

        {isAuthenticated && !isGuide && !isAdmin && (
          <Link
            to="/become-a-guide"
            className="shrink-0 px-4 py-2.5 bg-primary-600 text-white rounded-xl text-sm font-medium hover:bg-primary-700 transition-colors"
          >
            Apply as Guide
          </Link>
        )}
      </div>

      {/* Search + Sort */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <form onSubmit={handleSearch} className="flex-1 flex gap-2">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Search by name, language or speciality..."
              className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-300"
            />
          </div>
          <button type="submit" className="px-4 py-2.5 bg-primary-600 text-white rounded-xl text-sm font-medium hover:bg-primary-700">
            Search
          </button>
        </form>

        <select
          value={sortBy}
          onChange={(e) => { setSortBy(e.target.value); reset() }}
          className="border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-300"
        >
          {SORT_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
      </div>

      {/* Results */}
      {isLoading ? (
        <LoadingSpinner center />
      ) : !data?.items?.length ? (
        <div className="text-center py-16 text-gray-400">
          <Award size={40} className="mx-auto mb-3 opacity-30" />
          <p>No guides found</p>
        </div>
      ) : (
        <>
          <p className="text-sm text-gray-400 mb-4">{data.totalCount ?? data.items.length} guides found</p>
          <div className="grid gap-4">
            {data.items.map(guide => <GuideCard key={guide.id} guide={guide} />)}
          </div>
          <div className="mt-6">
            <Pagination
              pageNumber={pageNumber}
              totalPages={data.totalPages}
              hasPrev={data.hasPreviousPage}
              hasNext={data.hasNextPage}
              onPrev={prevPage}
              onNext={nextPage}
              onPage={goToPage}
            />
          </div>
        </>
      )}
    </div>
  )
}