'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { MapPin, Navigation, X } from 'lucide-react'

const storageKey = 'besttime.location-choice'
const coordinatesStorageKey = 'besttime.location-coordinates'

type LocationChoice = 'browser' | 'nyc-demo'
type BrowserLocation = {
  lat: number
  lng: number
}

type LocationModalProps = {
  onUseBrowserLocation: (location: BrowserLocation) => void
  onUseDemo: () => void
}

const readStoredLocation = (): BrowserLocation | undefined => {
  const stored = window.localStorage.getItem(coordinatesStorageKey)
  if (!stored) return undefined

  try {
    const parsed = JSON.parse(stored) as Partial<BrowserLocation>
    return typeof parsed.lat === 'number' && typeof parsed.lng === 'number' ? { lat: parsed.lat, lng: parsed.lng } : undefined
  } catch {
    return undefined
  }
}

export function LocationModal({ onUseBrowserLocation, onUseDemo }: LocationModalProps) {
  const [open, setOpen] = useState(false)
  const [status, setStatus] = useState<string>('Use your current area or start with the NYC demo venues.')
  const primaryActionRef = useRef<HTMLButtonElement | null>(null)

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const storedChoice = window.localStorage.getItem(storageKey)
      const storedLocation = storedChoice === 'browser' ? readStoredLocation() : undefined

      if (storedLocation) {
        onUseBrowserLocation(storedLocation)
        return
      }

      if (storedChoice === 'nyc-demo') {
        onUseDemo()
        return
      }

      setOpen(true)
    }, 0)

    return () => {
      window.clearTimeout(timer)
    }
  }, [onUseBrowserLocation, onUseDemo])

  const saveChoice = useCallback((choice: LocationChoice, location?: BrowserLocation) => {
    window.localStorage.setItem(storageKey, choice)
    if (location) {
      window.localStorage.setItem(coordinatesStorageKey, JSON.stringify(location))
    } else {
      window.localStorage.removeItem(coordinatesStorageKey)
      onUseDemo()
    }
    setOpen(false)
  }, [onUseDemo])

  useEffect(() => {
    if (!open) return

    primaryActionRef.current?.focus()
  }, [open])

  useEffect(() => {
    if (!open) return

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') saveChoice('nyc-demo')
    }

    window.addEventListener('keydown', handleKeyDown)

    return () => {
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [open, saveChoice])

  const requestLocation = () => {
    if (!navigator.geolocation) {
      setStatus('Location is not available in this browser. NYC demo is ready.')
      return
    }

    setStatus('Requesting browser location...')
    navigator.geolocation.getCurrentPosition(
      position => {
        const location = {
          lat: position.coords.latitude,
          lng: position.coords.longitude
        }

        onUseBrowserLocation(location)
        saveChoice('browser', location)
      },
      () => setStatus('Location was not shared. You can continue with the NYC demo.')
    )
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 grid place-items-end bg-slate-950/32 p-3 sm:place-items-center">
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="location-title"
        className="w-full max-w-md rounded-lg border border-slate-200 bg-white p-5 shadow-[var(--shadow-soft)]"
      >
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="grid h-10 w-10 shrink-0 place-items-center rounded-md bg-teal-50 text-teal-700">
              <MapPin aria-hidden="true" className="h-5 w-5" />
            </div>
            <div>
              <h2 id="location-title" className="text-base font-semibold text-slate-950">
                Choose a starting location
              </h2>
              <p className="mt-1 text-sm leading-5 text-slate-600">{status}</p>
            </div>
          </div>
          <button
            type="button"
            aria-label="Close location prompt"
            onClick={() => saveChoice('nyc-demo')}
            className="grid h-9 w-9 shrink-0 place-items-center rounded-md text-slate-500 transition hover:bg-slate-100 hover:text-slate-950"
          >
            <X aria-hidden="true" className="h-4 w-4" />
          </button>
        </div>
        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          <button
            type="button"
            ref={primaryActionRef}
            onClick={requestLocation}
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-md bg-slate-950 px-4 text-sm font-semibold text-white transition hover:bg-slate-800"
          >
            <Navigation aria-hidden="true" className="h-4 w-4" />
            Use my location
          </button>
          <button
            type="button"
            onClick={() => saveChoice('nyc-demo')}
            className="inline-flex min-h-11 items-center justify-center rounded-md border border-slate-200 px-4 text-sm font-semibold text-slate-800 transition hover:bg-slate-50"
          >
            Explore NYC demo
          </button>
        </div>
      </section>
    </div>
  )
}
