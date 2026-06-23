import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { allFixtureVenues } from '@/data/fixtures/nyc-nightlife'
import { VenueCard } from '@/components/venue/VenueCard'
import { getBusynessMetric, getRepresentativeVenueDay, getVenueDayForDate, VenueDetailPanel } from '@/components/venue/VenueDetailPanel'
import type { Venue } from '@/lib/types'

const makeLiveStyleVenue = (): Venue => ({
  ...allFixtureVenues[0],
  id: 'ven_live_detail_123',
  besttimeVenueId: 'ven_live_detail_123',
  slug: 'live-detail-slug',
  source: 'besttime'
})

describe('venue detail links and metrics', () => {
  it('links venue cards by stable venue id instead of slug', () => {
    const venue = makeLiveStyleVenue()

    render(<VenueCard venue={venue} onSelect={vi.fn()} />)

    expect(screen.getByRole('link', { name: 'Details' })).toHaveAttribute(
      'href',
      '/venues/ven_live_detail_123'
    )
  })

  it('links the detail panel by stable venue id instead of slug', () => {
    const venue = makeLiveStyleVenue()

    render(<VenueDetailPanel venue={venue} />)

    expect(screen.getByRole('link', { name: /details/i })).toHaveAttribute(
      'href',
      '/venues/ven_live_detail_123'
    )
  })

  it('labels non-live busyness as typical busyness', () => {
    const venue: Venue = {
      ...allFixtureVenues[0],
      liveBusyness: undefined,
      liveStatus: 'unavailable'
    }

    render(<VenueDetailPanel venue={venue} />)

    expect(screen.getByText('Typical busyness')).toBeInTheDocument()
    expect(screen.queryByText('Busy now')).not.toBeInTheDocument()
    expect(getBusynessMetric(venue)).toEqual({
      label: 'Typical busyness',
      value: `${venue.busyness}%`
    })
  })

  it('labels the representative forecast peak without today wording', () => {
    const venue = makeLiveStyleVenue()

    render(<VenueDetailPanel venue={venue} />)

    expect(screen.getByText('Forecast peak')).toBeInTheDocument()
    expect(screen.queryByText('Peak today')).not.toBeInTheDocument()
    expect(getRepresentativeVenueDay(venue)).toBe(venue.week[4])
  })

  it('maps the current weekday to the app Monday-first week array', () => {
    const venue = allFixtureVenues[0]

    expect(getVenueDayForDate(venue, new Date('2026-06-22T12:00:00Z'))).toBe(venue.week[0])
    expect(getVenueDayForDate(venue, new Date('2026-06-24T12:00:00Z'))).toBe(venue.week[2])
    expect(getVenueDayForDate(venue, new Date('2026-06-28T12:00:00Z'))).toBe(venue.week[6])
  })
})
