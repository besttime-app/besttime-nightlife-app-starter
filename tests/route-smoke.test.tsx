import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { NextRequest } from 'next/server'
import Home from '@/app/page'
import { allFixtureVenues } from '@/data/fixtures/nyc-nightlife'
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
  vi.unstubAllGlobals()
})

describe('route data dependencies', () => {
  it('can load venues for the home route without an API key', async () => {
    const repository = getVenueRepository()
    const venues = await repository.listVenues({ category: 'nightlife', limit: 4 })

    expect(venues).toHaveLength(4)
    expect(repository.mode).toBe('demo')
  })

  it('seeds the home route from fixtures during live-mode builds', () => {
    vi.stubEnv('BESTTIME_API_KEY', 'pri_build_secret')
    const fetchMock = vi.fn()
    vi.stubGlobal('fetch', fetchMock)

    const element = Home()

    expect(fetchMock).not.toHaveBeenCalled()
    expect(element.props.initialMode).toBe('live')
    expect(element.props.initialVenues[0].source).toBe('fixture')
  })

  it('can load a fixture venue detail', async () => {
    const repository = getVenueRepository()
    const venue = await repository.getVenue(allFixtureVenues[0].id)

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

  it('redacts live-mode route errors from the venues route handler', async () => {
    const secret = 'pri_route_smoke_secret'
    vi.stubEnv('BESTTIME_API_KEY', secret)
    vi.stubGlobal('fetch', vi.fn(async () => {
      throw new Error(`BestTime failed for api_key_private=${secret}`)
    }))

    const request = new NextRequest('http://localhost/api/besttime/venues?category=nightlife&limit=2')

    const response = await getVenues(request)
    const body = await response.json()
    const bodyText = JSON.stringify(body)

    expect(response.status).toBe(502)
    expect(body.mode).toBe('live')
    expect(body.error).toBeTruthy()
    expect(bodyText).not.toContain(secret)
    expect(bodyText).not.toContain(`api_key_private=${secret}`)
  })

  it('accepts browser-provided private key overrides without returning the key', async () => {
    const browserSecret = 'pri_browser_route_secret'
    let requestedUrl: URL | undefined
    vi.stubGlobal('fetch', vi.fn(async (input: RequestInfo | URL) => {
      requestedUrl = new URL(String(input))

      return new Response(JSON.stringify({
        status: 'OK',
        venues: [{
          venue_id: 'ven_browser_route',
          venue_name: 'Browser Route Bar',
          venue_type: 'BAR',
          api_key_private: browserSecret
        }]
      }))
    }))

    const request = new NextRequest('http://localhost/api/besttime/venues?category=nightlife&limit=1', {
      headers: {
        'x-besttime-api-key-private': browserSecret,
        'x-besttime-api-key-public': 'pub_browser_route_secret'
      }
    })

    const response = await getVenues(request)
    const body = await response.json()
    const bodyText = JSON.stringify(body)

    expect(response.status).toBe(200)
    expect(body.mode).toBe('live')
    expect(body.venues).toHaveLength(1)
    expect(requestedUrl?.searchParams.get('api_key_private')).toBe(browserSecret)
    expect(bodyText).not.toContain(browserSecret)
    expect(bodyText).not.toContain('pub_browser_route_secret')
  })

  it('returns fixture venue detail through the detail route handler', async () => {
    const fixtureVenue = allFixtureVenues[0]
    const request = new NextRequest(`http://localhost/api/besttime/venues/${fixtureVenue.id}`)

    const response = await getVenueDetail(request, { params: Promise.resolve({ venueId: fixtureVenue.id }) })
    const body = await response.json()

    expect(response.status).toBe(200)
    expect(body.mode).toBe('demo')
    expect(body.venue.id).toBe(fixtureVenue.id)
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
