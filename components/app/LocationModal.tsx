'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { MapPin, Navigation, X } from 'lucide-react'

const storageKey = 'besttime.location-choice'
const coordinatesStorageKey = 'besttime.location-coordinates'
const focusableSelector = [
  'a[href]',
  'button:not([disabled])',
  'textarea:not([disabled])',
  'input:not([disabled])',
  'select:not([disabled])',
  '[tabindex]:not([tabindex="-1"])'
].join(',')

type LocationChoice = 'browser' | 'nyc-demo'
type BrowserLocation = {
  lat: number
  lng: number
}

type LocationModalProps = {
  onUseBrowserLocation: (location: BrowserLocation) => void
  onUseDemo: () => void
  promptRequestKey?: number
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

const getFocusableElements = (container: HTMLElement) =>
  Array.from(container.querySelectorAll<HTMLElement>(focusableSelector)).filter(element => element.offsetParent !== null)

export function LocationModal({ onUseBrowserLocation, onUseDemo, promptRequestKey = 0 }: LocationModalProps) {
  const [open, setOpen] = useState(false)
  const [status, setStatus] = useState<string>('Use your current area or start with the NYC demo venues.')
  const dialogRef = useRef<HTMLElement | null>(null)
  const primaryActionRef = useRef<HTMLButtonElement | null>(null)
  const previousFocusRef = useRef<HTMLElement | null>(null)

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

  useEffect(() => {
    if (promptRequestKey === 0) return

    const timer = window.setTimeout(() => {
      setStatus('Switch to your current area or return to the NYC demo venues.')
      setOpen(true)
    }, 0)

    return () => {
      window.clearTimeout(timer)
    }
  }, [promptRequestKey])

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

    previousFocusRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null
    primaryActionRef.current?.focus()

    return () => {
      const previousFocus = previousFocusRef.current
      if (previousFocus?.isConnected) previousFocus.focus()
      previousFocusRef.current = null
    }
  }, [open])

  useEffect(() => {
    if (!open) return

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        saveChoice('nyc-demo')
        return
      }

      if (event.key !== 'Tab') return

      const dialog = dialogRef.current
      if (!dialog) return

      const focusableElements = getFocusableElements(dialog)
      const firstElement = focusableElements[0]
      const lastElement = focusableElements.at(-1)

      if (!firstElement || !lastElement) {
        event.preventDefault()
        dialog.focus()
        return
      }

      const activeElement = document.activeElement
      const focusIsInsideDialog = activeElement instanceof Node && dialog.contains(activeElement)

      if (event.shiftKey) {
        if (!focusIsInsideDialog || activeElement === firstElement) {
          event.preventDefault()
          lastElement.focus()
        }
        return
      }

      if (!focusIsInsideDialog || activeElement === lastElement) {
        event.preventDefault()
        firstElement.focus()
      }
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
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="location-title"
        tabIndex={-1}
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
