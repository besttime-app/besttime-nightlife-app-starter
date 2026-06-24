import { hasBestTimeApiKey } from '@/lib/config'
import { getBestTimeVenue, listBestTimeVenues } from '@/lib/besttime/client'
import { hasPrivateBestTimeCredential, normalizeBestTimeCredentials, type BestTimeCredentials } from '@/lib/besttime/credentials'
import { getFixtureVenueById, getFixtureVenues } from './fixture-store'
import type { VenueFilters } from '@/lib/types'

export const getVenueRepository = (credentials: BestTimeCredentials = {}) => {
  const normalizedCredentials = normalizeBestTimeCredentials(credentials)
  const live = hasBestTimeApiKey() || hasPrivateBestTimeCredential(normalizedCredentials)

  return {
    mode: live ? 'live' as const : 'demo' as const,
    async listVenues(filters: Partial<VenueFilters> = {}) {
      return live ? listBestTimeVenues(filters, normalizedCredentials) : getFixtureVenues(filters)
    },
    async getVenue(venueId: string) {
      return live ? getBestTimeVenue(venueId, normalizedCredentials) : getFixtureVenueById(venueId)
    }
  }
}
