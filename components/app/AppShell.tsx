'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { BarChart3, Building2, Database, Loader2, Map, MapPin } from 'lucide-react'
import { Attribution } from '@/components/app/Attribution'
import { BottomNav } from '@/components/app/BottomNav'
import { LocationModal } from '@/components/app/LocationModal'
import { AdvancedFilters, type AdvancedFilterState } from '@/components/filters/AdvancedFilters'
import { CategoryChips } from '@/components/filters/CategoryChips'
import { QuickFilters } from '@/components/filters/QuickFilters'
import { MapCanvas } from '@/components/map/MapCanvas'
import { VenueDetailPanel } from '@/components/venue/VenueDetailPanel'
import { VenueList } from '@/components/venue/VenueList'
import type { AppMode, Venue, VenueCategory, VenueFilters } from '@/lib/types'

type AppShellProps = {
  initialMode: AppMode
  initialVenues: Venue[]
  initialCategory: VenueCategory
  resultLimit: number
}

const defaultAdvancedFilters: AdvancedFilterState = {
  radius: 1600,
  minRating: 0,
  liveOnly: false
}

const navItems = [
  { label: 'Map', icon: Map, href: '/', active: true },
  { label: 'City', icon: Building2, href: '/cities/new-york/nightlife', active: false },
  { label: 'Data', icon: Database, href: '/about-data', active: false },
  { label: 'Admin', icon: BarChart3, href: '/admin', active: false }
]

