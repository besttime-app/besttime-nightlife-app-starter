import type { Venue } from '@/lib/types'

export const dayOptions = [
  { value: 0, label: 'Monday', shortLabel: 'Mon' },
  { value: 1, label: 'Tuesday', shortLabel: 'Tue' },
  { value: 2, label: 'Wednesday', shortLabel: 'Wed' },
  { value: 3, label: 'Thursday', shortLabel: 'Thu' },
  { value: 4, label: 'Friday', shortLabel: 'Fri' },
  { value: 5, label: 'Saturday', shortLabel: 'Sat' },
  { value: 6, label: 'Sunday', shortLabel: 'Sun' }
] as const

export const hourOptions = Array.from({ length: 24 }, (_, hour) => ({
  value: hour,
  label: formatHourLabel(hour)
}))

const titleCase = (value: string) =>
  value
    .toLowerCase()
    .split(/[\s_-]+/)
    .filter(Boolean)
    .map(part => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ')

const inferVenueType = (venue: Venue) => {
  const haystack = `${venue.name} ${venue.summary}`.toLowerCase()

  if (haystack.includes('bakery')) return 'Bakery'
  if (haystack.includes('coffee') || haystack.includes('cafe')) return 'Coffee shop'
  if (haystack.includes('tea')) return 'Tea room'
  if (haystack.includes('brewery')) return 'Brewery'
  if (haystack.includes('wine')) return 'Wine bar'
  if (haystack.includes('club')) return 'Club'
  if (haystack.includes('pub')) return 'Pub'
  if (haystack.includes('bar')) return 'Bar'
  if (haystack.includes('restaurant') || haystack.includes('grill') || haystack.includes('kitchen')) return 'Restaurant'
  if (haystack.includes('mall') || haystack.includes('shopping center')) return 'Shopping center'
  if (haystack.includes('market')) return 'Market'
  if (haystack.includes('store') || haystack.includes('shop')) return 'Store'

  if (venue.primaryCategory === 'cafes') return 'Cafe'
  if (venue.primaryCategory === 'shopping') return 'Shopping'
  if (venue.primaryCategory === 'nightlife') return 'Bar'
  return 'Venue'
}

export function formatHourLabel(hour: number) {
  if (hour === 0) return '12 AM'
  if (hour === 12) return '12 PM'
  return hour > 12 ? `${hour - 12} PM` : `${hour} AM`
}

export function formatCompactHourLabel(hour: number) {
  if (hour === 0) return '12a'
  if (hour === 12) return '12p'
  return hour > 12 ? `${hour - 12}p` : `${hour}a`
}

export function getVenueTypeLabel(venue: Venue) {
  return venue.venueType ? titleCase(venue.venueType) : inferVenueType(venue)
}

export function getForecastHour(venue: Venue, dayInt: number, hour: number) {
  return venue.week.find(day => day.dayInt === dayInt)?.hours.find(dayHour => dayHour.hour === hour)
}

export function getForecastBusyness(venue: Venue, dayInt: number, hour: number) {
  return getForecastHour(venue, dayInt, hour)?.busyness ?? 0
}

export function getDayLabel(dayInt: number) {
  return dayOptions.find(day => day.value === dayInt)?.label ?? 'Selected day'
}
