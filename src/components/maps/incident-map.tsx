'use client'
import { useEffect, useRef, useState } from 'react'
import type { IncidentReport } from '@/types'
import { CATEGORY_COLORS } from '@/lib/constants'

interface IncidentMapProps {
  incidents: IncidentReport[]
  onMarkerClick?: (incident: IncidentReport) => void
  height?: string
  onLocationSelect?: (lat: number, lng: number) => void
  selectable?: boolean
  selectedLat?: number
  selectedLng?: number
}

export default function IncidentMap({
  incidents,
  onMarkerClick,
  height = '500px',
  onLocationSelect,
  selectable = false,
  selectedLat,
  selectedLng,
}: IncidentMapProps) {
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<any>(null)
  const markersRef = useRef<any[]>([])
  const selectedMarkerRef = useRef<any>(null)
  const tileLayersRef = useRef<{ street: any; satellite: any } | null>(null)
  const [mapType, setMapType] = useState<'street' | 'satellite'>('street')
  const [mounted, setMounted] = useState(false)

  // Initialize map once
  useEffect(() => {
    setMounted(true)
    return () => {
      // Cleanup on unmount
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove()
        mapInstanceRef.current = null
        tileLayersRef.current = null
      }
    }
  }, [])

  useEffect(() => {
    if (!mounted || !mapRef.current || mapInstanceRef.current) return

    const initMap = async () => {
      const L = (await import('leaflet')).default
      await import('leaflet/dist/leaflet.css')

      // Check if container already has a map
      if ((mapRef.current as any)._leaflet_id) return

      // Fix default icons
      delete (L.Icon.Default.prototype as any)._getIconUrl
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
        iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
        shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
      })

      const map = L.map(mapRef.current!, {
        center: [14.8261, 120.5180], // Barangay Mabiga, Hermosa, Bataan
        zoom: 15,
        zoomControl: true,
        minZoom: 13,   // Don't let user zoom out too far
        maxZoom: 19,
        // Soft boundary around Hermosa, Bataan
        maxBounds: L.latLngBounds(
          [14.75, 120.45], // SW corner
          [14.90, 120.58]  // NE corner
        ),
        maxBoundsViscosity: 0.8, // Gently bounce back if dragged outside
      })

      const streetLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
      }).addTo(map)

      const satelliteLayer = L.tileLayer(
        'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
        { attribution: '© Esri' }
      )

      tileLayersRef.current = { street: streetLayer, satellite: satelliteLayer }
      mapInstanceRef.current = map

      if (selectable) {
        map.on('click', (e: any) => {
          onLocationSelect?.(e.latlng.lat, e.latlng.lng)
        })
      }
    }

    initMap()
  }, [mounted, selectable, onLocationSelect])

  // Toggle tile layers
  useEffect(() => {
    if (!mapInstanceRef.current || !tileLayersRef.current) return
    const map = mapInstanceRef.current
    const { street, satellite } = tileLayersRef.current
    if (mapType === 'satellite') {
      map.removeLayer(street)
      satellite.addTo(map)
    } else {
      map.removeLayer(satellite)
      street.addTo(map)
    }
  }, [mapType])

  // Update incident markers
  useEffect(() => {
    if (!mapInstanceRef.current || !mounted) return

    const updateMarkers = async () => {
      const L = (await import('leaflet')).default
      // Remove old markers
      markersRef.current.forEach(m => {
        try { m.remove() } catch {}
      })
      markersRef.current = []

      incidents.filter(i => i.lat && i.lng).forEach(incident => {
        const color = CATEGORY_COLORS[incident.category_name || ''] || '#6b7280'
        const icon = L.divIcon({
          className: 'custom-marker',
          html: `<div style="background:${color};width:22px;height:22px;border-radius:50% 50% 50% 0;transform:rotate(-45deg);border:2px solid white;box-shadow:0 2px 6px rgba(0,0,0,0.35)"></div>`,
          iconSize: [22, 22],
          iconAnchor: [11, 22],
        })

        const marker = L.marker([incident.lat!, incident.lng!], { icon })
          .bindPopup(`
            <div style="min-width:200px;font-family:sans-serif">
              <strong style="font-size:13px">${incident.title}</strong>
              <p style="font-size:12px;color:#666;margin:6px 0 4px">${incident.ai_summary || incident.description?.slice(0, 100) || ''}...</p>
              <div style="display:flex;gap:6px;flex-wrap:wrap">
                <span style="background:${color}20;color:${color};padding:2px 8px;border-radius:999px;font-size:11px;font-weight:500">${incident.category_name || 'Other'}</span>
                <span style="background:#f3f4f6;color:#374151;padding:2px 8px;border-radius:999px;font-size:11px">${incident.status}</span>
              </div>
            </div>
          `)
          .addTo(mapInstanceRef.current)

        if (onMarkerClick) {
          marker.on('click', () => onMarkerClick(incident))
        }
        markersRef.current.push(marker)
      })

      // Fit bounds if there are markers, otherwise center on Brgy Mabiga
      if (incidents.filter(i => i.lat && i.lng).length > 0 && !selectable) {
        const validIncidents = incidents.filter(i => i.lat && i.lng)
        if (validIncidents.length === 1) {
          mapInstanceRef.current.setView([validIncidents[0].lat!, validIncidents[0].lng!], 16)
        } else if (validIncidents.length > 1) {
          const bounds = L.latLngBounds(validIncidents.map(i => [i.lat!, i.lng!] as [number, number]))
          mapInstanceRef.current.fitBounds(bounds, { padding: [40, 40] })
        }
      } else if (!selectable) {
        // No incidents — reset to Barangay Mabiga center
        mapInstanceRef.current.setView([14.8261, 120.5180], 15)
      }
    }

    updateMarkers()
  }, [incidents, onMarkerClick, mounted, selectable])

  // Selected location marker (for submit form)
  useEffect(() => {
    if (!mapInstanceRef.current || !mounted) return

    const updateSelected = async () => {
      const L = (await import('leaflet')).default
      if (selectedMarkerRef.current) {
        try { selectedMarkerRef.current.remove() } catch {}
        selectedMarkerRef.current = null
      }
      if (selectedLat && selectedLng) {
        const icon = L.divIcon({
          className: 'custom-marker',
          html: `<div style="background:#ef4444;width:20px;height:20px;border-radius:50%;border:3px solid white;box-shadow:0 2px 8px rgba(239,68,68,0.6)"></div>`,
          iconSize: [20, 20],
          iconAnchor: [10, 10],
        })
        selectedMarkerRef.current = L.marker([selectedLat, selectedLng], { icon })
          .bindPopup('Incident location')
          .addTo(mapInstanceRef.current)
        mapInstanceRef.current.setView([selectedLat, selectedLng], 16)
      }
    }

    updateSelected()
  }, [selectedLat, selectedLng, mounted])

  return (
    <div className="relative" style={{ height }}>
      <div ref={mapRef} className="h-full w-full rounded-xl z-0" style={{ minHeight: height }} />

      {/* Map type toggle */}
      <div className="absolute top-3 right-3 z-[400] flex bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden border border-gray-200 dark:border-gray-600">
        <button
          onClick={() => setMapType('street')}
          className={`px-3 py-1.5 text-xs font-medium transition-colors ${
            mapType === 'street'
              ? 'bg-blue-600 text-white'
              : 'text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700'
          }`}
        >
          Street
        </button>
        <button
          onClick={() => setMapType('satellite')}
          className={`px-3 py-1.5 text-xs font-medium transition-colors ${
            mapType === 'satellite'
              ? 'bg-blue-600 text-white'
              : 'text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700'
          }`}
        >
          Satellite
        </button>
      </div>

      {selectable && (
        <div className="absolute bottom-3 left-3 z-[400] bg-white dark:bg-gray-800 rounded-lg shadow px-3 py-2 text-xs text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-600">
          📍 Click on the map to place the incident marker
        </div>
      )}
    </div>
  )
}
