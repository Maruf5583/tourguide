import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { reviewsApi } from '../../api/reviews.api'
import { useAuthStore } from '../../store/auth.store'
import LoadingSpinner from '../../components/common/LoadingSpinner'
import Pagination from '../../components/common/Pagination'
import { usePagination } from '../../hooks/usePagination'
import { timeAgo } from '../../utils/formatters'
import { ShieldCheck, Trash2 } from 'lucide-react'
import toast from 'react-hot-toast'

export default function ReportsPage() {
  const { user } = useAuthStore()
  const qc = useQueryClient()
  const { pageNumber, pageSize, nextPage, prevPage, goToPage } = usePagination()

  const { data, isLoading } = useQuery({
    queryKey: ['reports', pageNumber],
    queryFn: () => reviewsApi.getReports({ pageNumber, pageSize }).then(r => r.data),
  })

  const resolveMutation = useMutation({
    mutationFn: ({ reportId, takeAction }) =>
      reviewsApi.resolveReport(reportId, { reportId, takeAction, resolvedByUserId: user?.id }),
    onSuccess: () => { toast.success('Report resolved'); qc.invalidateQueries(['reports']) },
    onError: () => toast.error('Failed'),
  })

  if (isLoading) return <LoadingSpinner center />

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold text-gray-900">Reported reviews</h1>
      {!data?.items?.length ? (
        <div className="text-center py-12 text-gray-400">No open reports</div>
      ) : (
        <div className="space-y-3">
          {data.items.map((r) => (
            <div key={r.reportId} className="card p-4">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <span className="text-xs text-gray-500">Reported by</span>
                    <span className="text-sm font-medium">{r.reportedByUserName}</span>
                    <span className="text-xs text-gray-400">{timeAgo(r.createdAt)}</span>
                  </div>
                  <div className="bg-red-50 rounded-lg p-3 text-sm text-red-700 mb-2">
                    Reason: {r.reason}
                  </div>
                  <div className="bg-gray-50 rounded-lg p-3 text-sm">
                    <p className="text-xs text-gray-500 mb-1">Review by {r.reviewedUserName}</p>
                    {r.commentEn && <p className="text-gray-700">{r.commentEn}</p>}
                  </div>
                </div>
                <div className="flex flex-col gap-2 shrink-0">
                  <button onClick={() => resolveMutation.mutate({ reportId: r.reportId, takeAction: true })}
                    className="p-2 rounded-lg bg-red-50 text-red-700 hover:bg-red-100 transition-colors" title="Delete review">
                    <Trash2 size={15} />
                  </button>
                  <button onClick={() => resolveMutation.mutate({ reportId: r.reportId, takeAction: false })}
                    className="p-2 rounded-lg bg-green-50 text-green-700 hover:bg-green-100 transition-colors" title="Dismiss report">
                    <ShieldCheck size={15} />
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