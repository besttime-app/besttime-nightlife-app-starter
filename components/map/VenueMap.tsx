'use client'

import { useEffect, useRef, useState } from 'react'
import type { Map, Marker } from 'maplibre-gl'
import type { Venue } from '@/lib/types'
import { createVenueMarkerElement } from '@/components/map/MapMarker'

type VenueMapProps = {
  venue: Venue
  compact?: boolean
}

const mapStyle = 'https://tiles.openfreemap.org/styles/liberty'

export function VenueMap({ compact = false, venue }: VenueMapProps) {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const mapRef = useRef<Map | null>(null)
  const markerRef = useRef<Marker | null>(null)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    let cancelled = false

    async function initializeMap() {
      if (!containerRef.current || mapRef.current) return

      const maplibregl = await import('maplibre-gl')
      if (cancelled || !containerRef.current) return

      const map = new maplibregl.Map({
        container: containerRef.current,
        style: mapStyle,
        center: [venue.lng, venue.lat],
        zoom: 15.6,
        pitch: 58,
        bearing: -22,
        attributionControl: false
      })

      map.addControl(new maplibregl.NavigationControl({ visualizePitch: true }), 'top-right')
      map.addControl(new maplibregl.AttributionControl({ compact: true }), 'bottom-right')
      map.once('load', () => setReady(true))
      mapRef.current = map
    }

    void initializeMap()

    return () => {
      cancelled = true
      markerRef.current?.remove()
      markerRef.current = null
      mapRef.current?.remove()
      mapRef.current = null
      setReady(false)
    }
  }, [venue.lat, venue.lng])

  useEffect(() => {
    let cancelled = false

    async function renderMarker() {
      const map = mapRef.current
      if (!map || !ready) return

      const maplibregl = await import('maplibre-gl')
      if (cancelled) return

      markerRef.current?.remove()
      markerRef.current = new maplibregl.Marker({
        element: createVenueMarkerElement(venue, true),
        anchor: 'center'
      })
        .setLngLat([venue.lng, venue.lat])
        .addTo(map)

      map.easeTo({
        center: [venue.lng, venue.lat],
        zoom: 15.6,
        pitch: 58,
        bearing: -22,
        duration: 500
      })
    }

    void renderMarker()

    return () => {
      cancelled = true
    }
  }, [ready, venue])

  return (
    <div className={`relative w-full overflow-hidden rounded-md border border-slate-200 bg-slate-200 ${compact ? 'h-[260px] min-h-[240px]' : 'h-[360px] min-h-[320px] sm:h-[440px]'}`}>
      <div ref={containerRef} className="h-full w-full" aria-label={`Map centered on ${venue.name}`} />
      <div className="pointer-events-none absolute inset-x-0 top-0 h-20 bg-gradient-to-b from-white/70 to-transparent" />
    </div>
  )
}
