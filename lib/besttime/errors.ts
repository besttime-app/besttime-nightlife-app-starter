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

export const redactPrivateKey = (value: unknown): unknown => {
  if (typeof value === 'string') {
    return value.replace(/pri_[A-Za-z0-9_-]+/g, 'pri_[redacted]')
  }

  if (Array.isArray(value)) return value.map(item => redactPrivateKey(item))

  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value)
        .filter(([key]) => key !== 'api_key_private')
        .map(([key, entry]) => [key, redactPrivateKey(entry)])
    )
  }

  return value
}
