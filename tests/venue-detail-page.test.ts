import { afterEach, describe, expect, it, vi } from 'vitest'

vi.mock('server-only', () => ({}))

import { allFixtureVenues } from '@/data/fixtures/nyc-nightlife'
import { generateMetadata, generateStaticParams } from '@/app/(public)/venues/[venueId]/page'

afterEach(() => {
  vi.unstubAllEnvs()
  vi.unstubAllGlobals()
})

describe('venue detail page route helpers', () => {
  it('generates static params for fixture ids and slugs', async () => {
    const params = await generateStaticParams()
    const venue = allFixtureVenues[0]

    expect(params).toContainEqual({ venueId: venue.id })
    expect(params).toContainEqual({ venueId: venue.slug })
  })

  it('generates canonical metadata for slug URLs', async () => {
    const venue = allFixtureVenues[0]
    const metadata = await generateMetadata({
      params: Promise.resolve({ venueId: venue.slug })
    })

    expect(metadata.title).toContain(venue.name)
    expect(metadata.description).toContain(venue.city)
    expect(metadata.alternates).toMatchObject({
      canonical: `/venues/${venue.slug}`
    })
    expect(metadata.openGraph).toMatchObject({
      title: expect.stringContaining(venue.name),
      url: `/venues/${venue.slug}`
    })
  })

  it('generates canonical metadata for fixture id URLs while preserving slug canonicals', async () => {
    const venue = allFixtureVenues[0]
    const metadata = await generateMetadata({
      params: Promise.resolve({ venueId: venue.id })
    })

    expect(metadata.title).toContain(venue.name)
    expect(metadata.alternates).toMatchObject({
      canonical: `/venues/${venue.slug}`
    })
    expect(metadata.openGraph).toMatchObject({
      url: `/venues/${venue.slug}`
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
      canonical: '/venues/live-detail-room'
    })
  })
})
