import { NextResponse, type NextRequest } from 'next/server'
import { redactPrivateKey } from '@/lib/besttime/errors'
import { getVenueRepository } from '@/lib/data/repository'
import type { VenueFilters } from '@/lib/types'

const categories = ['nightlife', 'cafes', 'shopping', 'popular'] satisfies VenueFilters['category'][]
const quickFilters = ['busy-now', 'friday-night', 'quiet-spots', 'high-review'] satisfies NonNullable<VenueFilters['quickFilter']>[]

const parseCategory = (value: string | null): VenueFilters['category'] | undefined =>
  categories.includes(value as VenueFilters['category']) ? (value as VenueFilters['category']) : undefined

const parseQuickFilter = (value: string | null): VenueFilters['quickFilter'] | undefined =>
  quickFilters.includes(value as NonNullable<VenueFilters['quickFilter']>)
    ? (value as NonNullable<VenueFilters['quickFilter']>)
    : undefined

const parsePositiveNumber = (value: string | null): number | undefined => {
  if (!value) return undefined

  const parsed = Number(value)
  return Number.isFinite(parsed) && parsed > 0 ? parsed : undefined
}

const parseNumber = (value: string | null): number | undefined => {
  if (!value) return undefined

  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : undefined
}

const getErrorStatus = (error: unknown) => {
  const status = (error as { status?: unknown }).status
  return typeof status === 'number' ? status : 500
}

const getErrorMessage = (error: unknown) => {
  const message = error instanceof Error ? error.message : 'Unable to load venues'
  const redacted = redactPrivateKey(message, process.env.BESTTIME_API_KEY?.trim())

  return typeof redacted === 'string' ? redacted : 'Unable to load venues'
}

export async function GET(request: NextRequest) {
  const repository = getVenueRepository()

  try {
    const searchParams = request.nextUrl.searchParams
    const filters: Partial<VenueFilters> = {
      category: parseCategory(searchParams.get('category')),
      quickFilter: parseQuickFilter(searchParams.get('quickFilter')),
      limit: parsePositiveNumber(searchParams.get('limit')),
      lat: parseNumber(searchParams.get('lat')),
      lng: parseNumber(searchParams.get('lng')),
      radius: parsePositiveNumber(searchParams.get('radius'))
    }
    const venues = await repository.listVenues(filters)

    return NextResponse.json({ mode: repository.mode, venues })
  } catch (error) {
    return NextResponse.json(
      { mode: repository.mode, error: getErrorMessage(error) },
      { status: getErrorStatus(error) }
    )
  }
}
