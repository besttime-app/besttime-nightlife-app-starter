import { cookies } from 'next/headers'

const cookieName = 'besttime_starter_admin'

export const adminCookieName = cookieName

export const isAdminPasswordConfigured = () => Boolean(process.env.ADMIN_PASSWORD?.trim())

export const verifyAdminPassword = (password: string) => {
  const configuredPassword = process.env.ADMIN_PASSWORD?.trim()
  return Boolean(configuredPassword) && password === configuredPassword
}

export const isAdminSessionValid = async () => {
  if (!isAdminPasswordConfigured()) return true

  const cookieStore = await cookies()
  return cookieStore.get(cookieName)?.value === 'ok'
}
