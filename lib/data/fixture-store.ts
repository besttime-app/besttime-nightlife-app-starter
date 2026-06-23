import { allFixtureVenues } from '@/data/fixtures/nyc-nightlife'
import type { Venue, VenueCategory, VenueDay, VenueFilters } from '@/lib/types'

const categoryMatches = (venue: Venue, category: VenueCategory) => {
  if (category === 'popular') return venue.categories.includes('popular') || (venue.reviews ?? 0) > 1000
  return venue.categories.includes(category)
}

const cloneWeek = (week: VenueDay[]): VenueDay[] =>
  week.map(day => ({
    ...day,
    hours: day.hours.map(hour => ({ ...hour }))
  }))

const cloneVenue = (venue: Venue): Venue => ({
  ...venue,
  categories: [...venue.categories],
  week: cloneWeek(venue.week)
})

const liveScore = (venue: Venue) => venue.liveBusyness ?? venue.busyness

const compareDesc = (left: number, right: number) => right - left

const compareAsc = (left: number, right: number) => left - right

const compareByName = (a: Venue, b: Venue) => a.name.localeCompare(b.name) || a.id.localeCompare(b.id)

const comparePopularityTiebreakers = (a: Venue, b: Venue) =>
  compareDesc(liveScore(a), liveScore(b)) || compareDesc(a.reviews ?? 0, b.reviews ?? 0) || compareByName(a, b)

const compareQuietTiebreakers = (a: Venue, b: Venue) =>
  compareAsc(liveScore(a), liveScore(b)) || compareDesc(a.reviews ?? 0, b.reviews ?? 0) || compareByName(a, b)

const quickFilterSort = (venues: Venue[], quickFilter: VenueFilters['quickFilter']) => {
  const sorted = [...venues]

  if (quickFilter === 'busy-now') return sorted.sort((a, b) => compareDesc(liveScore(a), liveScore(b)) || comparePopularityTiebreakers(a, b))
  if (quickFilter === 'friday-night') return sorted.sort((a, b) => compareDesc(a.week[4].hours[21].busyness, b.week[4].hours[21].busyness) || comparePopularityTiebreakers(a, b))
  if (quickFilter === 'quiet-spots') return sorted.sort((a, b) => compareAsc(a.busyness, b.busyness) || compareQuietTiebreakers(a, b))
  if (quickFilter === 'high-review') return sorted.sort((a, b) => compareDesc(a.reviews ?? 0, b.reviews ?? 0) || comparePopularityTiebreakers(a, b))

  return sorted
}

export const getFixtureVenues = (filters: Partial<VenueFilters> = {}): Venue[] => {
  const category = filters.category || 'nightlife'
  const limit = filters.limit || 24
  const matches = allFixtureVenues.filter(venue => categoryMatches(venue, category))

  return quickFilterSort(matches, filters.quickFilter).slice(0, limit).map(cloneVenue)
}

export const getFixtureVenueById = (venueId: string): Venue | undefined => {
  const venue = allFixtureVenues.find(venue => venue.id === venueId || venue.slug === venueId || venue.besttimeVenueId === venueId)
  return venue ? cloneVenue(venue) : undefined
}

export const getFixtureWeek = (venueId: string): VenueDay[] | undefined => {
  const venue = allFixtureVenues.find(venue => venue.id === venueId || venue.slug === venueId || venue.besttimeVenueId === venueId)
  return venue ? cloneWeek(venue.week) : undefined
}

export const getFixtureVenueIds = (): string[] => allFixtureVenues.map(venue => venue.id)
