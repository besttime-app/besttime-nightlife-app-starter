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

export const venueDetailPath = (venue: Pick<Venue, 'id'>) => `/venues/${encodeURIComponent(venue.id)}`

export const serializeJsonLd = (data: JsonLdData) =>
  JSON.stringify(data).replace(/[<>&\u2028\u2029]/g, character => {
    switch (character) {
      case '<':
        return '\\u003c'
      case '>':
        return '\\u003e'
      case '&':
        return '\\u0026'
      case '\u2028':
        return '\\u2028'
      case '\u2029':
        return '\\u2029'
      default:
        return character
    }
  })

const isPublicWebsiteUrl = (url: string) => {
  try {
    const parsed = new URL(url)
    const isWebProtocol = parsed.protocol === 'https:' || parsed.protocol === 'http:'
    const isApiEndpoint = parsed.pathname.toLowerCase().startsWith('/api/')

    return isWebProtocol && !isApiEndpoint
  } catch {
    return false
  }
}

export const venueJsonLd = (venue: Venue): JsonLdData => {
  const schema: JsonLdData = {
    '@context': 'https://schema.org',
    '@type': ['LocalBusiness', 'BarOrPub'],
    name: venue.name,
    description: venue.summary,
    address: venue.address,
    url: canonicalUrl(venueDetailPath(venue)),
    geo: {
      '@type': 'GeoCoordinates',
      latitude: venue.lat,
      longitude: venue.lng
    }
  }

  if (venue.bestTimeUrl && isPublicWebsiteUrl(venue.bestTimeUrl)) {
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
