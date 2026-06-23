'use client'

import { useEffect, useState } from 'react'
import { MapPin, Navigation, X } from 'lucide-react'

const storageKey = 'besttime.location-choice'

type LocationChoice = 'browser' | 'nyc-demo' | 'dismissed'

export function LocationModal() {
  const [open, setOpen] = useState(false)
  const [status, setStatus] = useState<string>('Use your current area or start with the NYC demo venues.')

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setOpen(!window.localStorage.getItem(storageKey))
    }, 0)

    return () => {
      window.clearTimeout(timer)
    }
  }, [])

  const saveChoice = (choice: LocationChoice) => {
    window.localStorage.setItem(storageKey, choice)
    setOpen(false)
  }

  const requestLocation = () => {
    if (!navigator.geolocation) {
      setStatus('Location is not available in this browser. NYC demo is ready.')
      return
    }

    setStatus('Requesting browser location...')
    navigator.geolocation.getCurrentPosition(
      () => saveChoice('browser'),
      () => setStatus('Location was not shared. You can continue with the NYC demo.')
    )
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 grid place-items-end bg-slate-950/32 p-3 sm:place-items-center">
      <section
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
            onClick={() => saveChoice('dismissed')}
            className="grid h-9 w-9 shrink-0 place-items-center rounded-md text-slate-500 transition hover:bg-slate-100 hover:text-slate-950"
          >
            <X aria-hidden="true" className="h-4 w-4" />
          </button>
        </div>
        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          <button
            type="button"
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
