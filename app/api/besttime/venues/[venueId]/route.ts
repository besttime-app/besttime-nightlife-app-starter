import { NextResponse, type NextRequest } from 'next/server'
import { redactPrivateKey } from '@/lib/besttime/errors'
import { getVenueRepository } from '@/lib/data/repository'

type RouteParams = {
  params: Promise<{
    venueId: string
  }>
}

const getErrorStatus = (error: unknown) => {
  const status = (error as { status?: unknown }).status
  return typeof status === 'number' ? status : 500
}

const getErrorMessage = (error: unknown) => {
  const message = error instanceof Error ? error.message : 'Unable to load venue'
  const redacted = redactPrivateKey(message, process.env.BESTTIME_API_KEY?.trim())

  return typeof redacted === 'string' ? redacted : 'Unable to load venue'
}

export async function GET(_request: NextRequest, context: RouteParams) {
  const repository = getVenueRepository()

  try {
    const { venueId } = await context.params
    const venue = await repository.getVenue(venueId)

    if (!venue) {
      return NextResponse.json({ mode: repository.mode, error: 'Venue not found' }, { status: 404 })
    }

    return NextResponse.json({ mode: repository.mode, venue })
  } catch (error) {
    return NextResponse.json(
      { mode: repository.mode, error: getErrorMessage(error) },
      { status: getErrorStatus(error) }
    )
  }
}
