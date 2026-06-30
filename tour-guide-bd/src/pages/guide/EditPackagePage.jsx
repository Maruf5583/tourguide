import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation } from '@tanstack/react-query'
import { guideApi } from '../../api/guide.api'
import { parseApiErrors } from '../../utils/apiErrors'
import { Package, X, AlertCircle, MapPin, Search, Loader, ArrowLeft } from 'lucide-react'
import toast from 'react-hot-toast'
import mapboxgl from 'mapbox-gl'
import MapboxGeocoder from '@mapbox/mapbox-gl-geocoder'
import 'mapbox-gl/dist/mapbox-gl.css'
import '@mapbox/mapbox-gl-geocoder/dist/mapbox-gl-geocoder.css'

const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN
mapboxgl.accessToken = MAPBOX_TOKEN

function FieldError({ msg }) {
  if (!msg) return null
  return (
    <p className="flex items-center gap-1 text-xs text-red-500 mt-1">
      <AlertCircle size={12} /> {msg}
    </p>
  )
}

function MapPicker({ lat, lng, onChange }) {
  const mapRef = useRef(null)
  const mapInstance = useRef(null)
  const markerRef = useRef(null)

  useEffect(() => {
    if (mapInstance.current) return
    const map = new mapboxgl.Map({
      container: mapRef.current,
      style: 'mapbox://styles/mapbox/streets-v12',
      center: [lng || 90.3563, lat || 23.685],
      zoom: lat ? 13 : 6,
    })
    mapInstance.current = map

    const geocoder = new MapboxGeocoder({
      accessToken: MAPBOX_TOKEN,
      mapboxgl,
      marker: false,
      placeholder: 'Search meeting point…',
    })
    map.addControl(geocoder, 'top-left')

    geocoder.on('result', (e) => {
      const [lngR, latR] = e.result.center
      place(lngR, latR)
      onChange(latR.toFixed(6), lngR.toFixed(6), e.result.place_name)
    })

    map.on('click', (e) => {
      place(e.lngLat.lng, e.lngLat.lat)
      onChange(e.lngLat.lat.toFixed(6), e.lngLat.lng.toFixed(6), null)
    })

    function place(lngV, latV) {
      if (markerRef.current) markerRef.current.remove()
      markerRef.current = new mapboxgl.Marker({ color: '#6366f1' })
        .setLngLat([lngV, latV])
        .addTo(map)
    }

    if (lat && lng) place(lng, lat)
    return () => map.remove()
  }, [])

  return (
    <div ref={mapRef} className="w-full rounded-xl overflow-hidden border border-gray-200"
      style={{ height: 280 }} />
  )
}

