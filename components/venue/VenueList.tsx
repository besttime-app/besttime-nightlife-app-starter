import type { Venue } from '@/lib/types'
import { VenueCard } from './VenueCard'

type VenueListProps = {
  venues: Venue[]
  getDetailHref?: (venue: Venue) => string
  selectedVenueId?: string
  onSelectVenue: (venueId: string) => void
}

export function VenueList({ getDetailHref, venues, selectedVenueId, onSelectVenue }: VenueListProps) {
  if (venues.length === 0) {
    return (
      <div className="rounded-md border border-dashed border-slate-300 bg-white p-4 text-sm leading-6 text-slate-600">
        No venues match these filters. Try a broader category or lower rating.
      </div>
    )
  }

  return (
    <div className="grid gap-3">
      {venues.map(venue => (
        <VenueCard
          key={venue.id}
          detailHref={getDetailHref?.(venue)}
          venue={venue}
          selected={venue.id === selectedVenueId}
          onSelect={onSelectVenue}
        />
      ))}
    </div>
  )
}
