'use client'

import { useState } from 'react'
import { Database, Save, Settings2 } from 'lucide-react'
import { defaultAdminSettings, localStorageKey, type LocalAdminSettings } from '@/lib/admin/settings'
import type { VenueCategory } from '@/lib/types'

type AdminSettingsPanelProps = {
  mode: 'demo' | 'live'
  protectedByPassword: boolean
  indexingEnabled: boolean
}

const categories: VenueCategory[] = ['nightlife', 'cafes', 'shopping', 'popular']
const attributionModes = ['subtle', 'visible']

const parseStoredSettings = (raw: string | null): LocalAdminSettings => {
  if (!raw) return defaultAdminSettings

  try {
    return { ...defaultAdminSettings, ...JSON.parse(raw) }
  } catch {
    return defaultAdminSettings
  }
}

export function AdminSettingsPanel({ mode, protectedByPassword, indexingEnabled }: AdminSettingsPanelProps) {
  const [settings, setSettings] = useState<LocalAdminSettings>(() => {
    if (typeof window === 'undefined') return defaultAdminSettings
    return parseStoredSettings(window.localStorage.getItem(localStorageKey))
  })
  const [saved, setSaved] = useState(false)

  const update = (next: LocalAdminSettings) => {
    setSettings(next)
    window.localStorage.setItem(localStorageKey, JSON.stringify(next))
    setSaved(true)
    window.setTimeout(() => setSaved(false), 1400)
  }

  return (
    <section className="rounded-md border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex h-10 w-10 items-center justify-center rounded-md bg-slate-100">
            <Settings2 aria-hidden="true" className="h-5 w-5 text-slate-700" />
          </div>
          <h1 className="mt-5 text-2xl font-semibold text-slate-950">Starter admin</h1>
          <p className="mt-2 text-sm leading-6 text-slate-600">Local demo settings stored in this browser.</p>
        </div>
        <span className={`rounded-full px-3 py-1 text-xs font-semibold ${protectedByPassword ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}`}>
          {protectedByPassword ? 'Password protected' : 'Unprotected'}
        </span>
      </div>

      <div className="mt-7 grid gap-4 md:grid-cols-2">
        <label className="grid gap-2 text-sm font-medium text-slate-700">
          Default city
          <input
            className="rounded-md border border-slate-300 px-3 py-2 text-slate-950 outline-none transition focus:border-slate-950"
            value={settings.defaultCity}
            onChange={event => update({ ...settings, defaultCity: event.target.value })}
          />
        </label>

        <label className="grid gap-2 text-sm font-medium text-slate-700">
          Default category
          <select
            className="rounded-md border border-slate-300 px-3 py-2 text-slate-950 outline-none transition focus:border-slate-950"
            value={settings.defaultCategory}
            onChange={event => update({ ...settings, defaultCategory: event.target.value })}
          >
            {categories.map(category => (
              <option key={category} value={category}>{category}</option>
            ))}
          </select>
        </label>

        <label className="grid gap-2 text-sm font-medium text-slate-700">
          Result limit
          <input
            type="number"
            min={1}
            max={100}
            className="rounded-md border border-slate-300 px-3 py-2 text-slate-950 outline-none transition focus:border-slate-950"
            value={settings.resultLimit}
            onChange={event => update({ ...settings, resultLimit: Number(event.target.value) })}
          />
        </label>

        <label className="grid gap-2 text-sm font-medium text-slate-700">
          Attribution mode
          <select
            className="rounded-md border border-slate-300 px-3 py-2 text-slate-950 outline-none transition focus:border-slate-950"
            value={settings.attributionMode}
            onChange={event => update({ ...settings, attributionMode: event.target.value })}
          >
            {attributionModes.map(mode => (
              <option key={mode} value={mode}>{mode}</option>
            ))}
          </select>
        </label>
      </div>

      <div className="mt-6 grid gap-3 rounded-md bg-slate-50 p-4 text-sm text-slate-700 md:grid-cols-3">
        <StatusItem label="API mode" value={mode} icon={<Database aria-hidden="true" className="h-4 w-4 text-teal-700" />} />
        <StatusItem label="Indexing" value={indexingEnabled ? 'on' : 'off'} icon={<Settings2 aria-hidden="true" className="h-4 w-4 text-slate-600" />} />
        <StatusItem label="Settings" value={saved ? 'saved' : 'local'} icon={<Save aria-hidden="true" className="h-4 w-4 text-slate-600" />} />
      </div>
    </section>
  )
}

function StatusItem({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div>
      <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
        {icon}
        {label}
      </div>
      <p className="mt-2 text-sm font-semibold capitalize text-slate-950">{value}</p>
    </div>
  )
}
