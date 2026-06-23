import { hasBestTimeApiKey } from '@/lib/config'
import { getBestTimeVenue, listBestTimeVenues } from '@/lib/besttime/client'
import { getFixtureVenueById, getFixtureVenues } from './fixture-store'
import type { VenueFilters } from '@/lib/types'

export const getVenueRepository = () => {
  const live = hasBestTimeApiKey()

  return {
    mode: live ? 'live' as const : 'demo' as const,
    async listVenues(filters: Partial<VenueFilters> = {}) {
      return live ? listBestTimeVenues(filters) : getFixtureVenues(filters)
    },
    async getVenue(venueId: string) {
      return live ? getBestTimeVenue(venueId) : getFixtureVenueById(venueId)
    }
  }
}
