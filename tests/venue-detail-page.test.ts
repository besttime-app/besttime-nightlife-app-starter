import { describe, expect, it } from 'vitest'
import { allFixtureVenues } from '@/data/fixtures/nyc-nightlife'
import { generateMetadata, generateStaticParams } from '@/app/(public)/venues/[venueId]/page'

describe('venue detail page route helpers', () => {
  it('generates static params for fixture ids and slugs', async () => {
    const params = await generateStaticParams()
    const venue = allFixtureVenues[0]

    expect(params).toContainEqual({ venueId: venue.id })
    expect(params).toContainEqual({ venueId: venue.slug })
  })

  it('generates canonical metadata for slug URLs', async () => {
    const venue = allFixtureVenues[0]
    const metadata = await generateMetadata({
      params: Promise.resolve({ venueId: venue.slug })
    })

    expect(metadata.title).toContain(venue.name)
    expect(metadata.description).toContain(venue.city)
    expect(metadata.alternates).toMatchObject({
      canonical: `/venues/${venue.slug}`
    })
    expect(metadata.openGraph).toMatchObject({
      title: expect.stringContaining(venue.name),
      url: `/venues/${venue.slug}`
    })
  })
})
