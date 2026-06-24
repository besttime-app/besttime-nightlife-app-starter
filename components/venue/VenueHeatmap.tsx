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

export function VenueHeatmap({ week }: VenueHeatmapProps) {
  const hours = week[0]?.hours.map(hour => hour.hour) ?? []

  return (
    <section aria-labelledby="weekly-heatmap-heading" className="border-y border-slate-200 bg-white py-8">
      <div className="mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 id="weekly-heatmap-heading" className="text-xl font-semibold text-slate-950">
              Weekly busyness forecast
            </h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
              Hour-by-hour relative foot traffic from 0 to 100. Warmer cells indicate busier windows.
            </p>
          </div>
          <div className="flex items-center gap-2 text-xs font-medium text-slate-500">
            <span>Quiet</span>
            <span className="h-2 w-16 rounded-full bg-gradient-to-r from-slate-100 via-amber-400 to-rose-600" />
            <span>Busy</span>
          </div>
        </div>

        <div className="mt-5 overflow-x-auto pb-3" role="region" aria-label="Weekly busyness heatmap">
          <div className="grid min-w-[880px] gap-1" style={{ gridTemplateColumns: `5.5rem repeat(${hours.length}, minmax(1.75rem, 1fr))` }}>
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
                {day.hours.map(hour => (
                  <div
                    key={`${day.dayInt}-${hour.hour}`}
                    aria-label={`${day.dayLabel} ${formatCompactHourLabel(hour.hour)} ${hour.busyness}% busy`}
                    title={`${day.dayLabel} ${formatCompactHourLabel(hour.hour)}: ${hour.busyness}% busy`}
                    className={`flex h-8 items-center justify-center rounded-sm text-[0.65rem] font-semibold ${heatClass(hour.busyness)}`}
                  >
                    {hour.busyness}
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
