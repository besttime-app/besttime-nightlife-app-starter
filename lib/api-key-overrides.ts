export type BrowserBestTimeApiKeys = {
  privateKey?: string
  publicKey?: string
}

export const browserApiKeysStorageKey = 'besttime.api-keys'

const normalizeKey = (value: unknown) => {
  if (typeof value !== 'string') return undefined

  const trimmed = value.trim()
  return trimmed.length > 0 && trimmed.length <= 256 ? trimmed : undefined
}

export const normalizeBrowserApiKeys = (keys: BrowserBestTimeApiKeys = {}): BrowserBestTimeApiKeys => ({
  privateKey: normalizeKey(keys.privateKey),
  publicKey: normalizeKey(keys.publicKey)
})

export const parseStoredBrowserApiKeys = (stored: string | null): BrowserBestTimeApiKeys => {
  if (!stored) return {}

  try {
    const parsed = JSON.parse(stored) as BrowserBestTimeApiKeys
    return normalizeBrowserApiKeys(parsed)
  } catch {
    return {}
  }
}

export const hasBrowserPrivateKey = (keys: BrowserBestTimeApiKeys) => Boolean(normalizeBrowserApiKeys(keys).privateKey)

export const hasBrowserPublicKey = (keys: BrowserBestTimeApiKeys) => Boolean(normalizeBrowserApiKeys(keys).publicKey)

export const browserApiKeyHeaders = (keys: BrowserBestTimeApiKeys) => {
  const normalized = normalizeBrowserApiKeys(keys)
  const headers: Record<string, string> = {}

  if (normalized.privateKey) headers['x-besttime-api-key-private'] = normalized.privateKey
  if (normalized.publicKey) headers['x-besttime-api-key-public'] = normalized.publicKey

  return headers
}
