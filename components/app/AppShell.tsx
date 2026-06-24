'use client'

import { useCallback, useEffect, useMemo, useRef, useState, type PointerEvent } from 'react'
import Link from 'next/link'
import { BarChart3, Building2, ChevronUp, Database, Loader2, Map, MapPin } from 'lucide-react'
import { Attribution } from '@/components/app/Attribution'
import { BottomNav } from '@/components/app/BottomNav'
import { LocationModal } from '@/components/app/LocationModal'
import { AdvancedFilters, type AdvancedFilterState } from '@/components/filters/AdvancedFilters'
import { CategoryChips } from '@/components/filters/CategoryChips'
import { QuickFilters } from '@/components/filters/QuickFilters'
import { MapCanvas } from '@/components/map/MapCanvas'
import { getBusynessMetric, VenueDetailPanel } from '@/components/venue/VenueDetailPanel'
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

const demoLocation = { kind: 'demo' } as const

type BrowserLocation = {
  lat: number
  lng: number
}

type LocationState = typeof demoLocation | ({ kind: 'browser' } & BrowserLocation)
type MobileSheetState = 'peek' | 'half' | 'full'

const buildVenueSearchParams = ({
  advanced,
  category,
  location,
  quickFilter,
  resultLimit
}: {
  advanced: AdvancedFilterState
  category: VenueCategory
  location: LocationState
  quickFilter?: VenueFilters['quickFilter']
  resultLimit: number
}) => {
  const params = new URLSearchParams({
    category,
    limit: String(resultLimit),
    radius: String(advanced.radius)
  })

  if (quickFilter) params.set('quickFilter', quickFilter)
  if (advanced.dayInt !== undefined) params.set('dayInt', String(advanced.dayInt))
  if (advanced.hour !== undefined) params.set('hour', String(advanced.hour))
  if (location.kind === 'browser') {
    params.set('lat', String(location.lat))
    params.set('lng', String(location.lng))
  }

  return params
}

const navItems = [
  { label: 'Map', icon: Map, href: '/', active: true },
  { label: 'City', icon: Building2, href: '/cities/new-york/nightlife', active: false },
  { label: 'Data', icon: Database, href: '/about-data', active: false },
  { label: 'Admin', icon: BarChart3, href: '/admin', active: false }
]

const mobileSheetHeightClass: Record<MobileSheetState, string> = {
  peek: 'h-[8.75rem]',
  half: 'h-[46dvh]',
  full: 'h-[82dvh]'
}

const expandMobileSheet = (current: MobileSheetState): MobileSheetState => {
  if (current === 'peek') return 'half'
  if (current === 'half') return 'full'
  return 'full'
}

const collapseMobileSheet = (current: MobileSheetState): MobileSheetState => {
  if (current === 'full') return 'half'
  return 'peek'
}

