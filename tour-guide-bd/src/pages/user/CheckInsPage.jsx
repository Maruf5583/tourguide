import { useQuery } from '@tanstack/react-query'
import { usersApi } from '../../api/users.api'
import LoadingSpinner from '../../components/common/LoadingSpinner'
import Pagination from '../../components/common/Pagination'
import { usePagination } from '../../hooks/usePagination'
import { formatTime } from '../../utils/formatters'
import { MapPin, CheckCircle } from 'lucide-react'
import { Link } from 'react-router-dom'

export default function CheckInsPage() {
  const { pageNumber, pageSize, nextPage, prevPage, goToPage } = usePagination()

  const { data, isLoading } = useQuery({
    queryKey: ['checkins', pageNumber],
    queryFn: () => usersApi.getCheckIns({ pageNumber, pageSize }).then(r => r.data),
  })

  if (isLoading) return <LoadingSpinner center />

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-6">
      <h1 className="text-xl font-bold text-gray-900 mb-6">My check-ins</h1>
      {!data?.items?.length ? (
        <div className="text-center py-16 text-gray-400">
          <CheckCircle size={32} className="mx-auto mb-2 opacity-40" />
          <p>No check-ins yet. Visit a place and check in!</p>
        </div>
      ) : (
        <div className="space-y-3">
          {data.items.map((c) => (
            <Link key={c.id} to={`/places/${c.placeId}`} className="card p-4 flex items-center gap-4 hover:shadow-md transition-shadow">
              <div className="w-12 h-12 rounded-xl overflow-hidden bg-primary-100 shrink-0">
                {c.placeCoverPhotoUrl ? (
                  <img src={c.placeCoverPhotoUrl} alt={c.placeName} className="w-full h-full object-cover" />
                ) : <MapPin size={20} className="m-auto mt-3 text-primary-400" />}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-gray-900 truncate">{c.placeName}</p>
                {c.note && <p className="text-xs text-gray-500 truncate">{c.note}</p>}
              </div>
              <p className="text-xs text-gray-400 shrink-0">{formatTime(c.checkedInAt)}</p>
            </Link>
          ))}
        </div>
      )}
      <Pagination pageNumber={pageNumber} totalPages={data?.totalPages}
        hasPrev={data?.hasPreviousPage} hasNext={data?.hasNextPage}
        onPrev={prevPage} onNext={nextPage} onPage={goToPage} />
    </div>
  )
}