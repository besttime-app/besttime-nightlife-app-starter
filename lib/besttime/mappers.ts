import type { Venue, VenueCategory, VenueDay, VenueHour } from '@/lib/types'

const dayLabels = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
const defaultDayProfile = [8, 5, 3, 2, 2, 3, 6, 12, 20, 30, 42, 50, 58, 55, 50, 48, 52, 60, 70, 76, 82, 78, 58, 30]
const validCategories = ['cafes', 'shopping', 'nightlife', 'popular'] satisfies VenueCategory[]

const getString = (input: Record<string, unknown>, keys: string[], fallback = ''): string => {
  for (const key of keys) {
    const value = input[key]
    if (typeof value === 'string' && value.trim()) return value.trim()
    if (typeof value === 'number' && Number.isFinite(value)) return String(value)
  }

  return fallback
}

const getNumber = (input: Record<string, unknown>, keys: string[]): number | undefined => {
  for (const key of keys) {
    const value = input[key]
    const parsed = typeof value === 'number' ? value : typeof value === 'string' ? Number(value) : NaN
    if (Number.isFinite(parsed)) return parsed
  }

  return undefined
}

const clampBusyness = (value: number) => Math.max(0, Math.min(100, Math.round(value)))

const slugify = (value: string) =>
  value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '') || 'venue'

const normalizeCategory = (input: Record<string, unknown>): VenueCategory => {
  const raw = getString(input, ['primaryCategory', 'category', 'venue_category', 'venue_type', 'type']).toLowerCase()
  if (validCategories.includes(raw as VenueCategory)) return raw as VenueCategory
  if (raw.includes('cafe') || raw.includes('coffee') || raw.includes('bakery') || raw.includes('tea')) return 'cafes'
  if (raw.includes('shop') || raw.includes('store') || raw.includes('apparel') || raw.includes('market')) return 'shopping'
  if (raw.includes('bar') || raw.includes('beer') || raw.includes('brewery') || raw.includes('club') || raw.includes('pub') || raw.includes('night') || raw.includes('wine')) return 'nightlife'

  return 'popular'
}

const normalizeCategories = (input: Record<string, unknown>, primaryCategory: VenueCategory): VenueCategory[] => {
  const categories = new Set<VenueCategory>([primaryCategory])
  const rating = getNumber(input, ['rating'])
  const reviews = getNumber(input, ['reviews'])

  if (primaryCategory !== 'popular' && ((reviews ?? 0) >= 1000 || (rating ?? 0) >= 4.5)) {
    categories.add('popular')
  }

  return [...categories]
}

const isNumberArray = (value: unknown): value is number[] =>
  Array.isArray(value) && value.every(item => typeof item === 'number' || (typeof item === 'string' && Number.isFinite(Number(item))))

const toDayProfile = (value: unknown): number[] | undefined => {
  if (isNumberArray(value)) return value.map(Number).slice(0, 24)

  if (Array.isArray(value)) {
    const firstNumberArray = value.find(isNumberArray)
    if (firstNumberArray) return firstNumberArray.map(Number).slice(0, 24)
  }

  return undefined
}

const normalizeDayProfile = (input: Record<string, unknown>): number[] => {
  const rawProfile = toDayProfile(input.day_raw_whole) || toDayProfile(input.day_raw) || defaultDayProfile
  const profile = rawProfile.map(value => clampBusyness(Number(value)))

  while (profile.length < 24) profile.push(defaultDayProfile[profile.length])

  return profile.slice(0, 24)
}

const buildDay = (profile: number[], dayInt: number): VenueDay => {
  const hours: VenueHour[] = profile.map((busyness, index) => ({
    hour: (index + 6) % 24,
    busyness: clampBusyness(busyness)
  }))
  const peak = hours.reduce((max, current) => (current.busyness > max.busyness ? current : max), hours[0])
  const quiet = hours.reduce((min, current) => (current.busyness < min.busyness ? current : min), hours[0])

  return {
    dayInt,
    dayLabel: dayLabels[dayInt],
    hours,
    peakHour: peak.hour,
    quietHour: quiet.hour
  }
}

const buildWeek = (profile: number[]): VenueDay[] => dayLabels.map((_, dayInt) => buildDay(profile, dayInt))

const averageBusyness = (profile: number[]) =>
  clampBusyness(profile.reduce((total, value) => total + value, 0) / Math.max(profile.length, 1))

export const mapBestTimeVenue = (input: Record<string, unknown>): Venue => {
  const name = getString(input, ['venue_name', 'name'], 'Unknown venue')
  const id = getString(input, ['venue_id', 'id'], slugify(name))
  const besttimeVenueId = getString(input, ['venue_id', 'id'], id)
  const primaryCategory = normalizeCategory(input)
  const categories = normalizeCategories(input, primaryCategory)
  const profile = normalizeDayProfile(input)
  const week = buildWeek(profile)
  const liveBusyness = getNumber(input, ['venue_foot_traffic_live', 'live_busyness', 'liveBusyness'])
  const priceLevel = getNumber(input, ['price_level', 'priceLevel'])
  const busyness = getNumber(input, ['busyness', 'day_mean']) ?? averageBusyness(profile)

  return {
    id,
    besttimeVenueId,
    slug: slugify(name),
    name,
    address: getString(input, ['venue_address', 'address'], 'New York, NY'),
    city: 'New York',
    citySlug: 'new-york',
    lat: getNumber(input, ['venue_lat', 'lat']) ?? 40.7128,
    lng: getNumber(input, ['venue_lng', 'venue_lon', 'lng', 'lon']) ?? -74.006,
    categories,
    primaryCategory,
    rating: getNumber(input, ['rating']),
    reviews: getNumber(input, ['reviews']),
    priceLevel,
    busyness,
    liveBusyness,
    liveStatus: liveBusyness === undefined ? 'unavailable' : 'available',
    hasFootTraffic: true,
    source: 'besttime',
    week,
    summary: `${name} has a ${primaryCategory} foot traffic profile with a peak around ${week[0].peakHour}:00.`,
    bestTimeUrl: 'https://besttime.app/api/v1/venues/filter'
  }
}
