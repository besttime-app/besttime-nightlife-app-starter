'use client'

import { useEffect, useRef, useState } from 'react'
import { AlertTriangle } from 'lucide-react'

export function AdminWarningModal({ protectedByPassword }: { protectedByPassword: boolean }) {
  const [open, setOpen] = useState(!protectedByPassword)
  const closeButtonRef = useRef<HTMLButtonElement | null>(null)

  useEffect(() => {
    if (open) closeButtonRef.current?.focus()
  }, [open])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/50 p-4">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="admin-warning-heading"
        className="w-full max-w-lg rounded-md border border-amber-200 bg-white p-6 shadow-2xl"
      >
        <div className="flex h-10 w-10 items-center justify-center rounded-md bg-amber-100">
          <AlertTriangle aria-hidden="true" className="h-5 w-5 text-amber-700" />
        </div>
        <h2 id="admin-warning-heading" className="mt-5 text-xl font-semibold text-slate-950">
          Admin is unprotected
        </h2>
        <p className="mt-3 text-sm leading-6 text-slate-700">
          This starter admin page is open because <code>ADMIN_PASSWORD</code> is not configured. Set{' '}
          <code>ADMIN_PASSWORD</code> in your local or Vercel environment before sharing this deployment.
        </p>
        <button
          ref={closeButtonRef}
          type="button"
          onClick={() => setOpen(false)}
          className="mt-5 rounded-md bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800"
        >
          I understand
        </button>
      </div>
    </div>
  )
}
