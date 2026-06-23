import { afterEach, describe, expect, it, vi } from 'vitest'
import { listBestTimeVenues } from '@/lib/besttime/client'
import { mapBestTimeVenue } from '@/lib/besttime/mappers'
import { getVenueRepository } from '@/lib/data/repository'

afterEach(() => {
  vi.unstubAllEnvs()
  vi.unstubAllGlobals()
})

describe('BestTime mapping and repository', () => {
  it('maps BestTime venue filter records without preserving private keys', () => {
    const venue = mapBestTimeVenue({
      venue_id: 'ven_test',
      venue_name: 'Mapped Bar',
      venue_address: '10 Test St, New York, NY',
      venue_lat: 40.72,
      venue_lon: -73.99,
      venue_type: 'BAR',
      rating: 4.4,
      reviews: 321,
      day_raw_whole: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 20, 30, 40, 50, 60, 70, 80, 90, 95, 88, 76, 50, 20],
      api_key_private: 'pri_should_never_leak'
    })

    expect(venue.id).toBe('ven_test')
    expect(JSON.stringify(venue)).not.toContain('pri_should_never_leak')
  })

  it('maps BestTime breweries as nightlife venues', () => {
    const venue = mapBestTimeVenue({
      venue_id: 'ven_brewery',
      venue_name: 'Mapped Brewery',
      venue_type: 'BREWERY'
    })

    expect(venue.primaryCategory).toBe('nightlife')
  })

  it('preserves the API base path and keeps private keys out of mapped venues', async () => {
    vi.stubEnv('BESTTIME_API_KEY', 'pri_test_secret')
    let requestedUrl: URL | undefined
    const fetchMock = vi.fn(async (input: RequestInfo | URL) => {
      requestedUrl = new URL(String(input))

      return new Response(JSON.stringify({
        status: 'OK',
        venues: [{
          venue_id: 'ven_live',
          venue_name: 'Live Bar',
          venue_type: 'BAR',
          day_raw_whole: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 20, 30, 40, 50, 60, 70, 80, 90, 95, 88, 76, 50, 20],
          api_key_private: 'pri_response_should_never_leak'
        }]
      }))
    })
    vi.stubGlobal('fetch', fetchMock)

    const venues = await listBestTimeVenues({ category: 'nightlife', limit: 1 })

    if (!requestedUrl) throw new Error('Expected BestTime fetch to be called')
    expect(requestedUrl.href).toContain('/api/v1/venues/filter')
    expect(requestedUrl.searchParams.get('api_key_private')).toBe('pri_test_secret')
    expect(venues).toHaveLength(1)
    expect(JSON.stringify(venues)).not.toContain('pri_test_secret')
    expect(JSON.stringify(venues)).not.toContain('pri_response_should_never_leak')
  })

  it('uses fixture repository when no API key exists', async () => {
    vi.stubEnv('BESTTIME_API_KEY', '')
    const repository = getVenueRepository()
    const venues = await repository.listVenues({ category: 'nightlife', limit: 3 })

    expect(venues).toHaveLength(3)
    expect(venues.every(venue => venue.source === 'fixture')).toBe(true)
  })
})
