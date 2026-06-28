import { ChevronLeft, ChevronRight } from 'lucide-react'

export default function Pagination({ pageNumber, totalPages, hasPrev, hasNext, onPrev, onNext, onPage }) {
  if (totalPages <= 1) return null
  return (
    <div className="flex items-center justify-center gap-2 mt-6">
      <button onClick={onPrev} disabled={!hasPrev} className="p-2 rounded-lg border border-gray-200 disabled:opacity-40 hover:bg-gray-50 transition-colors">
        <ChevronLeft size={16} />
      </button>
      {Array.from({ length: totalPages }, (_, i) => i + 1)
        .filter((p) => p === 1 || p === totalPages || Math.abs(p - pageNumber) <= 1)
        .reduce((acc, p, idx, arr) => {
          if (idx > 0 && p - arr[idx - 1] > 1) acc.push('...')
          acc.push(p)
          return acc
        }, [])
        .map((p, i) =>
          p === '...' ? (
            <span key={`ellipsis-${i}`} className="px-2 text-gray-400">…</span>
          ) : (
            <button key={p} onClick={() => onPage(p)}
              className={`w-9 h-9 rounded-lg text-sm font-medium transition-colors ${
                p === pageNumber ? 'bg-primary-600 text-white' : 'border border-gray-200 hover:bg-gray-50'
              }`}>
              {p}
            </button>
          )
        )}
      <button onClick={onNext} disabled={!hasNext} className="p-2 rounded-lg border border-gray-200 disabled:opacity-40 hover:bg-gray-50 transition-colors">
        <ChevronRight size={16} />
      </button>
    </div>
  )
}