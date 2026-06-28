import { useEffect, useRef, useState } from 'react'
import { MapPin } from 'lucide-react'

const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN

export default function MapLocationPicker({ latitude, longitude, onChange }) {
  const mapContainer = useRef(null)
  const mapRef        = useRef(null)
  const markerRef      = useRef(null)
  const [mapReady, setMapReady] = useState(false)
  const [mapError, setMapError] = useState(null)

  // load mapbox script once
  useEffect(() => {
    if (window.mapboxgl) { setMapReady(true); return }
    if (document.querySelector('script[data-mapbox]')) {
      const check = setInterval(() => {
        if (window.mapboxgl) { setMapReady(true); clearInterval(check) }
      }, 100)
      return () => clearInterval(check)
    }

    const link = document.createElement('link')
    link.rel = 'stylesheet'
    link.href = 'https://api.mapbox.com/mapbox-gl-js/v3.6.0/mapbox-gl.css'
    document.head.appendChild(link)

    const script = document.createElement('script')
    script.src = 'https://api.mapbox.com/mapbox-gl-js/v3.6.0/mapbox-gl.js'
    script.dataset.mapbox = 'true'
    script.onload = () => setMapReady(true)
    script.onerror = () => setMapError('Failed to load map')
    document.head.appendChild(script)
  }, [])

  // init map
  useEffect(() => {
    if (!mapReady || !mapContainer.current || mapRef.current) return
    if (!MAPBOX_TOKEN) { setMapError('Mapbox token missing'); return }

    window.mapboxgl.accessToken = MAPBOX_TOKEN

    const startLng = longitude ? Number(longitude) : 90.4125
    const startLat = latitude ? Number(latitude) : 23.8103

    mapRef.current = new window.mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/streets-v12',
      center: [startLng, startLat],
      zoom: latitude && longitude ? 13 : 6.5,
    })

    mapRef.current.addControl(new window.mapboxgl.NavigationControl(), 'top-right')

    const placeMarker = (lng, lat) => {
      if (markerRef.current) {
        markerRef.current.setLngLat([lng, lat])
      } else {
        const el = document.createElement('div')
        el.style.cssText = `
          width: 30px; height: 30px;
          background: #00956a;
          border-radius: 50% 50% 50% 0;
          transform: rotate(-45deg);
          border: 2px solid white;
          box-shadow: 0 2px 8px rgba(0,0,0,0.3);
        `
        markerRef.current = new window.mapboxgl.Marker({ element: el, draggable: true })
          .setLngLat([lng, lat])
          .addTo(mapRef.current)

        markerRef.current.on('dragend', () => {
          const pos = markerRef.current.getLngLat()
          onChange(pos.lat.toFixed(6), pos.lng.toFixed(6))
        })
      }
    }

    // place initial marker if coords exist
    if (latitude && longitude) {
      placeMarker(startLng, startLat)
    }

    // click on map to place/move marker
    mapRef.current.on('click', (e) => {
      const { lng, lat } = e.lngLat
      placeMarker(lng, lat)
      onChange(lat.toFixed(6), lng.toFixed(6))
    })

    return () => {
      if (mapRef.current) {
        mapRef.current.remove()
        mapRef.current = null
        markerRef.current = null
      }
    }
  }, [mapReady])

  // sync marker if lat/lng changed externally (e.g. "use my location" button)
  useEffect(() => {
    if (!mapRef.current || !latitude || !longitude) return
    const lng = Number(longitude)
    const lat = Number(latitude)

    if (markerRef.current) {
      markerRef.current.setLngLat([lng, lat])
    } else {
      const el = document.createElement('div')
      el.style.cssText = `
        width: 30px; height: 30px;
        background: #00956a;
        border-radius: 50% 50% 50% 0;
        transform: rotate(-45deg);
        border: 2px solid white;
        box-shadow: 0 2px 8px rgba(0,0,0,0.3);
      `
      markerRef.current = new window.mapboxgl.Marker({ element: el, draggable: true })
        .setLngLat([lng, lat])
        .addTo(mapRef.current)

      markerRef.current.on('dragend', () => {
        const pos = markerRef.current.getLngLat()
        onChange(pos.lat.toFixed(6), pos.lng.toFixed(6))
      })
    }
    mapRef.current.flyTo({ center: [lng, lat], zoom: 13, duration: 600 })
  }, [latitude, longitude])

  if (!MAPBOX_TOKEN) {
    return (
      <div className="rounded-xl border border-gray-200 bg-gray-50 p-6 text-center text-sm text-gray-400">
        Mapbox token not configured
      </div>
    )
  }

  return (
    <div>
      <div className="rounded-xl overflow-hidden border border-gray-200" style={{ height: '280px' }}>
        <div ref={mapContainer} style={{ width: '100%', height: '100%' }} />
      </div>
      {mapError && <p className="text-xs text-red-500 mt-1">{mapError}</p>}
      <p className="text-xs text-gray-400 mt-1.5 flex items-center gap-1">
        <MapPin size={11} /> Click on the map or drag the pin to set the exact location
      </p>
    </div>
  )
}