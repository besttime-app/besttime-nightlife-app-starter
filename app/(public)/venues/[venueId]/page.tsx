import type { Metadata } from 'next'
import type { ReactNode } from 'react'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import {
  Activity,
  ArrowLeft,
  Bookmark,
  Clock3,
  Compass,
  ExternalLink,
  Hash,
  Layers,
  MapPin,
  Radio,
  Star,
  Tag,
  Timer
} from 'lucide-react'
import { Attribution } from '@/components/app/Attribution'
import { VenueMap } from '@/components/map/VenueMap'
import { JsonLd } from '@/components/seo/JsonLd'
import { getBusynessMetric, getRepresentativeVenueDay, getVenueDayForDate } from '@/components/venue/VenueDetailPanel'
import { VenueHeatmap } from '@/components/venue/VenueHeatmap'
import { getFixtureVenueById, getFixtureVenueIds } from '@/lib/data/fixture-store'
import { getVenueRepository } from '@/lib/data/repository'
import { venueDetailPath, venueJsonLd } from '@/lib/seo'
import type { Venue, VenueDay, VenueHour } from '@/lib/types'
import { formatHourLabel, getDayLabel, getForecastBusyness, getVenueTypeLabel } from '@/lib/venue-display'

type VenuePageProps = {
  params: Promise<{ venueId: string }>
}

const venueTimeZone = 'America/New_York'
const trendHourOrder = [6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 0, 1, 2, 3, 4, 5]

const priceLabel = (priceLevel?: number) => {
  if (!priceLevel) return 'Not listed'
  return '$'.repeat(priceLevel)
}

const visibleBestTimeDataUrl = (bestTimeUrl?: string) => {
  if (!bestTimeUrl) return 'https://besttime.app'

  try {
    const parsed = new URL(bestTimeUrl)
    if (parsed.pathname.toLowerCase().startsWith('/api/')) {
      return 'https://besttime.app'
    }
  } catch {
    return 'https://besttime.app'
  }

  return bestTimeUrl
}

const venuePath = (venue: Venue) => venueDetailPath(venue)

const getVenueByRouteId = async (venueId: string) => {
  const fixtureVenue = getFixtureVenueById(venueId)
  if (fixtureVenue) return fixtureVenue

  const repository = getVenueRepository()
  if (repository.mode !== 'live') return undefined

  return repository.getVenue(venueId)
}

const formatVenueLocalTime = (date: Date) => {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: venueTimeZone,
    weekday: 'long',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  }).formatToParts(date)
  const lookup = new Map(parts.map(part => [part.type, part.value]))

  return `${lookup.get('weekday')} ${lookup.get('year')}-${lookup.get('month')}-${lookup.get('day')} ${lookup.get('hour')}:${lookup.get('minute')}${lookup.get('dayPeriod')}`
}

const getTrendHours = (day: VenueDay) => {
  const byHour = new Map(day.hours.map(hour => [hour.hour, hour]))

  return trendHourOrder.map(hour => byHour.get(hour) ?? { hour, busyness: 0 })
}

const getTrafficBand = (value: number) => {
  if (value <= 0) return 'Closed or unavailable'
  if (value <= 39) return 'Not busy'
  if (value <= 69) return 'Usually a little busy'
  return 'As busy as it gets'
}

const getTrendNote = (day: VenueDay) => {
  const peak = day.hours.find(hour => hour.hour === day.peakHour)
  const quiet = day.hours.find(hour => hour.hour === day.quietHour)
  const peakLabel = peak ? formatHourLabel(peak.hour) : formatHourLabel(day.peakHour)
  const quietLabel = quiet ? formatHourLabel(quiet.hour) : formatHourLabel(day.quietHour)

  return `Peak flow builds toward ${peakLabel}, while the quietest forecast window is around ${quietLabel}.`
}

