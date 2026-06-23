import type { Venue } from '@/lib/types'

export const getMarkerColor = (busyness: number) => {
  if (busyness >= 80) return '#dc2626'
  if (busyness >= 65) return '#d97706'
  if (busyness >= 45) return '#0f766e'
  return '#2563eb'
}

export const createVenueMarkerElement = (venue: Venue, selected: boolean) => {
  const element = document.createElement('button')
  element.type = 'button'
  element.className = `venue-map-marker${selected ? ' is-selected' : ''}`
  element.style.setProperty('--marker-color', getMarkerColor(venue.liveBusyness ?? venue.busyness))
  element.setAttribute('aria-label', `${venue.name}, ${venue.liveBusyness ?? venue.busyness}% busy`)

  return element
}
