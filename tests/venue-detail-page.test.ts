import { afterEach, describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'

vi.mock('server-only', () => ({}))
vi.mock('@/components/map/VenueMap', () => ({
  VenueMap: () => null
}))

import { allFixtureVenues } from '@/data/fixtures/nyc-nightlife'
import VenuePage, { generateMetadata, generateStaticParams } from '@/app/(public)/venues/[venueId]/page'

afterEach(() => {
  vi.unstubAllEnvs()
  vi.unstubAllGlobals()
})

describe('venue detail page route helpers', () => {
  it('generates static params for canonical fixture ids only', async () => {
    const params = await generateStaticParams()
    const venue = allFixtureVenues[0]

    expect(params).toContainEqual({ venueId: venue.id })
    expect(params).not.toContainEqual({ venueId: venue.slug })
  })

  it('generates canonical metadata for slug URLs with the stable venue id', async () => {
    const venue = allFixtureVenues[0]
    const metadata = await generateMetadata({
      params: Promise.resolve({ venueId: venue.slug })
    })

    expect(metadata.title).toContain(venue.name)
    expect(metadata.description).toContain(venue.city)
    expect(metadata.alternates).toMatchObject({
      canonical: `/venues/${venue.id}`
    })
    expect(metadata.openGraph).toMatchObject({
      title: expect.stringContaining(venue.name),
      url: `/venues/${venue.id}`
    })
  })

  it('generates canonical metadata for fixture id URLs with the stable venue id', async () => {
    const venue = allFixtureVenues[0]
    const metadata = await generateMetadata({
      params: Promise.resolve({ venueId: venue.id })
    })

    expect(metadata.title).toContain(venue.name)
    expect(metadata.alternates).toMatchObject({
      canonical: `/venues/${venue.id}`
    })
    expect(metadata.openGraph).toMatchObject({
      url: `/venues/${venue.id}`
    })
  })

  it('resolves live detail metadata by stable BestTime id', async () => {
    vi.stubEnv('BESTTIME_API_KEY', 'pri_live_detail_secret')
    vi.stubGlobal('fetch', vi.fn(async () => new Response(JSON.stringify({
      status: 'OK',
      venue_info: {
        venue_id: 'ven_live_detail_123',
        venue_name: 'Live Detail Room',
        venue_address: '44 Live St, New York, NY',
        venue_type: 'BAR'
      }
    }))))

    const metadata = await generateMetadata({
      params: Promise.resolve({ venueId: 'ven_live_detail_123' })
    })

    expect(metadata.title).toContain('Live Detail Room')
    expect(metadata.alternates).toMatchObject({
      canonical: '/venues/ven_live_detail_123'
    })
    expect(metadata.openGraph).toMatchObject({
      url: '/venues/ven_live_detail_123'
    })
  })

  it('renders static detail labels without build-date today wording', async () => {
    const venue = allFixtureVenues[0]

    render(await VenuePage({
      params: Promise.resolve({ venueId: venue.id })
    }))

    expect(screen.getByText('Forecast peak')).toBeInTheDocument()
    expect(screen.getByText('Quiet forecast')).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Current day forecast' })).toBeInTheDocument()
    expect(screen.getByText('Venue type')).toBeInTheDocument()
    expect(screen.queryByText('Peak today')).not.toBeInTheDocument()
    expect(screen.queryByText('Quiet today')).not.toBeInTheDocument()
  })

  it('links generic BestTime API endpoints to the public BestTime homepage', async () => {
    const venue = allFixtureVenues[0]

    render(await VenuePage({
      params: Promise.resolve({ venueId: venue.id })
    }))

    expect(screen.getByRole('link', { name: 'View BestTime data' })).toHaveAttribute(
      'href',
      'https://besttime.app'
    )
  })
})
