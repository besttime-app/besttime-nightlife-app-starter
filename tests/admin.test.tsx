import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { NextRequest } from 'next/server'
import { POST } from '@/app/api/admin/session/route'
import { AdminPasswordForm } from '@/components/admin/AdminPasswordForm'
import { AdminSettingsPanel } from '@/components/admin/AdminSettingsPanel'
import { AdminWarningModal } from '@/components/admin/AdminWarningModal'
import { defaultAdminSettings, localStorageKey } from '@/lib/admin/settings'
import { isAdminPasswordConfigured, verifyAdminPassword } from '@/lib/admin/auth'

afterEach(() => {
  vi.unstubAllEnvs()
  vi.unstubAllGlobals()
  window.localStorage.clear()
})

describe('admin auth helpers', () => {
  it('treats admin as unprotected until ADMIN_PASSWORD is configured', () => {
    expect(isAdminPasswordConfigured()).toBe(false)
    expect(verifyAdminPassword('anything')).toBe(false)

    vi.stubEnv('ADMIN_PASSWORD', 'secret')

    expect(isAdminPasswordConfigured()).toBe(true)
    expect(verifyAdminPassword('secret')).toBe(true)
    expect(verifyAdminPassword('wrong')).toBe(false)
  })

  it('returns unprotected session response when no admin password is configured', async () => {
    const response = await POST(new NextRequest('http://localhost/api/admin/session', { method: 'POST' }))

    expect(response.status).toBe(200)
    await expect(response.json()).resolves.toMatchObject({ ok: true, protectedByPassword: false })
  })

  it('rejects invalid admin passwords and sets a cookie for valid passwords', async () => {
    vi.stubEnv('ADMIN_PASSWORD', 'secret')

    const invalid = await POST(new NextRequest('http://localhost/api/admin/session', {
      method: 'POST',
      body: JSON.stringify({ password: 'wrong' })
    }))
    expect(invalid.status).toBe(401)

    const valid = await POST(new NextRequest('http://localhost/api/admin/session', {
      method: 'POST',
      body: JSON.stringify({ password: 'secret' })
    }))

    expect(valid.status).toBe(200)
    expect(valid.headers.get('set-cookie')).toContain('besttime_starter_admin=ok')
  })
})

describe('admin warning', () => {
  it('warns when admin is unprotected', () => {
    render(<AdminWarningModal protectedByPassword={false} />)

    expect(screen.getByRole('dialog')).toBeInTheDocument()
    expect(screen.getByText(/admin is unprotected/i)).toBeInTheDocument()
    expect(screen.getAllByText(/ADMIN_PASSWORD/i).length).toBeGreaterThan(0)
  })

  it('does not warn when password is configured', () => {
    render(<AdminWarningModal protectedByPassword />)

    expect(screen.queryByText(/admin is unprotected/i)).not.toBeInTheDocument()
  })
})

describe('admin password form', () => {
  it('posts the password and reloads on success', async () => {
    const fetchMock = vi.fn(async () => new Response(JSON.stringify({ ok: true }), { status: 200 }))
    const reload = vi.fn()
    vi.stubGlobal('fetch', fetchMock)
    Object.defineProperty(window, 'location', {
      value: { reload },
      writable: true
    })

    render(<AdminPasswordForm />)

    await userEvent.type(screen.getByLabelText(/password/i), 'secret')
    await userEvent.click(screen.getByRole('button', { name: /continue/i }))

    await waitFor(() => expect(fetchMock).toHaveBeenCalledWith('/api/admin/session', expect.objectContaining({
      method: 'POST',
      body: JSON.stringify({ password: 'secret' })
    })))
    expect(reload).toHaveBeenCalled()
  })

  it('shows an invalid password error', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => new Response(JSON.stringify({ ok: false }), { status: 401 })))

    render(<AdminPasswordForm />)

    await userEvent.click(screen.getByRole('button', { name: /continue/i }))

    expect(await screen.findByText(/invalid password/i)).toBeInTheDocument()
  })
})

describe('admin settings panel', () => {
  it('loads defaults and persists local settings', async () => {
    render(<AdminSettingsPanel mode="demo" protectedByPassword={false} indexingEnabled />)

    expect(screen.getByDisplayValue(defaultAdminSettings.defaultCity)).toBeInTheDocument()
    await userEvent.clear(screen.getByLabelText(/result limit/i))
    await userEvent.type(screen.getByLabelText(/result limit/i), '12')

    await waitFor(() => expect(window.localStorage.getItem(localStorageKey)).toContain('"resultLimit":12'))
    expect(screen.getByText('saved')).toBeInTheDocument()
  })
})
