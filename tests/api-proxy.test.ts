import { describe, expect, it, vi } from 'vitest'
import { mapBestTimeVenue } from '@/lib/besttime/mappers'
import { getVenueRepository } from '@/lib/data/repository'

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

  it('uses fixture repository when no API key exists', async () => {
    vi.stubEnv('BESTTIME_API_KEY', '')
    const repository = getVenueRepository()
    const venues = await repository.listVenues({ category: 'nightlife', limit: 3 })

    expect(venues).toHaveLength(3)
    expect(venues.every(venue => venue.source === 'fixture')).toBe(true)
    vi.unstubAllEnvs()
  })
})
