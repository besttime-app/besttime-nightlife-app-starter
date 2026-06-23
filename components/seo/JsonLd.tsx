import { serializeJsonLd, type JsonLdData } from '@/lib/seo'

type JsonLdProps = {
  data: JsonLdData
}

export function JsonLd({ data }: JsonLdProps) {
  return (
    <script
      data-testid="json-ld"
      type="application/ld+json"
      suppressHydrationWarning
      dangerouslySetInnerHTML={{ __html: serializeJsonLd(data) }}
    />
  )
}
