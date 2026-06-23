import type { Venue, VenueCategory, VenueDay } from '@/lib/types'

const dayLabels = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']

type FixtureVenueInput = {
  id: string
  slug: string
  name: string
  address: string
  lat: number
  lng: number
  categories: VenueCategory[]
  primaryCategory: VenueCategory
  rating: number
  reviews: number
  priceLevel: number
  busyness: number
  liveBusyness?: number
  profile: number[]
  summary: string
}

const buildWeek = (profile: number[]): VenueDay[] =>
  dayLabels.map((dayLabel, dayInt) => {
    const boost = dayInt === 4 || dayInt === 5 ? 12 : dayInt === 6 ? 4 : 0
    const hours = profile.map((value, hour) => ({
      hour,
      busyness: Math.max(0, Math.min(100, value + boost))
    }))
    const peak = hours.reduce((max, current) => (current.busyness > max.busyness ? current : max), hours[0])
    const quiet = hours.reduce((min, current) => (current.busyness < min.busyness ? current : min), hours[0])

    return {
      dayInt,
      dayLabel,
      hours,
      peakHour: peak.hour,
      quietHour: quiet.hour
    }
  })

const nightlifeProfile = [18, 12, 8, 5, 4, 3, 4, 5, 8, 10, 14, 18, 22, 26, 30, 36, 48, 58, 68, 78, 88, 92, 86, 66]
const cafeProfile = [4, 2, 1, 1, 4, 18, 46, 70, 78, 74, 68, 64, 72, 66, 54, 46, 38, 28, 18, 10, 6, 4, 3, 2]
const shoppingProfile = [0, 0, 0, 0, 0, 2, 8, 20, 38, 54, 68, 76, 80, 78, 72, 68, 58, 42, 26, 14, 8, 4, 0, 0]

const makeVenue = ({ profile, ...input }: FixtureVenueInput): Venue => ({
  ...input,
  city: 'New York',
  citySlug: 'new-york',
  liveStatus: input.liveBusyness === undefined ? 'unavailable' : 'available',
  hasFootTraffic: true,
  source: 'fixture',
  week: buildWeek(profile),
  bestTimeUrl: 'https://besttime.app/api/v1/radar/filter'
})

