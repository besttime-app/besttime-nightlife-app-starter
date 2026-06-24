import { NextResponse, type NextRequest } from 'next/server'
import { bestTimeCredentialSecrets, type BestTimeCredentials } from '@/lib/besttime/credentials'
import { redactPrivateKey } from '@/lib/besttime/errors'
import { getBestTimeRequestCredentials } from '@/lib/besttime/request-credentials'
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

const getErrorMessage = (error: unknown, credentials: BestTimeCredentials) => {
  const message = error instanceof Error ? error.message : 'Unable to load venue'
  const redacted = redactPrivateKey(
    message,
    bestTimeCredentialSecrets(credentials, process.env.BESTTIME_API_KEY, process.env.BESTTIME_PUBLIC_API_KEY)
  )

  return typeof redacted === 'string' ? redacted : 'Unable to load venue'
}

export async function GET(request: NextRequest, context: RouteParams) {
  const credentials = getBestTimeRequestCredentials(request)
  const repository = getVenueRepository(credentials)

  try {
    const { venueId } = await context.params
    const venue = await repository.getVenue(venueId)

    if (!venue) {
      return NextResponse.json({ mode: repository.mode, error: 'Venue not found' }, { status: 404 })
    }

    return NextResponse.json({ mode: repository.mode, venue })
  } catch (error) {
    return NextResponse.json(
      { mode: repository.mode, error: getErrorMessage(error, credentials) },
      { status: getErrorStatus(error) }
    )
  }
}
