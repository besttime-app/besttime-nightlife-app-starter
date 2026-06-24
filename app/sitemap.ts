import type { MetadataRoute } from 'next'
import { siteConfig } from '@/lib/config'
import { getFixtureVenueIds } from '@/lib/data/fixture-store'

export default function sitemap(): MetadataRoute.Sitemap {
  const base = siteConfig.siteUrl.replace(/\/+$/, '')
  const now = new Date()
  const staticRoutes = ['/', '/cities/new-york/nightlife', '/about-data']
  const venueRoutes = getFixtureVenueIds().map(id => `/venues/${id}`)

  return [...staticRoutes, ...venueRoutes].map(route => ({
    url: `${base}${route}`,
    lastModified: now,
    changeFrequency: route === '/' ? 'daily' : 'weekly',
    priority: route === '/' ? 1 : 0.7
  }))
}
