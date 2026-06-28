import { useState, useEffect, useRef } from 'react'
import { useQuery } from '@tanstack/react-query'
import { placesApi } from '../../api/places.api'
import { locationsApi } from '../../api/locations.api'
import { Link } from 'react-router-dom'
import { MapPin, Navigation, Star, Ticket } from 'lucide-react'
import { formatBDT } from '../../utils/formatters'
import LoadingSpinner from '../../components/common/LoadingSpinner'

const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN

export default function MapPage() {
  const mapContainer = useRef(null)
  const mapRef        = useRef(null)
  const markersRef    = useRef([])
  const userMarkerRef = useRef(null)

  const [userPos, setUserPos]       = useState(null)
  const [radiusKm, setRadiusKm]     = useState(20)
  const [selected, setSelected]     = useState(null)
  const [mapReady, setMapReady]     = useState(false)
  const [mapError, setMapError]     = useState(null)
  const [divisionId, setDivisionId] = useState('')
  const [districtId, setDistrictId] = useState('')

  // ── location filters ─────────────────────────────────────
  const { data: divisions } = useQuery({
    queryKey: ['divisions'],
    queryFn: () => locationsApi.getDivisions().then(r => r.data),
  })
  const { data: districts } = useQuery({
    queryKey: ['districts', divisionId],
    enabled: !!divisionId,
    queryFn: () => locationsApi.getDistricts(divisionId).then(r => r.data),
  })

  // ── places data ───────────────────────────────────────────
  const { data: nearbyPlaces, isLoading: loadingNearby } = useQuery({
    queryKey: ['nearby', userPos, radiusKm],
    enabled: !!userPos,
    queryFn: () =>
      placesApi.nearby({ lat: userPos.lat, lng: userPos.lng, radiusKm }).then(r => r.data),
  })

  const { data: districtPlaces, isLoading: loadingDistrict } = useQuery({
    queryKey: ['places-district-map', districtId],
    enabled: !!districtId,
    queryFn: () => placesApi.byDistrict(districtId, { pageSize: 50 }).then(r => r.data),
  })

  const places = districtId ? (districtPlaces?.items || []) : (nearbyPlaces || [])
  const isLoading = loadingNearby || loadingDistrict

  // ── load Mapbox GL JS dynamically (once) ─────────────────
  useEffect(() => {
    if (window.mapboxgl) {
      setMapReady(true)
      return
    }
    if (document.querySelector('script[data-mapbox]')) return

    const link = document.createElement('link')
    link.rel = 'stylesheet'
    link.href = 'https://api.mapbox.com/mapbox-gl-js/v3.6.0/mapbox-gl.css'
    document.head.appendChild(link)

    const script = document.createElement('script')
    script.src = 'https://api.mapbox.com/mapbox-gl-js/v3.6.0/mapbox-gl.js'
    script.dataset.mapbox = 'true'
    script.onload = () => setMapReady(true)
    script.onerror = () => setMapError('Failed to load map library')
    document.head.appendChild(script)
  }, [])

  // ── init map (with cleanup for StrictMode / unmount) ─────
  useEffect(() => {
    if (!mapReady || !mapContainer.current || mapRef.current) return

    if (!MAPBOX_TOKEN) {
      setMapError('Mapbox token missing')
      return
    }

    try {
      window.mapboxgl.accessToken = MAPBOX_TOKEN
      mapRef.current = new window.mapboxgl.Map({
        container: mapContainer.current,
        style: 'mapbox://styles/mapbox/streets-v12',
        center: [90.4125, 23.8103], // Bangladesh center [lng, lat]
        zoom: 6.5,
      })
      mapRef.current.addControl(new window.mapboxgl.NavigationControl(), 'top-right')

      // container ar size thik moto calculate hote pore resize call kora
      mapRef.current.on('load', () => {
        mapRef.current?.resize()
      })
      setTimeout(() => {
        mapRef.current?.resize()
      }, 300)

      
    } catch (err) {
      setMapError(err.message)
    }

    return () => {
      if (mapRef.current) {
        mapRef.current.remove()
        mapRef.current = null
      }
    }
  }, [mapReady])

  // ── place markers ─────────────────────────────────────────
  useEffect(() => {
    if (!mapRef.current) return

    markersRef.current.forEach(m => m.remove())
    markersRef.current = []

    if (!places || places.length === 0) return

    const bounds = new window.mapboxgl.LngLatBounds()
    let hasBounds = false

    places.forEach(place => {
      if (!place.latitude || !place.longitude) return

      const el = document.createElement('div')
      el.style.cssText = `
        width: 30px; height: 30px;
        background: #00956a;
        border-radius: 50% 50% 50% 0;
        transform: rotate(-45deg);
        border: 2px solid white;
        box-shadow: 0 2px 8px rgba(0,0,0,0.3);
        cursor: pointer;
        display: flex; align-items: center; justify-content: center;
      `
      const inner = document.createElement('span')
      inner.style.cssText = 'transform: rotate(45deg); font-size: 13px;'
      inner.textContent = '📍'
      el.appendChild(inner)
      el.addEventListener('click', () => setSelected(place))

      const marker = new window.mapboxgl.Marker(el)
        .setLngLat([place.longitude, place.latitude])
        .addTo(mapRef.current)

      markersRef.current.push(marker)
      bounds.extend([place.longitude, place.latitude])
      hasBounds = true
    })

    if (hasBounds) {
      mapRef.current.fitBounds(bounds, { padding: 60, maxZoom: 13, duration: 600 })
    }
  }, [places])

  // ── user location marker ─────────────────────────────────
  useEffect(() => {
    if (!mapRef.current || !userPos) return

    if (userMarkerRef.current) userMarkerRef.current.remove()

    const el = document.createElement('div')
    el.style.cssText = `
      width: 16px; height: 16px; border-radius: 50%;
      background: #3b82f6; border: 3px solid white;
      box-shadow: 0 0 0 4px rgba(59,130,246,0.3);
    `
    userMarkerRef.current = new window.mapboxgl.Marker(el)
      .setLngLat([userPos.lng, userPos.lat])
      .setPopup(new window.mapboxgl.Popup({ offset: 12 }).setText('You are here'))
      .addTo(mapRef.current)

    mapRef.current.flyTo({ center: [userPos.lng, userPos.lat], zoom: 11, duration: 800 })
  }, [userPos])

  const locateMe = () => {
    navigator.geolocation.getCurrentPosition(
      pos => setUserPos({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => alert('Location access denied')
    )
  }

  // ── token missing fallback ───────────────────────────────
  if (!MAPBOX_TOKEN) {
    return (
      <div className="h-[calc(100vh-56px)] flex items-center justify-center text-center px-4">
        <div>
          <MapPin size={32} className="mx-auto mb-3 text-gray-300" />
          <p className="text-gray-500 font-medium">Mapbox token not configured</p>
          <p className="text-sm text-gray-400 mt-1">
            Add <code className="bg-gray-100 px-1.5 py-0.5 rounded">VITE_MAPBOX_TOKEN</code> to your .env file, then restart{' '}
            <code className="bg-gray-100 px-1.5 py-0.5 rounded">npm run dev</code>
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="h-[calc(100vh-56px)] flex flex-col">
      {/* Toolbar */}
      <div className="bg-white border-b border-gray-100 px-4 py-2 flex items-center gap-3 flex-wrap z-10">
        <button onClick={locateMe} className="btn-primary py-1.5 text-sm flex items-center gap-1.5">
          <Navigation size={14} /> Near me
        </button>
        <select value={radiusKm} onChange={e => setRadiusKm(Number(e.target.value))} className="input text-sm h-9 w-28">
          {[5, 10, 20, 50, 100].map(r => <option key={r} value={r}>{r} km</option>)}
        </select>
        <div className="w-px h-6 bg-gray-200" />
        <select value={divisionId} onChange={e => { setDivisionId(e.target.value); setDistrictId('') }} className="input text-sm h-9 w-36">
          <option value="">All divisions</option>
          {divisions?.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
        </select>
        <select value={districtId} onChange={e => setDistrictId(e.target.value)} disabled={!divisionId} className="input text-sm h-9 w-36">
          <option value="">All districts</option>
          {districts?.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
        </select>
        {isLoading && <LoadingSpinner size="sm" />}
        {places.length > 0 && <span className="text-xs text-gray-500 ml-auto">{places.length} places on map</span>}
      </div>

      {/* Map error banner */}
      {mapError && (
        <div className="bg-red-50 border-b border-red-200 px-4 py-2 text-sm text-red-700">
          Map error: {mapError}
        </div>
      )}

      {/* Map */}
      <div className="flex-1 relative" style={{ minHeight: '300px' }}>
        <div
          ref={mapContainer}
          style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, width: '100%', height: '100%' }}
        />

        {selected && (
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-10 w-80">
            <div className="card p-4 shadow-xl relative">
              <button
                onClick={() => setSelected(null)}
                className="absolute top-3 right-3 text-gray-400 hover:text-gray-700 text-lg leading-none"
              >
                ×
              </button>
              {selected.coverPhotoUrl && (
                <img src={selected.coverPhotoUrl} alt={selected.name} className="w-full h-28 object-cover rounded-lg mb-3" />
              )}
              <h3 className="font-semibold text-gray-900">{selected.name}</h3>
              <div className="flex items-center gap-1 mt-1 text-xs text-gray-500">
                <MapPin size={11} /> {selected.districtName}, {selected.divisionName}
              </div>
              <div className="flex items-center justify-between mt-2">
                <div className="flex items-center gap-1 text-xs">
                  <Star size={12} className="fill-amber-400 text-amber-400" />
                  <span>{selected.averageRating?.toFixed(1) || '—'}</span>
                  <span className="text-gray-400">({selected.totalReviews})</span>
                </div>
                <div className="flex items-center gap-1 text-xs text-gray-500">
                  <Ticket size={11} /> {selected.entryFee > 0 ? formatBDT(selected.entryFee) : 'Free'}
                </div>
              </div>
              <Link to={`/places/${selected.id}`} className="btn-primary w-full mt-3 text-sm text-center block py-2">
                View details
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}