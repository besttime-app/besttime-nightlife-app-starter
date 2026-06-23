import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { allFixtureVenues } from '@/data/fixtures/nyc-nightlife'
import { JsonLd } from '@/components/seo/JsonLd'
import { canonicalUrl, venueJsonLd } from '@/lib/seo'

describe('seo helpers', () => {
  it('builds canonical URLs from the configured site URL', () => {
    expect(canonicalUrl('/venues/lower-east-side-cocktail-room')).toBe(
      'http://localhost:3000/venues/lower-east-side-cocktail-room'
    )
    expect(canonicalUrl('venues/lower-east-side-cocktail-room')).toBe(
      'http://localhost:3000/venues/lower-east-side-cocktail-room'
    )
  })

  it('returns LocalBusiness JSON-LD for venues with geo, rating, and visible data URL', () => {
    const schema = venueJsonLd(allFixtureVenues[0])

    expect(schema).toMatchObject({
      '@context': 'https://schema.org',
      '@type': ['LocalBusiness', 'BarOrPub'],
      name: 'Lower East Side Cocktail Room',
      address: '128 Ludlow St, New York, NY',
      url: 'http://localhost:3000/venues/lower-east-side-cocktail-room',
      sameAs: 'https://besttime.app/api/v1/radar/filter',
      geo: {
        '@type': 'GeoCoordinates',
        latitude: 40.7209,
        longitude: -73.9872
      },
      aggregateRating: {
        '@type': 'AggregateRating',
        ratingValue: 4.6,
        reviewCount: 1842
      }
    })
  })

  it('renders JSON-LD as an application/ld+json script', () => {
    const schema = venueJsonLd(allFixtureVenues[0])

    render(<JsonLd data={schema} />)

    const script = screen.getByTestId('json-ld')
    expect(script).toHaveAttribute('type', 'application/ld+json')
    expect(JSON.parse(script.textContent || '{}')).toMatchObject({
      name: 'Lower East Side Cocktail Room'
    })
  })
})
