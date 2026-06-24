# Demo Mode

## Purpose

The starter must work immediately without a BestTime API key so developers can evaluate the product shape, map UI, venue detail pages, and SEO surfaces before configuring live credentials.

## Fixture Data

- Demo mode uses bundled New York fixture data generated from a read-only BestTime production slice.
- The fixture includes 1,000 public venue forecasts: 250 primary venues for cafes, nightlife, shopping, and popular discovery.
- Fixture fields are limited to public venue metadata, public forecast arrays, ratings/review counts, coordinates, category labels, and current live busyness values where available.
- Private API keys, user data, and internal database credentials must never be committed with fixtures.

## Discovery Behavior

- The first app screen is the map view.
- The user can choose the NYC demo dataset or browser location from the location prompt.
- If a location choice is stored, the UI must still expose a clear control to reopen the location prompt after refresh.
- Demo map/API results should keep the default visible result limit modest so mobile browsers do not render all fixture markers at once.
- Category and quick filters must work against the full fixture pool while returning a bounded result set.

## SEO Behavior

- Public demo indexing is enabled through robots, sitemap, metadata, canonical URLs, and venue JSON-LD.
- Sitemap and static generation should include canonical fixture venue ID routes only.
- Slug routes may resolve dynamically, but their canonical URL should point to the stable venue ID route to avoid duplicate indexed pages.
- Venue JSON-LD should match the primary venue category: nightlife as `BarOrPub`, cafes as `CafeOrCoffeeShop`, shopping as `Store`, and popular as generic `LocalBusiness`.

## Live Mode Boundary

- When `BESTTIME_API_KEY` is configured, browser code must continue to call local `/api/besttime/*` routes only.
- The private BestTime key stays server-side and must be redacted from API errors and test fixtures.
