import type { VenueCategory } from './types'

const validVenueCategories = ['nightlife', 'cafes', 'shopping', 'popular'] satisfies VenueCategory[]

const parseDefaultCategory = (value: string | undefined): VenueCategory =>
  validVenueCategories.includes(value as VenueCategory) ? (value as VenueCategory) : 'nightlife'

const parseDefaultResultLimit = (value: string | undefined): number => {
  const parsed = Number(value || 24)
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 24
}

export const siteConfig = {
  name: 'BestTime Nightlife Starter',
  description: 'A Vercel-ready venue discovery app powered by BestTime foot traffic data.',
  siteUrl: process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000',
  bestTimeApiBaseUrl: 'https://besttime.app/api/v1',
  defaultCity: process.env.NEXT_PUBLIC_DEFAULT_CITY || 'new-york',
  defaultCategory: parseDefaultCategory(process.env.NEXT_PUBLIC_DEFAULT_CATEGORY),
  defaultResultLimit: parseDefaultResultLimit(process.env.NEXT_PUBLIC_DEFAULT_RESULT_LIMIT),
  indexPublicPages: process.env.NEXT_PUBLIC_INDEX_PUBLIC_PAGES !== 'false',
  attributionMode: process.env.NEXT_PUBLIC_ATTRIBUTION_MODE || 'subtle'
}

export const hasBestTimeApiKey = () => Boolean(process.env.BESTTIME_API_KEY?.trim())
