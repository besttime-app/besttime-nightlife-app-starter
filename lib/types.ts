export type VenueCategory = 'nightlife' | 'cafes' | 'shopping' | 'popular'

export type VenueSource = 'fixture' | 'besttime'

export type LiveStatus = 'available' | 'unavailable' | 'not_configured' | 'error'

export type VenueHour = {
  hour: number
  busyness: number
}

export type VenueDay = {
  dayInt: number
  dayLabel: string
  hours: VenueHour[]
  peakHour: number
  quietHour: number
}

export type Venue = {
  id: string
  besttimeVenueId?: string
  slug: string
  name: string
  address: string
  city: string
  citySlug: string
  lat: number
  lng: number
  categories: VenueCategory[]
  primaryCategory: VenueCategory
  venueType?: string
  rating?: number
  reviews?: number
  priceLevel?: number
  busyness: number
  liveBusyness?: number
  liveStatus: LiveStatus
  hasFootTraffic: boolean
  source: VenueSource
  week: VenueDay[]
  summary: string
  bestTimeUrl?: string
}

export type VenueFilters = {
  category: VenueCategory
  quickFilter?: 'busy-now' | 'friday-night' | 'quiet-spots' | 'high-review'
  limit?: number
  lat?: number
  lng?: number
  radius?: number
  dayInt?: number
  hour?: number
}

export type AppMode = 'demo' | 'live'
