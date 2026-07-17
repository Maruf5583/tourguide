import { useEffect, useRef, useState } from 'react'
import { X, MapPin, Plus, Trash2, Loader } from 'lucide-react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { packageApi } from '../../api/package.api'
import { useAuthStore } from '../../store/auth.store'

// ─── helpers ────────────────────────────────────────────
function cls() {
  return Array.from(arguments).filter(Boolean).join(' ')
}

function InputField(props) {
  var label = props.label
  var required = props.required
  var children = props.children
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {label}
        {required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      {children}
    </div>
  )
}

var inputCls = 'w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-300'
var checkCls = 'w-4 h-4 rounded accent-primary-600 cursor-pointer'

// ─── Availability row ────────────────────────────────────
function AvailRow(props) {
  var item = props.item
  var idx = props.idx
  var onChange = props.onChange
  var onRemove = props.onRemove

  return (
    <div className="flex items-center gap-2">
      <input
        type="date"
        value={item.date}
        onChange={function(e) { onChange(idx, 'date', e.target.value) }}
        className="flex-1 border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-300"
      />
      <input
        type="number"
        min="1"
        max="50"
        value={item.maxBookings}
        placeholder="Max slots"
        onChange={function(e) { onChange(idx, 'maxBookings', Number(e.target.value)) }}
        className="w-28 border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-300"
      />
      <button
        type="button"
        onClick={function() { onRemove(idx) }}
        className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
      >
        <Trash2 size={14} />
      </button>
    </div>
  )
}

// ─── Mapbox picker ────────────────────────────────────────
function MapboxPicker(props) {
  var onPick = props.onPick
  var initialLat = props.initialLat
  var initialLng = props.initialLng
  var mapRef = useRef(null)
  var markerRef = useRef(null)
  var mapInstance = useRef(null)
  var token = import.meta.env.VITE_MAPBOX_TOKEN
  var [search, setSearch] = useState('')
  var [searching, setSearching] = useState(false)

  useEffect(function() {
    if (!token || mapInstance.current) return

    import('mapbox-gl').then(function(mod) {
      var mapboxgl = mod.default
      mapboxgl.accessToken = token

      var lat = initialLat || 23.8103
      var lng = initialLng || 90.4125

      var map = new mapboxgl.Map({
        container: mapRef.current,
        style: 'mapbox://styles/mapbox/streets-v12',
        center: [lng, lat],
        zoom: initialLat ? 13 : 7,
      })

      map.addControl(new mapboxgl.NavigationControl(), 'top-right')

      var marker = new mapboxgl.Marker({ color: '#4f46e5', draggable: true })
        .setLngLat([lng, lat])
        .addTo(map)

      function emitPosition() {
        var pos = marker.getLngLat()
        onPick({ lat: pos.lat, lng: pos.lng })
      }

      marker.on('dragend', emitPosition)

      map.on('click', function(e) {
        marker.setLngLat(e.lngLat)
        onPick({ lat: e.lngLat.lat, lng: e.lngLat.lng })
      })

      markerRef.current = marker
      mapInstance.current = map

      if (initialLat) emitPosition()
    })

    return function() {
      if (mapInstance.current) {
        mapInstance.current.remove()
        mapInstance.current = null
      }
    }
  }, [])

  function handleSearch(e) {
    e.preventDefault()
    if (!search.trim() || !token) return
    setSearching(true)

    var url = 'https://api.mapbox.com/geocoding/v5/mapbox.places/'
      + encodeURIComponent(search)
      + '.json?country=bd&limit=1&access_token=' + token

    fetch(url)
      .then(function(r) { return r.json() })
      .then(function(data) {
        if (data.features && data.features.length > 0) {
          var coords = data.features[0].center
          var lng = coords[0]
          var lat = coords[1]
          mapInstance.current.flyTo({ center: [lng, lat], zoom: 14 })
          markerRef.current.setLngLat([lng, lat])
          onPick({ lat: lat, lng: lng })
        } else {
          toast.error('Location not found')
        }
      })
      .catch(function() { toast.error('Search failed') })
      .finally(function() { setSearching(false) })
  }

  return (
    <div className="space-y-2">
      <form onSubmit={handleSearch} className="flex gap-2">
        <input
          value={search}
          onChange={function(e) { setSearch(e.target.value) }}
          placeholder="Search location in Bangladesh..."
          className="flex-1 border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-300"
        />
        <button
          type="submit"
          disabled={searching}
          className="px-3 py-2 bg-primary-600 text-white rounded-xl text-sm font-medium hover:bg-primary-700 disabled:opacity-50 flex items-center gap-1"
        >
          {searching ? <Loader size={14} className="animate-spin" /> : <MapPin size={14} />}
          Search
        </button>
      </form>
      <div ref={mapRef} style={{ height: '280px', borderRadius: '12px', overflow: 'hidden' }} />
      <p className="text-xs text-gray-400 text-center">
        Click on map or drag marker to set meeting point
      </p>
    </div>
  )
}

