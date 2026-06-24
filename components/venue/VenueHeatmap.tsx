import type { VenueDay } from '@/lib/types'
import { formatCompactHourLabel } from '@/lib/venue-display'

type VenueHeatmapProps = {
  week: VenueDay[]
}

const heatClass = (busyness: number) => {
  if (busyness >= 85) return 'bg-rose-600 text-white'
  if (busyness >= 70) return 'bg-orange-500 text-white'
  if (busyness >= 55) return 'bg-amber-400 text-slate-950'
  if (busyness >= 35) return 'bg-teal-300 text-slate-950'
  if (busyness >= 15) return 'bg-cyan-100 text-slate-700'
  return 'bg-slate-100 text-slate-500'
}

export const getVisibleHeatmapHours = (week: VenueDay[], padding = 1) => {
  const hourOrder = week[0]?.hours.map(hour => hour.hour) ?? []
  const hourIndex = new Map(hourOrder.map((hour, index) => [hour, index]))
  const activeIndexes = new Set<number>()
  const hourCount = hourOrder.length

  if (hourCount <= 2) return hourOrder

  for (const day of week) {
    for (const hour of day.hours) {
      const index = hourIndex.get(hour.hour)
      if (index !== undefined && hour.busyness > 0) activeIndexes.add(index)
    }
  }

  if (activeIndexes.size === 0 || activeIndexes.size >= hourCount - 1) return hourOrder

  const sortedIndexes = [...activeIndexes].sort((a, b) => a - b)
  let largestGap = -1
  let visibleStart = sortedIndexes[0]
  let visibleEnd = sortedIndexes[sortedIndexes.length - 1]

  for (let index = 0; index < sortedIndexes.length; index += 1) {
    const current = sortedIndexes[index]
    const next = sortedIndexes[(index + 1) % sortedIndexes.length]
    const gap = (next - current - 1 + hourCount) % hourCount

    if (gap > largestGap) {
      largestGap = gap
      visibleStart = next
      visibleEnd = current
    }
  }

  const start = (visibleStart - padding + hourCount) % hourCount
  const end = (visibleEnd + padding) % hourCount
  const visibleHours: number[] = []
  let index = start

  while (visibleHours.length < hourCount) {
    visibleHours.push(hourOrder[index])
    if (index === end) break
    index = (index + 1) % hourCount
  }

  return visibleHours.length >= hourCount ? hourOrder : visibleHours
}

export function VenueHeatmap({ week }: VenueHeatmapProps) {
  const hours = getVisibleHeatmapHours(week)
  const gridMinWidth = Math.max(560, 88 + hours.length * 44)

  return (
    <section aria-labelledby="weekly-heatmap-heading" className="border-y border-slate-200 bg-white py-8">
      <div className="mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 id="weekly-heatmap-heading" className="text-xl font-semibold text-slate-950">
              Weekly busyness forecast
            </h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
              Hour-by-hour relative foot traffic from 0 to 100, focused on open forecast windows.
            </p>
          </div>
          <div className="flex items-center gap-2 text-xs font-medium text-slate-500">
            <span>Quiet</span>
            <span className="h-2 w-16 rounded-full bg-gradient-to-r from-slate-100 via-amber-400 to-rose-600" />
            <span>Busy</span>
          </div>
        </div>

        <div className="mt-5 overflow-x-auto pb-3" role="region" aria-label="Weekly busyness heatmap">
          <div
            className="grid gap-1"
            style={{
              gridTemplateColumns: `5.5rem repeat(${hours.length}, minmax(1.75rem, 1fr))`,
              minWidth: `${gridMinWidth}px`
            }}
          >
            <div aria-hidden="true" />
            {hours.map(hour => (
              <div key={hour} className="text-center text-[0.68rem] font-semibold text-slate-500">
                {formatCompactHourLabel(hour)}
              </div>
            ))}

            {week.map(day => (
              <div key={day.dayInt} className="contents">
                <div className="flex h-8 items-center pr-2 text-xs font-semibold text-slate-700">
                  {day.dayLabel.slice(0, 3)}
                </div>
                {hours.map(hour => {
                  const busyness = day.hours.find(dayHour => dayHour.hour === hour)?.busyness ?? 0

                  return (
                    <div
                      key={`${day.dayInt}-${hour}`}
                      aria-label={`${day.dayLabel} ${formatCompactHourLabel(hour)} ${busyness}% busy`}
                      title={`${day.dayLabel} ${formatCompactHourLabel(hour)}: ${busyness}% busy`}
                      className={`flex h-8 items-center justify-center rounded-sm text-[0.65rem] font-semibold ${heatClass(busyness)}`}
                    >
                      {busyness}
                    </div>
                  )
                })}
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
