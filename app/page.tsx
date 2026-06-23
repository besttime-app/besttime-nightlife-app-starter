import { AppShell } from '@/components/app/AppShell'
import { getVenueRepository } from '@/lib/data/repository'
import { siteConfig } from '@/lib/config'

export default async function Home() {
  const repository = getVenueRepository()
  const initialVenues = await repository.listVenues({
    category: siteConfig.defaultCategory,
    limit: siteConfig.defaultResultLimit
  })

  return (
    <AppShell
      initialMode={repository.mode}
      initialVenues={initialVenues}
      initialCategory={siteConfig.defaultCategory}
      resultLimit={siteConfig.defaultResultLimit}
    />
  )
}
