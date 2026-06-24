import { afterEach, describe, expect, it, vi } from 'vitest'

vi.mock('server-only', () => ({}))

import { getBestTimeVenue, listBestTimeVenues } from '@/lib/besttime/client'
import { BestTimeError, redactPrivateKey } from '@/lib/besttime/errors'
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
    expect(venue.venueType).toBe('BAR')
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

  it('maps BestTime hourly arrays from the 6AM forecast window', () => {
    const profile = Array.from({ length: 24 }, () => 5)
    profile[15] = 99

    const venue = mapBestTimeVenue({
      venue_id: 'ven_shifted_hours',
      venue_name: 'Shifted Hours Bar',
      venue_type: 'BAR',
      day_raw_whole: profile
    })

    expect(venue.week[0].hours).toHaveLength(24)
    expect(venue.week[0].hours[0]).toEqual({ hour: 6, busyness: 5 })
    expect(venue.week[0].hours[15]).toEqual({ hour: 21, busyness: 99 })
    expect(venue.week[0].peakHour).toBe(21)
  })

  it('documents the starter week fallback from a single BestTime day profile', () => {
    const profile = Array.from({ length: 24 }, (_, index) => index)

    const venue = mapBestTimeVenue({
      venue_id: 'ven_single_day',
      venue_name: 'Single Day Bar',
      venue_type: 'BAR',
      day_raw_whole: profile
    })

    expect(venue.week).toHaveLength(7)
    expect(venue.week.every(day => day.hours.length === 24)).toBe(true)
    expect(venue.week.map(day => day.dayLabel)).toEqual([
      'Starter Monday (single-day normalized)',
      'Starter Tuesday (single-day normalized)',
      'Starter Wednesday (single-day normalized)',
      'Starter Thursday (single-day normalized)',
      'Starter Friday (single-day normalized)',
      'Starter Saturday (single-day normalized)',
      'Starter Sunday (single-day normalized)'
    ])
    expect(venue.week[0].hours[0]).toEqual({ hour: 6, busyness: 0 })
    expect(venue.week[0].hours[15]).toEqual({ hour: 21, busyness: 15 })
    expect(venue.week[6].hours[23]).toEqual({ hour: 5, busyness: 23 })
  })

  it('maps BestTime venue_info detail responses', async () => {
    vi.stubEnv('BESTTIME_API_KEY', 'pri_detail_secret')
    vi.stubGlobal('fetch', vi.fn(async () => new Response(JSON.stringify({
      status: 'OK',
      venue_info: {
        venue_id: 'ven_detail',
        venue_name: 'Venue Info Bar',
        venue_address: '55 Detail St, New York, NY',
        venue_type: 'BAR'
      }
    }))))

    const venue = await getBestTimeVenue('ven_detail')

    expect(venue).toMatchObject({
      id: 'ven_detail',
      besttimeVenueId: 'ven_detail',
      name: 'Venue Info Bar',
      address: '55 Detail St, New York, NY'
    })
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

    const venues = await listBestTimeVenues({ category: 'nightlife', limit: 1, dayInt: 5, hour: 22 })

    if (!requestedUrl) throw new Error('Expected BestTime fetch to be called')
    expect(requestedUrl.href).toContain('/api/v1/venues/filter')
    expect(requestedUrl.searchParams.get('api_key_private')).toBe('pri_test_secret')
    expect(requestedUrl.searchParams.get('day_int')).toBe('5')
    expect(requestedUrl.searchParams.get('hour_min')).toBe('22')
    expect(requestedUrl.searchParams.get('hour_max')).toBe('22')
    expect(venues).toHaveLength(1)
    expect(JSON.stringify(venues)).not.toContain('pri_test_secret')
    expect(JSON.stringify(venues)).not.toContain('pri_response_should_never_leak')
  })

  it('redacts nested private keys and active secrets', () => {
    const redacted = redactPrivateKey({
      Api_Key_Private: 'pri_object_secret',
      nested: [
        'https://besttime.app/api/v1/venues/filter?api_key_private=plain-secret&limit=1',
        'prefix pri_pattern_secret suffix',
        'plain-secret'
      ]
    }, 'plain-secret')

    expect(JSON.stringify(redacted)).not.toContain('Api_Key_Private')
    expect(JSON.stringify(redacted)).not.toContain('pri_object_secret')
    expect(JSON.stringify(redacted)).not.toContain('plain-secret')
    expect(JSON.stringify(redacted)).not.toContain('pri_pattern_secret')
  })

  it('redacts BestTime error details', async () => {
    vi.stubEnv('BESTTIME_API_KEY', 'plain-active-secret')
    vi.stubGlobal('fetch', vi.fn(async () => new Response(JSON.stringify({
      status: 'error',
      message: 'BestTime rejected api_key_private=plain-active-secret',
      api_key_private: 'plain-active-secret',
      nested: {
        url: 'https://besttime.app/api/v1/venues/filter?API_KEY_PRIVATE=plain-active-secret',
        list: ['pri_nested_secret']
      }
    }), { status: 200 })))

    await expect(listBestTimeVenues({ category: 'nightlife', limit: 1 })).rejects.toMatchObject({
      name: 'BestTimeError'
    })

    try {
      await listBestTimeVenues({ category: 'nightlife', limit: 1 })
    } catch (error) {
      expect(error).toBeInstanceOf(BestTimeError)
      expect(JSON.stringify((error as BestTimeError).details)).not.toContain('plain-active-secret')
      expect(JSON.stringify((error as BestTimeError).details)).not.toContain('pri_nested_secret')
    }
  })

  it('redacts BestTime network failure messages and details', async () => {
    vi.stubEnv('BESTTIME_API_KEY', 'network-secret')
    vi.stubGlobal('fetch', vi.fn(async () => {
      throw new Error('Failed to fetch https://besttime.app/api/v1/venues/filter?api_key_private=network-secret&limit=1')
    }))

    try {
      await listBestTimeVenues({ category: 'nightlife', limit: 1 })
      throw new Error('Expected BestTimeError')
    } catch (error) {
      expect(error).toBeInstanceOf(BestTimeError)
      expect((error as BestTimeError).status).toBe(502)
      expect((error as BestTimeError).message).not.toContain('network-secret')
      expect((error as BestTimeError).message).not.toContain('api_key_private=network-secret')
      expect(JSON.stringify((error as BestTimeError).details)).not.toContain('network-secret')
      expect(JSON.stringify((error as BestTimeError).details)).not.toContain('api_key_private=network-secret')
    }
  })

  it('uses fixture repository when no API key exists', async () => {
    vi.stubEnv('BESTTIME_API_KEY', '')
    const repository = getVenueRepository()
    const venues = await repository.listVenues({ category: 'nightlife', limit: 3 })

    expect(venues).toHaveLength(3)
    expect(venues.every(venue => venue.source === 'fixture')).toBe(true)
  })
})
