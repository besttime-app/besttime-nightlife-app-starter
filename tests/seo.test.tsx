import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { allFixtureVenues } from '@/data/fixtures/nyc-nightlife'
import { JsonLd } from '@/components/seo/JsonLd'
import { canonicalUrl, serializeJsonLd, venueJsonLd } from '@/lib/seo'

describe('seo helpers', () => {
  it('builds canonical URLs from the configured site URL', () => {
    expect(canonicalUrl('/venues/lower-east-side-cocktail-room')).toBe(
      'http://localhost:3000/venues/lower-east-side-cocktail-room'
    )
    expect(canonicalUrl('venues/lower-east-side-cocktail-room')).toBe(
      'http://localhost:3000/venues/lower-east-side-cocktail-room'
    )
  })

  it('returns LocalBusiness JSON-LD for venues with geo and rating', () => {
    const schema = venueJsonLd(allFixtureVenues[0])

    expect(schema).toMatchObject({
      '@context': 'https://schema.org',
      '@type': ['LocalBusiness', 'BarOrPub'],
      name: 'Lower East Side Cocktail Room',
      address: '128 Ludlow St, New York, NY',
      url: 'http://localhost:3000/venues/demo-nyc-bar-1',
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
    expect(schema).not.toHaveProperty('sameAs')
  })

  it('keeps sameAs only for public website URLs', () => {
    const schema = venueJsonLd({
      ...allFixtureVenues[0],
      bestTimeUrl: 'https://example.com/lower-east-side-cocktail-room'
    })

    expect(schema).toMatchObject({
      sameAs: 'https://example.com/lower-east-side-cocktail-room'
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

  it('escapes JSON-LD before injecting script HTML', () => {
    const schema = {
      '@context': 'https://schema.org',
      '@type': 'LocalBusiness',
      name: '</script><script>alert("xss")</script>',
      description: 'Line\u2028separator and paragraph\u2029separator & tag <b>'
    }

    const { container } = render(<JsonLd data={schema} />)
    const script = container.querySelector('script[type="application/ld+json"]')

    expect(script?.innerHTML).not.toContain('</script>')
    expect(script?.innerHTML).toContain('\\u003c/script\\u003e\\u003cscript\\u003e')
    expect(script?.innerHTML).toContain('\\u0026')
    expect(script?.innerHTML).toContain('\\u2028')
    expect(script?.innerHTML).toContain('\\u2029')
    expect(JSON.parse(script?.textContent || '{}')).toMatchObject({
      name: '</script><script>alert("xss")</script>'
    })
  })

  it('serializes all JSON-LD script-sensitive characters', () => {
    expect(serializeJsonLd({ text: '<>&\u2028\u2029' })).toBe(
      '{"text":"\\u003c\\u003e\\u0026\\u2028\\u2029"}'
    )
  })
})
