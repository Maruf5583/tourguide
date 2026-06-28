import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { placesApi } from '../../api/places.api'
import { locationsApi } from '../../api/locations.api'
import { parseApiErrors } from '../../utils/apiErrors'
import { PLACE_CATEGORY_LABELS, BEST_SEASON, PLACE_CATEGORY } from '../../utils/constants'
import { MapPin, Plus, X, AlertCircle, Trash2 } from 'lucide-react'
import toast from 'react-hot-toast'
import LoadingSpinner from '../../components/common/LoadingSpinner'
import Modal from '../../components/common/Modal'

function FieldError({ msg }) {
  if (!msg) return null
  return (
    <p className="flex items-center gap-1 text-xs text-red-500 mt-1">
      <AlertCircle size={12} /> {msg}
    </p>
  )
}

export default function EditPlacePage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [loading, setLoading]   = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [tagInput, setTagInput] = useState('')
  const [errors, setErrors]     = useState({})
  const [form, setForm]         = useState(null)

  const { data: place, isLoading } = useQuery({
    queryKey: ['place', id],
    queryFn: () => placesApi.getById(id).then(r => r.data),
  })

  // populate form once place loads
  useEffect(() => {
    if (place && !form) {
      setForm({
        name: place.name || '',
        nameBn: place.nameBn || '',
        description: place.description || '',
        latitude: place.latitude ?? '',
        longitude: place.longitude ?? '',
        entryFee: place.entryFee ?? 0,
        bestSeason: place.bestSeason ?? 1,
        divisionId: place.divisionId || '',
        districtId: place.districtId || '',
        upazilaId: place.upazilaId || '',
        categoryIds: place.categoryIds || [],
        tags: place.tags || [],
      })
    }
  }, [place, form])

  const { data: divisions } = useQuery({
    queryKey: ['divisions'],
    queryFn: () => locationsApi.getDivisions().then(r => r.data),
  })
  const { data: districts } = useQuery({
    queryKey: ['districts', form?.divisionId],
    enabled: !!form?.divisionId,
    queryFn: () => locationsApi.getDistricts(form.divisionId).then(r => r.data),
  })
  const { data: upazilas } = useQuery({
    queryKey: ['upazilas', form?.districtId],
    enabled: !!form?.districtId,
    queryFn: () => locationsApi.getUpazilas(form.districtId).then(r => r.data),
  })

  if (isLoading || !form) return <LoadingSpinner center />

  const validate = () => {
    const e = {}
    if (!form.name.trim()) e.name = 'Place name is required'
    if (!form.divisionId)  e.divisionId = 'Division is required'
    if (!form.districtId)  e.districtId = 'District is required'
    if (!String(form.latitude).trim()) e.latitude = 'Latitude is required'
    if (!String(form.longitude).trim()) e.longitude = 'Longitude is required'
    if (form.categoryIds.length === 0) e.categoryIds = 'Select at least one category'
    return e
  }

  const clearError = (field) =>
    setErrors(prev => { const n = { ...prev }; delete n[field]; return n })

  const toggleCategory = (catId) => {
    setForm(prev => ({
      ...prev,
      categoryIds: prev.categoryIds.includes(catId)
        ? prev.categoryIds.filter(c => c !== catId)
        : [...prev.categoryIds, catId],
    }))
    clearError('categoryIds')
  }

  const addTag = () => {
    const t = tagInput.trim()
    if (t && !form.tags.includes(t)) setForm(prev => ({ ...prev, tags: [...prev.tags, t] }))
    setTagInput('')
  }
  const removeTag = (t) => setForm(prev => ({ ...prev, tags: prev.tags.filter(x => x !== t) }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    const clientErrors = validate()
    if (Object.keys(clientErrors).length > 0) {
      setErrors(clientErrors)
      toast.error('Please fix the errors below')
      return
    }
    setErrors({})
    setLoading(true)
    try {
      const payload = {
        id: Number(id),
        name: form.name.trim(),
        nameBn: form.nameBn.trim() || null,
        description: form.description.trim() || null,
        latitude: parseFloat(form.latitude),
        longitude: parseFloat(form.longitude),
        entryFee: parseFloat(form.entryFee) || 0,
        bestSeason: Number(form.bestSeason),
        divisionId: parseInt(form.divisionId),
        districtId: parseInt(form.districtId),
        upazilaId: form.upazilaId ? parseInt(form.upazilaId) : null,
        categoryIds: form.categoryIds,
        tags: form.tags,
      }
      await placesApi.update(id, payload)
      toast.success('Place updated successfully')
      navigate(`/places/${id}`)
    } catch (err) {
      const apiErrors = parseApiErrors(err)
      if (apiErrors.general) toast.error(apiErrors.general)
      else { setErrors(apiErrors); toast.error('Please fix the errors below') }
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    setDeleting(true)
    try {
      await placesApi.remove(id)
      toast.success('Place deleted')
      navigate('/places')
    } catch {
      toast.error('Failed to delete place')
    } finally {
      setDeleting(false)
      setConfirmOpen(false)
    }
  }

  const inputCls = (field) => `input ${errors[field] ? 'border-red-400 focus:ring-red-400' : ''}`

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Edit place</h1>
          <p className="text-sm text-gray-500 mt-1">{place.name}</p>
        </div>
        <button onClick={() => setConfirmOpen(true)}
          className="btn-danger text-sm flex items-center gap-1.5">
          <Trash2 size={14} /> Delete
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6" noValidate>
        <div className="card p-5 space-y-4">
          <h2 className="font-semibold text-gray-800 text-sm uppercase tracking-wide">Basic info</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Name (English) <span className="text-red-500">*</span>
              </label>
              <input value={form.name}
                onChange={e => { setForm({ ...form, name: e.target.value }); clearError('name') }}
                className={inputCls('name')} />
              <FieldError msg={errors.name} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Name (Bengali)</label>
              <input value={form.nameBn}
                onChange={e => setForm({ ...form, nameBn: e.target.value })}
                className="input" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea value={form.description}
              onChange={e => setForm({ ...form, description: e.target.value })}
              rows={4} className="input resize-none" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Entry fee (BDT)</label>
              <input type="number" min={0} value={form.entryFee}
                onChange={e => setForm({ ...form, entryFee: e.target.value })} className="input" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Best season</label>
              <select value={form.bestSeason}
                onChange={e => setForm({ ...form, bestSeason: Number(e.target.value) })} className="input">
                {Object.entries(BEST_SEASON).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
            </div>
          </div>
        </div>

        <div className="card p-5 space-y-4">
          <h2 className="font-semibold text-gray-800 text-sm uppercase tracking-wide">Location</h2>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Division *</label>
              <select value={form.divisionId}
                onChange={e => { setForm({ ...form, divisionId: e.target.value, districtId: '', upazilaId: '' }); clearError('divisionId') }}
                className={inputCls('divisionId')}>
                <option value="">Select</option>
                {divisions?.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
              </select>
              <FieldError msg={errors.divisionId} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">District *</label>
              <select value={form.districtId}
                onChange={e => { setForm({ ...form, districtId: e.target.value, upazilaId: '' }); clearError('districtId') }}
                disabled={!form.divisionId} className={inputCls('districtId')}>
                <option value="">Select</option>
                {districts?.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
              </select>
              <FieldError msg={errors.districtId} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Upazila</label>
              <select value={form.upazilaId}
                onChange={e => setForm({ ...form, upazilaId: e.target.value })}
                disabled={!form.districtId} className="input">
                <option value="">Select</option>
                {upazilas?.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Latitude *</label>
              <input type="number" step="any" value={form.latitude}
                onChange={e => { setForm({ ...form, latitude: e.target.value }); clearError('latitude') }}
                className={inputCls('latitude')} />
              <FieldError msg={errors.latitude} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Longitude *</label>
              <input type="number" step="any" value={form.longitude}
                onChange={e => { setForm({ ...form, longitude: e.target.value }); clearError('longitude') }}
                className={inputCls('longitude')} />
              <FieldError msg={errors.longitude} />
            </div>
          </div>
        </div>

        <div className="card p-5 space-y-3">
          <h2 className="font-semibold text-gray-800 text-sm uppercase tracking-wide">Categories *</h2>
          <div className="flex flex-wrap gap-2">
            {PLACE_CATEGORY_LABELS.map(c => (
              <button key={c.id} type="button" onClick={() => toggleCategory(c.id)}
                className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-colors ${
                  form.categoryIds.includes(c.id)
                    ? 'bg-primary-600 text-white border-primary-600'
                    : 'border-gray-200 text-gray-600 hover:border-primary-300'
                }`}>
                {c.name}
              </button>
            ))}
          </div>
          <FieldError msg={errors.categoryIds} />
        </div>

        <div className="card p-5 space-y-3">
          <h2 className="font-semibold text-gray-800 text-sm uppercase tracking-wide">Tags</h2>
          <div className="flex gap-2">
            <input value={tagInput} onChange={e => setTagInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addTag())}
              placeholder="Type a tag and press Enter" className="input flex-1" />
            <button type="button" onClick={addTag} className="btn-secondary px-4"><Plus size={16} /></button>
          </div>
          {form.tags.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {form.tags.map(t => (
                <span key={t} className="flex items-center gap-1 px-2.5 py-1 bg-gray-100 rounded-full text-sm text-gray-700">
                  {t}
                  <button type="button" onClick={() => removeTag(t)}>
                    <X size={12} className="text-gray-400 hover:text-red-500" />
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>

        <div className="flex gap-3">
          <button type="submit" disabled={loading} className="btn-primary flex-1 py-3">
            {loading ? 'Saving…' : 'Save changes'}
          </button>
          <button type="button" onClick={() => navigate(-1)} className="btn-secondary px-6">
            Cancel
          </button>
        </div>
      </form>

      <Modal isOpen={confirmOpen} onClose={() => setConfirmOpen(false)} title="Delete this place?">
        <p className="text-sm text-gray-600 mb-4">
          This will permanently delete <strong>{place.name}</strong>. This action cannot be undone.
        </p>
        <div className="flex gap-3">
          <button onClick={handleDelete} disabled={deleting} className="btn-danger flex-1">
            {deleting ? 'Deleting…' : 'Yes, delete'}
          </button>
          <button onClick={() => setConfirmOpen(false)} className="btn-secondary flex-1">Cancel</button>
        </div>
      </Modal>
    </div>
  )
}