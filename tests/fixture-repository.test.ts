import { afterEach, describe, expect, it, vi } from 'vitest'
import { getFixtureVenueById, getFixtureVenues, getFixtureWeek } from '@/lib/data/fixture-store'

afterEach(() => {
  vi.unstubAllEnvs()
  vi.resetModules()
})

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

  it('filters fixture venues by radius when coordinates are available', () => {
    const nearby = getFixtureVenues({
      category: 'nightlife',
      lat: 40.7209,
      lng: -73.9872,
      radius: 800
    })

    expect(nearby.map(venue => venue.id)).toEqual([
      'demo-nyc-bar-1',
      'demo-nyc-bar-2',
      'demo-nyc-bar-3'
    ])
  })

  it('keeps the default demo radius inert until coordinates are available', () => {
    const venues = getFixtureVenues({ category: 'nightlife', radius: 800 })

    expect(venues.map(venue => venue.id)).toContain('demo-nyc-bar-6')
  })

  it('returns detail data by venue id', () => {
    const venue = getFixtureVenueById('demo-nyc-bar-1')
    const week = getFixtureWeek('demo-nyc-bar-1')

    expect(venue?.name).toBeTruthy()
    expect(week).toHaveLength(7)
    expect(week?.[0].hours).toHaveLength(24)
  })

  it('returns detail data by BestTime venue id', () => {
    const venue = getFixtureVenueById('bt-demo-nyc-bar-1')

    expect(venue).toMatchObject({
      id: 'demo-nyc-bar-1',
      besttimeVenueId: 'bt-demo-nyc-bar-1',
      name: 'Lower East Side Cocktail Room'
    })
  })

  it('sorts busy-now by current busyness', () => {
    const venues = getFixtureVenues({ category: 'nightlife', quickFilter: 'busy-now', limit: 3 })

    expect(venues.map(venue => venue.id)).toEqual(['demo-nyc-bar-6', 'demo-nyc-bar-1', 'demo-nyc-bar-2'])
  })

  it('sorts friday-night with deterministic tie-breakers', () => {
    const venues = getFixtureVenues({ category: 'nightlife', quickFilter: 'friday-night', limit: 3 })
    const fridayNightScores = venues.map(venue => venue.week[4].hours[21].busyness)

    expect(venues.map(venue => venue.id)).toEqual(['demo-nyc-bar-6', 'demo-nyc-bar-1', 'demo-nyc-bar-2'])
    expect(fridayNightScores).toEqual([99, 96, 91])
    expect(fridayNightScores).toEqual([...fridayNightScores].sort((a, b) => b - a))
  })

  it('provides varied friday-night demand for nightlife fixtures', () => {
    const venues = getFixtureVenues({ category: 'nightlife' })
    const fridayNightScores = venues.map(venue => venue.week[4].hours[21].busyness)

    expect(new Set(fridayNightScores).size).toBeGreaterThan(1)
  })

  it('sorts quiet-spots by lower busyness', () => {
    const venues = getFixtureVenues({ category: 'nightlife', quickFilter: 'quiet-spots', limit: 3 })

    expect(venues.map(venue => venue.id)).toEqual(['demo-nyc-bar-5', 'demo-nyc-bar-3', 'demo-nyc-bar-4'])
  })

  it('sorts high-review by review count', () => {
    const venues = getFixtureVenues({ category: 'popular', quickFilter: 'high-review', limit: 3 })

    expect(venues.map(venue => venue.id)).toEqual(['demo-nyc-bar-6', 'demo-nyc-shop-3', 'demo-nyc-cafe-1'])
  })

  it('returns cloned venues and forecast arrays', () => {
    const [venue] = getFixtureVenues({ category: 'nightlife', limit: 1 })
    const originalBusyness = venue.week[0].hours[0].busyness

    venue.categories.push('cafes')
    venue.week[0].hours[0].busyness = 1

    const freshVenue = getFixtureVenueById(venue.id)
    const freshWeek = getFixtureWeek(venue.id)

    expect(freshVenue?.categories).not.toContain('cafes')
    expect(freshVenue?.week[0].hours[0].busyness).toBe(originalBusyness)
    expect(freshWeek?.[0].hours[0].busyness).toBe(originalBusyness)
    expect(freshWeek).not.toBe(freshVenue?.week)
  })
})

describe('site config', () => {
  it('falls back when the default category is invalid', async () => {
    vi.stubEnv('NEXT_PUBLIC_DEFAULT_CATEGORY', 'dinner')

    const { siteConfig } = await import('@/lib/config')

    expect(siteConfig.defaultCategory).toBe('nightlife')
  })

  it('falls back when the default result limit is invalid', async () => {
    vi.stubEnv('NEXT_PUBLIC_DEFAULT_RESULT_LIMIT', '0')

    const { siteConfig } = await import('@/lib/config')

    expect(siteConfig.defaultResultLimit).toBe(24)
  })

  it('trims the BestTime API key before checking availability', async () => {
    vi.stubEnv('BESTTIME_API_KEY', '   ')

    const { hasBestTimeApiKey } = await import('@/lib/config')

    expect(hasBestTimeApiKey()).toBe(false)
  })
})
