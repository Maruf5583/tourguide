import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { reviewsApi } from '../../api/reviews.api'
import { useAuthStore } from '../../store/auth.store'
import LoadingSpinner from '../../components/common/LoadingSpinner'
import Pagination from '../../components/common/Pagination'
import StarRating from '../../components/common/StarRating'
import { usePagination } from '../../hooks/usePagination'
import { timeAgo } from '../../utils/formatters'
import { Check, X } from 'lucide-react'
import toast from 'react-hot-toast'

export default function PendingReviewsPage() {
  const { user } = useAuthStore()
  const qc = useQueryClient()
  const { pageNumber, pageSize, nextPage, prevPage, goToPage } = usePagination()

  const { data, isLoading } = useQuery({
    queryKey: ['pending-reviews', pageNumber],
    queryFn: () => reviewsApi.getPending({ pageNumber, pageSize }).then(r => r.data),
  })

  const approveMutation = useMutation({
    mutationFn: ({ reviewId, isApproved }) =>
      reviewsApi.approve(reviewId, { reviewId, isApproved, moderatorId: user?.id }),
    onSuccess: (_, v) => {
      toast.success(v.isApproved ? 'Review approved' : 'Review rejected')
      qc.invalidateQueries(['pending-reviews'])
    },
    onError: () => toast.error('Action failed'),
  })

  if (isLoading) return <LoadingSpinner center />

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold text-gray-900">Pending reviews</h1>
      {!data?.items?.length ? (
        <div className="text-center py-12 text-gray-400">No pending reviews</div>
      ) : (
        <div className="space-y-3">
          {data.items.map((r) => (
            <div key={r.id} className="card p-4">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium text-sm text-gray-900">{r.userName}</span>
                    <span className="text-gray-400 text-xs">→</span>
                    <span className="text-sm text-primary-600">{r.placeName}</span>
                    <StarRating value={r.rating} size={12} />
                    <span className="text-xs text-gray-400 ml-auto">{timeAgo(r.createdAt)}</span>
                  </div>
                  {r.commentEn && <p className="text-sm text-gray-600">{r.commentEn}</p>}
                  {r.commentBn && <p className="text-sm text-gray-600 mt-1">{r.commentBn}</p>}
                </div>
                <div className="flex gap-2 shrink-0">
                  <button onClick={() => approveMutation.mutate({ reviewId: r.id, isApproved: true })}
                    className="p-2 rounded-lg bg-green-50 text-green-700 hover:bg-green-100 transition-colors">
                    <Check size={16} />
                  </button>
                  <button onClick={() => approveMutation.mutate({ reviewId: r.id, isApproved: false })}
                    className="p-2 rounded-lg bg-red-50 text-red-700 hover:bg-red-100 transition-colors">
                    <X size={16} />
                  </button>
                </div>
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