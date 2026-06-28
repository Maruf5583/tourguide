import { useState, useEffect, useRef } from 'react'
import { useQuery } from '@tanstack/react-query'
import { placesApi } from '../../api/places.api'
import { Search, X, MapPin, Loader2 } from 'lucide-react'

export default function PlaceSearchInput({ value, onChange, placeholder = 'Search a place…' }) {
  const [query, setQuery]       = useState('')
  const [open, setOpen]         = useState(false)
  const [selected, setSelected] = useState(null)
  const wrapperRef = useRef(null)

  // debounce query
  const [debouncedQuery, setDebouncedQuery] = useState('')
  useEffect(() => {
    const t = setTimeout(() => setDebouncedQuery(query), 350)
    return () => clearTimeout(t)
  }, [query])

  const { data, isFetching } = useQuery({
    queryKey: ['place-search-input', debouncedQuery],
    enabled: debouncedQuery.trim().length >= 2,
    queryFn: () => placesApi.search({ q: debouncedQuery.trim(), pageNumber: 1, pageSize: 8 }).then(r => r.data),
  })

  // close dropdown on outside click
  useEffect(() => {
    const handler = (e) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const handleSelect = (place) => {
    setSelected(place)
    setQuery(place.name)
    setOpen(false)
    onChange(place.id, place)
  }

  const handleClear = () => {
    setSelected(null)
    setQuery('')
    onChange('', null)
  }

  return (
    <div className="relative" ref={wrapperRef}>
      <div className="relative">
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          value={query}
          onChange={(e) => { setQuery(e.target.value); setOpen(true); if (selected) setSelected(null) }}
          onFocus={() => query.length >= 2 && setOpen(true)}
          placeholder={placeholder}
          className="input pl-9 pr-8"
        />
        {query && (
          <button type="button" onClick={handleClear}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
            <X size={14} />
          </button>
        )}
      </div>

      {open && debouncedQuery.trim().length >= 2 && (
        <div className="absolute z-20 mt-1 w-full bg-white border border-gray-200 rounded-xl shadow-lg max-h-64 overflow-y-auto">
          {isFetching ? (
            <div className="flex items-center justify-center gap-2 py-4 text-sm text-gray-400">
              <Loader2 size={14} className="animate-spin" /> Searching…
            </div>
          ) : data?.items?.length ? (
            data.items.map((place) => (
              <button
                key={place.id}
                type="button"
                onClick={() => handleSelect(place)}
                className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-primary-50 transition-colors text-left border-b border-gray-50 last:border-0"
              >
                <div className="w-9 h-9 rounded-lg overflow-hidden bg-primary-50 shrink-0">
                  {place.coverPhotoUrl ? (
                    <img src={place.coverPhotoUrl} alt={place.name} className="w-full h-full object-cover" />
                  ) : (
                    <MapPin size={16} className="m-auto mt-2.5 text-primary-400" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-gray-900 truncate">{place.name}</p>
                  <p className="text-xs text-gray-400 truncate">{place.districtName}, {place.divisionName}</p>
                </div>
              </button>
            ))
          ) : (
            <div className="text-center py-4 text-sm text-gray-400">No places found</div>
          )}
        </div>
      )}
    </div>
  )
}