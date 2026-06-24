import 'server-only'

import { siteConfig } from '@/lib/config'
import type { VenueFilters } from '@/lib/types'
import { BestTimeError, redactPrivateKey } from './errors'
import { mapBestTimeVenue } from './mappers'

type BestTimeParams = Record<string, string | number | boolean | undefined>

const nycDefaults = {
  lat: 40.72,
  lng: -73.99,
  radius: 6000
}

const categoryTypes: Record<VenueFilters['category'], string | undefined> = {
  nightlife: 'BAR,CLUBS,WINERY,BREWERY,BEER',
  cafes: 'CAFE,COFFEE,BAKERY,TEA',
  shopping: 'SHOPPING,SHOPPING_CENTER,APPAREL,MARKET',
  popular: undefined
}

const appendParams = (url: URL, params: BestTimeParams) => {
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== '') url.searchParams.set(key, String(value))
  })
}

const buildBestTimeUrl = (path: string) => {
  const base = siteConfig.bestTimeApiBaseUrl.replace(/\/+$/, '')
  const normalizedPath = path.replace(/^\/+/, '')

  return new URL(`${base}/${normalizedPath}`)
}

const readJson = async (response: Response) => {
  const text = await response.text()
  if (!text) return null

  try {
    return JSON.parse(text) as unknown
  } catch {
    return { message: text }
  }
}

export const requestBestTime = async (
  path: string,
  params: BestTimeParams = {},
  init: RequestInit = {}
) => {
  const apiKey = process.env.BESTTIME_API_KEY?.trim()
  if (!apiKey) throw new BestTimeError('BESTTIME_API_KEY is not configured')

  const url = buildBestTimeUrl(path)
  appendParams(url, {
    ...params,
    api_key_private: apiKey
  })

  let response: Response
  try {
    response = await fetch(url, {
      ...init,
      cache: 'no-store'
    })
  } catch (error) {
    const details = redactPrivateKey(error, apiKey)
    const message =
      typeof details === 'object' && details && 'message' in details && typeof details.message === 'string'
        ? `BestTime network request failed: ${details.message}`
        : 'BestTime network request failed'

    throw new BestTimeError(message, {
      status: 502,
      details
    })
  }

  const json = redactPrivateKey(await readJson(response), apiKey)
  const status = typeof json === 'object' && json && 'status' in json ? String(json.status).toLowerCase() : undefined
  const message =
    typeof json === 'object' && json && 'message' in json && typeof json.message === 'string'
      ? json.message
      : 'BestTime API request failed'

  if (!response.ok || (status !== undefined && status !== 'ok')) {
    throw new BestTimeError(message, {
      status: response.status,
      details: json
    })
  }

  return json
}

const applyQuickFilter = (params: BestTimeParams, quickFilter: VenueFilters['quickFilter']) => {
  if (quickFilter === 'busy-now') {
    params.now = true
    params.busy_min = 65
    params.order_by = 'now,reviews'
    params.order = 'desc,desc'
  }

  if (quickFilter === 'friday-night') {
    params.day_int = 4
    params.hour_min = 18
    params.hour_max = 23
    params.busy_min = 50
    params.busy_conf = 'any'
    params.order_by = 'day_rank_max,reviews'
    params.order = 'asc,desc'
  }

  if (quickFilter === 'quiet-spots') {
    params.busy_max = 45
    params.busy_conf = 'all'
    params.order_by = 'day_mean,reviews'
    params.order = 'asc,desc'
  }

  if (quickFilter === 'high-review') {
    params.reviews_min = 100
    params.order_by = 'reviews,rating'
    params.order = 'desc,desc'
  }
}

const applyForecastWindow = (params: BestTimeParams, filters: Partial<VenueFilters>) => {
  if (filters.dayInt === undefined && filters.hour === undefined) return

  if (filters.dayInt !== undefined) params.day_int = filters.dayInt
  if (filters.hour !== undefined) {
    params.hour_min = filters.hour
    params.hour_max = filters.hour
  }

  params.busy_conf = 'any'
  params.order_by = 'day_rank_max,reviews'
  params.order = 'asc,desc'
}

export const listBestTimeVenues = async (filters: Partial<VenueFilters> = {}) => {
  const category = filters.category || 'nightlife'
  const params: BestTimeParams = {
    types: categoryTypes[category],
    limit: filters.limit || siteConfig.defaultResultLimit,
    foot_traffic: 'both',
    lat: filters.lat ?? nycDefaults.lat,
    lng: filters.lng ?? nycDefaults.lng,
    radius: filters.radius ?? nycDefaults.radius,
    page: 0,
    own_venues_only: false
  }

  if (filters.quickFilter) {
    applyQuickFilter(params, filters.quickFilter)
  } else {
    applyForecastWindow(params, filters)
  }

  const json = await requestBestTime('/venues/filter', params)
  const venues = typeof json === 'object' && json && 'venues' in json && Array.isArray(json.venues) ? json.venues : []

  return venues.map(venue => mapBestTimeVenue(venue as Record<string, unknown>))
}

export const getBestTimeVenue = async (venueId: string) => {
  const json = await requestBestTime(`/venues/${encodeURIComponent(venueId)}`)
  const venue =
    typeof json === 'object' && json && 'venue' in json
      ? json.venue
      : typeof json === 'object' && json && 'venue_info' in json
        ? json.venue_info
        : json

  return mapBestTimeVenue((venue || {}) as Record<string, unknown>)
}
