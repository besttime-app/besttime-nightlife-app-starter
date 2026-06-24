'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, Loader2, Radio } from 'lucide-react'
import { ApiKeySettings } from '@/components/app/ApiKeySettings'
import { Attribution } from '@/components/app/Attribution'
import { VenueMap } from '@/components/map/VenueMap'
import { getBusynessMetric, getVenueDayForDate, VenueDetailPanel } from '@/components/venue/VenueDetailPanel'
import { VenueHeatmap } from '@/components/venue/VenueHeatmap'
import {
  browserApiKeyHeaders,
  browserApiKeysStorageKey,
  hasBrowserPrivateKey,
  hasBrowserPublicKey,
  normalizeBrowserApiKeys,
  parseStoredBrowserApiKeys,
  type BrowserBestTimeApiKeys
} from '@/lib/api-key-overrides'
import { liveDetailVenueStorageKey } from '@/lib/live-detail-storage'
import type { Venue, VenueHour } from '@/lib/types'
import { formatHourLabel, getForecastBusyness, getVenueTypeLabel } from '@/lib/venue-display'

type LiveVenueDetailsPageProps = {
  venueId: string
}

const trendHourOrder = [6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 0, 1, 2, 3, 4, 5]

const getTrendHours = (venue: Venue) => {
  const day = getVenueDayForDate(venue)
  const byHour = new Map(day?.hours.map(hour => [hour.hour, hour]) ?? [])

  return trendHourOrder.map(hour => byHour.get(hour) ?? { hour, busyness: 0 })
}

const peakHour = (hours: VenueHour[]) =>
  hours.reduce((best, hour) => hour.busyness > best.busyness ? hour : best, hours[0] ?? { hour: 0, busyness: 0 })

const readCachedVenue = (venueId: string) => {
  const stored = window.sessionStorage.getItem(liveDetailVenueStorageKey)
  if (!stored) return undefined

  try {
    const parsed = JSON.parse(stored) as Partial<Venue>
    return parsed.id === venueId && parsed.source === 'besttime' && parsed.name ? parsed as Venue : undefined
  } catch {
    return undefined
  }
}