export function AppShell({ initialMode, initialVenues, initialCategory, resultLimit }: AppShellProps) {
  const [mode, setMode] = useState<AppMode>(initialMode)
  const [venues, setVenues] = useState<Venue[]>(initialVenues)
  const [selectedVenueId, setSelectedVenueId] = useState<string | undefined>(initialVenues[0]?.id)
  const [category, setCategory] = useState<VenueCategory>(initialCategory)
  const [quickFilter, setQuickFilter] = useState<VenueFilters['quickFilter']>()
  const [advanced, setAdvanced] = useState<AdvancedFilterState>(defaultAdvancedFilters)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | undefined>()

  useEffect(() => {
    const controller = new AbortController()

    async function loadVenues() {
      setIsLoading(true)
      setError(undefined)

      const params = new URLSearchParams({
        category,
        limit: String(resultLimit),
        radius: String(advanced.radius)
      })
      if (quickFilter) params.set('quickFilter', quickFilter)

      try {
        const response = await fetch(`/api/besttime/venues?${params.toString()}`, {
          signal: controller.signal
        })
        const body = await response.json() as { mode?: AppMode; venues?: Venue[]; error?: string }

        if (!response.ok) throw new Error(body.error || 'Unable to load venues')

        const nextVenues = body.venues || []
        setMode(body.mode || 'demo')
        setVenues(nextVenues)
        setSelectedVenueId(current => current && nextVenues.some(venue => venue.id === current) ? current : nextVenues[0]?.id)
      } catch (fetchError) {
        if (controller.signal.aborted) return
        setError(fetchError instanceof Error ? fetchError.message : 'Unable to load venues')
      } finally {
        if (!controller.signal.aborted) setIsLoading(false)
      }
    }

    void loadVenues()

    return () => {
      controller.abort()
    }
  }, [advanced.radius, category, quickFilter, resultLimit])

  const visibleVenues = useMemo(
    () => venues.filter(venue => {
      if (advanced.liveOnly && venue.liveStatus !== 'available') return false
      if ((venue.rating || 0) < advanced.minRating) return false
      return true
    }),
    [advanced.liveOnly, advanced.minRating, venues]
  )

  const selectedVenue = visibleVenues.find(venue => venue.id === selectedVenueId) ?? visibleVenues[0]
  const effectiveSelectedVenueId = selectedVenue?.id

  const filterPanel = (
    <div className="grid gap-3">
      <CategoryChips value={category} onChange={setCategory} />
      <QuickFilters value={quickFilter} onChange={setQuickFilter} />
      <AdvancedFilters value={advanced} onChange={setAdvanced} />
    </div>
  )

  const desktopNav = (
    <aside className="hidden border-r border-slate-200 bg-white md:flex md:flex-col md:items-center md:gap-4 md:px-3 md:py-4">
      <div className="grid h-11 w-11 place-items-center rounded-md bg-slate-950 text-base font-semibold text-white">
        BT
      </div>
      <nav aria-label="Primary" className="grid gap-2">
        {navItems.map(({ label, icon: Icon, href, active }) => (
          <Link
            key={label}
            href={href}
            title={label}
            aria-label={label}
            aria-current={active ? 'page' : undefined}
            className={`grid h-11 w-11 place-items-center rounded-md transition ${
              active ? 'bg-teal-700 text-white' : 'text-slate-500 hover:bg-slate-100 hover:text-slate-950'
            }`}
          >
            <Icon aria-hidden="true" className="h-5 w-5" />
          </Link>
        ))}
      </nav>
    </aside>
  )

  return (
    <main className="h-dvh overflow-hidden bg-slate-100 text-slate-950">
      <div className="hidden h-full grid-cols-[4.5rem_minmax(0,1fr)_24rem] grid-rows-[minmax(0,1fr)] md:grid">
        {desktopNav}
        <section className="relative min-h-0 min-w-0">
          <MapCanvas venues={visibleVenues} selectedVenueId={effectiveSelectedVenueId} onSelectVenue={setSelectedVenueId} />
          <div className="pointer-events-none absolute left-4 top-4 z-10 w-[min(42rem,calc(100%-2rem))]">
            <div className="pointer-events-auto rounded-lg border border-white/70 bg-white/92 p-3 shadow-[var(--shadow-soft)] backdrop-blur">
              {filterPanel}
            </div>
          </div>
          <div className="pointer-events-none absolute bottom-4 left-4 z-10">
            <Attribution />
          </div>
        </section>
        <aside className="flex min-h-0 flex-col border-l border-slate-200 bg-slate-50">
          <div className="border-b border-slate-200 bg-white p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-teal-700">{mode === 'live' ? 'Live data' : 'NYC demo'}</p>
                <h1 className="mt-1 text-xl font-semibold tracking-tight text-slate-950">BestTime venues in New York</h1>
              </div>
              {isLoading ? <Loader2 aria-label="Loading venues" className="h-5 w-5 animate-spin text-slate-500" /> : null}
            </div>
            {error ? <p className="mt-3 rounded-md bg-red-50 p-2 text-sm text-red-700">{error}</p> : null}
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto p-4">
            <VenueDetailPanel venue={selectedVenue} />
            <div className="mt-4">
              <VenueList venues={visibleVenues} selectedVenueId={effectiveSelectedVenueId} onSelectVenue={setSelectedVenueId} />
            </div>
          </div>
        </aside>
      </div>

      <div className="relative flex h-full flex-col md:hidden">
        <MapCanvas venues={visibleVenues} selectedVenueId={effectiveSelectedVenueId} onSelectVenue={setSelectedVenueId} />
        <div className="pointer-events-none absolute inset-x-0 top-0 z-10 p-3">
          <div className="pointer-events-auto rounded-lg border border-white/70 bg-white/94 p-3 shadow-[var(--shadow-soft)] backdrop-blur">
            <div className="mb-3 flex items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="text-xs font-semibold uppercase tracking-wide text-teal-700">{mode === 'live' ? 'Live data' : 'NYC demo'}</p>
                <h1 className="truncate text-base font-semibold text-slate-950">BestTime venues</h1>
              </div>
              <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-slate-100 px-2 py-1 text-xs font-semibold text-slate-600">
                <MapPin aria-hidden="true" className="h-3 w-3" />
                NYC
              </span>
            </div>
            <div className="grid gap-3">
              <CategoryChips value={category} onChange={setCategory} />
              <QuickFilters value={quickFilter} onChange={setQuickFilter} />
            </div>
          </div>
        </div>
        <section className="safe-bottom fixed inset-x-0 bottom-[4.9rem] z-20 max-h-[44dvh] overflow-y-auto rounded-t-lg border-t border-slate-200 bg-slate-50 p-3 shadow-[0_-18px_45px_rgb(15_23_42/0.16)]">
          <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-slate-300" />
          {error ? <p className="mb-3 rounded-md bg-red-50 p-2 text-sm text-red-700">{error}</p> : null}
          {selectedVenue ? <VenueDetailPanel venue={selectedVenue} /> : <VenueList venues={visibleVenues} selectedVenueId={effectiveSelectedVenueId} onSelectVenue={setSelectedVenueId} />}
          <div className="mt-3 flex justify-center">
            <Attribution />
          </div>
        </section>
        <BottomNav />
      </div>
      <LocationModal />
    </main>
  )
}
