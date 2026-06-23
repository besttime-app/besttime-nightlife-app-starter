import type { VenueCategory } from './types'

export const siteConfig = {
  name: 'BestTime Nightlife Starter',
  description: 'A Vercel-ready venue discovery app powered by BestTime foot traffic data.',
  siteUrl: process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000',
  bestTimeApiBaseUrl: 'https://besttime.app/api/v1',
  defaultCity: process.env.NEXT_PUBLIC_DEFAULT_CITY || 'new-york',
  defaultCategory: (process.env.NEXT_PUBLIC_DEFAULT_CATEGORY || 'nightlife') as VenueCategory,
  defaultResultLimit: Number(process.env.NEXT_PUBLIC_DEFAULT_RESULT_LIMIT || 24),
  indexPublicPages: process.env.NEXT_PUBLIC_INDEX_PUBLIC_PAGES !== 'false',
  attributionMode: process.env.NEXT_PUBLIC_ATTRIBUTION_MODE || 'subtle'
}

export const hasBestTimeApiKey = () => Boolean(process.env.BESTTIME_API_KEY)
