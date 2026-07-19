import { useState, useEffect, useRef } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { tripPlannerApi } from '../../api/tripPlanner.api'
import PlaceSearchInput from '../../components/places/PlaceSearchInput'
import LoadingSpinner from '../../components/common/LoadingSpinner'
import { formatBDT, formatMinutes } from '../../utils/formatters'
import {
  Route, Wallet, Clock, Navigation, Users, MapPin,
  Utensils, Bus, ChevronRight, ArrowRight, TrendingUp, CheckCircle2,
} from 'lucide-react'
import toast from 'react-hot-toast'

const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN

const FOOD_LEVELS = [
  { value: 1, label: 'Low',    emoji: '🍛', desc: '~৳150/meal', color: 'border-green-400 bg-green-50 text-green-700' },
  { value: 2, label: 'Medium', emoji: '🍽️', desc: '~৳300/meal', color: 'border-blue-400 bg-blue-50 text-blue-700' },
  { value: 3, label: 'VIP',    emoji: '🥗', desc: '~৳600/meal', color: 'border-purple-400 bg-purple-50 text-purple-700' },
]

// ── Inline Mapbox map component — destination marker only ──
function TripMap({ res }) {
  const mapContainer = useRef(null)
  const mapRef        = useRef(null)
  const [mapReady, setMapReady] = useState(false)

  // load mapbox script once
  useEffect(() => {
    if (window.mapboxgl) { setMapReady(true); return }
    if (document.querySelector('script[data-mapbox]')) {
      const t = setInterval(() => {
        if (window.mapboxgl) { setMapReady(true); clearInterval(t) }
      }, 100)
      return () => clearInterval(t)
    }
    const link = document.createElement('link')
    link.rel = 'stylesheet'
    link.href = 'https://api.mapbox.com/mapbox-gl-js/v3.6.0/mapbox-gl.css'
    document.head.appendChild(link)

    const script = document.createElement('script')
    script.src = 'https://api.mapbox.com/mapbox-gl-js/v3.6.0/mapbox-gl.js'
    script.dataset.mapbox = 'true'
    script.onload = () => setMapReady(true)
    script.onerror = () => console.error('❌ Mapbox script load failed')
    document.head.appendChild(script)
  }, [])

  // destination coords — adjust field names here if your API uses different names
  const destLat = res?.toStandLat ?? res?.destinationLat ?? res?.placeLat
  const destLng = res?.toStandLng ?? res?.destinationLng ?? res?.placeLng
  const destName = res?.placeName || res?.nearestToStand || 'Destination'

  useEffect(() => {
    if (!mapReady || !mapContainer.current || mapRef.current) return

    if (!MAPBOX_TOKEN) {
      console.error('❌ MAPBOX_TOKEN missing — check .env VITE_MAPBOX_TOKEN')
      return
    }
    if (!destLat || !destLng) {
      console.error('❌ Destination coords missing. res object:', res)
      return
    }

    window.mapboxgl.accessToken = MAPBOX_TOKEN

    mapRef.current = new window.mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/streets-v12',
      center: [destLng, destLat],
      zoom: 12,
    })

    mapRef.current.addControl(new window.mapboxgl.NavigationControl(), 'top-right')

    mapRef.current.on('load', () => {
      mapRef.current.resize()

      const el = document.createElement('div')
      el.style.cssText = `
        width:36px;height:36px;border-radius:50% 50% 50% 0;
        background:#10b981;border:2px solid white;
        box-shadow:0 3px 10px rgba(0,0,0,0.3);
        transform:rotate(-45deg);display:flex;
        align-items:center;justify-content:center;
      `
      const inner = document.createElement('span')
      inner.style.cssText = 'transform:rotate(45deg);font-size:16px;'
      inner.textContent = '📍'
      el.appendChild(inner)

      new window.mapboxgl.Marker(el)
        .setLngLat([destLng, destLat])
        .setPopup(new window.mapboxgl.Popup({ offset: 20 }).setText(destName))
        .addTo(mapRef.current)
    })

    // extra safety resize after mount (layout shift, sticky container etc.)
    const resizeTimer = setTimeout(() => mapRef.current?.resize(), 300)

    return () => {
      clearTimeout(resizeTimer)
      if (mapRef.current) { mapRef.current.remove(); mapRef.current = null }
    }
  }, [mapReady, destLat, destLng, destName])

  if (!MAPBOX_TOKEN) {
    return (
      <div className="w-full h-[400px] rounded-2xl border border-amber-200 bg-amber-50 flex items-center justify-center text-sm text-amber-700 p-4 text-center">
        MAPBOX_TOKEN missing — .env file e VITE_MAPBOX_TOKEN set koro
      </div>
    )
  }

  if (!destLat || !destLng) {
    return (
      <div className="w-full h-[400px] rounded-2xl border border-red-200 bg-red-50 flex items-center justify-center text-sm text-red-700 p-4 text-center">
        Destination coordinates not found in response. Check console log for the `res` object.
      </div>
    )
  }

  return (
    <div
      className="relative w-full rounded-2xl overflow-hidden border border-gray-200 shadow-sm"
      style={{ height: '400px' }}
    >
      <div ref={mapContainer} className="absolute inset-0 w-full h-full" />

      {/* distance + destination overlay */}
      <div className="absolute top-3 left-3 z-10 bg-white/95 backdrop-blur-sm rounded-xl shadow-md px-4 py-3 space-y-1.5">
        <div className="flex items-center gap-2 text-sm font-semibold text-gray-900">
          <span className="text-green-600 font-bold">{destName}</span>
        </div>
        {res?.totalTravelTime || res?.totalTravelMinutes ? (
          <div className="flex items-center gap-3 text-xs text-gray-500">
            <span className="flex items-center gap-1">
              <Clock size={11} className="text-purple-500" />
              {res.totalTravelTime || formatMinutes(res.totalTravelMinutes)}
            </span>
          </div>
        ) : null}
      </div>

      {/* legend */}
      <div className="absolute bottom-3 left-3 z-10 bg-white/95 backdrop-blur-sm rounded-xl shadow-md px-3 py-2 space-y-1">
        <div className="flex items-center gap-2 text-xs text-gray-700">
          <div className="w-2.5 h-2.5 rounded-full shrink-0 bg-emerald-500" />
          <span className="truncate max-w-[160px]">{destName}</span>
        </div>
      </div>
    </div>
  )
}

