'use client'

import type { VenueCategory } from '@/lib/types'

const categories: { value: VenueCategory; label: string }[] = [
  { value: 'nightlife', label: 'Nightlife' },
  { value: 'cafes', label: 'Cafes' },
  { value: 'shopping', label: 'Shopping' },
  { value: 'popular', label: 'Popular' }
]

type CategoryChipsProps = {
  value: VenueCategory
  onChange: (category: VenueCategory) => void
}

export function CategoryChips({ value, onChange }: CategoryChipsProps) {
  return (
    <div aria-label="Venue categories" className="flex gap-2 overflow-x-auto pb-1">
      {categories.map(category => {
        const selected = category.value === value

        return (
          <button
            key={category.value}
            type="button"
            aria-pressed={selected}
            onClick={() => onChange(category.value)}
            className={`h-10 shrink-0 rounded-full border px-4 text-sm font-semibold transition ${
              selected
                ? 'border-slate-950 bg-slate-950 text-white'
                : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50'
            }`}
          >
            {category.label}
          </button>
        )
      })}
    </div>
  )
}
