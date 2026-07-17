import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import { guideApi } from '../../api/guide.api'

export default function GuidesListPage() {
  const [guides, setGuides] = useState([])
  const [loading, setLoading] = useState(true)
  const [removeModal, setRemoveModal] = useState(null) // guide object
  const [reason, setReason] = useState('')
  const [removing, setRemoving] = useState(false)

  const fetchGuides = async () => {
    setLoading(true)
    try {
      const { data } = await guideApi.getGuides({ pageNumber: 1, pageSize: 50 })
      setGuides(data.items || [])
    } catch {
      toast.error('Failed to load guides')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchGuides() }, [])

  const confirmRemove = async () => {
    if (!reason.trim()) return toast.error('Reason is required')
    setRemoving(true)
    try {
      await guideApi.removeGuide(removeModal.id, { reason })
      toast.success('Guide removed')
      setRemoveModal(null)
      setReason('')
      fetchGuides()
    } catch (err) {
      // active booking থাকলে backend ValidationException দেবে — সেটাই দেখাবো
      toast.error(err.response?.data?.message || err.response?.data?.detail || 'Failed to remove')
    } finally {
      setRemoving(false)
    }
  }

  if (loading) return <p className="text-gray-500">Loading...</p>

  return (
    <div>
      <h1 className="text-xl font-bold mb-6">Manage Guides</h1>
      <div className="grid gap-3">
        {guides.map((g) => (
          <div key={g.id} className="border rounded-lg p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <img src={g.profilePhotoUrl} className="w-10 h-10 rounded-full object-cover" alt={g.fullName} />
              <div>
                <p className="font-semibold">{g.fullName || g.name}</p>
                <p className="text-sm text-gray-500">⭐ {g.rating ?? 'N/A'}</p>
              </div>
            </div>
            <button
              onClick={() => setRemoveModal(g)}
              className="px-3 py-1.5 bg-red-600 text-white text-sm rounded-lg hover:bg-red-700"
            >
              Delete
            </button>
          </div>
        ))}
      </div>

      {removeModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <h3 className="font-semibold mb-1">Remove "{removeModal.fullName || removeModal.name}"?</h3>
            <p className="text-sm text-gray-500 mb-3">
              Active booking থাকলে remove হবে না — আগে booking resolve করতে হবে।
            </p>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Reason for removal (required)"
              rows={3}
              className="w-full border rounded-lg px-3 py-2 text-sm mb-4"
            />
            <div className="flex justify-end gap-2">
              <button onClick={() => { setRemoveModal(null); setReason('') }} className="px-4 py-2 text-sm rounded-lg border">
                Cancel
              </button>
              <button
                onClick={confirmRemove}
                disabled={removing}
                className="px-4 py-2 text-sm rounded-lg text-white bg-red-600 hover:bg-red-700 disabled:opacity-50"
              >
                {removing ? 'Removing...' : 'Confirm Remove'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}