// ─── empty form state ────────────────────────────────────
function emptyForm() {
  return {
    title: '',
    description: '',
    pricePerPerson: '',
    maxPeople: '',
    durationDays: '',
    includesFood: false,
    includesTransport: false,
    includesAccommodation: false,
    additionalIncludes: '',
    meetingPoint: '',
    meetingLat: 0,
    meetingLng: 0,
    placeIds: '',
    isActive: true,
  }
}

// ─── Main Modal ──────────────────────────────────────────
export default function PackageFormModal(props) {
  var isOpen = props.isOpen
  var onClose = props.onClose
  var editPackage = props.editPackage   // null = create, object = edit

  var qc = useQueryClient()
  var user = useAuthStore(function(s) { return s.user })

  var [form, setForm] = useState(emptyForm())
  var [availabilities, setAvailabilities] = useState([])

  // edit mode হলে form pre-fill করো
  useEffect(function() {
    if (!isOpen) return
    if (editPackage) {
      setForm({
        title: editPackage.title || '',
        description: editPackage.description || '',
        pricePerPerson: editPackage.pricePerPerson || '',
        maxPeople: editPackage.maxPeople || '',
        durationDays: editPackage.durationDays || '',
        includesFood: editPackage.includesFood || false,
        includesTransport: editPackage.includesTransport || false,
        includesAccommodation: editPackage.includesAccommodation || false,
        additionalIncludes: editPackage.additionalIncludes || '',
        meetingPoint: editPackage.meetingPoint || '',
        meetingLat: editPackage.meetingLat || 0,
        meetingLng: editPackage.meetingLng || 0,
        placeIds: (editPackage.placeIds || []).join(', '),
        isActive: editPackage.isActive !== false,
      })
      setAvailabilities([])
    } else {
      setForm(emptyForm())
      setAvailabilities([])
    }
  }, [isOpen, editPackage])

  function handleChange(e) {
    var target = e.target
    var value = target.type === 'checkbox' ? target.checked : target.value
    setForm(function(prev) {
      var next = Object.assign({}, prev)
      next[target.name] = value
      return next
    })
  }

  function handleMapPick(coords) {
    setForm(function(prev) {
      return Object.assign({}, prev, { meetingLat: coords.lat, meetingLng: coords.lng })
    })
  }

  function addAvailRow() {
    setAvailabilities(function(prev) {
      return prev.concat({ date: '', maxBookings: 10 })
    })
  }

  function changeAvailRow(idx, key, val) {
    setAvailabilities(function(prev) {
      return prev.map(function(item, i) {
        if (i !== idx) return item
        var next = Object.assign({}, item)
        next[key] = val
        return next
      })
    })
  }

  function removeAvailRow(idx) {
    setAvailabilities(function(prev) {
      return prev.filter(function(_, i) { return i !== idx })
    })
  }

  var isEdit = !!editPackage

  var mutation = useMutation({
    mutationFn: function(payload) {
      if (isEdit) {
        return packageApi.update(editPackage.id, payload)
      }
      return packageApi.create(payload)
    },
    onSuccess: function() {
      toast.success(isEdit ? 'Package updated!' : 'Package created!')
      qc.invalidateQueries({ queryKey: ['my-packages'] })
      onClose()
    },
    onError: function(err) {
      var msg = err.response && err.response.data && err.response.data.message
        ? err.response.data.message
        : 'Action failed'
      toast.error(msg)
    },
  })

  function handleSubmit(e) {
    e.preventDefault()

    if (!form.meetingLat || !form.meetingLng) {
      toast.error('Please pick a meeting point on the map')
      return
    }

    var placeIdList = form.placeIds
      .split(',')
      .map(function(s) { return Number(s.trim()) })
      .filter(function(n) { return !isNaN(n) && n > 0 })

    if (placeIdList.length === 0) {
      toast.error('At least one Place ID is required')
      return
    }

    var validAvails = availabilities.filter(function(a) {
      return a.date && a.maxBookings > 0
    })

    var payload = {
      guideUserId: user.id,
      title: form.title,
      description: form.description,
      pricePerPerson: Number(form.pricePerPerson),
      maxPeople: Number(form.maxPeople),
      durationDays: Number(form.durationDays),
      includesFood: form.includesFood,
      includesTransport: form.includesTransport,
      includesAccommodation: form.includesAccommodation,
      additionalIncludes: form.additionalIncludes || null,
      meetingPoint: form.meetingPoint,
      meetingLat: form.meetingLat,
      meetingLng: form.meetingLng,
      placeIds: placeIdList,
    }

    if (!isEdit) {
      payload.availabilities = validAvails.map(function(a) {
        return { date: a.date, maxBookings: a.maxBookings }
      })
    }

    if (isEdit) {
      payload.packageId = editPackage.id
      payload.isActive = form.isActive
    }

    mutation.mutate(payload)
  }

  if (!isOpen) return null

  var overlayStyle = {
    position: 'fixed',
    inset: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    display: 'flex',
    alignItems: 'flex-start',
    justifyContent: 'center',
    zIndex: 50,
    padding: '24px 16px',
    overflowY: 'auto',
  }

  return (
    <div style={overlayStyle} onClick={function(e) { if (e.target === e.currentTarget) onClose() }}>
      <div className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <h2 className="text-lg font-bold text-gray-900">
            {isEdit ? 'Edit Package' : 'Create New Package'}
          </h2>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-xl transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Title */}
          <InputField label="Package Title" required>
            <input
              name="title"
              value={form.title}
              onChange={handleChange}
              required
              maxLength={200}
              placeholder="e.g. Sundarbans 3-Day Adventure"
              className={inputCls}
            />
          </InputField>

          {/* Description */}
          <InputField label="Description" required>
            <textarea
              name="description"
              value={form.description}
              onChange={handleChange}
              required
              rows={3}
              maxLength={2000}
              placeholder="Describe what this tour includes..."
              className={inputCls}
            />
          </InputField>

          {/* Price + People + Days */}
          <div className="grid grid-cols-3 gap-3">
            <InputField label="Price/Person (৳)" required>
              <input
                type="number"
                name="pricePerPerson"
                value={form.pricePerPerson}
                onChange={handleChange}
                required
                min="1"
                placeholder="2500"
                className={inputCls}
              />
            </InputField>
            <InputField label="Max People" required>
              <input
                type="number"
                name="maxPeople"
                value={form.maxPeople}
                onChange={handleChange}
                required
                min="1"
                max="50"
                placeholder="10"
                className={inputCls}
              />
            </InputField>
            <InputField label="Duration (days)" required>
              <input
                type="number"
                name="durationDays"
                value={form.durationDays}
                onChange={handleChange}
                required
                min="1"
                max="30"
                placeholder="3"
                className={inputCls}
              />
            </InputField>
          </div>

          {/* Inclusions */}
          <div>
            <p className="text-sm font-medium text-gray-700 mb-2">Inclusions</p>
            <div className="flex flex-wrap gap-4">
              <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
                <input
                  type="checkbox"
                  name="includesFood"
                  checked={form.includesFood}
                  onChange={handleChange}
                  className={checkCls}
                />
                Food
              </label>
              <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
                <input
                  type="checkbox"
                  name="includesTransport"
                  checked={form.includesTransport}
                  onChange={handleChange}
                  className={checkCls}
                />
                Transport
              </label>
              <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
                <input
                  type="checkbox"
                  name="includesAccommodation"
                  checked={form.includesAccommodation}
                  onChange={handleChange}
                  className={checkCls}
                />
                Accommodation
              </label>
            </div>
          </div>

          {/* Additional includes */}
          <InputField label="Additional Includes (optional)">
            <input
              name="additionalIncludes"
              value={form.additionalIncludes}
              onChange={handleChange}
              placeholder="e.g. Boat ride, Photography session"
              className={inputCls}
            />
          </InputField>

          {/* Place IDs */}
          <InputField label="Place IDs (comma separated)" required>
            <input
              name="placeIds"
              value={form.placeIds}
              onChange={handleChange}
              placeholder="e.g. 1, 4, 7"
              className={inputCls}
            />
            <p className="text-xs text-gray-400 mt-1">
              Enter the IDs of places included in this tour
            </p>
          </InputField>

          {/* Meeting point name */}
          <InputField label="Meeting Point Name" required>
            <input
              name="meetingPoint"
              value={form.meetingPoint}
              onChange={handleChange}
              required
              placeholder="e.g. Dhaka Airport Gate 2"
              className={inputCls}
            />
          </InputField>

          {/* Mapbox */}
          <div>
            <p className="text-sm font-medium text-gray-700 mb-2">
              Meeting Point on Map
              {form.meetingLat !== 0 && (
                <span className="ml-2 text-xs text-green-600 font-normal">
                  ({form.meetingLat.toFixed(5)}, {form.meetingLng.toFixed(5)})
                </span>
              )}
            </p>
            <MapboxPicker
              onPick={handleMapPick}
              initialLat={form.meetingLat || null}
              initialLng={form.meetingLng || null}
            />
          </div>

          {/* Availabilities (only for create) */}
          {!isEdit && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-medium text-gray-700">Available Dates</p>
                <button
                  type="button"
                  onClick={addAvailRow}
                  className="flex items-center gap-1 text-xs text-primary-600 hover:text-primary-800 font-medium"
                >
                  <Plus size={13} /> Add date
                </button>
              </div>
              {availabilities.length === 0 ? (
                <p className="text-xs text-gray-400 py-2">
                  No dates added yet. You can add availability dates after creating the package too.
                </p>
              ) : (
                <div className="space-y-2">
                  {availabilities.map(function(item, idx) {
                    return (
                      <AvailRow
                        key={idx}
                        item={item}
                        idx={idx}
                        onChange={changeAvailRow}
                        onRemove={removeAvailRow}
                      />
                    )
                  })}
                </div>
              )}
            </div>
          )}

          {/* Active toggle (edit only) */}
          {isEdit && (
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                name="isActive"
                checked={form.isActive}
                onChange={handleChange}
                className={checkCls}
              />
              <span className="text-sm text-gray-700 font-medium">Package is Active</span>
            </label>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-2 border-t">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 border border-gray-200 text-gray-700 rounded-xl py-2 text-sm font-medium hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={mutation.isPending}
              className="flex-1 bg-primary-600 text-white rounded-xl py-2 text-sm font-medium hover:bg-primary-700 disabled:opacity-50 transition-colors"
            >
              {mutation.isPending
                ? (isEdit ? 'Saving...' : 'Creating...')
                : (isEdit ? 'Save Changes' : 'Create Package')}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}