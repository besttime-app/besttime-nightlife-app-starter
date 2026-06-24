import type { Metadata } from 'next'
import { LiveVenueDetailsPage } from '@/components/venue/LiveVenueDetailsPage'

type LiveVenuePageProps = {
  params: Promise<{ venueId: string }>
}

export const metadata: Metadata = {
  title: 'Live venue detail | BestTime starter',
  robots: {
    index: false,
    follow: false
  }
}

export default async function LiveVenuePage({ params }: LiveVenuePageProps) {
  const { venueId } = await params

  return <LiveVenueDetailsPage venueId={venueId} />
}
