import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useMutation } from '@tanstack/react-query'
import { tripPlannerApi } from '../../api/tripPlanner.api'
import { useAuthStore } from '../../store/auth.store'
import PlaceSearchInput from '../../components/places/PlaceSearchInput'
import { formatBDT, formatMinutes, formatKm } from '../../utils/formatters'
import { MapPin, Plus, X, Route, GripVertical } from 'lucide-react'
import toast from 'react-hot-toast'

const TRANSPORT_TYPES = [
  { id: 1, name: 'Bus' },
  { id: 2, name: 'CNG/Auto' },
  { id: 3, name: 'Train' },
  { id: 4, name: 'Private car' },
]

export default function ItineraryBuilderPage() {
  const { user } = useAuthStore()
  const navigate = useNavigate()
  const [title, setTitle] = useState('')
  const [tripDate, setTripDate] = useState('')
  const [startLat, setStartLat] = useState('')
  const [startLng, setStartLng] = useState('')
  const [peopleCount, setPeopleCount] = useState(1)
  const [foodCost, setFoodCost] = useState(300)
  const [stops, setStops] = useState([{ placeId: '', placeName: '', transportTypeId: 1 }])
  const [result, setResult] = useState(null)

  const addStop = () => setStops(prev => [...prev, { placeId: '', placeName: '', transportTypeId: 1 }])
  const removeStop = (idx) => setStops(prev => prev.filter((_, i) => i !== idx))

  const updateStopPlace = (idx, placeId, place) => {
    setStops(prev => prev.map((s, i) =>
      i === idx ? { ...s, placeId, placeName: place?.name || '' } : s
    ))
  }

  const updateStopTransport = (idx, transportTypeId) => {
    setStops(prev => prev.map((s, i) => i === idx ? { ...s, transportTypeId } : s))
  }

  const useMyLocation = () => {
    navigator.geolocation.getCurrentPosition(
      pos => {
        setStartLat(pos.coords.latitude.toFixed(6))
        setStartLng(pos.coords.longitude.toFixed(6))
        toast.success('Start location set')
      },
      () => toast.error('Location access denied')
    )
  }

  const createMutation = useMutation({
    mutationFn: (payload) => tripPlannerApi.createItinerary(payload),
    onSuccess: (res) => {
      setResult(res.data)
      toast.success('Itinerary created!')
    },
    onError: () => toast.error('Failed to create itinerary'),
  })

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!title.trim() || !tripDate || !startLat || !startLng) {
      return toast.error('Please fill all required fields')
    }
    const validStops = stops.filter(s => s.placeId)
    if (validStops.length === 0) {
      return toast.error('Add at least one place to visit')
    }
    const payload = {
      title: title.trim(),
      tripDate: new Date(tripDate).toISOString(),
      startLat: parseFloat(startLat),
      startLng: parseFloat(startLng),
      stops: validStops.map((s, i) => ({
        placeId: Number(s.placeId),
        order: i + 1,
        transportTypeId: Number(s.transportTypeId),
      })),
      foodCostPerPersonPerStop: parseFloat(foodCost) || 0,
      peopleCount: Number(peopleCount),
      userId: user?.id,
    }
    createMutation.mutate(payload)
  }

  if (result) {
    return (
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8">
        <div className="card p-6">
          <h1 className="text-xl font-bold text-gray-900 mb-1">{result.title}</h1>
          <p className="text-sm text-gray-500 mb-6">Your itinerary is ready</p>

          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="bg-primary-50 rounded-xl p-4">
              <p className="text-xs text-gray-500">Total cost</p>
              <p className="text-xl font-bold text-primary-700">{formatBDT(result.estimatedTotalCost)}</p>
            </div>
            <div className="bg-amber-50 rounded-xl p-4">
              <p className="text-xs text-gray-500">Food cost</p>
              <p className="text-xl font-bold text-amber-700">{formatBDT(result.estimatedFoodCost)}</p>
            </div>
          </div>

          <h2 className="font-semibold text-gray-900 mb-3">Stops</h2>
          <div className="space-y-3">
            {result.stops?.map((stop, i) => (
              <div key={i} className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                <div className="w-7 h-7 rounded-full bg-primary-600 text-white flex items-center justify-center text-xs font-bold shrink-0">
                  {stop.order}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm text-gray-900">{stop.placeName}</p>
                  <p className="text-xs text-gray-500">
                    {stop.transportTypeName} · {formatKm(stop.distanceFromPreviousKm)} · {formatMinutes(stop.travelTimeMinutes)}
                  </p>
                </div>
                <p className="text-sm font-semibold text-gray-700 shrink-0">{formatBDT(stop.transportCost)}</p>
              </div>
            ))}
          </div>

          <div className="flex gap-3 mt-6">
            <button onClick={() => navigate(`/trip-planner/itinerary/${result.id}`)} className="btn-primary flex-1">
              View saved itinerary
            </button>
            <button onClick={() => setResult(null)} className="btn-secondary px-6">
              Create another
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8">
      <div className="mb-6">
        <h1 className="text-xl font-bold text-gray-900">Build an itinerary</h1>
        <p className="text-sm text-gray-500 mt-1">Plan a multi-stop trip with cost estimates</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="card p-5 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Trip title *</label>
            <input value={title} onChange={e => setTitle(e.target.value)}
              placeholder="Weekend in Sylhet" className="input" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Trip date *</label>
              <input type="date" value={tripDate} onChange={e => setTripDate(e.target.value)} className="input" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">People count</label>
              <input type="number" min={1} value={peopleCount}
                onChange={e => setPeopleCount(e.target.value)} className="input" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Start latitude *</label>
              <input type="number" step="any" value={startLat}
                onChange={e => setStartLat(e.target.value)} placeholder="23.8103" className="input" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Start longitude *</label>
              <input type="number" step="any" value={startLng}
                onChange={e => setStartLng(e.target.value)} placeholder="90.4125" className="input" />
            </div>
          </div>
          <button type="button" onClick={useMyLocation} className="btn-secondary text-sm flex items-center gap-2 w-fit">
            <MapPin size={15} /> Use my current location
          </button>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Food cost per person, per stop (BDT)</label>
            <input type="number" min={0} value={foodCost} onChange={e => setFoodCost(e.target.value)} className="input" />
          </div>
        </div>

        <div className="card p-5 space-y-3">
          <h2 className="font-semibold text-gray-800 text-sm uppercase tracking-wide">Stops</h2>
          {stops.map((stop, idx) => (
            <div key={idx} className="flex items-start gap-2">
              <div className="flex items-center gap-2 pt-2.5 shrink-0">
                <GripVertical size={14} className="text-gray-300" />
                <span className="w-6 h-6 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center text-xs font-bold">
                  {idx + 1}
                </span>
              </div>
              <div className="flex-1">
                <PlaceSearchInput
                  onChange={(placeId, place) => updateStopPlace(idx, placeId, place)}
                  placeholder="Search a place to visit…"
                />
              </div>
              <select value={stop.transportTypeId}
                onChange={e => updateStopTransport(idx, e.target.value)}
                className="input w-32 shrink-0">
                {TRANSPORT_TYPES.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
              </select>
              {stops.length > 1 && (
                <button type="button" onClick={() => removeStop(idx)} className="p-2 mt-1 text-gray-400 hover:text-red-500 shrink-0">
                  <X size={16} />
                </button>
              )}
            </div>
          ))}
          <button type="button" onClick={addStop} className="btn-secondary text-sm flex items-center gap-1.5 w-fit">
            <Plus size={14} /> Add stop
          </button>
        </div>

        <button type="submit" disabled={createMutation.isPending}
          className="btn-primary w-full text-base py-3 flex items-center justify-center gap-2">
          <Route size={16} />
          {createMutation.isPending ? 'Calculating…' : 'Create itinerary'}
        </button>
      </form>
    </div>
  )
}