function PlaceSearch({ placeIds, onChange }) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState([])
  const [searching, setSearching] = useState(false)

  const search = async () => {
    if (!query.trim()) return
    setSearching(true)
    try {
      const res = await fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json` +
          `?access_token=${MAPBOX_TOKEN}&country=bd&limit=5&language=en`
      )
      const data = await res.json()
      setResults(data.features || [])
    } catch {
      toast.error('Place search failed')
    } finally {
      setSearching(false)
    }
  }

  const add = (feature) => {
    if (!placeIds.find((p) => p.mapboxId === feature.id)) {
      onChange([...placeIds, { mapboxId: feature.id, name: feature.place_name, center: feature.center }])
    }
    setResults([]); setQuery('')
  }

  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        <input value={query} onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), search())}
          placeholder="Search a place…" className="input flex-1" />
        <button type="button" onClick={search} className="btn-secondary px-4 flex items-center gap-1">
          {searching ? <Loader size={15} className="animate-spin" /> : <Search size={15} />}
        </button>
      </div>
      {results.length > 0 && (
        <div className="border border-gray-200 rounded-xl overflow-hidden divide-y divide-gray-100 shadow-sm">
          {results.map((f) => (
            <button key={f.id} type="button" onClick={() => add(f)}
              className="w-full text-left px-4 py-2.5 hover:bg-primary-50 text-sm text-gray-700">
              <span className="font-medium">{f.text}</span>
              <span className="text-gray-400 text-xs ml-2">{f.place_name}</span>
            </button>
          ))}
        </div>
      )}
      {placeIds.length > 0 && (
        <div className="flex flex-wrap gap-2 mt-1">
          {placeIds.map((p) => (
            <span key={p.mapboxId}
              className="flex items-center gap-1 px-3 py-1 bg-primary-50 text-primary-700 rounded-full text-sm font-medium">
              <MapPin size={11} /> {p.name.split(',')[0]}
              <button type="button" onClick={() => onChange(placeIds.filter((x) => x.mapboxId !== p.mapboxId))}>
                <X size={12} className="text-primary-400 hover:text-red-500 ml-1" />
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  )
}

export default function EditPackagePage() {
  const { packageId } = useParams()
  const navigate = useNavigate()
  const [errors, setErrors] = useState({})
  const [form, setForm] = useState(null)

  const { data: pkg, isLoading } = useQuery({
    queryKey: ['package-detail', packageId],
    queryFn: () => guideApi.getPackageById(packageId).then((r) => r.data),
    enabled: !!packageId,
  })

  useEffect(() => {
    if (!pkg) return
    setForm({
      title:                 pkg.title || '',
      description:           pkg.description || '',
      pricePerPerson:        pkg.pricePerPerson || '',
      maxPeople:             pkg.maxPeople || 10,
      durationDays:          pkg.durationDays || 1,
      includesFood:          pkg.includesFood || false,
      includesTransport:     pkg.includesTransport || false,
      includesAccommodation: pkg.includesAccommodation || false,
      additionalIncludes:    pkg.additionalIncludes || '',
      meetingPoint:          pkg.meetingPoint || '',
      meetingLat:            pkg.meetingLat?.toString() || '',
      meetingLng:            pkg.meetingLng?.toString() || '',
      places:                (pkg.places || []).map((pl) => ({
        mapboxId: pl.mapboxId || String(pl.id),
        name:     pl.name || pl.title || '',
        center:   pl.center || [pl.lng, pl.lat],
      })),
    })
  }, [pkg])

  const clearError = (field) =>
    setErrors((p) => { const n = { ...p }; delete n[field]; return n })

  const updateMutation = useMutation({
    mutationFn: (data) => guideApi.updatePackage(packageId, data),
    onSuccess: () => { toast.success('Package updated!'); navigate('/guide/dashboard') },
    onError: (err) => {
      const apiErrors = parseApiErrors(err)
      if (apiErrors.general) toast.error(apiErrors.general)
      else { setErrors(apiErrors); toast.error('Please fix the errors') }
    },
  })

  const validate = () => {
    const e = {}
    if (!form.title.trim())       e.title         = 'Title is required'
    if (!form.description.trim()) e.description   = 'Description is required'
    if (!form.pricePerPerson || Number(form.pricePerPerson) <= 0)
                                   e.pricePerPerson = 'Price must be greater than 0'
    if (!form.meetingPoint.trim()) e.meetingPoint  = 'Meeting point is required'
    if (!form.meetingLat || !form.meetingLng)
                                   e.meetingLat    = 'Pin a location on the map'
    if (form.places.length === 0)  e.places        = 'Add at least one place'
    return e
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    const clientErrors = validate()
    if (Object.keys(clientErrors).length > 0) { setErrors(clientErrors); return }
    setErrors({})
    updateMutation.mutate({
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
      placeIds:              form.places.map((_, i) => i + 1),
    })
  }

  const inputCls = (field) =>
    `input ${errors[field] ? 'border-red-400 focus:ring-red-400' : ''}`

  if (isLoading || !form) return (
    <div className="flex items-center justify-center py-16">
      <div className="w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" />
    </div>
  )

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8">
      <button onClick={() => navigate(-1)}
        className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 mb-6">
        <ArrowLeft size={16} /> Back
      </button>
      <div className="flex items-center gap-3 mb-6">
        <Package size={24} className="text-primary-600" />
        <h1 className="text-xl font-black text-gray-900">Edit package</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6" noValidate>

        <div className="card p-5 space-y-4">
          <h2 className="font-semibold text-gray-800 text-sm uppercase tracking-wide">Basic info</h2>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Title <span className="text-red-500">*</span></label>
            <input value={form.title}
              onChange={(e) => { setForm((p) => ({ ...p, title: e.target.value })); clearError('title') }}
              className={inputCls('title')} />
            <FieldError msg={errors.title} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description <span className="text-red-500">*</span></label>
            <textarea value={form.description} rows={4}
              onChange={(e) => { setForm((p) => ({ ...p, description: e.target.value })); clearError('description') }}
              className={`${inputCls('description')} resize-none`} />
            <FieldError msg={errors.description} />
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Price/person (BDT) <span className="text-red-500">*</span></label>
              <input type="number" min={1} value={form.pricePerPerson}
                onChange={(e) => { setForm((p) => ({ ...p, pricePerPerson: e.target.value })); clearError('pricePerPerson') }}
                className={inputCls('pricePerPerson')} />
              <FieldError msg={errors.pricePerPerson} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Max people</label>
              <input type="number" min={1} max={50} value={form.maxPeople}
                onChange={(e) => setForm((p) => ({ ...p, maxPeople: e.target.value }))}
                className="input" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Duration (days)</label>
              <input type="number" min={1} max={30} value={form.durationDays}
                onChange={(e) => setForm((p) => ({ ...p, durationDays: e.target.value }))}
                className="input" />
            </div>
          </div>
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
                    onChange={(e) => setForm((p) => ({ ...p, [key]: e.target.checked }))}
                    className="w-4 h-4 accent-primary-600" />
                  <span className="text-sm text-gray-700">{label}</span>
                </label>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Additional includes <span className="text-gray-400 font-normal">(optional)</span></label>
            <input value={form.additionalIncludes}
              onChange={(e) => setForm((p) => ({ ...p, additionalIncludes: e.target.value }))}
              className="input" />
          </div>
        </div>

        <div className="card p-5 space-y-4">
          <h2 className="font-semibold text-gray-800 text-sm uppercase tracking-wide">Meeting point</h2>
          <p className="text-xs text-gray-400">Search or click on the map to update location.</p>
          <MapPicker
            lat={parseFloat(form.meetingLat) || null}
            lng={parseFloat(form.meetingLng) || null}
            onChange={(lat, lng, placeName) => {
              setForm((p) => ({
                ...p,
                meetingLat: lat,
                meetingLng: lng,
                meetingPoint: placeName || p.meetingPoint,
              }))
              clearError('meetingLat')
            }}
          />
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Meeting point name <span className="text-red-500">*</span></label>
            <input value={form.meetingPoint}
              onChange={(e) => { setForm((p) => ({ ...p, meetingPoint: e.target.value })); clearError('meetingPoint') }}
              className={inputCls('meetingPoint')} />
            <FieldError msg={errors.meetingPoint} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Latitude</label>
              <input value={form.meetingLat} readOnly className="input bg-gray-50 text-gray-500" />
              <FieldError msg={errors.meetingLat} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Longitude</label>
              <input value={form.meetingLng} readOnly className="input bg-gray-50 text-gray-500" />
            </div>
          </div>
        </div>

        <div className="card p-5 space-y-3">
          <h2 className="font-semibold text-gray-800 text-sm uppercase tracking-wide">Places included <span className="text-red-500">*</span></h2>
          <PlaceSearch
            placeIds={form.places}
            onChange={(places) => { setForm((p) => ({ ...p, places })); clearError('places') }}
          />
          <FieldError msg={errors.places} />
        </div>

        {errors.general && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-2 text-sm text-red-700">
            <AlertCircle size={16} className="shrink-0 mt-0.5" />
            {errors.general}
          </div>
        )}

        <button type="submit" disabled={updateMutation.isPending}
          className="btn-primary w-full py-3.5 font-bold flex items-center justify-center gap-2">
          {updateMutation.isPending
            ? <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Saving…</>
            : <><Package size={16} /> Save changes</>}
        </button>
      </form>
    </div>
  )
}