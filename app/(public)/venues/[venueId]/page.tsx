import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { Activity, ArrowLeft, Clock3, Database, MapPin, Star } from 'lucide-react'
import { Attribution } from '@/components/app/Attribution'
import { VenueMap } from '@/components/map/VenueMap'
import { JsonLd } from '@/components/seo/JsonLd'
import { getBusynessMetric, getRepresentativeVenueDay } from '@/components/venue/VenueDetailPanel'
import { VenueHeatmap } from '@/components/venue/VenueHeatmap'
import { allFixtureVenues } from '@/data/fixtures/nyc-nightlife'
import { getFixtureVenueById } from '@/lib/data/fixture-store'
import { getVenueRepository } from '@/lib/data/repository'
import { venueDetailPath, venueJsonLd } from '@/lib/seo'
import type { Venue } from '@/lib/types'

type VenuePageProps = {
  params: Promise<{ venueId: string }>
}

const hourLabel = (hour: number) => {
  if (hour === 0) return '12 AM'
  if (hour === 12) return '12 PM'
  return hour > 12 ? `${hour - 12} PM` : `${hour} AM`
}

const formatReviews = (reviews?: number) => {
  if (!reviews) return 'No reviews yet'
  return `${reviews.toLocaleString()} reviews`
}

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

export function generateStaticParams() {
  const params = new Map<string, { venueId: string }>()

  for (const venue of allFixtureVenues) {
    params.set(venue.id, { venueId: venue.id })
    params.set(venue.slug, { venueId: venue.slug })
  }

  return [...params.values()]
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

  const busynessMetric = getBusynessMetric(venue)
  const representativeDay = getRepresentativeVenueDay(venue)
  const forecastPeak = representativeDay ? hourLabel(representativeDay.peakHour) : '-'
  const quietForecast = representativeDay ? hourLabel(representativeDay.quietHour) : '-'
  const bestTimeUrl = visibleBestTimeDataUrl(venue.bestTimeUrl)

  return (
    <main className="min-h-screen bg-slate-50 text-slate-950">
      <JsonLd data={venueJsonLd(venue)} />

      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8">
          <Link href="/" className="inline-flex w-fit items-center gap-2 text-sm font-semibold text-slate-700 underline-offset-2 hover:text-slate-950 hover:underline">
            <ArrowLeft aria-hidden="true" className="h-4 w-4" />
            Back to map
          </Link>

          <div className="grid gap-6 lg:grid-cols-[1fr_20rem] lg:items-end">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-full bg-teal-50 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-teal-800">
                  {venue.liveStatus === 'available' ? 'Live signal' : 'Forecast'}
                </span>
                <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold capitalize text-slate-700">
                  {venue.primaryCategory}
                </span>
              </div>
              <h1 className="mt-4 text-3xl font-semibold leading-tight text-slate-950 sm:text-4xl">
                {venue.name}
              </h1>
              <p className="mt-3 flex max-w-3xl items-start gap-2 text-sm leading-6 text-slate-600 sm:text-base">
                <MapPin aria-hidden="true" className="mt-0.5 h-5 w-5 shrink-0 text-slate-500" />
                <span>{venue.address}</span>
              </p>
              <p className="mt-4 max-w-3xl text-base leading-7 text-slate-700">
                {venue.summary}
              </p>
            </div>

            <section aria-label="Venue metrics" className="grid grid-cols-2 gap-3">
              <Metric icon={<Activity aria-hidden="true" className="h-4 w-4 text-teal-700" />} label={busynessMetric.label} value={busynessMetric.value} />
              <Metric icon={<Star aria-hidden="true" className="h-4 w-4 text-amber-500" />} label={formatReviews(venue.reviews)} value={venue.rating?.toFixed(1) ?? '-'} />
              <Metric icon={<Clock3 aria-hidden="true" className="h-4 w-4 text-slate-600" />} label="Forecast peak" value={forecastPeak} />
              <Metric icon={<Clock3 aria-hidden="true" className="h-4 w-4 text-slate-600" />} label="Quiet forecast" value={quietForecast} />
            </section>
          </div>
        </div>
      </header>

      <section aria-labelledby="overview-heading" className="bg-slate-50 py-8">
        <div className="mx-auto grid w-full max-w-6xl gap-6 px-4 sm:px-6 lg:grid-cols-[1fr_20rem] lg:px-8">
          <div>
            <h2 id="overview-heading" className="text-xl font-semibold text-slate-950">
              Venue overview
            </h2>
            <div className="mt-4 grid gap-3 sm:grid-cols-3">
              <InfoBox label="City" value={venue.city} />
              <InfoBox label="Price level" value={priceLabel(venue.priceLevel)} />
              <InfoBox label="Data source" value={venue.source === 'fixture' ? 'Demo forecast' : 'BestTime'} />
            </div>
          </div>

          <aside className="rounded-md border border-slate-200 bg-white p-4">
            <div className="flex items-start gap-3">
              <Database aria-hidden="true" className="mt-1 h-5 w-5 shrink-0 text-teal-700" />
              <div>
                <h2 className="text-sm font-semibold text-slate-950">BestTime data</h2>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  Forecast and live foot traffic signals are powered by BestTime public venue data.
                </p>
                <a
                  href={bestTimeUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-3 inline-flex text-sm font-semibold text-slate-950 underline-offset-2 hover:underline"
                >
                  View BestTime data
                </a>
              </div>
            </div>
          </aside>
        </div>
      </section>

      <VenueHeatmap week={venue.week} />

      <section aria-labelledby="map-heading" className="bg-slate-50 py-8">
        <div className="mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 id="map-heading" className="text-xl font-semibold text-slate-950">
                Venue map
              </h2>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                Centered on {venue.name} with navigation controls and OpenFreeMap tiles.
              </p>
            </div>
            <Attribution />
          </div>
          <VenueMap venue={venue} />
        </div>
      </section>
    </main>
  )
}

function Metric({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-md border border-slate-200 bg-white p-4">
      {icon}
      <p className="mt-3 text-2xl font-semibold leading-none text-slate-950">{value}</p>
      <p className="mt-1 text-xs font-medium leading-5 text-slate-500">{label}</p>
    </div>
  )
}

function InfoBox({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-slate-200 bg-white p-4">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-2 text-sm font-semibold text-slate-950">{value}</p>
    </div>
  )
}
