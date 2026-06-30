import { useState, useEffect } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useParams, useNavigate } from 'react-router-dom'
import { guideApi } from '../../api/guide.api'
import { useAuthStore } from '../../store/auth.store'
import { parseApiErrors } from '../../utils/apiErrors'
import { Package, Plus, X, AlertCircle, MapPin } from 'lucide-react'
import { formatBDT } from '../../utils/formatters'
import LoadingSpinner from '../../components/common/LoadingSpinner'
import toast from 'react-hot-toast'

function FieldError({ msg }) {
  if (!msg) return null
  return (
    <p className="flex items-center gap-1 text-xs text-red-500 mt-1">
      <AlertCircle size={12} /> {msg}
    </p>
  )
}

const EMPTY_FORM = {
  title:               '',
  description:         '',
  pricePerPerson:      '',
  maxPeople:           10,
  durationDays:        1,
  includesFood:        false,
  includesTransport:   false,
  includesAccommodation: false,
  additionalIncludes:  '',
  meetingPoint:        '',
  meetingLat:          '',
  meetingLng:          '',
  placeIds:            [],
  availabilities:      [], // { date: '', maxBookings: 5 }
}

export default function GuidePackagesPage() {
  const { user } = useAuthStore()
  const qc = useQueryClient()
  const navigate = useNavigate()
  // present when editing an existing package -> /guide/packages/:packageId
  const { packageId } = useParams()
  const isEditMode = !!packageId

  const [errors,  setErrors]  = useState({})
  const [created, setCreated] = useState(null)
  const [placeIdInput, setPlaceIdInput] = useState('')
  const [locating, setLocating] = useState(false)

  const [form, setForm] = useState(EMPTY_FORM)

  // fetch package data when editing.
  const { data: myPackages, isLoading: loadingPackages } = useQuery({
    queryKey: ['my-packages', user?.id],
    queryFn: () => guideApi.getMyPackages().then(r => r.data),
    enabled: isEditMode,
  })

  useEffect(() => {
    if (!isEditMode || !myPackages) return
    const pkg = myPackages.find(p => String(p.id) === String(packageId))
    if (!pkg) {
      toast.error('Package not found')
      navigate('/guide/dashboard')
      return
    }
    setForm({
      title:                 pkg.title || '',
      description:           pkg.description || '',
      pricePerPerson:        pkg.pricePerPerson ?? '',
      maxPeople:             pkg.maxPeople ?? 10,
      durationDays:          pkg.durationDays ?? 1,
      includesFood:          !!pkg.includesFood,
      includesTransport:     !!pkg.includesTransport,
      includesAccommodation: !!pkg.includesAccommodation,
      additionalIncludes:    pkg.additionalIncludes || '',
      meetingPoint:          pkg.meetingPoint || '',
      meetingLat:            pkg.meetingLat ?? '',
      meetingLng:            pkg.meetingLng ?? '',
      placeIds:              pkg.placeIds || [],
      availabilities:        (pkg.availabilities || []).map(a => ({
        date: a.date ? a.date.slice(0, 10) : '',
        maxBookings: a.maxBookings ?? 5,
      })),
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isEditMode, myPackages, packageId])

  const clearError = (field) =>
    setErrors(p => { const n = { ...p }; delete n[field]; return n })

  // ── meeting location (plain geolocation, no map — same pattern as CreatePlacePage) ──
  const useMyLocation = () => {
    setLocating(true)
    navigator.geolocation.getCurrentPosition(
      pos => {
        setForm(p => ({
          ...p,
          meetingLat: pos.coords.latitude.toFixed(6),
          meetingLng: pos.coords.longitude.toFixed(6),
        }))
        clearError('meetingLat')
        setLocating(false)
        toast.success('Location captured')
      },
      () => { toast.error('Location access denied'); setLocating(false) }
    )
  }

  // ── places (simple numeric Place ID input) ─────────────
  const addPlace = () => {
    const id = parseInt(placeIdInput)
    if (!isNaN(id) && id > 0 && !form.placeIds.includes(id))
      setForm(p => ({ ...p, placeIds: [...p.placeIds, id] }))
    setPlaceIdInput('')
    clearError('placeIds')
  }

  // ── availabilities ─────────────────────────────────────
  const addAvailability = () => {
    setForm(p => ({
      ...p,
      availabilities: [...p.availabilities, { date: '', maxBookings: 5 }],
    }))
  }

  const updateAvailability = (idx, field, value) => {
    setForm(p => ({
      ...p,
      availabilities: p.availabilities.map((a, i) =>
        i === idx ? { ...a, [field]: value } : a
      ),
    }))
  }

  const removeAvailability = (idx) => {
    setForm(p => ({
      ...p,
      availabilities: p.availabilities.filter((_, i) => i !== idx),
    }))
  }

  // ── validation ─────────────────────────────────────────
  const validate = () => {
    const e = {}
    if (!form.title.trim())       e.title         = 'Title is required'
    if (!form.description.trim()) e.description   = 'Description is required'
    if (!form.pricePerPerson || Number(form.pricePerPerson) <= 0)
                                   e.pricePerPerson = 'Price must be greater than 0'
    if (!form.meetingPoint.trim()) e.meetingPoint  = 'Meeting point is required'
    if (!form.meetingLat || !form.meetingLng)
                                   e.meetingLat    = 'Meeting location coordinates required'
    if (form.placeIds.length === 0)e.placeIds      = 'At least one place required'
    return e
  }

  const buildPayload = () => ({
    title:                 form.title.trim(),
    description:           form.description.trim(),
    pricePerPerson:        parseFloat(form.pricePerPerson),
    maxPeople:             parseInt(form.maxPeople) || 10,
    durationDays:          parseInt(form.durationDays) || 1,
    includesFood:          form.includesFood,
    includesTransport:     form.includesTransport,
    includesAccommodation: form.includesAccommodation,
    additionalIncludes:    form.additionalIncludes.trim() || null,
    meetingPoint:          form.meetingPoint.trim(),
    meetingLat:            parseFloat(form.meetingLat),
    meetingLng:            parseFloat(form.meetingLng),
    placeIds:              form.placeIds,
    availabilities:        form.availabilities
      .filter(a => a.date)
      .map(a => ({
        date:        new Date(a.date).toISOString(),
        maxBookings: parseInt(a.maxBookings) || 1,
      })),
  })

  const createMutation = useMutation({
    mutationFn: (data) => guideApi.createPackage(data),
    onSuccess: (res) => {
      toast.success('Package created!')
      const id = res.data?.packageId ?? res.data?.id ?? res.data
      setCreated(id)
    },
    onError: (err) => {
      const apiErrors = parseApiErrors(err)
      if (apiErrors.general) toast.error(apiErrors.general)
      else { setErrors(apiErrors); toast.error('Please fix the errors below') }
    },
  })

  const updateMutation = useMutation({
    mutationFn: (data) => guideApi.updatePackage(packageId, data),
    onSuccess: () => {
      toast.success('Package updated!')
      qc.invalidateQueries({ queryKey: ['my-packages'] })
      navigate('/guide/dashboard')
    },
    onError: (err) => {
      const apiErrors = parseApiErrors(err)
      if (apiErrors.general) toast.error(apiErrors.general)
      else { setErrors(apiErrors); toast.error('Please fix the errors below') }
    },
  })

  const isSubmitting = createMutation.isPending || updateMutation.isPending

  const handleSubmit = (e) => {
    e.preventDefault()
    const clientErrors = validate()
    if (Object.keys(clientErrors).length > 0) {
      setErrors(clientErrors)
      toast.error('Please fix the errors below')
      return
    }
    setErrors({})

    if (isEditMode) {
      updateMutation.mutate(buildPayload())
    } else {
      createMutation.mutate({
        guideUserId: user?.id || '',
        ...buildPayload(),
      })
    }
  }

  const inputCls = (field) =>
    `input ${errors[field] ? 'border-red-400 focus:ring-red-400' : ''}`

  if (isEditMode && loadingPackages) return <LoadingSpinner center />

  if (created) {
    return (
      <div className="max-w-lg mx-auto px-4 sm:px-6 py-16 text-center space-y-4">
        <div className="text-6xl">🎉</div>
        <h2 className="text-2xl font-black text-gray-900">Package created!</h2>
        <p className="text-gray-500 text-sm">Package ID: #{String(created)}</p>
        <button onClick={() => {
          setCreated(null)
          setForm(EMPTY_FORM)
        }} className="btn-primary">
          Create another package
        </button>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8">
      <div className="flex items-center gap-3 mb-6">
        <Package size={24} className="text-primary-600" />
        <h1 className="text-xl font-black text-gray-900">
          {isEditMode ? 'Edit tour package' : 'Create tour package'}
        </h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6" noValidate>

        {/* ── Basic info ── */}
        <div className="card p-5 space-y-4">
          <h2 className="font-semibold text-gray-800 text-sm uppercase tracking-wide">Basic info</h2>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Package title <span className="text-red-500">*</span>
            </label>
            <input value={form.title} placeholder="3-day Cox's Bazar tour"
              onChange={e => { setForm(p => ({ ...p, title: e.target.value })); clearError('title') }}
              className={inputCls('title')} />
            <FieldError msg={errors.title} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description <span className="text-red-500">*</span>
            </label>
            <textarea value={form.description} rows={4}
              placeholder="What's included? What will tourists experience?"
              onChange={e => { setForm(p => ({ ...p, description: e.target.value })); clearError('description') }}
              className={`${inputCls('description')} resize-none`} />
            <FieldError msg={errors.description} />
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Price/person (BDT) <span className="text-red-500">*</span>
              </label>
              <input type="number" min={1} value={form.pricePerPerson} placeholder="5000"
                onChange={e => { setForm(p => ({ ...p, pricePerPerson: e.target.value })); clearError('pricePerPerson') }}
                className={inputCls('pricePerPerson')} />
              <FieldError msg={errors.pricePerPerson} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Max people</label>
              <input type="number" min={1} max={50} value={form.maxPeople}
                onChange={e => setForm(p => ({ ...p, maxPeople: e.target.value }))}
                className="input" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Duration (days)</label>
              <input type="number" min={1} max={30} value={form.durationDays}
                onChange={e => setForm(p => ({ ...p, durationDays: e.target.value }))}
                className="input" />
            </div>
          </div>

          {/* includes */}
          <div>
            <p className="text-sm font-medium text-gray-700 mb-2">Includes</p>
            <div className="flex flex-wrap gap-4">
              {[
                { key: 'includesFood',          label: '🍽️ Food' },
                { key: 'includesTransport',     label: '🚌 Transport' },
                { key: 'includesAccommodation', label: '🏨 Accommodation' },
              ].map(({ key, label }) => (
                <label key={key} className="flex items-center gap-2 cursor-pointer select-none">
                  <input type="checkbox" checked={form[key]}
                    onChange={e => setForm(p => ({ ...p, [key]: e.target.checked }))}
                    className="w-4 h-4 accent-primary-600" />
                  <span className="text-sm text-gray-700">{label}</span>
                </label>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Additional includes <span className="text-gray-400 font-normal">(optional)</span>
            </label>
            <input value={form.additionalIncludes}
              placeholder="e.g. Snorkeling gear, Permits…"
              onChange={e => setForm(p => ({ ...p, additionalIncludes: e.target.value }))}
              className="input" />
          </div>
        </div>

        {/* ── Meeting point (plain inputs, no map — matches CreatePlacePage pattern) ── */}
        <div className="card p-5 space-y-4">
          <h2 className="font-semibold text-gray-800 text-sm uppercase tracking-wide">Meeting point</h2>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Meeting point name <span className="text-red-500">*</span>
            </label>
            <input value={form.meetingPoint}
              placeholder="e.g. Cox's Bazar Bus Terminal main gate"
              onChange={e => { setForm(p => ({ ...p, meetingPoint: e.target.value })); clearError('meetingPoint') }}
              className={inputCls('meetingPoint')} />
            <FieldError msg={errors.meetingPoint} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Latitude <span className="text-red-500">*</span>
              </label>
              <input type="number" step="any" value={form.meetingLat} placeholder="21.4272"
                onChange={e => { setForm(p => ({ ...p, meetingLat: e.target.value })); clearError('meetingLat') }}
                className={inputCls('meetingLat')} />
              <FieldError msg={errors.meetingLat} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Longitude <span className="text-red-500">*</span></label>
              <input type="number" step="any" value={form.meetingLng} placeholder="92.0058"
                onChange={e => setForm(p => ({ ...p, meetingLng: e.target.value }))}
                className="input" />
            </div>
          </div>
          <button type="button" onClick={useMyLocation} disabled={locating}
            className="btn-secondary text-sm flex items-center gap-2 w-fit">
            {locating
              ? <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
              : <MapPin size={14} />}
            Use my current location
          </button>
        </div>

        {/* ── Places (simple Place ID input) ── */}
        <div className="card p-5 space-y-3">
          <h2 className="font-semibold text-gray-800 text-sm uppercase tracking-wide">
            Places included <span className="text-red-500">*</span>
          </h2>
          <div className="flex gap-2">
            <input type="number" value={placeIdInput}
              onChange={e => setPlaceIdInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addPlace())}
              placeholder="Enter Place ID" className="input flex-1" />
            <button type="button" onClick={addPlace} className="btn-secondary px-4">
              <Plus size={16} />
            </button>
          </div>
          <p className="text-xs text-gray-400">Find Place IDs on the Explore or Map page</p>
          {form.placeIds.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {form.placeIds.map(id => (
                <span key={id} className="flex items-center gap-1 px-3 py-1 bg-primary-50 text-primary-700 rounded-full text-sm font-medium">
                  Place #{id}
                  <button type="button"
                    onClick={() => setForm(p => ({ ...p, placeIds: p.placeIds.filter(x => x !== id) }))}>
                    <X size={12} className="text-primary-400 hover:text-red-500" />
                  </button>
                </span>
              ))}
            </div>
          )}
          <FieldError msg={errors.placeIds} />
        </div>

        {/* ── Availability dates ── */}
        <div className="card p-5 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-gray-800 text-sm uppercase tracking-wide">
              Available dates
            </h2>
            <button type="button" onClick={addAvailability}
              className="btn-secondary text-sm flex items-center gap-1.5 px-3">
              <Plus size={14} /> Add date
            </button>
          </div>
          {form.availabilities.length === 0 ? (
            <p className="text-sm text-gray-400">No dates added yet. Add availability dates for bookings.</p>
          ) : (
            <div className="space-y-2">
              {form.availabilities.map((a, i) => (
                <div key={i} className="flex items-center gap-3">
                  <input type="date" value={a.date}
                    onChange={e => updateAvailability(i, 'date', e.target.value)}
                    className="input flex-1" />
                  <input type="number" min={1} value={a.maxBookings}
                    onChange={e => updateAvailability(i, 'maxBookings', e.target.value)}
                    placeholder="Max bookings" className="input w-36" />
                  <button type="button" onClick={() => removeAvailability(i)}
                    className="p-2 text-gray-400 hover:text-red-500">
                    <X size={16} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {errors.general && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-2 text-sm text-red-700">
            <AlertCircle size={16} className="shrink-0 mt-0.5" />
            {errors.general}
          </div>
        )}

        <div className="flex gap-3">
          {isEditMode && (
            <button type="button" onClick={() => navigate('/guide/dashboard')}
              className="btn-secondary py-3.5 px-6 font-bold">
              Cancel
            </button>
          )}
          <button type="submit" disabled={isSubmitting}
            className="btn-primary flex-1 py-3.5 font-bold flex items-center justify-center gap-2">
            {isSubmitting
              ? <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> {isEditMode ? 'Updating…' : 'Creating…'}</>
              : <><Package size={16} /> {isEditMode ? 'Update package' : 'Create package'}</>}
          </button>
        </div>
      </form>
    </div>
  )
}