export const nycNightlifeVenues: Venue[] = [
  makeVenue({
    id: 'demo-nyc-bar-1',
    slug: 'lower-east-side-cocktail-room',
    name: 'Lower East Side Cocktail Room',
    address: '128 Ludlow St, New York, NY',
    lat: 40.7209,
    lng: -73.9872,
    categories: ['nightlife', 'popular'],
    primaryCategory: 'nightlife',
    rating: 4.6,
    reviews: 1842,
    priceLevel: 3,
    busyness: 82,
    liveBusyness: 88,
    profile: nightlifeProfile,
    summary: 'A late-night cocktail stop with strong Friday and Saturday peaks.'
  }),
  makeVenue({
    id: 'demo-nyc-bar-2',
    slug: 'bowery-rooftop-lounge',
    name: 'Bowery Rooftop Lounge',
    address: '93 Bowery, New York, NY',
    lat: 40.7172,
    lng: -73.9951,
    categories: ['nightlife', 'popular'],
    primaryCategory: 'nightlife',
    rating: 4.4,
    reviews: 1260,
    priceLevel: 4,
    busyness: 76,
    liveBusyness: 81,
    profile: nightlifeProfile,
    summary: 'A rooftop lounge with dinner-to-drinks traffic and a late evening peak.'
  }),
  makeVenue({
    id: 'demo-nyc-bar-3',
    slug: 'east-village-vinyl-bar',
    name: 'East Village Vinyl Bar',
    address: '219 E 5th St, New York, NY',
    lat: 40.7271,
    lng: -73.9886,
    categories: ['nightlife'],
    primaryCategory: 'nightlife',
    rating: 4.7,
    reviews: 742,
    priceLevel: 2,
    busyness: 64,
    liveBusyness: 59,
    profile: nightlifeProfile,
    summary: 'A music-led bar that stays quieter before 9 PM and fills after midnight.'
  }),
  makeVenue({
    id: 'demo-nyc-bar-4',
    slug: 'soho-supper-club',
    name: 'SoHo Supper Club',
    address: '64 Grand St, New York, NY',
    lat: 40.7216,
    lng: -74.0027,
    categories: ['nightlife', 'popular'],
    primaryCategory: 'nightlife',
    rating: 4.5,
    reviews: 1568,
    priceLevel: 4,
    busyness: 71,
    liveBusyness: 73,
    profile: nightlifeProfile,
    summary: 'A polished supper club with earlier dinner traffic and a second late peak.'
  }),
  makeVenue({
    id: 'demo-nyc-bar-5',
    slug: 'tribeca-wine-room',
    name: 'Tribeca Wine Room',
    address: '31 N Moore St, New York, NY',
    lat: 40.7195,
    lng: -74.0076,
    categories: ['nightlife'],
    primaryCategory: 'nightlife',
    rating: 4.3,
    reviews: 514,
    priceLevel: 3,
    busyness: 55,
    liveBusyness: 48,
    profile: nightlifeProfile,
    summary: 'A calmer wine bar option for date-night and after-work visits.'
  }),
  makeVenue({
    id: 'demo-nyc-bar-6',
    slug: 'chelsea-dance-hall',
    name: 'Chelsea Dance Hall',
    address: '243 W 14th St, New York, NY',
    lat: 40.7394,
    lng: -74.0008,
    categories: ['nightlife', 'popular'],
    primaryCategory: 'nightlife',
    rating: 4.2,
    reviews: 2380,
    priceLevel: 3,
    busyness: 88,
    liveBusyness: 93,
    profile: nightlifeProfile,
    summary: 'A high-volume dance venue with the strongest late Friday night signal.'
  }),
  makeVenue({
    id: 'demo-nyc-cafe-1',
    slug: 'nolita-espresso-counter',
    name: 'Nolita Espresso Counter',
    address: '234 Mott St, New York, NY',
    lat: 40.7232,
    lng: -73.9941,
    categories: ['cafes', 'popular'],
    primaryCategory: 'cafes',
    rating: 4.8,
    reviews: 1984,
    priceLevel: 2,
    busyness: 68,
    liveBusyness: 62,
    profile: cafeProfile,
    summary: 'A compact espresso counter with a strong morning and lunch rush.'
  }),
  makeVenue({
    id: 'demo-nyc-cafe-2',
    slug: 'union-square-coffee-lab',
    name: 'Union Square Coffee Lab',
    address: '36 E 13th St, New York, NY',
    lat: 40.7351,
    lng: -73.9913,
    categories: ['cafes'],
    primaryCategory: 'cafes',
    rating: 4.5,
    reviews: 860,
    priceLevel: 2,
    busyness: 58,
    liveBusyness: 55,
    profile: cafeProfile,
    summary: 'A work-friendly cafe where the busiest window is late morning.'
  }),
  makeVenue({
    id: 'demo-nyc-cafe-3',
    slug: 'west-village-bakery-cafe',
    name: 'West Village Bakery Cafe',
    address: '77 7th Ave S, New York, NY',
    lat: 40.7328,
    lng: -74.0036,
    categories: ['cafes', 'popular'],
    primaryCategory: 'cafes',
    rating: 4.6,
    reviews: 1342,
    priceLevel: 2,
    busyness: 63,
    liveBusyness: 69,
    profile: cafeProfile,
    summary: 'A bakery cafe with brunch-driven weekend traffic.'
  }),
  makeVenue({
    id: 'demo-nyc-shop-1',
    slug: 'soho-sneaker-market',
    name: 'SoHo Sneaker Market',
    address: '113 Spring St, New York, NY',
    lat: 40.7246,
    lng: -74.0017,
    categories: ['shopping', 'popular'],
    primaryCategory: 'shopping',
    rating: 4.4,
    reviews: 1725,
    priceLevel: 3,
    busyness: 72,
    liveBusyness: 66,
    profile: shoppingProfile,
    summary: 'A shopping stop with predictable afternoon peaks and weekend queues.'
  }),
  makeVenue({
    id: 'demo-nyc-shop-2',
    slug: 'flatiron-design-store',
    name: 'Flatiron Design Store',
    address: '928 Broadway, New York, NY',
    lat: 40.7409,
    lng: -73.9901,
    categories: ['shopping'],
    primaryCategory: 'shopping',
    rating: 4.3,
    reviews: 602,
    priceLevel: 3,
    busyness: 46,
    profile: shoppingProfile,
    summary: 'A quieter design shop that works well as a low-crowd demo result.'
  }),
  makeVenue({
    id: 'demo-nyc-shop-3',
    slug: 'meatpacking-weekend-market',
    name: 'Meatpacking Weekend Market',
    address: '88 10th Ave, New York, NY',
    lat: 40.7423,
    lng: -74.0061,
    categories: ['shopping', 'popular'],
    primaryCategory: 'shopping',
    rating: 4.6,
    reviews: 2210,
    priceLevel: 3,
    busyness: 79,
    liveBusyness: 75,
    profile: shoppingProfile,
    summary: 'A market-style retail destination with weekend afternoon surges.'
  })
]

export const allFixtureVenues = nycNightlifeVenues
