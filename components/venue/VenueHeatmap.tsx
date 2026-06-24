import type { VenueDay } from '@/lib/types'
import { formatCompactHourLabel } from '@/lib/venue-display'

type VenueHeatmapProps = {
  currentDayInt?: number
  currentHour?: number
  embedded?: boolean
  week: VenueDay[]
}

const heatClass = (busyness: number) => {
  if (busyness >= 70) return 'bg-[#ff5b5b]'
  if (busyness >= 40) return 'bg-[#ffd166]'
  if (busyness >= 1) return 'bg-[#23b43a]'
  return 'bg-[#e9eef8]'
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

const getWeeklyInsights = (week: VenueDay[]) => {
  const strongest = week.flatMap(day => day.hours.map(hour => ({ day, hour }))).reduce((best, current) => (
    current.hour.busyness > best.hour.busyness ? current : best
  ), { day: week[0], hour: week[0]?.hours[0] ?? { hour: 0, busyness: 0 } })

  const volumeLeader = week.map(day => {
    const total = day.hours.reduce((sum, hour) => sum + hour.busyness, 0)
    return {
      day,
      average: Math.round(total / Math.max(day.hours.length, 1))
    }
  }).reduce((best, current) => (current.average > best.average ? current : best), {
    day: week[0],
    average: 0
  })

  return {
    peak: strongest.day
      ? `Strongest peak occurs ${strongest.day.dayLabel} at ${formatCompactHourLabel(strongest.hour.hour)}, reaching ${strongest.hour.busyness}% busyness.`
      : 'Strongest peak is not available yet.',
    volume: volumeLeader.day
      ? `${volumeLeader.day.dayLabel} carries the largest volume this week at ${volumeLeader.average}% of the venue's weekly high.`
      : 'Largest volume day is not available yet.'
  }
}

export function VenueHeatmap({ currentDayInt, currentHour, embedded = false, week }: VenueHeatmapProps) {
  const hours = getVisibleHeatmapHours(week)
  const gridMinWidth = Math.max(680, 84 + hours.length * 52)
  const insights = getWeeklyInsights(week)
  const shellClassName = embedded
    ? 'min-w-0 rounded-[24px] border border-slate-200/80 bg-white/90 p-4 shadow-[0_18px_50px_rgb(22_34_62_/_0.10)] sm:p-5'
    : 'min-w-0 border-y border-slate-200 bg-white py-8'
  const contentClassName = embedded
    ? 'min-w-0 w-full'
    : 'mx-auto min-w-0 w-full max-w-6xl px-4 sm:px-6 lg:px-8'

  return (
    <section aria-labelledby="weekly-heatmap-heading" className={shellClassName}>
      <div className={contentClassName}>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 id="weekly-heatmap-heading" className="text-base font-bold text-[#1d2b4f]">
              Weekly visitor heatmap
            </h2>
          </div>
          <div className="flex flex-wrap items-center gap-3 text-xs font-bold text-slate-500">
            <span className="inline-flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-[#23b43a]" />Not busy</span>
            <span className="inline-flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-[#ffd166]" />Usually a little busy</span>
            <span className="inline-flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-[#ff0000]" />As busy as it gets</span>
          </div>
        </div>

        <div className="mt-5 max-w-full overflow-x-auto pb-3" role="region" aria-label="Weekly busyness heatmap">
          <div
            className="grid gap-1.5"
            style={{
              gridTemplateColumns: `4.25rem repeat(${hours.length}, minmax(2.25rem, 1fr))`,
              minWidth: `${gridMinWidth}px`
            }}
          >
            <div aria-hidden="true" />
            {hours.map(hour => (
              <div key={hour} className="pb-1 text-center text-[0.68rem] font-semibold text-slate-500">
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
                  const isCurrent = day.dayInt === currentDayInt && hour === currentHour

                  return (
                    <div
                      key={`${day.dayInt}-${hour}`}
                      aria-label={`${day.dayLabel} ${formatCompactHourLabel(hour)} ${busyness}% busy`}
                      title={`${day.dayLabel} ${formatCompactHourLabel(hour)}: ${busyness}% busy`}
                      className={`relative h-8 rounded-md ${heatClass(busyness)} ${isCurrent ? 'ring-2 ring-blue-500 ring-offset-2' : ''}`}
                    >
                      <span className="sr-only">{busyness}</span>
                    </div>
                  )
                })}
              </div>
            ))}
          </div>
        </div>

        <div className="mt-3 grid gap-3">
          <SummaryTile label="Strongest peak" value={insights.peak} />
          <SummaryTile label="Largest volume day" value={insights.volume} />
        </div>
      </div>
    </section>
  )
}

function SummaryTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3">
      <p className="text-[0.68rem] font-bold uppercase tracking-[0.08em] text-slate-500">{label}</p>
      <p className="mt-1 text-sm font-semibold leading-5 text-[#1d2b4f]">{value}</p>
    </div>
  )
}
