import Link from 'next/link'
import { Activity, MapPin, Star } from 'lucide-react'
import type { Venue } from '@/lib/types'
import { getVenueTypeLabel } from '@/lib/venue-display'

type VenueCardProps = {
  detailHref?: string
  venue: Venue
  selected?: boolean
  onSelect: (venueId: string) => void
}

const formatReviews = (reviews?: number) => {
  if (!reviews) return 'No reviews yet'
  return `${Intl.NumberFormat('en-US', { notation: reviews >= 1000 ? 'compact' : 'standard' }).format(reviews)} reviews`
}

export function VenueCard({ detailHref, venue, selected = false, onSelect }: VenueCardProps) {
  const busyness = venue.liveBusyness ?? venue.busyness
  const venueType = getVenueTypeLabel(venue)

  return (
    <article
      className={`rounded-md border bg-white p-3 transition ${
        selected ? 'border-slate-950 shadow-sm' : 'border-slate-200 hover:border-slate-300'
      }`}
    >
      <button type="button" onClick={() => onSelect(venue.id)} className="block w-full text-left">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h3 className="truncate text-sm font-semibold text-slate-950">{venue.name}</h3>
            <p className="mt-1 flex items-start gap-1 text-xs leading-4 text-slate-500">
              <MapPin aria-hidden="true" className="mt-0.5 h-3.5 w-3.5 shrink-0" />
              <span className="line-clamp-2">{venue.address}</span>
            </p>
          </div>
          <span className="shrink-0 rounded-full bg-slate-100 px-2 py-1 text-xs font-semibold capitalize text-slate-700">
            {venueType}
          </span>
        </div>
        <div className="mt-3 grid grid-cols-3 gap-2 text-xs text-slate-600">
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
      </button>
      <div className="mt-3 flex items-center justify-between gap-3 border-t border-slate-100 pt-3">
        <span className={`text-xs font-semibold ${venue.liveStatus === 'available' ? 'text-emerald-700' : 'text-slate-500'}`}>
          {venue.liveStatus === 'available' ? 'Live now' : 'Forecast'}
        </span>
        <Link href={detailHref || `/venues/${encodeURIComponent(venue.id)}`} className="text-xs font-semibold text-slate-900 underline-offset-2 hover:underline">
          Details
        </Link>
      </div>
    </article>
  )
}