export function AppShell({ initialMode, initialVenues, initialCategory, resultLimit }: AppShellProps) {
  const [mode, setMode] = useState<AppMode>(initialMode)
  const [venues, setVenues] = useState<Venue[]>(initialVenues)
  const [selectedVenueId, setSelectedVenueId] = useState<string | undefined>(initialVenues[0]?.id)
  const [category, setCategory] = useState<VenueCategory>(initialCategory)
  const [quickFilter, setQuickFilter] = useState<VenueFilters['quickFilter']>()
  const [advanced, setAdvanced] = useState<AdvancedFilterState>(defaultAdvancedFilters)
  const [location, setLocation] = useState<LocationState>(demoLocation)
  const [locationPromptKey, setLocationPromptKey] = useState(0)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | undefined>()
  const [mobileSheetState, setMobileSheetState] = useState<MobileSheetState>('half')
  const [selectionPulse, setSelectionPulse] = useState(0)
  const sheetDragStartYRef = useRef<number | null>(null)
  const ignoreNextSheetClickRef = useRef(false)
  const lastSheetInteractionAtRef = useRef(0)
  const initialVenueSearchKeyRef = useRef(
    buildVenueSearchParams({
      advanced: defaultAdvancedFilters,
      category: initialCategory,
      location: demoLocation,
      resultLimit
    }).toString()
  )
  const fetchedChangedStateRef = useRef(initialMode === 'live')

  const venueSearchKey = useMemo(
    () => buildVenueSearchParams({ advanced, category, location, quickFilter, resultLimit }).toString(),
    [advanced, category, location, quickFilter, resultLimit]
  )

  const handleUseBrowserLocation = useCallback((browserLocation: BrowserLocation) => {
    setLocation({ kind: 'browser', ...browserLocation })
  }, [])

  const handleUseDemo = useCallback(() => {
    setLocation(demoLocation)
  }, [])

  const openLocationPrompt = useCallback(() => {
    setLocationPromptKey(current => current + 1)
  }, [])

  const selectVenue = useCallback((venueId: string) => {
    setSelectedVenueId(venueId)
    setSelectionPulse(current => current + 1)
    setMobileSheetState('half')
  }, [])

  const handleMobileMapInteraction = useCallback(() => {
    if (Date.now() - lastSheetInteractionAtRef.current < 500) return
    setMobileSheetState('peek')
  }, [])

  const handleSheetToggle = useCallback(() => {
    lastSheetInteractionAtRef.current = Date.now()
    if (ignoreNextSheetClickRef.current) {
      ignoreNextSheetClickRef.current = false
      return
    }

    setMobileSheetState(current => current === 'full' ? 'half' : expandMobileSheet(current))
  }, [])

  const handleSheetDragStart = useCallback((event: PointerEvent<HTMLSpanElement>) => {
    lastSheetInteractionAtRef.current = Date.now()
    sheetDragStartYRef.current = event.clientY
    event.currentTarget.setPointerCapture(event.pointerId)
  }, [])

  const handleSheetDragEnd = useCallback((event: PointerEvent<HTMLSpanElement>) => {
    const startY = sheetDragStartYRef.current
    sheetDragStartYRef.current = null
    if (startY === null) return

    const deltaY = event.clientY - startY
    if (deltaY > 36) {
      lastSheetInteractionAtRef.current = Date.now()
      ignoreNextSheetClickRef.current = true
      setMobileSheetState(collapseMobileSheet)
    }
    if (deltaY < -36) {
      lastSheetInteractionAtRef.current = Date.now()
      ignoreNextSheetClickRef.current = true
      setMobileSheetState(expandMobileSheet)
    }
  }, [])

  useEffect(() => {
    const isInitialServerState = venueSearchKey === initialVenueSearchKeyRef.current
    if (isInitialServerState && !fetchedChangedStateRef.current) {
      return
    }
    if (!isInitialServerState) fetchedChangedStateRef.current = true

    const controller = new AbortController()

    async function loadVenues() {
      setIsLoading(true)
      setError(undefined)

      try {
        const response = await fetch(`/api/besttime/venues?${venueSearchKey}`, {
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
  }, [venueSearchKey])

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
  const selectedVenueBusyness = selectedVenue ? getBusynessMetric(selectedVenue) : undefined
  const locationLabel = location.kind === 'browser' ? 'Near you' : 'NYC'
  const modeLabel = mode === 'live' ? 'Live data' : location.kind === 'browser' ? 'Near you demo' : 'NYC demo'

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
          <MapCanvas venues={visibleVenues} selectedVenueId={effectiveSelectedVenueId} onSelectVenue={selectVenue} />
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
                <p className="text-xs font-semibold uppercase tracking-wide text-teal-700">{modeLabel}</p>
                <h1 className="mt-1 text-xl font-semibold tracking-tight text-slate-950">
                  BestTime venues {location.kind === 'browser' ? 'near you' : 'in New York'}
                </h1>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <button
                  type="button"
                  onClick={openLocationPrompt}
                  className="inline-flex items-center gap-1.5 rounded-md border border-slate-200 px-2.5 py-1.5 text-xs font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50 hover:text-slate-950"
                >
                  <MapPin aria-hidden="true" className="h-3.5 w-3.5" />
                  Change
                </button>
                {isLoading ? <Loader2 aria-label="Loading venues" className="h-5 w-5 animate-spin text-slate-500" /> : null}
              </div>
            </div>
            {error ? <p className="mt-3 rounded-md bg-red-50 p-2 text-sm text-red-700">{error}</p> : null}
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto p-4">
            <VenueDetailPanel key={`${effectiveSelectedVenueId ?? 'empty'}-${selectionPulse}`} venue={selectedVenue} highlight={selectionPulse > 0} />
            <div className="mt-4">
              <VenueList venues={visibleVenues} selectedVenueId={effectiveSelectedVenueId} onSelectVenue={selectVenue} />
            </div>
          </div>
        </aside>
      </div>

      <div className="relative flex h-full flex-col md:hidden">
        <MapCanvas
          venues={visibleVenues}
          selectedVenueId={effectiveSelectedVenueId}
          onMapInteract={handleMobileMapInteraction}
          onSelectVenue={selectVenue}
        />
        <div className="pointer-events-none absolute left-0 right-[4.25rem] top-0 z-10 p-3">
          <div className="pointer-events-auto rounded-lg border border-white/70 bg-white/94 p-3 shadow-[var(--shadow-soft)] backdrop-blur">
            <div className="mb-3 flex items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="text-xs font-semibold uppercase tracking-wide text-teal-700">{modeLabel}</p>
                <h1 className="truncate text-base font-semibold text-slate-950">BestTime venues</h1>
              </div>
              <button
                type="button"
                onClick={openLocationPrompt}
                aria-label="Change location"
                className="inline-flex shrink-0 items-center gap-1 rounded-full bg-slate-100 px-2 py-1 text-xs font-semibold text-slate-600 transition hover:bg-slate-200 hover:text-slate-950"
              >
                <MapPin aria-hidden="true" className="h-3 w-3" />
                {locationLabel}
              </button>
            </div>
            <div className="grid gap-3">
              <CategoryChips value={category} onChange={setCategory} />
              <QuickFilters value={quickFilter} onChange={setQuickFilter} />
            </div>
          </div>
        </div>
        <section
          className={`safe-bottom fixed inset-x-0 bottom-[4.9rem] z-20 flex flex-col overflow-hidden rounded-t-lg border-t border-slate-200 bg-slate-50 shadow-[0_-18px_45px_rgb(15_23_42/0.16)] transition-[height] duration-200 ease-out ${mobileSheetHeightClass[mobileSheetState]}`}
          data-state={mobileSheetState}
          data-testid="mobile-venue-sheet"
        >
          <button
            type="button"
            aria-label="Resize venue sheet"
            className="grid shrink-0 gap-3 px-3 pb-3 pt-2 text-left"
            data-testid="mobile-sheet-toggle"
            onClick={handleSheetToggle}
          >
            <span
              className="mx-auto h-1.5 w-12 rounded-full bg-slate-300"
              aria-hidden="true"
              onPointerDown={handleSheetDragStart}
              onPointerUp={handleSheetDragEnd}
              onPointerCancel={() => {
                sheetDragStartYRef.current = null
              }}
            />
            <span className="flex items-center justify-between gap-3 rounded-md border border-slate-200 bg-white px-3 py-2 shadow-sm">
              <span className="min-w-0">
                <span className="block truncate text-sm font-semibold text-slate-950">
                  {selectedVenue?.name ?? 'Select a venue'}
                </span>
                <span className="mt-0.5 block truncate text-xs text-slate-500">
                  {selectedVenueBusyness ? `${selectedVenueBusyness.value} ${selectedVenueBusyness.label.toLowerCase()}` : `${visibleVenues.length} venues nearby`}
                </span>
              </span>
              <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-slate-100 px-2 py-1 text-xs font-semibold text-slate-600">
                {mobileSheetState === 'full' ? 'Less' : 'More'}
                <ChevronUp aria-hidden="true" className={`h-3.5 w-3.5 transition ${mobileSheetState === 'full' ? 'rotate-180' : ''}`} />
              </span>
            </span>
          </button>
          <div className={`min-h-0 flex-1 overflow-y-auto px-3 pb-[max(1.25rem,calc(env(safe-area-inset-bottom)+1rem))] scroll-pb-6 ${mobileSheetState === 'peek' ? 'hidden' : 'block'}`}>
            <div className="mb-3">
              <AdvancedFilters value={advanced} onChange={setAdvanced} />
            </div>
            {error ? <p className="mb-3 rounded-md bg-red-50 p-2 text-sm text-red-700">{error}</p> : null}
            {selectedVenue ? (
              <VenueDetailPanel key={`${effectiveSelectedVenueId ?? 'empty'}-${selectionPulse}-mobile`} venue={selectedVenue} highlight={selectionPulse > 0} />
            ) : (
              <VenueList venues={visibleVenues} selectedVenueId={effectiveSelectedVenueId} onSelectVenue={selectVenue} />
            )}
            <div className="mt-3 flex justify-center">
              <Attribution />
            </div>
          </div>
        </section>
        <BottomNav />
      </div>
      <LocationModal
        onUseBrowserLocation={handleUseBrowserLocation}
        onUseDemo={handleUseDemo}
        promptRequestKey={locationPromptKey}
      />
    </main>
  )
}
