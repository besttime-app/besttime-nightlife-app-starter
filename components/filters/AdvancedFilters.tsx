'use client'

import { SlidersHorizontal } from 'lucide-react'

export type AdvancedFilterState = {
  radius: number
  minRating: number
  liveOnly: boolean
}

type AdvancedFiltersProps = {
  value: AdvancedFilterState
  onChange: (value: AdvancedFilterState) => void
}

export function AdvancedFilters({ value, onChange }: AdvancedFiltersProps) {
  return (
    <details className="group rounded-md border border-slate-200 bg-white">
      <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-3 px-3 text-sm font-semibold text-slate-800 marker:hidden">
        <span className="inline-flex items-center gap-2">
          <SlidersHorizontal aria-hidden="true" className="h-4 w-4" />
          Advanced filters
        </span>
        <span className="text-xs font-medium text-slate-500 group-open:hidden">Show</span>
        <span className="hidden text-xs font-medium text-slate-500 group-open:inline">Hide</span>
      </summary>
      <div className="grid gap-4 border-t border-slate-100 p-3">
        <label className="grid gap-2 text-sm font-medium text-slate-700">
          Search radius
          <select
            value={value.radius}
            onChange={event => onChange({ ...value, radius: Number(event.target.value) })}
            className="h-10 rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-900 outline-none focus:border-teal-700"
          >
            <option value={800}>0.5 miles</option>
            <option value={1600}>1 mile</option>
            <option value={3200}>2 miles</option>
          </select>
        </label>
        <label className="grid gap-2 text-sm font-medium text-slate-700">
          Minimum rating
          <input
            type="range"
            min="0"
            max="5"
            step="0.1"
            value={value.minRating}
            onChange={event => onChange({ ...value, minRating: Number(event.target.value) })}
            className="accent-teal-700"
          />
          <span className="text-xs text-slate-500">{value.minRating.toFixed(1)} stars and up</span>
        </label>
        <label className="flex min-h-10 items-center justify-between gap-3 rounded-md bg-slate-50 px-3 text-sm font-medium text-slate-700">
          Live data available
          <input
            type="checkbox"
            checked={value.liveOnly}
            onChange={event => onChange({ ...value, liveOnly: event.target.checked })}
            className="h-4 w-4 accent-teal-700"
          />
        </label>
      </div>
    </details>
  )
}
