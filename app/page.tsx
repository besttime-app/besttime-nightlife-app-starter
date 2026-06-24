import { AppShell } from '@/components/app/AppShell'
import { hasBestTimeApiKey, siteConfig } from '@/lib/config'
import { getFixtureVenues } from '@/lib/data/fixture-store'

const defaultRadius = 1600

export default function Home() {
  const initialVenues = getFixtureVenues({
    category: siteConfig.defaultCategory,
    limit: siteConfig.defaultResultLimit,
    radius: defaultRadius
  })

  return (
    <AppShell
      initialMode={hasBestTimeApiKey() ? 'live' : 'demo'}
      initialVenues={initialVenues}
      initialCategory={siteConfig.defaultCategory}
      resultLimit={siteConfig.defaultResultLimit}
    />
  )
}
