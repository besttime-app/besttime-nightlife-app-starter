import { allFixtureVenues } from '@/data/fixtures/nyc-nightlife'
import type { Venue, VenueCategory, VenueDay, VenueFilters } from '@/lib/types'

const categoryMatches = (venue: Venue, category: VenueCategory) => {
  if (category === 'popular') return venue.categories.includes('popular') || (venue.reviews ?? 0) > 1000
  return venue.categories.includes(category)
}

const quickFilterSort = (venues: Venue[], quickFilter: VenueFilters['quickFilter']) => {
  const sorted = [...venues]

  if (quickFilter === 'busy-now') return sorted.sort((a, b) => (b.liveBusyness ?? b.busyness) - (a.liveBusyness ?? a.busyness))
  if (quickFilter === 'friday-night') return sorted.sort((a, b) => b.week[4].hours[21].busyness - a.week[4].hours[21].busyness)
  if (quickFilter === 'quiet-spots') return sorted.sort((a, b) => a.busyness - b.busyness)
  if (quickFilter === 'high-review') return sorted.sort((a, b) => (b.reviews ?? 0) - (a.reviews ?? 0))

  return sorted
}

export const getFixtureVenues = (filters: Partial<VenueFilters> = {}): Venue[] => {
  const category = filters.category || 'nightlife'
  const limit = filters.limit || 24
  const matches = allFixtureVenues.filter(venue => categoryMatches(venue, category))

  return quickFilterSort(matches, filters.quickFilter).slice(0, limit)
}

export const getFixtureVenueById = (venueId: string): Venue | undefined =>
  allFixtureVenues.find(venue => venue.id === venueId || venue.slug === venueId || venue.besttimeVenueId === venueId)

export const getFixtureWeek = (venueId: string): VenueDay[] | undefined => getFixtureVenueById(venueId)?.week

export const getFixtureVenueIds = (): string[] => allFixtureVenues.map(venue => venue.id)
