import type { MetadataRoute } from 'next'
import { shouldIndexPublicPages, siteConfig } from '@/lib/config'

export default function robots(): MetadataRoute.Robots {
  const indexPublicPages = shouldIndexPublicPages()

  return {
    rules: {
      userAgent: '*',
      allow: indexPublicPages ? '/' : undefined,
      disallow: indexPublicPages ? undefined : '/'
    },
    sitemap: `${siteConfig.siteUrl.replace(/\/+$/, '')}/sitemap.xml`
  }
}
