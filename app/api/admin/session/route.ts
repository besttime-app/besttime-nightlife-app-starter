import { NextRequest, NextResponse } from 'next/server'
import { adminCookieName, isAdminPasswordConfigured, verifyAdminPassword } from '@/lib/admin/auth'

export async function POST(request: NextRequest) {
  if (!isAdminPasswordConfigured()) {
    return NextResponse.json({ ok: true, protectedByPassword: false })
  }

  const body = await request.json().catch(() => ({}))
  const password = typeof body.password === 'string' ? body.password : ''

  if (!verifyAdminPassword(password)) {
    return NextResponse.json({ ok: false, error: 'Invalid password.' }, { status: 401 })
  }

  const response = NextResponse.json({ ok: true, protectedByPassword: true })
  response.cookies.set(adminCookieName, 'ok', {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/admin'
  })

  return response
}
