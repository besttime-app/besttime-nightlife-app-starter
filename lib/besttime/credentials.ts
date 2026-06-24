export type BestTimeCredentials = {
  privateKey?: string
  publicKey?: string
}

const normalizeKey = (value: unknown) => {
  if (typeof value !== 'string') return undefined

  const trimmed = value.trim()
  return trimmed.length > 0 && trimmed.length <= 256 ? trimmed : undefined
}

export const normalizeBestTimeCredentials = (credentials: BestTimeCredentials = {}): BestTimeCredentials => ({
  privateKey: normalizeKey(credentials.privateKey),
  publicKey: normalizeKey(credentials.publicKey)
})

export const hasPrivateBestTimeCredential = (credentials: BestTimeCredentials = {}) =>
  Boolean(normalizeBestTimeCredentials(credentials).privateKey)

export const bestTimeCredentialSecrets = (
  credentials: BestTimeCredentials = {},
  envPrivateKey?: string,
  envPublicKey?: string
) => {
  const normalized = normalizeBestTimeCredentials(credentials)

  return [normalized.privateKey, normalized.publicKey, envPrivateKey?.trim(), envPublicKey?.trim()].filter(Boolean) as string[]
}
