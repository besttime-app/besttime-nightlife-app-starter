import { AppShell } from '@/components/app/AppShell'
import { getVenueRepository } from '@/lib/data/repository'
import { siteConfig } from '@/lib/config'

const defaultRadius = 1600

export default async function Home() {
  const repository = getVenueRepository()
  const initialVenues = await repository.listVenues({
    category: siteConfig.defaultCategory,
    limit: siteConfig.defaultResultLimit,
    radius: defaultRadius
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
