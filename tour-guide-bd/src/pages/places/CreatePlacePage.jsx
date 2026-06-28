import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { placesApi } from '../../api/places.api'
import { locationsApi } from '../../api/locations.api'
import { useAuthStore } from '../../store/auth.store'
import { parseApiErrors } from '../../utils/apiErrors'
import { PLACE_CATEGORY_LABELS, BEST_SEASON } from '../../utils/constants'
import MapLocationPicker from '../../components/places/MapLocationPicker'
import { MapPin, Plus, X, Upload, AlertCircle, Clock } from 'lucide-react'
import toast from 'react-hot-toast'

function FieldError({ msg }) {
  if (!msg) return null
  return (
    <p className="flex items-center gap-1 text-xs text-red-500 mt-1">
      <AlertCircle size={12} /> {msg}
    </p>
  )
}

const INITIAL_FORM = {
  name: '', nameBn: '', description: '',
  latitude: '', longitude: '',
  entryFee: 0, bestSeason: 1,
  openingHours: '', closingHours: '',
  divisionId: '', districtId: '', upazilaId: '',
  categoryIds: [], tags: [],
  autoApprove: false,
}

export default function CreatePlacePage() {
  const { user } = useAuthStore()
  const navigate  = useNavigate()
  const [loading, setLoading]   = useState(false)
  const [tagInput, setTagInput] = useState('')
  const [photos, setPhotos]     = useState([])
  const [errors, setErrors]     = useState({})
  const [form, setForm]         = useState(INITIAL_FORM)

  // ── location queries ──────────────────────────────────────
  const { data: divisions } = useQuery({
    queryKey: ['divisions'],
    queryFn: () => locationsApi.getDivisions().then(r => r.data),
  })
  const { data: districts } = useQuery({
    queryKey: ['districts', form.divisionId],
    enabled: !!form.divisionId,
    queryFn: () => locationsApi.getDistricts(form.divisionId).then(r => r.data),
  })
  const { data: upazilas } = useQuery({
    queryKey: ['upazilas', form.districtId],
    enabled: !!form.districtId,
    queryFn: () => locationsApi.getUpazilas(form.districtId).then(r => r.data),
  })

  // ── validation ────────────────────────────────────────────
  const validate = () => {
    const e = {}
    if (!form.name.trim())
      e.name = 'Place name is required'
    if (!form.divisionId)
      e.divisionId = 'Division is required'
    if (!form.districtId)
      e.districtId = 'District is required'
    if (!String(form.latitude).trim())
      e.latitude = 'Latitude is required'
    else if (Number(form.latitude) < -90 || Number(form.latitude) > 90)
      e.latitude = 'Must be between −90 and 90'
    if (!String(form.longitude).trim())
      e.longitude = 'Longitude is required'
    else if (Number(form.longitude) < -180 || Number(form.longitude) > 180)
      e.longitude = 'Must be between −180 and 180'
    if (Number(form.entryFee) < 0)
      e.entryFee = 'Cannot be negative'
    if (form.categoryIds.length === 0)
      e.categoryIds = 'Select at least one category'
    return e
  }

  const clearError = (field) =>
    setErrors(prev => { const n = { ...prev }; delete n[field]; return n })

  // ── photo select ──────────────────────────────────────────
  const handlePhotoSelect = (e) => {
    const files = Array.from(e.target.files)
    if (photos.length + files.length > 5) {
      toast.error('Maximum 5 photos allowed')
      e.target.value = ''
      return
    }
    const invalid = files.filter(f => !f.type.startsWith('image/'))
    if (invalid.length) {
      toast.error('Only image files are allowed')
      e.target.value = ''
      return
    }
    const tooBig = files.filter(f => f.size > 5 * 1024 * 1024)
    if (tooBig.length) {
      toast.error('Each photo must be under 5 MB')
      e.target.value = ''
      return
    }
    const newPhotos = files.map(file => ({
      file,
      preview: URL.createObjectURL(file),
    }))
    setPhotos(prev => [...prev, ...newPhotos])
    e.target.value = ''
  }

  const removePhoto = (idx) => {
    setPhotos(prev => {
      URL.revokeObjectURL(prev[idx].preview)
      return prev.filter((_, i) => i !== idx)
    })
  }

  // ── categories & tags ─────────────────────────────────────
  const toggleCategory = (id) => {
    setForm(prev => ({
      ...prev,
      categoryIds: prev.categoryIds.includes(id)
        ? prev.categoryIds.filter(c => c !== id)
        : [...prev.categoryIds, id],
    }))
    clearError('categoryIds')
  }

  const addTag = () => {
    const t = tagInput.trim()
    if (t && !form.tags.includes(t))
      setForm(prev => ({ ...prev, tags: [...prev.tags, t] }))
    setTagInput('')
  }

  const removeTag = (t) =>
    setForm(prev => ({ ...prev, tags: prev.tags.filter(x => x !== t) }))

  const useMyLocation = () => {
    navigator.geolocation.getCurrentPosition(
      pos => {
        setForm(prev => ({
          ...prev,
          latitude:  pos.coords.latitude.toFixed(6),
          longitude: pos.coords.longitude.toFixed(6),
        }))
        clearError('latitude')
        clearError('longitude')
        toast.success('Location captured')
      },
      () => toast.error('Location access denied')
    )
  }

  // ── submit ────────────────────────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault()

    const clientErrors = validate()
    if (Object.keys(clientErrors).length > 0) {
      setErrors(clientErrors)
      const firstId = Object.keys(clientErrors)[0]
      document.getElementById(firstId)?.scrollIntoView({ behavior: 'smooth', block: 'center' })
      toast.error('Please fix the errors below')
      return
    }

    setErrors({})
    setLoading(true)

    try {
      // 1. upload photos first → get back URLs
      let uploadedPhotoUrls = []
      if (photos.length > 0) {
        try {
          const { data: urls } = await placesApi.uploadPhotos(photos.map(p => p.file))
          uploadedPhotoUrls = Array.isArray(urls) ? urls : []
        } catch (uploadErr) {
          console.error('Photo upload failed:', uploadErr)
          toast('Photos failed to upload, continuing without them', { icon: '⚠️' })
        }
      }

      // 2. build payload — matches CreatePlaceCommand exactly
      const payload = {
        name:              form.name.trim(),
        nameBn:            form.nameBn.trim() || null,
        description:       form.description.trim() || null,
        latitude:          parseFloat(form.latitude),
        longitude:         parseFloat(form.longitude),
        entryFee:          parseFloat(form.entryFee) || 0,
        bestSeason:        Number(form.bestSeason),
        openingHours:      form.openingHours.trim() || null,
        closingHours:      form.closingHours.trim() || null,
        divisionId:        parseInt(form.divisionId),
        districtId:        parseInt(form.districtId),
        upazilaId:         form.upazilaId ? parseInt(form.upazilaId) : null,
        categoryIds:       form.categoryIds,
        tags:              form.tags,
        photoUrls:         uploadedPhotoUrls,
        submittedByUserId: user?.id || null,
        autoApprove:       form.autoApprove,
        entityId:          null,
      }

      // 3. create place
      const { data: placeId } = await placesApi.create(payload)

      toast.success('Place submitted for approval!')
      navigate(`/places/${placeId}`)

    } catch (err) {
      const apiErrors = parseApiErrors(err)
      if (apiErrors.general) {
        toast.error(apiErrors.general)
      } else {
        setErrors(apiErrors)
        const firstKey = Object.keys(apiErrors)[0]
        document.getElementById(firstKey)?.scrollIntoView({ behavior: 'smooth', block: 'center' })
        toast.error('Please fix the errors below')
      }
    } finally {
      setLoading(false)
    }
  }

  const inputCls = (field) =>
    `input ${errors[field] ? 'border-red-400 focus:ring-red-400' : ''}`

  // ── render ────────────────────────────────────────────────
  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8">
      <div className="mb-6">
        <h1 className="text-xl font-bold text-gray-900">Add a new place</h1>
        <p className="text-sm text-gray-500 mt-1">Submit a tourist spot for review</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6" noValidate>

        {/* ── Basic info ─────────────────────────────────── */}
        <div className="card p-5 space-y-4">
          <h2 className="font-semibold text-gray-800 text-sm uppercase tracking-wide">
            Basic info
          </h2>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                Name (English) <span className="text-red-500">*</span>
              </label>
              <input
                id="name"
                value={form.name}
                onChange={e => { setForm({ ...form, name: e.target.value }); clearError('name') }}
                placeholder="Cox's Bazar"
                className={inputCls('name')}
              />
              <FieldError msg={errors.name} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Name (Bengali)
              </label>
              <input
                value={form.nameBn}
                onChange={e => setForm({ ...form, nameBn: e.target.value })}
                placeholder="কক্সবাজার"
                className="input"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              value={form.description}
              onChange={e => setForm({ ...form, description: e.target.value })}
              placeholder="Describe this place…"
              rows={4}
              className="input resize-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="entryFee" className="block text-sm font-medium text-gray-700 mb-1">
                Entry fee (BDT)
              </label>
              <input
                id="entryFee"
                type="number"
                min={0}
                value={form.entryFee}
                onChange={e => { setForm({ ...form, entryFee: e.target.value }); clearError('entryFee') }}
                className={inputCls('entryFee')}
              />
              <FieldError msg={errors.entryFee} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Best season
              </label>
              <select
                value={form.bestSeason}
                onChange={e => setForm({ ...form, bestSeason: Number(e.target.value) })}
                className="input"
              >
                {Object.entries(BEST_SEASON).map(([k, v]) => (
                  <option key={k} value={k}>{v}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Opening / Closing hours */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-1.5">
                <Clock size={13} /> Opening hours
              </label>
              <input
                type="time"
                value={form.openingHours}
                onChange={e => setForm({ ...form, openingHours: e.target.value })}
                className="input"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-1.5">
                <Clock size={13} /> Closing hours
              </label>
              <input
                type="time"
                value={form.closingHours}
                onChange={e => setForm({ ...form, closingHours: e.target.value })}
                className="input"
              />
            </div>
          </div>
        </div>

        {/* ── Photos ─────────────────────────────────────── */}
        <div className="card p-5 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-gray-800 text-sm uppercase tracking-wide">
              Photos
            </h2>
            <span className="text-xs text-gray-400">{photos.length} / 5</span>
          </div>

          <div className="grid grid-cols-5 gap-2">
            {photos.map((photo, idx) => (
              <div
                key={idx}
                className="relative aspect-square rounded-xl overflow-hidden bg-gray-100 group"
              >
                <img
                  src={photo.preview}
                  alt={`preview-${idx}`}
                  className="w-full h-full object-cover"
                />
                {idx === 0 && (
                  <span className="absolute bottom-1 left-1 text-xs bg-black/60 text-white px-1.5 py-0.5 rounded-md leading-tight">
                    Cover
                  </span>
                )}
                <button
                  type="button"
                  onClick={() => removePhoto(idx)}
                  className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                >
                  <X size={20} className="text-white" />
                </button>
              </div>
            ))}

            {photos.length < 5 && (
              <label className="aspect-square rounded-xl border-2 border-dashed border-gray-200 hover:border-primary-400 hover:bg-primary-50 transition-colors cursor-pointer flex flex-col items-center justify-center gap-1 group">
                <Upload size={18} className="text-gray-400 group-hover:text-primary-500 transition-colors" />
                <span className="text-xs text-gray-400 group-hover:text-primary-500 transition-colors">
                  Upload
                </span>
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  multiple
                  className="hidden"
                  onChange={handlePhotoSelect}
                />
              </label>
            )}
          </div>

          <p className="text-xs text-gray-400">
            First photo will be the cover. JPG, PNG or WebP — max 5 MB each.
          </p>
        </div>

        {/* ── Location ───────────────────────────────────── */}
        <div className="card p-5 space-y-4">
          <h2 className="font-semibold text-gray-800 text-sm uppercase tracking-wide">
            Location
          </h2>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Division <span className="text-red-500">*</span>
              </label>
              <select
                id="divisionId"
                value={form.divisionId}
                onChange={e => {
                  setForm({ ...form, divisionId: e.target.value, districtId: '', upazilaId: '' })
                  clearError('divisionId')
                  clearError('districtId')
                }}
                className={inputCls('divisionId')}
              >
                <option value="">Select</option>
                {divisions?.map(d => (
                  <option key={d.id} value={d.id}>{d.name}</option>
                ))}
              </select>
              <FieldError msg={errors.divisionId} />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                District <span className="text-red-500">*</span>
              </label>
              <select
                id="districtId"
                value={form.districtId}
                onChange={e => {
                  setForm({ ...form, districtId: e.target.value, upazilaId: '' })
                  clearError('districtId')
                }}
                disabled={!form.divisionId}
                className={inputCls('districtId')}
              >
                <option value="">Select</option>
                {districts?.map(d => (
                  <option key={d.id} value={d.id}>{d.name}</option>
                ))}
              </select>
              <FieldError msg={errors.districtId} />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Upazila</label>
              <select
                value={form.upazilaId}
                onChange={e => setForm({ ...form, upazilaId: e.target.value })}
                disabled={!form.districtId}
                className="input"
              >
                <option value="">Select</option>
                {upazilas?.map(u => (
                  <option key={u.id} value={u.id}>{u.name}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Map picker */}
          <MapLocationPicker
            latitude={form.latitude}
            longitude={form.longitude}
            onChange={(lat, lng) => {
              setForm(prev => ({ ...prev, latitude: lat, longitude: lng }))
              clearError('latitude')
              clearError('longitude')
            }}
          />

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="latitude" className="block text-sm font-medium text-gray-700 mb-1">
                Latitude <span className="text-red-500">*</span>
              </label>
              <input
                id="latitude"
                type="number"
                step="any"
                value={form.latitude}
                onChange={e => { setForm({ ...form, latitude: e.target.value }); clearError('latitude') }}
                placeholder="23.8103"
                className={inputCls('latitude')}
              />
              <FieldError msg={errors.latitude} />
            </div>
            <div>
              <label htmlFor="longitude" className="block text-sm font-medium text-gray-700 mb-1">
                Longitude <span className="text-red-500">*</span>
              </label>
              <input
                id="longitude"
                type="number"
                step="any"
                value={form.longitude}
                onChange={e => { setForm({ ...form, longitude: e.target.value }); clearError('longitude') }}
                placeholder="90.4125"
                className={inputCls('longitude')}
              />
              <FieldError msg={errors.longitude} />
            </div>
          </div>

          <button
            type="button"
            onClick={useMyLocation}
            className="btn-secondary text-sm flex items-center gap-2 w-fit"
          >
            <MapPin size={15} /> Use my current location
          </button>
        </div>

        {/* ── Categories ─────────────────────────────────── */}
        <div className="card p-5 space-y-3">
          <h2 className="font-semibold text-gray-800 text-sm uppercase tracking-wide">
            Categories <span className="text-red-500">*</span>
          </h2>
          <div className="flex flex-wrap gap-2">
            {PLACE_CATEGORY_LABELS.map(c => (
              <button
                key={c.id}
                type="button"
                onClick={() => toggleCategory(c.id)}
                className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-colors ${
                  form.categoryIds.includes(c.id)
                    ? 'bg-primary-600 text-white border-primary-600'
                    : 'border-gray-200 text-gray-600 hover:border-primary-300 hover:bg-primary-50'
                }`}
              >
                {c.name}
              </button>
            ))}
          </div>
          <FieldError msg={errors.categoryIds} />
        </div>

        {/* ── Tags ───────────────────────────────────────── */}
        <div className="card p-5 space-y-3">
          <h2 className="font-semibold text-gray-800 text-sm uppercase tracking-wide">
            Tags{' '}
            <span className="text-gray-400 font-normal normal-case text-xs">(optional)</span>
          </h2>
          <div className="flex gap-2">
            <input
              value={tagInput}
              onChange={e => setTagInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addTag())}
              placeholder="Type a tag and press Enter"
              className="input flex-1"
            />
            <button type="button" onClick={addTag} className="btn-secondary px-4">
              <Plus size={16} />
            </button>
          </div>
          {form.tags.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {form.tags.map(t => (
                <span
                  key={t}
                  className="flex items-center gap-1 px-2.5 py-1 bg-gray-100 rounded-full text-sm text-gray-700"
                >
                  {t}
                  <button type="button" onClick={() => removeTag(t)}>
                    <X size={12} className="text-gray-400 hover:text-red-500 transition-colors" />
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>

        {/* ── Global server error ─────────────────────────── */}
        {errors.general && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-2 text-sm text-red-700">
            <AlertCircle size={16} className="shrink-0 mt-0.5" />
            {errors.general}
          </div>
        )}

        {/* ── Submit ─────────────────────────────────────── */}
        <button
          type="submit"
          disabled={loading}
          className="btn-primary w-full text-base py-3 flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Submitting…
            </>
          ) : (
            'Submit place for approval'
          )}
        </button>

      </form>
    </div>
  )
}