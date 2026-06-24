export class BestTimeError extends Error {
  status?: number
  details?: unknown

  constructor(message: string, options: { status?: number; details?: unknown } = {}) {
    super(message)
    this.name = 'BestTimeError'
    this.status = options.status
    this.details = options.details
  }
}

const escapeRegExp = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

const normalizeSecrets = (activeSecret?: string | string[]) => (
  Array.isArray(activeSecret) ? activeSecret : activeSecret ? [activeSecret] : []
).filter(Boolean)

const redactString = (value: string, activeSecret?: string | string[]): string => {
  let redacted = value.replace(/(api_key_(?:private|public)=)[^&\s"'<>]+/gi, '$1[redacted]')

  for (const secret of normalizeSecrets(activeSecret)) {
    redacted = redacted.replace(new RegExp(escapeRegExp(secret), 'g'), '[redacted]')
  }

  return redacted
    .replace(/pri_[A-Za-z0-9_-]+/g, 'pri_[redacted]')
    .replace(/pub_[A-Za-z0-9_-]+/g, 'pub_[redacted]')
}

export const redactPrivateKey = (value: unknown, activeSecret?: string | string[]): unknown => {
  if (typeof value === 'string') {
    return redactString(value, activeSecret)
  }

  if (Array.isArray(value)) return value.map(item => redactPrivateKey(item, activeSecret))

  if (value instanceof Error) {
    return {
      name: value.name,
      message: redactString(value.message, activeSecret)
    }
  }

  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value)
        .filter(([key]) => !['api_key_private', 'api_key_public'].includes(key.toLowerCase()))
        .map(([key, entry]) => [key, redactPrivateKey(entry, activeSecret)])
    )
  }

  return value
}
