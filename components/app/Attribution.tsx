import Link from 'next/link'
import { siteConfig } from '@/lib/config'

export function Attribution() {
  if (siteConfig.attributionMode === 'off') return null

  return (
    <div className="pointer-events-auto inline-flex max-w-full items-center gap-2 rounded-full border border-black/10 bg-white/92 px-3 py-2 text-[0.72rem] font-medium text-slate-600 shadow-sm backdrop-blur">
      <span className="truncate">Foot traffic data by</span>
      <a
        href="https://besttime.app"
        target="_blank"
        rel="noopener noreferrer"
        className="shrink-0 text-slate-950 underline-offset-2 hover:underline"
      >
        BestTime
      </a>
      <span className="text-slate-300">/</span>
      <Link href="/about-data" className="shrink-0 underline-offset-2 hover:text-slate-950 hover:underline">
        About data
      </Link>
    </div>
  )
}
