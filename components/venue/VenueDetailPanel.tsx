import Link from 'next/link'
import { Activity, Clock3, ExternalLink, MapPin, Star } from 'lucide-react'
import type { Venue } from '@/lib/types'

type VenueDetailPanelProps = {
  venue?: Venue
}

const hourLabel = (hour: number) => {
  if (hour === 0) return '12 AM'
  if (hour === 12) return '12 PM'
  return hour > 12 ? `${hour - 12} PM` : `${hour} AM`
}

export function VenueDetailPanel({ venue }: VenueDetailPanelProps) {
  if (!venue) {
    return (
      <section className="rounded-md border border-slate-200 bg-white p-4">
        <h2 className="text-sm font-semibold text-slate-950">Select a venue</h2>
        <p className="mt-2 text-sm leading-6 text-slate-600">
          Choose a marker or list item to inspect live busyness, forecast peaks, and venue context.
        </p>
      </section>
    )
  }

  const busyness = venue.liveBusyness ?? venue.busyness
  const today = venue.week[0]

  return (
    <section className="rounded-md border border-slate-200 bg-white p-4">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <h2 className="text-lg font-semibold leading-6 text-slate-950">{venue.name}</h2>
          <p className="mt-2 flex items-start gap-2 text-sm leading-5 text-slate-600">
            <MapPin aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0" />
            <span>{venue.address}</span>
          </p>
        </div>
        <span className="shrink-0 rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold capitalize text-slate-700">
          {venue.primaryCategory}
        </span>
      </div>

      <div className="mt-4 grid grid-cols-3 gap-2">
        <div className="rounded-md bg-slate-50 p-3">
          <Activity aria-hidden="true" className="h-4 w-4 text-teal-700" />
          <p className="mt-2 text-xl font-semibold text-slate-950">{busyness}%</p>
          <p className="text-xs font-medium text-slate-500">Busy now</p>
        </div>
        <div className="rounded-md bg-slate-50 p-3">
          <Star aria-hidden="true" className="h-4 w-4 text-amber-500" />
          <p className="mt-2 text-xl font-semibold text-slate-950">{venue.rating?.toFixed(1) ?? '-'}</p>
          <p className="text-xs font-medium text-slate-500">{venue.reviews?.toLocaleString() ?? 0} reviews</p>
        </div>
        <div className="rounded-md bg-slate-50 p-3">
          <Clock3 aria-hidden="true" className="h-4 w-4 text-slate-600" />
          <p className="mt-2 text-xl font-semibold text-slate-950">{today ? hourLabel(today.peakHour) : '-'}</p>
          <p className="text-xs font-medium text-slate-500">Peak today</p>
        </div>
      </div>

      <p className="mt-4 text-sm leading-6 text-slate-600">{venue.summary}</p>

      <div className="mt-4 flex items-center justify-between gap-3 border-t border-slate-100 pt-4">
        <span className={`text-sm font-semibold ${venue.liveStatus === 'available' ? 'text-emerald-700' : 'text-slate-500'}`}>
          {venue.liveStatus === 'available' ? 'Live signal available' : 'Forecast data'}
        </span>
        <Link
          href={`/venues/${venue.slug}`}
          className="inline-flex min-h-9 items-center gap-2 rounded-md bg-slate-950 px-3 text-sm font-semibold text-white transition hover:bg-slate-800"
        >
          Details
          <ExternalLink aria-hidden="true" className="h-3.5 w-3.5" />
        </Link>
      </div>
    </section>
  )
}
