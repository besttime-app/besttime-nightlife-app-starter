import { siteConfig } from '@/lib/config'
import type { Venue } from '@/lib/types'

type JsonLdValue =
  | string
  | number
  | boolean
  | null
  | JsonLdValue[]
  | { [key: string]: JsonLdValue }

export type JsonLdData = { [key: string]: JsonLdValue }

export const canonicalUrl = (path: string) => {
  const base = siteConfig.siteUrl.replace(/\/+$/, '')
  const normalizedPath = path.startsWith('/') ? path : `/${path}`

  return `${base}${normalizedPath}`
}

export const venueJsonLd = (venue: Venue): JsonLdData => {
  const schema: JsonLdData = {
    '@context': 'https://schema.org',
    '@type': ['LocalBusiness', 'BarOrPub'],
    name: venue.name,
    description: venue.summary,
    address: venue.address,
    url: canonicalUrl(`/venues/${venue.slug}`),
    geo: {
      '@type': 'GeoCoordinates',
      latitude: venue.lat,
      longitude: venue.lng
    }
  }

  if (venue.bestTimeUrl) {
    schema.sameAs = venue.bestTimeUrl
  }

  if (venue.rating !== undefined && venue.reviews !== undefined && venue.reviews > 0) {
    schema.aggregateRating = {
      '@type': 'AggregateRating',
      ratingValue: venue.rating,
      reviewCount: venue.reviews
    }
  }

  return schema
}
