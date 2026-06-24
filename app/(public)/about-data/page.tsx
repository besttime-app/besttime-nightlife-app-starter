import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowLeft, Database, ShieldCheck, Signal } from 'lucide-react'
import { canonicalUrl } from '@/lib/seo'

const pagePath = '/about-data'

export const metadata: Metadata = {
  title: 'About foot traffic data',
  description: 'How this starter uses BestTime forecast and live public venue busyness data.',
  alternates: { canonical: canonicalUrl(pagePath) },
  openGraph: {
    title: 'About foot traffic data',
    description: 'How this starter uses BestTime forecast and live public venue busyness data.',
    url: canonicalUrl(pagePath),
    type: 'website'
  }
}

export default function AboutDataPage() {
  return (
    <main className="min-h-dvh bg-slate-50 text-slate-950">
      <article className="mx-auto w-full max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
        <Link href="/" className="inline-flex items-center gap-2 text-sm font-semibold text-slate-700 underline-offset-2 hover:text-slate-950 hover:underline">
          <ArrowLeft aria-hidden="true" className="h-4 w-4" />
          Back to app
        </Link>

        <header className="mt-8 border-b border-slate-200 pb-8">
          <p className="text-xs font-semibold uppercase tracking-wide text-teal-800">Data source</p>
          <h1 className="mt-3 text-3xl font-semibold leading-tight sm:text-4xl">About the foot traffic data</h1>
          <p className="mt-4 max-w-3xl text-base leading-7 text-slate-700">
            This starter demonstrates how consumer apps can use BestTime forecast and live public venue busyness data to
            recommend the right place at the right time.
          </p>
        </header>

        <div className="grid gap-4 py-8 md:grid-cols-3">
          <DataPoint
            icon={<Database aria-hidden="true" className="h-5 w-5 text-teal-700" />}
            title="Weekly forecast"
            body="Forecast data describes typical venue patterns across the full week using relative 0-100 busyness scores."
          />
          <DataPoint
            icon={<Signal aria-hidden="true" className="h-5 w-5 text-teal-700" />}
            title="Live signal"
            body="Live data, when available, compares current activity against expected activity for the local hour."
          />
          <DataPoint
            icon={<ShieldCheck aria-hidden="true" className="h-5 w-5 text-teal-700" />}
            title="Public venue data"
            body="BestTime exposes relative public venue busyness signals, not people tracking or absolute visitor counts."
          />
        </div>

        <section className="border-t border-slate-200 py-8">
          <h2 className="text-xl font-semibold">Coverage and limits</h2>
          <p className="mt-3 text-sm leading-6 text-slate-700">
            Coverage and live availability vary by venue and region. This demo ships with New York fixture data so the
            starter works immediately, then switches to live server-side BestTime API calls when a private API key is
            configured.
          </p>
          <p className="mt-4 text-sm leading-6 text-slate-700">
            Learn more at the <a href="https://besttime.app" className="font-semibold underline-offset-2 hover:underline">BestTime</a>{' '}
            API website, review the <a href="https://besttime.app/api/v1/docs" className="font-semibold underline-offset-2 hover:underline">docs</a>,
            or compare API <a href="https://besttime.app/pricing" className="font-semibold underline-offset-2 hover:underline">pricing</a>.
          </p>
        </section>
      </article>
    </main>
  )
}

function DataPoint({ icon, title, body }: { icon: React.ReactNode; title: string; body: string }) {
  return (
    <section className="rounded-md border border-slate-200 bg-white p-4">
      {icon}
      <h2 className="mt-4 text-sm font-semibold">{title}</h2>
      <p className="mt-2 text-sm leading-6 text-slate-600">{body}</p>
    </section>
  )
}
