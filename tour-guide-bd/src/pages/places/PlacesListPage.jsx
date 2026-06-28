import { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { placesApi } from '../../api/places.api'
import { locationsApi } from '../../api/locations.api'
import PlaceCard from '../../components/places/PlaceCard'
import Pagination from '../../components/common/Pagination'
import LoadingSpinner from '../../components/common/LoadingSpinner'
import { usePagination } from '../../hooks/usePagination'
import { PLACE_CATEGORY_LABELS } from '../../utils/constants'
import { Search, SlidersHorizontal } from 'lucide-react'

export default function PlacesListPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [search, setSearch]         = useState(searchParams.get('q') || '')
  const [districtId, setDistrictId] = useState('')
  const [category, setCategory]     = useState('')
  const [divisionId, setDivisionId] = useState('')
  const { pageNumber, pageSize, goToPage, nextPage, prevPage, reset } = usePagination()

  const { data: divisions } = useQuery({
    queryKey: ['divisions'],
    queryFn: () => locationsApi.getDivisions().then(r => r.data),
  })
  const { data: districts } = useQuery({
    queryKey: ['districts', divisionId],
    enabled: !!divisionId,
    queryFn: () => locationsApi.getDistricts(divisionId).then(r => r.data),
  })

  const q = searchParams.get('q') || ''



const { data, isLoading } = useQuery({
  queryKey: ['places', q, divisionId, districtId, category, pageNumber],
  queryFn: () =>
    placesApi.getAll({
      pageNumber,
      pageSize,
      divisionId: divisionId || undefined,
      districtId: districtId || undefined,
      category: category || undefined,
      search: q.trim() || undefined,
    }).then(r => r.data),
})

  const handleSearch = (e) => {
    e.preventDefault()
    reset()
    setSearchParams(search ? { q: search } : {})
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Explore Places</h1>
        <p className="text-sm text-gray-500 mt-1">Discover tourist spots across Bangladesh</p>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <form onSubmit={handleSearch} className="flex gap-2 flex-1">
          <div className="relative flex-1">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input value={search} onChange={(e) => setSearch(e.target.value)}
              placeholder="Search places…" className="input pl-9" />
          </div>
          <button type="submit" className="btn-primary px-5">Search</button>
        </form>
        <div className="flex gap-2">
          <select value={divisionId} onChange={(e) => { setDivisionId(e.target.value); setDistrictId(''); reset() }}
            className="input text-sm">
            <option value="">All divisions</option>
            {divisions?.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
          </select>
          <select value={districtId} onChange={(e) => { setDistrictId(e.target.value); reset() }}
            disabled={!divisionId} className="input text-sm">
            <option value="">All districts</option>
            {districts?.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
          </select>
          <select value={category} onChange={(e) => { setCategory(e.target.value); reset() }}
            className="input text-sm">
            <option value="">All categories</option>
            {PLACE_CATEGORY_LABELS.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>
      </div>

      {isLoading ? <LoadingSpinner center /> : (
        <>
          {data?.totalCount != null && (
            <p className="text-sm text-gray-500 mb-4">{data.totalCount} places found</p>
          )}
          {!data?.items?.length ? (
            <div className="text-center py-16 text-gray-400">
              <SlidersHorizontal size={32} className="mx-auto mb-2 opacity-40" />
              <p>No places found. Try different filters.</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
              {data.items.map((place) => <PlaceCard key={place.id} place={place} />)}
            </div>
          )}
          <Pagination pageNumber={pageNumber} totalPages={data?.totalPages}
            hasPrev={data?.hasPreviousPage} hasNext={data?.hasNextPage}
            onPrev={prevPage} onNext={nextPage} onPage={goToPage} />
        </>
      )}
    </div>
  )
}