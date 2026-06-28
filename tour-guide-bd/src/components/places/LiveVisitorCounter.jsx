import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { realtimeApi } from '../../api/realtime.api'
import { Users, Plus, Minus } from 'lucide-react'
import toast from 'react-hot-toast'

export default function LiveVisitorCounter({ placeId, currentCount = 0 }) {
  const qc = useQueryClient()
  const [pending, setPending] = useState(false)

  const mutation = useMutation({
    mutationFn: (delta) => realtimeApi.updateLiveVisitor(placeId, { placeId: Number(placeId), delta }),
    onMutate: () => setPending(true),
    onSuccess: () => {
      qc.invalidateQueries(['crowd', placeId])
      toast.success('Updated')
    },
    onError: () => toast.error('Failed to update'),
    onSettled: () => setPending(false),
  })

  return (
    <div className="flex items-center gap-3 bg-gray-50 rounded-xl px-3 py-2">
      <Users size={16} className="text-primary-600 shrink-0" />
      <span className="text-sm text-gray-600 flex-1">I'm here now</span>
      <div className="flex items-center gap-1">
        <button onClick={() => mutation.mutate(-1)} disabled={pending}
          className="w-7 h-7 rounded-lg bg-white border border-gray-200 flex items-center justify-center hover:bg-gray-100 transition-colors disabled:opacity-50">
          <Minus size={13} />
        </button>
        <span className="w-8 text-center text-sm font-semibold text-gray-900">{currentCount}</span>
        <button onClick={() => mutation.mutate(1)} disabled={pending}
          className="w-7 h-7 rounded-lg bg-primary-600 text-white flex items-center justify-center hover:bg-primary-700 transition-colors disabled:opacity-50">
          <Plus size={13} />
        </button>
      </div>
    </div>
  )
}