// ── Main page ─────────────────────────────────────────────
export default function TripPlannerPage() {
  const location = useLocation()
  const [selectedPlace, setSelectedPlace] = useState(null)
  const [form, setForm] = useState({
    OriginLat: '', OriginLng: '',
    people: 1, days: 1, foodLevel: 2,
  })
  const [submitted, setSubmitted] = useState(null)
  const [locating, setLocating]   = useState(false)

  // Place Details page sent us here with a destination already chosen
  useEffect(() => {
    if (location.state?.destinationPlace) {
      setSelectedPlace(location.state.destinationPlace)
    }
  }, [location.state])

  const useMyLocation = () => {
    setLocating(true)
    navigator.geolocation.getCurrentPosition(
      pos => {
        setForm(p => ({
          ...p,
          OriginLat: pos.coords.latitude.toFixed(6),
          OriginLng: pos.coords.longitude.toFixed(6),
        }))
        setLocating(false)
        toast.success('Location captured!')
      },
      () => { toast.error('Location access denied'); setLocating(false) }
    )
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!form.OriginLat || !form.OriginLng) return toast.error('Please enter your location')
    if (!selectedPlace) return toast.error('Please select a destination')
    setSubmitted({
      userLat:            parseFloat(form.OriginLat),
      userLng:            parseFloat(form.OriginLng),
      destinationPlaceId: selectedPlace.id,
      people:             Number(form.people) || 1,
      days:               Number(form.days)   || 1,
      foodLevel:          Number(form.foodLevel),
    })
  }

  const { data: res, isLoading, isError, error } = useQuery({
    queryKey: ['smart-budget', JSON.stringify(submitted)],
    enabled:  !!submitted,
    queryFn:  () => tripPlannerApi.smartCalculate(submitted).then(r => r.data),
    retry:    false,
  })

  // debug helper — remove once map is confirmed working
  useEffect(() => {
    if (res) console.log('smartCalculate response:', res)
  }, [res])

  const b = res?.budget

  return (
    <div className="min-h-screen bg-gray-50">

      {/* header */}
      <div className="bg-gradient-to-r from-primary-700 via-primary-600 to-teal-500 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10">
          <div className="flex items-center gap-3 mb-2">
            <Route size={28} className="text-white/80" />
            <h1 className="text-2xl sm:text-3xl font-black">Trip Planner</h1>
          </div>
          <p className="text-white/70 text-sm">Smart cost breakdown with step-by-step directions</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">

        {/* ── no result yet: form centered ── */}
        {!res && (
          <div className="max-w-2xl mx-auto">
            <form onSubmit={handleSubmit}
              className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6 space-y-5">

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  🏔️ Where do you want to go?
                </label>
                <PlaceSearchInput
                  onChange={(id, place) => setSelectedPlace(place)}
                  placeholder="Search a destination…"
                />
                {selectedPlace && (
                  <div className="flex items-center gap-2 mt-2 px-3 py-2 bg-primary-50 rounded-xl text-sm text-primary-700">
                    <MapPin size={14} />
                    <span className="font-medium">{selectedPlace.name}</span>
                    <span className="text-primary-400 text-xs">— {selectedPlace.districtName}</span>
                    {selectedPlace.entryFee > 0 && (
                      <span className="ml-auto text-xs bg-primary-100 px-2 py-0.5 rounded-full">
                        Entry: {formatBDT(selectedPlace.entryFee)}
                      </span>
                    )}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  📍 Your starting location
                </label>
                <div className="flex gap-2">
                  <div className="grid grid-cols-2 gap-2 flex-1">
                    <input type="number" step="any" value={form.OriginLat}
                      onChange={e => setForm(p => ({ ...p, OriginLat: e.target.value }))}
                      placeholder="Latitude  23.8103" className="input text-sm" />
                    <input type="number" step="any" value={form.OriginLng}
                      onChange={e => setForm(p => ({ ...p, OriginLng: e.target.value }))}
                      placeholder="Longitude  90.4125" className="input text-sm" />
                  </div>
                  <button type="button" onClick={useMyLocation} disabled={locating}
                    className="btn-secondary text-sm flex items-center gap-1.5 px-3 shrink-0">
                    {locating
                      ? <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
                      : <Navigation size={15} />}
                    <span className="hidden sm:inline">My location</span>
                  </button>
                </div>
                {form.OriginLat && form.OriginLng && (
                  <p className="text-xs text-gray-400 mt-1.5 flex items-center gap-1">
                    <CheckCircle2 size={11} className="text-green-500" />
                    {parseFloat(form.OriginLat).toFixed(4)}, {parseFloat(form.OriginLng).toFixed(4)}
                  </p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">👥 People</label>
                  <input type="number" min={1} max={50} value={form.people}
                    onChange={e => setForm(p => ({ ...p, people: e.target.value }))}
                    className="input" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">📅 Days</label>
                  <input type="number" min={1} max={30} value={form.days}
                    onChange={e => setForm(p => ({ ...p, days: e.target.value }))}
                    className="input" />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">🍴 Food preference</label>
                <div className="grid grid-cols-3 gap-2">
                  {FOOD_LEVELS.map(fl => (
                    <button key={fl.value} type="button"
                      onClick={() => setForm(p => ({ ...p, foodLevel: fl.value }))}
                      className={`border-2 rounded-xl p-3 text-center transition-all ${
                        form.foodLevel === fl.value ? fl.color : 'border-gray-200 hover:border-gray-300'
                      }`}>
                      <div className="text-xl mb-1">{fl.emoji}</div>
                      <div className="text-sm font-semibold">{fl.label}</div>
                      <div className="text-xs text-gray-400">{fl.desc}</div>
                    </button>
                  ))}
                </div>
              </div>

              <button type="submit"
                className="btn-primary w-full py-3.5 text-base font-bold flex items-center justify-center gap-2">
                <Route size={18} /> Calculate trip cost
              </button>
            </form>

            {isLoading && (
              <div className="bg-white rounded-3xl p-12 text-center border border-gray-100 shadow-sm mt-6">
                <LoadingSpinner center />
                <p className="text-sm text-gray-400 mt-3">Calculating your trip…</p>
              </div>
            )}

            {isError && (
              <div className="bg-red-50 border border-red-200 rounded-2xl p-5 text-sm text-red-700 mt-6 space-y-1">
                <p className="font-semibold">Failed to calculate trip</p>
                <p className="text-red-500 text-xs">
                  {error?.response?.data?.errors?.message ||
                   error?.response?.data?.message ||
                   'No route data available for this destination.'}
                </p>
              </div>
            )}
          </div>
        )}

        {/* ── result: split layout ── */}
        {res && b && !isLoading && (
          <div className="flex flex-col lg:flex-row gap-6">

            {/* LEFT — details panel */}
            <div className="flex-1 min-w-0 space-y-4 order-2 lg:order-1">

              {/* recalculate button */}
              <button onClick={() => setSubmitted(null)}
                className="btn-secondary text-sm flex items-center gap-2 w-fit">
                <Route size={14} /> Plan another trip
              </button>

              {/* overview */}
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="bg-gradient-to-r from-primary-600 to-teal-500 px-5 py-4">
                  <div className="flex items-center justify-between flex-wrap gap-3">
                    <div>
                      <p className="text-white/70 text-xs mb-1">Trip overview</p>
                      <div className="flex items-center gap-2 text-white font-bold">
                        <span>{res.fromDistrict}</span>
                        <ArrowRight size={16} />
                        <span>{res.toDistrict}</span>
                      </div>
                      <p className="text-white/60 text-xs mt-1">
                        {b.people} {b.people > 1 ? 'people' : 'person'}
                        {b.days > 0 && ` · ${b.days} day${b.days > 1 ? 's' : ''}`}
                        {b.foodLevelName && ` · ${b.foodLevelName}`}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-white/70 text-xs">Grand total</p>
                      <p className="text-2xl font-black text-white">{formatBDT(b.grandTotal)}</p>
                      <p className="text-white/70 text-xs">{formatBDT(b.totalPerPerson)} / person</p>
                    </div>
                  </div>
                </div>

                {/* tiles */}
                <div className="grid grid-cols-2 sm:grid-cols-4 divide-x divide-y divide-gray-100">
                  {[
                    { icon: Bus,        label: 'Bus fare',    value: formatBDT(b.busRouteCostPerPerson),  color: 'text-blue-600',    bg: 'bg-blue-50' },
                    { icon: Utensils,   label: 'Food/person', value: formatBDT(b.foodCostPerPerson),      color: 'text-orange-600',  bg: 'bg-orange-50' },
                    { icon: Clock,      label: 'Travel time', value: res.totalTravelTime || formatMinutes(res.totalTravelMinutes), color: 'text-purple-600', bg: 'bg-purple-50' },
                    { icon: TrendingUp, label: 'Per person',  value: formatBDT(b.totalPerPerson),         color: 'text-primary-600', bg: 'bg-primary-50' },
                  ].map(({ icon: Icon, label, value, color, bg }) => (
                    <div key={label} className="p-3">
                      <div className={`w-7 h-7 rounded-lg flex items-center justify-center mb-1.5 ${bg}`}>
                        <Icon size={13} className={color} />
                      </div>
                      <p className="text-xs text-gray-400">{label}</p>
                      <p className={`text-sm font-bold ${color}`}>{value}</p>
                    </div>
                  ))}
                </div>

                {/* breakdown */}
                <div className="px-5 py-3 bg-gray-50 border-t border-gray-100">
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    {[
                      ['To stand',   formatBDT(b.userToStandCostPerPerson)],
                      ['Bus route',  formatBDT(b.busRouteCostPerPerson)],
                      ['Stand→Dest', formatBDT(b.standToDestCostPerPerson)],
                      ['Food level', b.foodLevelName],
                    ].map(([label, val]) => (
                      <div key={label} className="flex justify-between gap-2">
                        <span className="text-gray-400">{label}</span>
                        <span className="font-semibold text-gray-700">{val}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* entry fee */}
              {res.placeEntryFee > 0 && (
                <div className="bg-amber-50 border border-amber-200 rounded-2xl px-4 py-3 flex items-center gap-3 text-sm">
                  <span className="text-xl">🎫</span>
                  <div>
                    <p className="font-semibold text-amber-900">Entry fee: {formatBDT(res.placeEntryFee)} / person</p>
                    <p className="text-amber-600 text-xs">Not included in transport cost above</p>
                  </div>
                </div>
              )}

              {/* route terminals */}
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
                <h3 className="font-bold text-gray-900 mb-3 flex items-center gap-2 text-sm">
                  <MapPin size={14} className="text-primary-600" /> Route terminals
                </h3>
                <div className="flex items-center gap-2">
                  <div className="flex-1 bg-blue-50 rounded-xl p-3">
                    <p className="text-xs text-blue-400 mb-0.5">From</p>
                    <p className="text-sm font-semibold text-blue-700">{res.nearestFromStand}</p>
                  </div>
                  <ArrowRight size={14} className="text-gray-300 shrink-0" />
                  <div className="flex-1 bg-green-50 rounded-xl p-3">
                    <p className="text-xs text-green-400 mb-0.5">To</p>
                    <p className="text-sm font-semibold text-green-700">{res.nearestToStand}</p>
                  </div>
                </div>
              </div>

              {/* steps */}
              {res.steps?.length > 0 && (
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
                  <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2 text-sm">
                    <Route size={14} className="text-primary-600" /> Step-by-step directions
                  </h3>
                  {res.steps.map((step, i) => (
                    <div key={step.stepNumber ?? i} className="flex gap-3">
                      <div className="flex flex-col items-center">
                        <div className="w-7 h-7 rounded-full bg-primary-600 text-white flex items-center justify-center text-xs font-bold shrink-0">
                          {step.stepNumber ?? i + 1}
                        </div>
                        {i < res.steps.length - 1 && (
                          <div className="w-0.5 flex-1 bg-primary-100 my-1" style={{ minHeight: '16px' }} />
                        )}
                      </div>
                      <div className="flex-1 pb-4">
                        <p className="text-sm font-medium text-gray-900 leading-snug">{step.instruction}</p>
                        {step.instructionBn && (
                          <p className="text-xs text-gray-400 mt-0.5 leading-snug">{step.instructionBn}</p>
                        )}
                        <div className="flex gap-2 mt-1.5 flex-wrap">
                          {step.cost != null && (
                            <span className="inline-flex items-center gap-1 text-xs bg-green-50 text-green-700 px-2 py-0.5 rounded-full font-medium">
                              <Wallet size={10} /> {formatBDT(step.cost)}
                            </span>
                          )}
                          {step.timeMinutes != null && (
                            <span className="inline-flex items-center gap-1 text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full font-medium">
                              <Clock size={10} /> {formatMinutes(step.timeMinutes)}
                            </span>
                          )}
                          {step.transportMode && (
                            <span className="text-xs text-gray-400">{step.transportMode}</span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* cost summary */}
              <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-2xl p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Users size={14} className="text-amber-600" />
                  <h3 className="font-bold text-amber-900 text-sm">
                    Full summary · {b.people} {b.people > 1 ? 'people' : 'person'}
                    {b.days > 1 && `, ${b.days} days`}
                  </h3>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    ['Per person',      formatBDT(b.totalPerPerson),          'text-amber-700'],
                    ['Grand total',     formatBDT(b.grandTotal),              'text-orange-700'],
                    ['Transport total', formatBDT(b.transportTotalAllPeople), 'text-blue-700'],
                    ['Food total',      formatBDT(b.foodTotalAllPeople),      'text-green-700'],
                  ].map(([label, val, color]) => (
                    <div key={label} className="bg-white/70 rounded-xl p-3">
                      <p className="text-xs text-gray-400 mb-0.5">{label}</p>
                      <p className={`text-base font-black ${color}`}>{val}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* itinerary CTA */}
              <Link to="/trip-planner/build"
                className="flex items-center justify-between bg-white border border-gray-100 rounded-2xl p-4 hover:shadow-md transition-shadow group shadow-sm">
                <div>
                  <p className="font-bold text-gray-900 text-sm">Build a full multi-stop itinerary</p>
                  <p className="text-xs text-gray-400 mt-0.5">Add multiple places and save your trip</p>
                </div>
                <ChevronRight size={18} className="text-gray-300 group-hover:text-primary-600 transition-colors" />
              </Link>
            </div>

            {/* RIGHT — sticky map */}
            <div className="w-full lg:w-[480px] shrink-0 order-1 lg:order-2">
              <div className="sticky top-20">
                <TripMap res={res} />

                {/* map place info */}
                <div className="mt-3 bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex items-center gap-3">
                  <div className="w-10 h-10 bg-primary-50 rounded-xl flex items-center justify-center shrink-0">
                    <MapPin size={18} className="text-primary-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm text-gray-900 truncate">{res.placeName}</p>
                    <p className="text-xs text-gray-400">
                      {((res.userToStandKm || 0) + (res.standToDestKm || 0)).toFixed(1)} km ·{' '}
                      {res.totalTravelTime}
                    </p>
                  </div>
                  <Link to={`/places/${submitted?.destinationPlaceId}`}
                    className="btn-primary text-xs px-3 py-2 shrink-0">
                    Details
                  </Link>
                </div>
              </div>
            </div>

          </div>
        )}
      </div>
    </div>
  )
}