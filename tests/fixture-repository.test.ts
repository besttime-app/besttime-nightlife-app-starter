import { describe, expect, it } from 'vitest'
import { getFixtureVenueById, getFixtureVenues, getFixtureWeek } from '@/lib/data/fixture-store'

describe('fixture store', () => {
  it('returns NYC nightlife venues with forecast data', () => {
    const venues = getFixtureVenues({ category: 'nightlife', limit: 10 })

    expect(venues.length).toBeGreaterThanOrEqual(6)
    expect(venues[0]).toMatchObject({
      citySlug: 'new-york',
      hasFootTraffic: true
    })
    expect(venues.every(venue => venue.week.length === 7)).toBe(true)
  })

  it('filters by category and result limit', () => {
    const cafes = getFixtureVenues({ category: 'cafes', limit: 2 })

    expect(cafes).toHaveLength(2)
    expect(cafes.every(venue => venue.categories.includes('cafes'))).toBe(true)
  })

  it('returns detail data by venue id', () => {
    const venue = getFixtureVenueById('demo-nyc-bar-1')
    const week = getFixtureWeek('demo-nyc-bar-1')

    expect(venue?.name).toBeTruthy()
    expect(week).toHaveLength(7)
    expect(week?.[0].hours).toHaveLength(24)
  })
})
