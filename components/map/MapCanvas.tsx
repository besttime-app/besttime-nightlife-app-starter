'use client'

import { useEffect, useRef, useState } from 'react'
import type { GeoJSONSource, Map } from 'maplibre-gl'
import type { Venue } from '@/lib/types'

type MapCanvasProps = {
  venues: Venue[]
  selectedVenueId?: string
  onSelectVenue: (venueId: string) => void
}

const mapStyle = 'https://tiles.openfreemap.org/styles/liberty'
const defaultCenter: [number, number] = [-73.995, 40.728]
const venueSourceId = 'besttime-venues'
const venueLayerId = 'besttime-venue-dots'

type VenueFeatureCollection = {
  type: 'FeatureCollection'
  features: Array<{
    type: 'Feature'
    geometry: {
      type: 'Point'
      coordinates: [number, number]
    }
    properties: {
      id: string
      busyness: number
      selected: boolean
    }
  }>
}

const venueFeatureCollection = (venues: Venue[], selectedVenueId?: string): VenueFeatureCollection => ({
  type: 'FeatureCollection',
  features: venues.map(venue => ({
    type: 'Feature',
    geometry: {
      type: 'Point',
      coordinates: [venue.lng, venue.lat]
    },
    properties: {
      id: venue.id,
      busyness: venue.liveBusyness ?? venue.busyness,
      selected: venue.id === selectedVenueId
    }
  }))
})

export function MapCanvas({ venues, selectedVenueId, onSelectVenue }: MapCanvasProps) {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const mapRef = useRef<Map | null>(null)
  const lastFitVenueIdsRef = useRef('')
  const onSelectVenueRef = useRef(onSelectVenue)
  const [mapReady, setMapReady] = useState(false)

  useEffect(() => {
    onSelectVenueRef.current = onSelectVenue
  }, [onSelectVenue])

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

      const data = venueFeatureCollection(venues, selectedVenueId)
      const source = map.getSource(venueSourceId) as GeoJSONSource | undefined

      if (source) {
        source.setData(data)
      } else {
        map.addSource(venueSourceId, {
          type: 'geojson',
          data
        })
        map.addLayer({
          id: venueLayerId,
          type: 'circle',
          source: venueSourceId,
          paint: {
            'circle-color': [
              'case',
              ['>=', ['get', 'busyness'], 80],
              '#dc2626',
              ['>=', ['get', 'busyness'], 65],
              '#d97706',
              ['>=', ['get', 'busyness'], 45],
              '#0f766e',
              '#2563eb'
            ],
            'circle-opacity': 0.96,
            'circle-pitch-alignment': 'viewport',
            'circle-pitch-scale': 'viewport',
            'circle-radius': ['case', ['boolean', ['get', 'selected'], false], 15, 12],
            'circle-stroke-color': ['case', ['boolean', ['get', 'selected'], false], '#111827', '#ffffff'],
            'circle-stroke-opacity': 1,
            'circle-stroke-width': ['case', ['boolean', ['get', 'selected'], false], 4, 3]
          }
        })
        map.on('click', venueLayerId, event => {
          const venueId = event.features?.[0]?.properties?.id
          if (typeof venueId === 'string') onSelectVenueRef.current(venueId)
        })
        map.on('mouseenter', venueLayerId, () => {
          map.getCanvas().style.cursor = 'pointer'
        })
        map.on('mouseleave', venueLayerId, () => {
          map.getCanvas().style.cursor = ''
        })
      }

      const venueIdsKey = venues.map(venue => venue.id).join('|')
      if (venues.length > 1 && venueIdsKey !== lastFitVenueIdsRef.current) {
        lastFitVenueIdsRef.current = venueIdsKey
        const bounds = venues.reduce(
          (nextBounds, venue) => nextBounds.extend([venue.lng, venue.lat]),
          new maplibregl.LngLatBounds([venues[0].lng, venues[0].lat], [venues[0].lng, venues[0].lat])
        )
        map.fitBounds(bounds, { padding: 88, maxZoom: 13.8, duration: 650 })
      } else if (venues.length === 1 && venueIdsKey !== lastFitVenueIdsRef.current) {
        lastFitVenueIdsRef.current = venueIdsKey
        map.easeTo({ center: [venues[0].lng, venues[0].lat], zoom: 13.8, duration: 650 })
      }
    }

    void renderMarkers()

    return () => {
      cancelled = true
    }
  }, [mapReady, venues, selectedVenueId])

  return (
    <div className="relative h-full w-full overflow-hidden bg-slate-200">
      <div ref={containerRef} className="h-full w-full" aria-label="Venue map" />
      <div className="pointer-events-none absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-white/70 to-transparent" />
    </div>
  )
}
