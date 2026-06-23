'use client'

import Link from 'next/link'
import { BarChart3, Building2, Database, Map } from 'lucide-react'

const navItems = [
  { label: 'Map', icon: Map, href: '/', active: true },
  { label: 'City', icon: Building2, href: '/cities/new-york/nightlife', active: false },
  { label: 'Data', icon: Database, href: '/about-data', active: false },
  { label: 'Admin', icon: BarChart3, href: '/admin', active: false }
]

export function BottomNav() {
  return (
    <nav aria-label="Mobile" className="fixed inset-x-0 bottom-0 z-30 border-t border-slate-200 bg-white/96 px-2 pt-2 shadow-[0_-12px_30px_rgb(15_23_42/0.10)] backdrop-blur md:hidden">
      <div className="safe-bottom grid grid-cols-4 gap-1">
        {navItems.map(({ label, icon: Icon, href, active }) => (
          <Link
            key={label}
            href={href}
            aria-current={active ? 'page' : undefined}
            className={`flex min-h-12 flex-col items-center justify-center gap-1 rounded-md px-2 text-[0.7rem] font-semibold transition ${
              active ? 'bg-slate-900 text-white' : 'text-slate-500 hover:bg-slate-100 hover:text-slate-950'
            }`}
          >
            <Icon aria-hidden="true" className="h-4 w-4" />
            <span className="max-w-full truncate">{label}</span>
          </Link>
        ))}
      </div>
    </nav>
  )
}
