'use client'

import type { FormEvent } from 'react'
import { useState } from 'react'
import { LockKeyhole } from 'lucide-react'

export function AdminPasswordForm() {
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setSubmitting(true)
    setError('')

    const response = await fetch('/api/admin/session', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ password })
    })

    if (!response.ok) {
      setError('Invalid password.')
      setSubmitting(false)
      return
    }

    window.location.reload()
  }

  return (
    <form onSubmit={submit} className="w-full max-w-sm rounded-md border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex h-10 w-10 items-center justify-center rounded-md bg-slate-100">
        <LockKeyhole aria-hidden="true" className="h-5 w-5 text-slate-700" />
      </div>
      <h1 className="mt-5 text-xl font-semibold text-slate-950">Admin password</h1>
      <p className="mt-2 text-sm leading-6 text-slate-600">Enter the configured starter admin password.</p>
      <label className="mt-5 grid gap-2 text-sm font-medium text-slate-700">
        Password
        <input
          name="password"
          type="password"
          value={password}
          onChange={event => setPassword(event.target.value)}
          className="rounded-md border border-slate-300 px-3 py-2 text-slate-950 outline-none transition focus:border-slate-950"
          autoComplete="current-password"
        />
      </label>
      {error ? <p className="mt-3 text-sm font-medium text-red-600">{error}</p> : null}
      <button
        type="submit"
        disabled={submitting}
        className="mt-5 inline-flex rounded-md bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {submitting ? 'Checking...' : 'Continue'}
      </button>
    </form>
  )
}
