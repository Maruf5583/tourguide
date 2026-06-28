import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { adminApi } from '../../api/admin.api'
import { placesApi } from '../../api/places.api'
import LoadingSpinner from '../../components/common/LoadingSpinner'
import Pagination from '../../components/common/Pagination'
import { usePagination } from '../../hooks/usePagination'
import { MapPin, Check, X } from 'lucide-react'
import toast from 'react-hot-toast'

export default function PendingPlacesPage() {
  const qc = useQueryClient()
  const { pageNumber, pageSize, nextPage, prevPage, goToPage } = usePagination()

  const { data, isLoading } = useQuery({
    queryKey: ['pending-places', pageNumber],
    queryFn: () => adminApi.getPendingPlaces({ pageNumber, pageSize }).then(r => r.data),
  })

  const approveMutation = useMutation({
    mutationFn: ({ id, isApproved }) => placesApi.approve(id, { placeId: id, isApproved }),
    onSuccess: (_, vars) => {
      toast.success(vars.isApproved ? 'Place approved' : 'Place rejected')
      qc.invalidateQueries(['pending-places'])
    },
    onError: () => toast.error('Action failed'),
  })

  if (isLoading) return <LoadingSpinner center />

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold text-gray-900">Pending places</h1>
      {!data?.items?.length ? (
        <div className="text-center py-12 text-gray-400">No pending places</div>
      ) : (
        <div className="space-y-3">
          {data.items.map((place) => (
            <div key={place.id} className="card p-4 flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl overflow-hidden bg-primary-50 shrink-0">
                {place.coverPhotoUrl ? (
                  <img src={place.coverPhotoUrl} alt={place.name} className="w-full h-full object-cover" />
                ) : <MapPin size={20} className="m-auto mt-3 text-primary-400" />}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-gray-900">{place.name}</p>
                <p className="text-xs text-gray-500">{place.districtName}, {place.divisionName}</p>
                <div className="flex gap-1 mt-1">
                  {place.categories?.map(c => (
                    <span key={c} className="badge bg-gray-100 text-gray-600">{c}</span>
                  ))}
                </div>
              </div>
              <div className="flex gap-2 shrink-0">
                <button onClick={() => approveMutation.mutate({ id: place.id, isApproved: true })}
                  className="p-2 rounded-lg bg-green-50 text-green-700 hover:bg-green-100 transition-colors">
                  <Check size={16} />
                </button>
                <button onClick={() => approveMutation.mutate({ id: place.id, isApproved: false })}
                  className="p-2 rounded-lg bg-red-50 text-red-700 hover:bg-red-100 transition-colors">
                  <X size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
      <Pagination pageNumber={pageNumber} totalPages={data?.totalPages}
        hasPrev={data?.hasPreviousPage} hasNext={data?.hasNextPage}
        onPrev={prevPage} onNext={nextPage} onPage={goToPage} />
    </div>
  )
}