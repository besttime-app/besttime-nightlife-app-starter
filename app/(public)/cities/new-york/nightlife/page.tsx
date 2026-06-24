import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowLeft, Activity, MapPin, Star } from 'lucide-react'
import { Attribution } from '@/components/app/Attribution'
import { getFixtureVenues } from '@/lib/data/fixture-store'
import { canonicalUrl } from '@/lib/seo'
import type { Venue } from '@/lib/types'
import { getVenueTypeLabel } from '@/lib/venue-display'

const pagePath = '/cities/new-york/nightlife'
const pageTitle = 'New York nightlife foot traffic starter'
const pageDescription = 'Explore demo nightlife venues in New York with BestTime-style forecast and live busyness data.'

export const metadata: Metadata = {
  title: pageTitle,
  description: pageDescription,
  alternates: { canonical: canonicalUrl(pagePath) },
  openGraph: {
    title: pageTitle,
    description: pageDescription,
    url: canonicalUrl(pagePath),
    type: 'website'
  }
}

const formatReviews = (reviews?: number) => {
  if (!reviews) return 'No reviews yet'
  return `${Intl.NumberFormat('en-US', { notation: reviews >= 1000 ? 'compact' : 'standard' }).format(reviews)} reviews`
}

export default function NewYorkNightlifePage() {
  const venues = getFixtureVenues({ category: 'nightlife', limit: 12 })

  return (
    <main className="min-h-dvh bg-slate-50 text-slate-950">
      <section className="border-b border-slate-200 bg-white">
        <div className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
          <Link href="/" className="inline-flex items-center gap-2 text-sm font-semibold text-slate-700 underline-offset-2 hover:text-slate-950 hover:underline">
            <ArrowLeft aria-hidden="true" className="h-4 w-4" />
            Back to map
          </Link>
          <div className="mt-8 grid gap-5 lg:grid-cols-[1fr_18rem] lg:items-end">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-teal-800">SEO demo city guide</p>
              <h1 className="mt-3 max-w-3xl text-3xl font-semibold leading-tight sm:text-4xl">
                New York nightlife foot traffic demo
              </h1>
              <p className="mt-4 max-w-3xl text-base leading-7 text-slate-700">
                A crawlable city page for venue discovery apps that want searchable landing pages while keeping live
                BestTime API calls behind server-side routes.
              </p>
            </div>
            <Attribution />
          </div>
        </div>
      </section>

      <section aria-labelledby="venues-heading" className="py-8">
        <div className="mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 id="venues-heading" className="text-xl font-semibold">Nightlife venues</h2>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                Static demo venues link to indexable detail pages with forecast heatmaps and venue metadata.
              </p>
            </div>
            <Link href="/about-data" className="text-sm font-semibold text-slate-700 underline-offset-2 hover:text-slate-950 hover:underline">
              About data
            </Link>
          </div>

          <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {venues.map(venue => (
              <CityVenueLink key={venue.id} venue={venue} />
            ))}
          </div>
        </div>
      </section>
    </main>
  )
}

function CityVenueLink({ venue }: { venue: Venue }) {
  const busyness = venue.liveBusyness ?? venue.busyness
  const venueType = getVenueTypeLabel(venue)

  return (
    <Link
      href={`/venues/${encodeURIComponent(venue.id)}`}
      className="group rounded-md border border-slate-200 bg-white p-4 transition hover:border-slate-300 hover:shadow-sm"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="truncate text-sm font-semibold text-slate-950 group-hover:underline">{venue.name}</h3>
          <p className="mt-2 flex items-start gap-1 text-xs leading-5 text-slate-500">
            <MapPin aria-hidden="true" className="mt-0.5 h-3.5 w-3.5 shrink-0" />
            <span className="line-clamp-2">{venue.address}</span>
          </p>
        </div>
        <span className="shrink-0 rounded-full bg-slate-100 px-2 py-1 text-xs font-semibold capitalize text-slate-700">
          {venueType}
        </span>
      </div>
      <div className="mt-4 grid grid-cols-3 gap-2 text-xs text-slate-600">
        <span className="inline-flex items-center gap-1 rounded-md bg-slate-50 px-2 py-2">
          <Activity aria-hidden="true" className="h-3.5 w-3.5 text-teal-700" />
          <strong className="font-semibold text-slate-950">{busyness}%</strong>
        </span>
        <span className="inline-flex items-center gap-1 rounded-md bg-slate-50 px-2 py-2">
          <Star aria-hidden="true" className="h-3.5 w-3.5 text-amber-500" />
          <strong className="font-semibold text-slate-950">{venue.rating?.toFixed(1) ?? '-'}</strong>
        </span>
        <span className="truncate rounded-md bg-slate-50 px-2 py-2 font-medium">
          {formatReviews(venue.reviews)}
        </span>
      </div>
    </Link>
  )
}
