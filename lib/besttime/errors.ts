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

const redactString = (value: string, activeSecret?: string): string => {
  let redacted = value.replace(/(api_key_private=)[^&\s"'<>]+/gi, '$1[redacted]')

  if (activeSecret) {
    redacted = redacted.replace(new RegExp(escapeRegExp(activeSecret), 'g'), '[redacted]')
  }

  return redacted.replace(/pri_[A-Za-z0-9_-]+/g, 'pri_[redacted]')
}

export const redactPrivateKey = (value: unknown, activeSecret?: string): unknown => {
  if (typeof value === 'string') {
    return redactString(value, activeSecret)
  }

  if (Array.isArray(value)) return value.map(item => redactPrivateKey(item, activeSecret))

  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value)
        .filter(([key]) => key.toLowerCase() !== 'api_key_private')
        .map(([key, entry]) => [key, redactPrivateKey(entry, activeSecret)])
    )
  }

  return value
}
