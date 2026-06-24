import { render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { allFixtureVenues } from '@/data/fixtures/nyc-nightlife'
import AboutDataPage, { metadata as aboutDataMetadata } from '@/app/(public)/about-data/page'
import NewYorkNightlifePage, { metadata as cityMetadata } from '@/app/(public)/cities/new-york/nightlife/page'
import manifest from '@/app/manifest'
import robots from '@/app/robots'
import sitemap from '@/app/sitemap'
import { JsonLd } from '@/components/seo/JsonLd'
import { canonicalUrl, serializeJsonLd, venueJsonLd } from '@/lib/seo'

afterEach(() => {
  vi.unstubAllEnvs()
})

const escapeRegExp = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

describe('seo helpers', () => {
  const seoFixtureVenue = allFixtureVenues[0]

  it('builds canonical URLs from the configured site URL', () => {
    expect(canonicalUrl('/venues/lower-east-side-cocktail-room')).toBe(
      'http://localhost:3000/venues/lower-east-side-cocktail-room'
    )
    expect(canonicalUrl('venues/lower-east-side-cocktail-room')).toBe(
      'http://localhost:3000/venues/lower-east-side-cocktail-room'
    )
  })

  it('returns LocalBusiness JSON-LD for venues with geo and rating', () => {
    const schema = venueJsonLd(seoFixtureVenue)

    expect(schema).toMatchObject({
      '@context': 'https://schema.org',
      '@type': expect.arrayContaining(['LocalBusiness']),
      name: seoFixtureVenue.name,
      address: seoFixtureVenue.address,
      url: `http://localhost:3000/venues/${seoFixtureVenue.id}`,
      geo: {
        '@type': 'GeoCoordinates',
        latitude: seoFixtureVenue.lat,
        longitude: seoFixtureVenue.lng
      },
      aggregateRating: {
        '@type': 'AggregateRating',
        ratingValue: seoFixtureVenue.rating,
        reviewCount: seoFixtureVenue.reviews
      }
    })
    expect(schema).toMatchObject({ sameAs: 'https://besttime.app' })
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
    const schema = venueJsonLd(seoFixtureVenue)

    render(<JsonLd data={schema} />)

    const script = screen.getByTestId('json-ld')
    expect(script).toHaveAttribute('type', 'application/ld+json')
    expect(JSON.parse(script.textContent || '{}')).toMatchObject({
      name: seoFixtureVenue.name
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

describe('public seo pages', () => {
  it('renders the crawlable city page with fixture venue detail links', () => {
    const firstNightlifeVenue = allFixtureVenues.find(venue => venue.categories.some(category => category === 'nightlife'))
    expect(firstNightlifeVenue).toBeTruthy()

    render(<NewYorkNightlifePage />)

    expect(screen.getByRole('heading', { name: /new york nightlife foot traffic demo/i })).toBeInTheDocument()
    expect(screen.getAllByRole('link', { name: new RegExp(escapeRegExp(firstNightlifeVenue!.name), 'i') })[0]).toHaveAttribute(
      'href',
      `/venues/${firstNightlifeVenue!.id}`
    )
    expect(cityMetadata.alternates).toMatchObject({
      canonical: 'http://localhost:3000/cities/new-york/nightlife'
    })
  })

  it('renders about-data links to public BestTime resources', () => {
    render(<AboutDataPage />)

    expect(screen.getByRole('heading', { name: /about the foot traffic data/i })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'BestTime' })).toHaveAttribute('href', 'https://besttime.app')
    expect(screen.getByRole('link', { name: 'docs' })).toHaveAttribute('href', 'https://besttime.app/api/v1/docs')
    expect(screen.getByRole('link', { name: 'pricing' })).toHaveAttribute('href', 'https://besttime.app/pricing')
    expect(aboutDataMetadata.alternates).toMatchObject({
      canonical: 'http://localhost:3000/about-data'
    })
  })
})

describe('pwa and indexing routes', () => {
  it('returns an installable manifest', () => {
    expect(manifest()).toMatchObject({
      name: 'BestTime Nightlife Starter',
      short_name: 'Nightlife',
      start_url: '/',
      display: 'standalone',
      icons: [
        {
          src: '/icon.svg',
          sizes: 'any',
          type: 'image/svg+xml'
        }
      ]
    })
  })

  it('allows public indexing by default and can disable it by env', () => {
    expect(robots()).toMatchObject({
      rules: {
        userAgent: '*',
        allow: '/'
      },
      sitemap: 'http://localhost:3000/sitemap.xml'
    })

    vi.stubEnv('NEXT_PUBLIC_INDEX_PUBLIC_PAGES', 'false')

    expect(robots()).toMatchObject({
      rules: {
        userAgent: '*',
        disallow: '/'
      }
    })
  })

  it('includes static and fixture venue routes in the sitemap', () => {
    const urls = sitemap().map(entry => entry.url)
    const firstFixtureUrl = `http://localhost:3000/venues/${allFixtureVenues[0].id}`

    expect(urls).toContain('http://localhost:3000/')
    expect(urls).toContain('http://localhost:3000/cities/new-york/nightlife')
    expect(urls).toContain('http://localhost:3000/about-data')
    expect(urls).toContain(firstFixtureUrl)
  })
})