const googleMapsUrl = (venue: Venue) =>
  `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${venue.name} ${venue.address}`)}`

export function generateStaticParams() {
  return getFixtureVenueIds().map(venueId => ({ venueId }))
}

export async function generateMetadata({ params }: VenuePageProps): Promise<Metadata> {
  const { venueId } = await params
  const venue = await getVenueByRouteId(venueId)

  if (!venue) {
    return {
      title: 'Venue not found'
    }
  }

  const path = venuePath(venue)
  const title = `${venue.name} busyness forecast | BestTime`
  const description = `${venue.name} in ${venue.city}: live busyness, weekly foot traffic forecast, peak hours, map location, and BestTime venue data.`

  return {
    title,
    description,
    alternates: {
      canonical: path
    },
    openGraph: {
      title,
      description,
      type: 'website',
      url: path
    }
  }
}

export default async function VenuePage({ params }: VenuePageProps) {
  const { venueId } = await params
  const venue = await getVenueByRouteId(venueId)

  if (!venue) notFound()

  const now = new Date()
  const busynessMetric = getBusynessMetric(venue)
  const representativeDay = getRepresentativeVenueDay(venue)
  const currentDay = getVenueDayForDate(venue, now)
  const currentHour = now.getHours()
  const currentForecast = currentDay ? getForecastBusyness(venue, currentDay.dayInt, currentHour) : 0
  const forecastPeak = representativeDay ? formatHourLabel(representativeDay.peakHour) : '-'
  const quietForecast = representativeDay ? formatHourLabel(representativeDay.quietHour) : '-'
  const bestTimeUrl = visibleBestTimeDataUrl(venue.bestTimeUrl)
  const venueType = getVenueTypeLabel(venue)
  const localTime = formatVenueLocalTime(now)

  return (
    <main className="min-h-screen bg-[#eef2f6] text-[#17213a]">
      <JsonLd data={venueJsonLd(venue)} />

      <div className="mx-auto flex w-full max-w-[1440px] flex-col gap-5 px-4 py-6 sm:px-6 lg:px-8">
        <Link href="/" className="inline-flex w-fit items-center gap-2 text-sm font-semibold text-slate-600 underline-offset-2 hover:text-slate-950 hover:underline">
          <ArrowLeft aria-hidden="true" className="h-4 w-4" />
          Back to map
        </Link>

        <section className="grid min-w-0 gap-5 lg:grid-cols-[minmax(20rem,0.92fr)_minmax(0,1.88fr)]">
          <VenueIdentityPanel
            bestTimeUrl={bestTimeUrl}
            busynessMetric={busynessMetric}
            localTime={localTime}
            price={priceLabel(venue.priceLevel)}
            venue={venue}
            venueType={venueType}
          />

          <TodayTrendPanel
            currentDay={currentDay}
            currentForecast={currentForecast}
            currentHour={currentHour}
            forecastPeak={forecastPeak}
            quietForecast={quietForecast}
            venue={venue}
          />
        </section>

        <section className="grid min-w-0 items-start gap-5 lg:grid-cols-[minmax(0,1.72fr)_minmax(22rem,0.82fr)]">
          <VenueHeatmap currentDayInt={currentDay?.dayInt} currentHour={currentHour} embedded week={venue.week} />
          <VenueMapPanel venue={venue} />
        </section>
      </div>
    </main>
  )
}

function VenueIdentityPanel({
  bestTimeUrl,
  busynessMetric,
  localTime,
  price,
  venue,
  venueType
}: {
  bestTimeUrl: string
  busynessMetric: ReturnType<typeof getBusynessMetric>
  localTime: string
  price: string
  venue: Venue
  venueType: string
}) {
  return (
    <section className="rounded-[24px] border border-slate-200/80 bg-white/90 p-4 shadow-[0_18px_50px_rgb(22_34_62_/_0.10)] sm:p-5">
      <div className="flex flex-wrap items-center gap-2 text-xs font-bold text-slate-500">
        <Link href="/cities/new-york/nightlife" className="hover:text-slate-950">World</Link>
        <span>/</span>
        <span>USA</span>
        <span>/</span>
        <span>{venue.city}</span>
      </div>

      <div className="mt-3 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-2xl font-semibold leading-tight text-[#1d2b4f] sm:text-[1.75rem]">
              {venue.name}
            </h1>
            {venue.rating ? (
              <span className="inline-flex items-center gap-1 rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 text-xs font-bold text-amber-800">
                <Star aria-hidden="true" className="h-3.5 w-3.5 fill-current" />
                {venue.rating.toFixed(1)}
              </span>
            ) : null}
          </div>
          <p className="mt-3 text-sm leading-6 text-slate-600">{venue.address}</p>
        </div>
        <button type="button" className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl border border-slate-200 bg-white text-slate-500 shadow-sm" aria-label="Save venue">
          <Bookmark aria-hidden="true" className="h-4 w-4" />
        </button>
      </div>

      <div className="mt-5 flex flex-wrap gap-2">
        <InfoPill icon={<Tag aria-hidden="true" className="h-3.5 w-3.5" />} label={venueType} />
        <InfoPill icon={<Timer aria-hidden="true" className="h-3.5 w-3.5" />} label="30 min typical stay" />
        <InfoPill icon={<Layers aria-hidden="true" className="h-3.5 w-3.5" />} label={venue.primaryCategory} />
        <InfoPill icon={<Hash aria-hidden="true" className="h-3.5 w-3.5" />} label="Demo venue" />
      </div>

      <div className="mt-6 rounded-[20px] border border-blue-100 bg-gradient-to-br from-blue-50 via-white to-slate-50 p-4">
        <p className="text-[0.7rem] font-bold uppercase tracking-[0.08em] text-slate-500">Current forecast</p>
        <p className="mt-2 text-lg font-semibold leading-snug text-[#1d2b4f]">
          {busynessMetric.value} · {getTrafficBand(venue.liveBusyness ?? venue.busyness)}
        </p>
      </div>

      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        <DetailTile icon={<Clock3 aria-hidden="true" className="h-4 w-4" />} label="Local time" value={localTime} />
        <DetailTile icon={<Compass aria-hidden="true" className="h-4 w-4" />} label="Timezone" value={venueTimeZone} />
        <DetailTile icon={<MapPin aria-hidden="true" className="h-4 w-4" />} label="City" value={venue.city} />
        <DetailTile icon={<Activity aria-hidden="true" className="h-4 w-4" />} label="Price level" value={price} />
      </div>

      <a href={bestTimeUrl} target="_blank" rel="noopener noreferrer" className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-[#1d2b4f] underline-offset-2 hover:underline">
        View BestTime data
        <ExternalLink aria-hidden="true" className="h-3.5 w-3.5" />
      </a>
    </section>
  )
}

function TodayTrendPanel({
  currentDay,
  currentForecast,
  currentHour,
  forecastPeak,
  quietForecast,
  venue
}: {
  currentDay?: VenueDay
  currentForecast: number
  currentHour: number
  forecastPeak: string
  quietForecast: string
  venue: Venue
}) {
  const trendHours = currentDay ? getTrendHours(currentDay) : []

  return (
    <section aria-labelledby="today-trend-heading" className="rounded-[24px] border border-slate-200/80 bg-white/90 p-4 shadow-[0_18px_50px_rgb(22_34_62_/_0.10)] sm:p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 id="today-trend-heading" className="text-base font-bold text-[#1d2b4f]">Today&apos;s visitor trend</h2>
          <p className="mt-1 text-sm text-slate-500">
            {currentDay ? `${getDayLabel(currentDay.dayInt)} forecast for ${venue.name}.` : 'Current-day forecast from the weekly BestTime profile.'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-bold text-slate-600">
            <Radio aria-hidden="true" className="h-3.5 w-3.5" />
            {venue.liveStatus === 'available' ? 'Live' : 'Forecast'}
          </span>
          <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-bold text-slate-700">Now</span>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-[2.5rem_minmax(0,1fr)] gap-3">
        <div className="pt-1 text-xs font-semibold text-slate-500">100%</div>
        <div className="h-60">
          {currentDay ? <CurrentDayTrendBars currentHour={currentHour} hours={trendHours} /> : null}
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

      <div className="mt-3 rounded-full border border-slate-200 bg-white px-4 py-1.5 text-center text-xs font-medium text-slate-600">
        {currentDay ? getTrendNote(currentDay) : 'Trend summary is unavailable for this venue.'}
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        <TrendMetric label="Now" value={`${currentForecast}%`} />
        <TrendMetric label="Peak" value={forecastPeak} />
        <TrendMetric label="Quiet" value={quietForecast} />
      </div>
    </section>
  )
}

function CurrentDayTrendBars({ currentHour, hours }: { currentHour: number; hours: VenueHour[] }) {
  return (
    <div className="grid h-full items-end gap-1.5" style={{ gridTemplateColumns: `repeat(${hours.length}, minmax(0, 1fr))` }}>
      {hours.map(hour => {
        const isCurrentHour = hour.hour === currentHour
        const height = Math.max(0.08, hour.busyness / 100)

        return (
          <div key={hour.hour} className="flex h-full items-end">
            <div
              className={`w-full rounded-t-[3px] ${isCurrentHour ? 'bg-teal-700' : 'bg-blue-400'}`}
              style={{ height: `${height * 100}%` }}
              title={`${formatHourLabel(hour.hour)}: ${hour.busyness}% busy`}
            />
          </div>
        )
      })}
    </div>
  )
}

function VenueMapPanel({ venue }: { venue: Venue }) {
  return (
    <section aria-labelledby="venue-map-heading" className="rounded-[24px] border border-slate-200/80 bg-white/90 p-4 shadow-[0_18px_50px_rgb(22_34_62_/_0.10)]">
      <div className="mb-3 flex items-center justify-between gap-3">
        <h2 id="venue-map-heading" className="text-base font-bold text-[#1d2b4f]">Venue map</h2>
        <Attribution />
      </div>
      <VenueMap venue={venue} compact />
      <div className="mt-3 flex flex-wrap items-center gap-2 text-xs font-semibold text-slate-500">
        <Compass aria-hidden="true" className="h-3.5 w-3.5" />
        <span>{venue.lat.toFixed(4)}, {venue.lng.toFixed(4)}</span>
      </div>
      <div className="mt-3 grid grid-cols-[1fr_auto_1fr] gap-2">
        <Link href="/" className="inline-flex min-h-10 items-center justify-center gap-2 rounded-2xl border border-slate-300 px-3 text-sm font-semibold text-slate-700 hover:border-slate-400">
          <MapPin aria-hidden="true" className="h-4 w-4" />
          Nearby venues
        </Link>
        <a href={googleMapsUrl(venue)} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-10 items-center justify-center rounded-2xl border border-slate-300 px-3 text-sm font-semibold text-slate-700 hover:border-slate-400" aria-label="Open fullscreen map">
          <ExternalLink aria-hidden="true" className="h-4 w-4" />
        </a>
        <a href={googleMapsUrl(venue)} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-10 items-center justify-center gap-2 rounded-2xl border border-slate-300 px-3 text-sm font-semibold text-slate-700 hover:border-slate-400">
          <MapPin aria-hidden="true" className="h-4 w-4" />
          Google
        </a>
      </div>
    </section>
  )
}

function InfoPill({ icon, label }: { icon: ReactNode; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-blue-100 bg-blue-50 px-3 py-1.5 text-xs font-bold capitalize text-slate-700">
      {icon}
      {label}
    </span>
  )
}

function DetailTile({ icon, label, value }: { icon: ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-[18px] border border-slate-200 bg-white/80 p-3">
      <div className="flex items-center gap-1.5 text-[0.68rem] font-bold uppercase tracking-[0.08em] text-slate-500">
        {icon}
        {label}
      </div>
      <p className="mt-2 text-sm font-semibold leading-5 text-[#1d2b4f]">{value}</p>
    </div>
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
