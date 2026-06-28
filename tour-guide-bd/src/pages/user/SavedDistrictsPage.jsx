import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { usersApi } from '../../api/users.api'
import { locationsApi } from '../../api/locations.api'
import LoadingSpinner from '../../components/common/LoadingSpinner'
import { MapPin, Plus, Trash2 } from 'lucide-react'
import { useState } from 'react'
import toast from 'react-hot-toast'

export default function SavedDistrictsPage() {
  const qc = useQueryClient()
  const [divisionId, setDivisionId] = useState('')
  const [selectedDistrictId, setSelectedDistrictId] = useState('')

  const { data: saved, isLoading } = useQuery({
    queryKey: ['saved-districts'],
    queryFn: () => usersApi.getSavedDistricts().then(r => r.data),
  })
  const { data: divisions } = useQuery({
    queryKey: ['divisions'],
    queryFn: () => locationsApi.getDivisions().then(r => r.data),
  })
  const { data: districts } = useQuery({
    queryKey: ['districts', divisionId],
    enabled: !!divisionId,
    queryFn: () => locationsApi.getDistricts(divisionId).then(r => r.data),
  })

  const addMutation = useMutation({
    mutationFn: (id) => usersApi.saveDistrict(id),
    onSuccess: () => { toast.success('District saved'); qc.invalidateQueries(['saved-districts']) },
  })
  const removeMutation = useMutation({
    mutationFn: (id) => usersApi.removeDistrict(id),
    onSuccess: () => { toast.success('Removed'); qc.invalidateQueries(['saved-districts']) },
  })

  if (isLoading) return <LoadingSpinner center />

  return (
    <div className="max-w-xl mx-auto px-4 sm:px-6 py-6">
      <h1 className="text-xl font-bold text-gray-900 mb-6">Saved districts</h1>

      {/* Add new */}
      <div className="card p-4 mb-6 flex gap-3 flex-wrap">
        <select value={divisionId} onChange={e => { setDivisionId(e.target.value); setSelectedDistrictId('') }}
          className="input text-sm flex-1">
          <option value="">Select division</option>
          {divisions?.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
        </select>
        <select value={selectedDistrictId} onChange={e => setSelectedDistrictId(e.target.value)}
          disabled={!divisionId} className="input text-sm flex-1">
          <option value="">Select district</option>
          {districts?.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
        </select>
        <button onClick={() => selectedDistrictId && addMutation.mutate(selectedDistrictId)}
          disabled={!selectedDistrictId} className="btn-primary flex items-center gap-1.5">
          <Plus size={15} /> Save
        </button>
      </div>

      {/* List */}
      {!saved?.length ? (
        <div className="text-center py-12 text-gray-400">
          <MapPin size={28} className="mx-auto mb-2 opacity-40" />
          <p>No saved districts yet</p>
        </div>
      ) : (
        <div className="space-y-2">
          {saved.map(d => (
            <div key={d.districtId} className="card p-3 flex items-center gap-3">
              <MapPin size={16} className="text-primary-600 shrink-0" />
              <div className="flex-1">
                <p className="font-medium text-sm text-gray-900">{d.districtName}</p>
                {d.districtNameBn && <p className="text-xs text-gray-400">{d.districtNameBn}</p>}
              </div>
              <button onClick={() => removeMutation.mutate(d.districtId)}
                className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors">
                <Trash2 size={15} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}