import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { allFixtureVenues } from '@/data/fixtures/nyc-nightlife'
import { VenueCard } from '@/components/venue/VenueCard'
import { getBusynessMetric, getRepresentativeVenueDay, getVenueDayForDate, VenueDetailPanel } from '@/components/venue/VenueDetailPanel'
import { getVisibleHeatmapHours, VenueHeatmap } from '@/components/venue/VenueHeatmap'
import type { Venue } from '@/lib/types'
import { getVenueTypeLabel } from '@/lib/venue-display'

const makeLiveStyleVenue = (): Venue => ({
  ...allFixtureVenues[0],
  id: 'ven_live_detail_123',
  besttimeVenueId: 'ven_live_detail_123',
  slug: 'live-detail-slug',
  source: 'besttime'
})

const makeWeek = (activeHours: number[]) =>
  Array.from({ length: 7 }, (_, dayInt) => ({
    dayInt,
    dayLabel: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'][dayInt],
    hours: Array.from({ length: 24 }, (_, hour) => ({
      hour,
      busyness: activeHours.includes(hour) ? 50 : 0
    })),
    peakHour: activeHours[0] ?? 0,
    quietHour: 0
  }))

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
    const expectedDay = venue.week.reduce((bestDay, day) => {
      const dayPeak = day.hours.find(hour => hour.hour === day.peakHour)?.busyness ?? 0
      const bestPeak = bestDay.hours.find(hour => hour.hour === bestDay.peakHour)?.busyness ?? 0

      return dayPeak > bestPeak ? day : bestDay
    }, venue.week[0])

    expect(getRepresentativeVenueDay(venue)).toBe(expectedDay)
  })

  it('shows a refined venue type instead of only the broad discovery category', () => {
    const venue: Venue = {
      ...allFixtureVenues[0],
      primaryCategory: 'nightlife',
      venueType: 'BAR'
    }

    render(<VenueDetailPanel venue={venue} />)

    expect(screen.getByText('Bar')).toBeInTheDocument()
    expect(getVenueTypeLabel(venue)).toBe('Bar')
  })

  it('maps the current weekday to the app Monday-first week array', () => {
    const venue = allFixtureVenues[0]

    expect(getVenueDayForDate(venue, new Date('2026-06-22T12:00:00Z'))).toBe(venue.week[0])
    expect(getVenueDayForDate(venue, new Date('2026-06-24T12:00:00Z'))).toBe(venue.week[2])
    expect(getVenueDayForDate(venue, new Date('2026-06-28T12:00:00Z'))).toBe(venue.week[6])
  })

  it('trims closed heatmap hours while preserving overnight venue windows', () => {
    const week = makeWeek([17, 18, 19, 20, 21, 22, 23, 0, 1, 2])

    expect(getVisibleHeatmapHours(week)).toEqual([16, 17, 18, 19, 20, 21, 22, 23, 0, 1, 2, 3])

    render(<VenueHeatmap week={week} />)

    expect(screen.getByText('4p')).toBeInTheDocument()
    expect(screen.getByText('3a')).toBeInTheDocument()
    expect(screen.queryByText('9a')).not.toBeInTheDocument()
    expect(screen.queryByText('12p')).not.toBeInTheDocument()
  })
})
