'use client'

import { useState } from 'react'
import { createPortal } from 'react-dom'
import { KeyRound, Trash2, X } from 'lucide-react'
import type { BrowserBestTimeApiKeys } from '@/lib/api-key-overrides'
import { normalizeBrowserApiKeys } from '@/lib/api-key-overrides'

type ApiKeySettingsProps = {
  keys: BrowserBestTimeApiKeys
  onClear: () => void
  onSave: (keys: BrowserBestTimeApiKeys) => void
  variant?: 'desktop' | 'mobile'
}

const apiKeysUrl = 'https://besttime.app/api/v1/api_keys_list'

export function ApiKeySettings({ keys, onClear, onSave, variant = 'desktop' }: ApiKeySettingsProps) {
  const [open, setOpen] = useState(false)
  const [privateKey, setPrivateKey] = useState(keys.privateKey || '')
  const [publicKey, setPublicKey] = useState(keys.publicKey || '')
  const normalizedKeys = normalizeBrowserApiKeys(keys)
  const hasAnyKey = Boolean(normalizedKeys.privateKey || normalizedKeys.publicKey)

  const openSettings = () => {
    setPrivateKey(keys.privateKey || '')
    setPublicKey(keys.publicKey || '')
    setOpen(true)
  }

  const saveKeys = () => {
    onSave({ privateKey, publicKey })
    setOpen(false)
  }

  const clearKeys = () => {
    setPrivateKey('')
    setPublicKey('')
    onClear()
    setOpen(false)
  }

  const dialog = open && typeof document !== 'undefined' ? createPortal((
    <div className="fixed inset-0 z-50 grid place-items-end bg-slate-950/40 p-3 pb-[calc(5.75rem+env(safe-area-inset-bottom))] sm:place-items-center sm:p-3">
      <section
        aria-labelledby="api-key-settings-heading"
        className="max-h-[calc(100dvh-1.5rem)] w-full max-w-lg overflow-y-auto rounded-lg border border-slate-200 bg-white p-4 shadow-[0_24px_60px_rgb(15_23_42/0.24)] sm:p-5"
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 id="api-key-settings-heading" className="text-lg font-semibold text-slate-950">
              Test with your BestTime keys
            </h2>
            <p className="mt-1 text-sm leading-6 text-slate-600">
              These keys are stored only in this browser and sent to this app&apos;s API proxy. For production, keep the private key in Vercel or `.env.local`.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setOpen(false)}
            aria-label="Close API key settings"
            className="grid h-9 w-9 shrink-0 place-items-center rounded-md text-slate-500 transition hover:bg-slate-100 hover:text-slate-950"
          >
            <X aria-hidden="true" className="h-4 w-4" />
          </button>
        </div>

        <div className="mt-4 grid gap-3">
          <label className="grid gap-1.5 text-sm font-semibold text-slate-800">
            Private API key
            <input
              type="password"
              autoComplete="off"
              spellCheck={false}
              value={privateKey}
              onChange={event => setPrivateKey(event.target.value)}
              placeholder="pri_..."
              className="min-h-11 rounded-md border border-slate-300 px-3 text-sm font-medium text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-teal-700 focus:ring-2 focus:ring-teal-700/15"
            />
            <span className="text-xs font-medium leading-5 text-slate-500">
              Required for live venue filtering and search APIs.
            </span>
          </label>

          <label className="grid gap-1.5 text-sm font-semibold text-slate-800">
            Public API key
            <input
              type="password"
              autoComplete="off"
              spellCheck={false}
              value={publicKey}
              onChange={event => setPublicKey(event.target.value)}
              placeholder="pub_..."
              className="min-h-11 rounded-md border border-slate-300 px-3 text-sm font-medium text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-teal-700 focus:ring-2 focus:ring-teal-700/15"
            />
            <span className="text-xs font-medium leading-5 text-slate-500">
              Optional for public venue and forecast endpoints as the starter expands.
            </span>
          </label>
        </div>

        <div className="mt-4 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs leading-5 text-amber-900">
          Browser storage is convenient for demo testing, but it is not a secure production place for a private key.
        </div>

        <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <a
            href={apiKeysUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm font-semibold text-slate-700 underline-offset-2 hover:text-slate-950 hover:underline"
          >
            Open BestTime API keys
          </a>
          <div className="flex gap-2">
            {hasAnyKey ? (
              <button
                type="button"
                onClick={clearKeys}
                className="inline-flex min-h-10 items-center justify-center gap-2 rounded-md border border-slate-200 px-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 hover:text-slate-950"
              >
                <Trash2 aria-hidden="true" className="h-4 w-4" />
                Clear
              </button>
            ) : null}
            <button
              type="button"
              onClick={saveKeys}
              className="inline-flex min-h-10 items-center justify-center rounded-md bg-slate-950 px-4 text-sm font-semibold text-white transition hover:bg-slate-800"
            >
              Save and reload data
            </button>
          </div>
        </div>
      </section>
    </div>
  ), document.body) : null

  return (
    <>
      <button
        type="button"
        onClick={openSettings}
        className={variant === 'mobile'
          ? 'inline-flex shrink-0 items-center gap-1 rounded-full bg-slate-100 px-2 py-1 text-xs font-semibold text-slate-600 transition hover:bg-slate-200 hover:text-slate-950'
          : 'inline-flex items-center gap-1.5 rounded-md border border-slate-200 px-2.5 py-1.5 text-xs font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50 hover:text-slate-950'}
      >
        <KeyRound aria-hidden="true" className={variant === 'mobile' ? 'h-3 w-3' : 'h-3.5 w-3.5'} />
        {hasAnyKey ? 'Keys on' : 'API keys'}
      </button>
      {dialog}
    </>
  )
}