export function LiveVenueDetailsPage({ venueId }: LiveVenueDetailsPageProps) {
  const [apiKeys, setApiKeys] = useState<BrowserBestTimeApiKeys>({})
  const [apiKeyVersion, setApiKeyVersion] = useState(0)
  const [venue, setVenue] = useState<Venue | undefined>()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | undefined>()
  const hasPrivateKey = hasBrowserPrivateKey(apiKeys)
  const hasPublicKey = hasBrowserPublicKey(apiKeys)
  const hasLiveDetailKeys = hasPrivateKey && hasPublicKey
  const visibleError = !hasLiveDetailKeys
    ? 'Add both your private and public BestTime API keys to load live venue details from your browser session.'
    : error

  const saveBrowserApiKeys = useCallback((keys: BrowserBestTimeApiKeys) => {
    const normalizedKeys = normalizeBrowserApiKeys(keys)

    setApiKeys(normalizedKeys)
    window.localStorage.setItem(browserApiKeysStorageKey, JSON.stringify(normalizedKeys))
    setApiKeyVersion(current => current + 1)
  }, [])

  const clearBrowserApiKeys = useCallback(() => {
    setApiKeys({})
    window.localStorage.removeItem(browserApiKeysStorageKey)
    setVenue(undefined)
    setApiKeyVersion(current => current + 1)
  }, [])

  const headers = useMemo(() => browserApiKeyHeaders(apiKeys), [apiKeys])

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const storedKeys = parseStoredBrowserApiKeys(window.localStorage.getItem(browserApiKeysStorageKey))
      const normalizedKeys = normalizeBrowserApiKeys(storedKeys)
      const cachedVenue = readCachedVenue(venueId)

      if (cachedVenue) {
        setVenue(cachedVenue)
      }
      if (!normalizedKeys.privateKey && !normalizedKeys.publicKey) return

      setApiKeys(normalizedKeys)
      setApiKeyVersion(current => current + 1)
    }, 0)

    return () => {
      window.clearTimeout(timer)
    }
  }, [venueId])

  useEffect(() => {
    if (!hasLiveDetailKeys) {
      return
    }

    const controller = new AbortController()
    let timedOut = false
    const timeout = window.setTimeout(() => {
      timedOut = true
      controller.abort()
    }, 15000)

    async function loadVenue() {
      setIsLoading(true)
      setError(undefined)

      try {
        const response = await fetch(`/api/besttime/venues/${encodeURIComponent(venueId)}`, {
          headers,
          signal: controller.signal
        })
        const body = await response.json() as { venue?: Venue; error?: string }

        if (!response.ok || !body.venue) throw new Error(body.error || 'Unable to load live venue details')

        setVenue(body.venue)
      } catch (fetchError) {
        if (controller.signal.aborted && !timedOut) return
        setError(timedOut ? 'Live detail refresh timed out. Showing the venue data loaded from the live results list.' : fetchError instanceof Error ? fetchError.message : 'Unable to load live venue details')
      } finally {
        window.clearTimeout(timeout)
        if (!controller.signal.aborted) setIsLoading(false)
        if (timedOut) setIsLoading(false)
      }
    }

    void loadVenue()

    return () => {
      window.clearTimeout(timeout)
      controller.abort()
    }
  }, [apiKeyVersion, hasLiveDetailKeys, headers, venueId])

  const trendHours = venue ? getTrendHours(venue) : []
  const currentDay = venue ? getVenueDayForDate(venue) : undefined
  const currentHour = new Date().getHours()
  const currentForecast = venue && currentDay ? getForecastBusyness(venue, currentDay.dayInt, currentHour) : 0
  const trendPeak = peakHour(trendHours)
  const busynessMetric = venue ? getBusynessMetric(venue) : undefined

  return (
    <main className="min-h-screen bg-[#eef2f6] text-[#17213a]">
      <div className="mx-auto flex w-full max-w-[1440px] flex-col gap-5 px-4 py-6 sm:px-6 lg:px-8">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Link href="/" className="inline-flex w-fit items-center gap-2 text-sm font-semibold text-slate-600 underline-offset-2 hover:text-slate-950 hover:underline">
            <ArrowLeft aria-hidden="true" className="h-4 w-4" />
            Back to map
          </Link>
          <ApiKeySettings keys={apiKeys} onClear={clearBrowserApiKeys} onSave={saveBrowserApiKeys} />
        </div>

        {isLoading ? (
          <div className="inline-flex items-center gap-2 rounded-[18px] border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-600">
            <Loader2 aria-hidden="true" className="h-4 w-4 animate-spin" />
            Loading live venue details
          </div>
        ) : null}

        {visibleError ? (
          <div className="rounded-[18px] border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold leading-6 text-red-700">
            {visibleError}
          </div>
        ) : null}

        {venue ? (
          <>
            <section className="grid min-w-0 gap-5 lg:grid-cols-[minmax(20rem,0.92fr)_minmax(0,1.88fr)]">
              <VenueDetailPanel detailHref={`/live/venues/${encodeURIComponent(venue.id)}`} venue={venue} />
              <section aria-labelledby="live-trend-heading" className="rounded-[24px] border border-slate-200/80 bg-white/90 p-4 shadow-[0_18px_50px_rgb(22_34_62_/_0.10)] sm:p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h2 id="live-trend-heading" className="text-base font-bold text-[#1d2b4f]">Today&apos;s visitor trend</h2>
                    <p className="mt-1 text-sm text-slate-500">
                      {getVenueTypeLabel(venue)} forecast from the live BestTime API response.
                    </p>
                  </div>
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-bold text-slate-600">
                    <Radio aria-hidden="true" className="h-3.5 w-3.5" />
                    {venue.liveStatus === 'available' ? 'Live' : 'Forecast'}
                  </span>
                </div>

                <div className="mt-6 grid grid-cols-[2.5rem_minmax(0,1fr)] gap-3">
                  <div className="pt-1 text-xs font-semibold text-slate-500">100%</div>
                  <div className="grid h-60 items-end gap-1.5" style={{ gridTemplateColumns: `repeat(${trendHours.length}, minmax(0, 1fr))` }}>
                    {trendHours.map(hour => (
                      <div key={hour.hour} className="flex h-full items-end">
                        <div
                          className={`w-full rounded-t-[3px] ${hour.hour === currentHour ? 'bg-teal-700' : 'bg-blue-400'}`}
                          style={{ height: `${Math.max(0.08, hour.busyness / 100) * 100}%` }}
                          title={`${formatHourLabel(hour.hour)}: ${hour.busyness}% busy`}
                        />
                      </div>
                    ))}
                  </div>
                  <div aria-hidden="true" />
                  <div className="grid grid-cols-5 text-xs font-semibold text-slate-500">
                    <span>6 AM</span>
                    <span>12 PM</span>
                    <span>6 PM</span>
                    <span>12 AM</span>
                    <span>3 AM</span>
                  </div>
                </div>

                <div className="mt-4 grid gap-3 sm:grid-cols-3">
                  <TrendMetric label={busynessMetric?.label || 'Now'} value={busynessMetric?.value || `${currentForecast}%`} />
                  <TrendMetric label="Forecast now" value={`${currentForecast}%`} />
                  <TrendMetric label="Peak" value={formatHourLabel(trendPeak.hour)} />
                </div>
              </section>
            </section>

            <section className="grid min-w-0 items-start gap-5 lg:grid-cols-[minmax(0,1.72fr)_minmax(22rem,0.82fr)]">
              <VenueHeatmap currentDayInt={currentDay?.dayInt} currentHour={currentHour} embedded week={venue.week} />
              <section aria-labelledby="venue-map-heading" className="rounded-[24px] border border-slate-200/80 bg-white/90 p-4 shadow-[0_18px_50px_rgb(22_34_62_/_0.10)]">
                <div className="mb-3 flex items-center justify-between gap-3">
                  <h2 id="venue-map-heading" className="text-base font-bold text-[#1d2b4f]">Venue map</h2>
                  <Attribution />
                </div>
                <VenueMap venue={venue} compact />
              </section>
            </section>
          </>
        ) : null}
      </div>
    </main>
  )
}

function TrendMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[16px] bg-slate-50 px-4 py-3">
      <p className="text-xl font-semibold leading-none text-[#1d2b4f]">{value}</p>
      <p className="mt-1 text-[0.68rem] font-bold uppercase tracking-[0.08em] text-slate-500">{label}</p>
    </div>
  )
}
