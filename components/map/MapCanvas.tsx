'use client'

import { useEffect, useRef, useState } from 'react'
import type { Map, Marker } from 'maplibre-gl'
import type { Venue } from '@/lib/types'
import { createVenueMarkerElement } from './MapMarker'

type MapCanvasProps = {
  venues: Venue[]
  selectedVenueId?: string
  onSelectVenue: (venueId: string) => void
}

const mapStyle = 'https://tiles.openfreemap.org/styles/liberty'
const defaultCenter: [number, number] = [-73.995, 40.728]

export function MapCanvas({ venues, selectedVenueId, onSelectVenue }: MapCanvasProps) {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const mapRef = useRef<Map | null>(null)
  const markersRef = useRef<Marker[]>([])
  const [mapReady, setMapReady] = useState(false)

  useEffect(() => {
    let cancelled = false

    async function initializeMap() {
      if (!containerRef.current || mapRef.current) return

      const maplibregl = await import('maplibre-gl')
      if (cancelled || !containerRef.current) return

      const map = new maplibregl.Map({
        container: containerRef.current,
        style: mapStyle,
        center: defaultCenter,
        zoom: 12.4,
        pitch: 52,
        bearing: -18,
        attributionControl: false
      })

      map.addControl(new maplibregl.NavigationControl({ visualizePitch: true }), 'top-right')
      map.addControl(new maplibregl.AttributionControl({ compact: true }), 'bottom-right')
      map.once('load', () => {
        setMapReady(true)
      })
      mapRef.current = map
    }

    void initializeMap()

    return () => {
      cancelled = true
      markersRef.current.forEach(marker => marker.remove())
      markersRef.current = []
      mapRef.current?.remove()
      mapRef.current = null
      setMapReady(false)
    }
  }, [])

  useEffect(() => {
    let cancelled = false

    async function renderMarkers() {
      const map = mapRef.current
      if (!map || !mapReady) return

      const maplibregl = await import('maplibre-gl')
      if (cancelled) return

      markersRef.current.forEach(marker => marker.remove())
      markersRef.current = venues.map(venue => {
        const element = createVenueMarkerElement(venue, venue.id === selectedVenueId)
        element.addEventListener('click', () => onSelectVenue(venue.id))

        return new maplibregl.Marker({ element, anchor: 'center' })
          .setLngLat([venue.lng, venue.lat])
          .addTo(map)
      })

      if (venues.length > 1) {
        const bounds = venues.reduce(
          (nextBounds, venue) => nextBounds.extend([venue.lng, venue.lat]),
          new maplibregl.LngLatBounds([venues[0].lng, venues[0].lat], [venues[0].lng, venues[0].lat])
        )
        map.fitBounds(bounds, { padding: 88, maxZoom: 13.8, duration: 650 })
      }
    }

    void renderMarkers()

    return () => {
      cancelled = true
    }
  }, [mapReady, venues, selectedVenueId, onSelectVenue])

  return (
    <div className="relative h-full w-full overflow-hidden bg-slate-200">
      <div ref={containerRef} className="h-full w-full" aria-label="Venue map" />
      <div className="pointer-events-none absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-white/70 to-transparent" />
    </div>
  )
}
