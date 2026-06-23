import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { NextRequest } from 'next/server'
import { getVenueRepository } from '@/lib/data/repository'
import { GET as getVenues } from '@/app/api/besttime/venues/route'
import { GET as getVenueDetail } from '@/app/api/besttime/venues/[venueId]/route'
import { GET as getLiveVenue } from '@/app/api/besttime/live/[venueId]/route'

vi.mock('server-only', () => ({}))

beforeEach(() => {
  vi.stubEnv('BESTTIME_API_KEY', '')
})

afterEach(() => {
  vi.unstubAllEnvs()
})

describe('route data dependencies', () => {
  it('can load venues for the home route without an API key', async () => {
    const repository = getVenueRepository()
    const venues = await repository.listVenues({ category: 'nightlife', limit: 4 })

    expect(venues).toHaveLength(4)
    expect(repository.mode).toBe('demo')
  })

  it('can load a fixture venue detail', async () => {
    const repository = getVenueRepository()
    const venue = await repository.getVenue('demo-nyc-bar-1')

    expect(venue?.week).toHaveLength(7)
  })

  it('returns fixture venues through the venues route handler', async () => {
    const request = new NextRequest('http://localhost/api/besttime/venues?category=nightlife&limit=2')

    const response = await getVenues(request)
    const body = await response.json()

    expect(response.status).toBe(200)
    expect(body.mode).toBe('demo')
    expect(body.venues).toHaveLength(2)
  })

  it('returns fixture venue detail through the detail route handler', async () => {
    const request = new NextRequest('http://localhost/api/besttime/venues/demo-nyc-bar-1')

    const response = await getVenueDetail(request, { params: Promise.resolve({ venueId: 'demo-nyc-bar-1' }) })
    const body = await response.json()

    expect(response.status).toBe(200)
    expect(body.mode).toBe('demo')
    expect(body.venue.id).toBe('demo-nyc-bar-1')
  })

  it('returns 404 for missing live venue route handler requests', async () => {
    const request = new NextRequest('http://localhost/api/besttime/live/missing-venue')

    const response = await getLiveVenue(request, { params: Promise.resolve({ venueId: 'missing-venue' }) })
    const body = await response.json()

    expect(response.status).toBe(404)
    expect(body.mode).toBe('demo')
    expect(body.error).toBe('Venue not found')
  })
})
