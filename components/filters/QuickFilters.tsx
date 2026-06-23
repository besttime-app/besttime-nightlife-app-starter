'use client'

import { Clock3, Moon, Sparkles, Star } from 'lucide-react'
import type { VenueFilters } from '@/lib/types'

type QuickFilter = NonNullable<VenueFilters['quickFilter']>

const filters: { value: QuickFilter; label: string; icon: typeof Clock3 }[] = [
  { value: 'busy-now', label: 'Busy now', icon: Sparkles },
  { value: 'friday-night', label: 'Friday night', icon: Moon },
  { value: 'quiet-spots', label: 'Quieter spots', icon: Clock3 },
  { value: 'high-review', label: 'High review', icon: Star }
]

type QuickFiltersProps = {
  value?: QuickFilter
  onChange: (filter?: QuickFilter) => void
}

export function QuickFilters({ value, onChange }: QuickFiltersProps) {
  return (
    <div aria-label="Quick filters" className="grid grid-cols-2 gap-2 lg:grid-cols-4">
      {filters.map(filter => {
        const selected = filter.value === value
        const Icon = filter.icon

        return (
          <button
            key={filter.value}
            type="button"
            aria-pressed={selected}
            onClick={() => onChange(selected ? undefined : filter.value)}
            className={`inline-flex min-h-10 items-center justify-center gap-2 rounded-md border px-3 text-sm font-semibold transition ${
              selected
                ? 'border-teal-700 bg-teal-700 text-white'
                : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50'
            }`}
          >
            <Icon aria-hidden="true" className="h-4 w-4 shrink-0" />
            <span className="truncate">{filter.label}</span>
          </button>
        )
      })}
    </div>
  )
}
