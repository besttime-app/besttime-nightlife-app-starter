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
- Browser-location failures must explain whether permission is blocked, location is unavailable, or lookup timed out, and must keep retry plus NYC demo fallback available.
- Demo map/API results should keep the default visible result limit modest so mobile browsers do not render all fixture markers at once.
- Category and quick filters must work against the full fixture pool while returning a bounded result set.
- Advanced filters may rank venues by selected forecast day and time. This ranking should use fixture forecast arrays in demo mode and `day_int` plus hour parameters in live mode.
- Discovery-map venue dots should be rendered as map-native layers or equivalent map-synchronized primitives so pitch, bearing, and zoom cannot desynchronize them from the basemap.
- Mobile discovery uses a lightweight bottom sheet with peek, half, and full states. Real map interactions should collapse the sheet to the compact peek state, while venue selection should reopen enough detail to inspect the venue.
- Selecting a venue from the map or list should make the updated detail card visually noticeable without blocking map interaction.
- Venue cards, map detail panels, and public venue pages should show a refined venue type label such as `Bar`, `Bakery`, or `Shopping center` when source data or safe inference supports it, rather than only the broad starter category.

## SEO Behavior

- Public demo indexing is enabled through robots, sitemap, metadata, canonical URLs, and venue JSON-LD.
- Sitemap and static generation should include canonical fixture venue ID routes only.
- Slug routes may resolve dynamically, but their canonical URL should point to the stable venue ID route to avoid duplicate indexed pages.
- Venue JSON-LD should match the primary venue category: nightlife as `BarOrPub`, cafes as `CafeOrCoffeeShop`, shopping as `Store`, and popular as generic `LocalBusiness`.
- Venue detail pages should expose a crawlable BestTime-style dashboard layout: dense venue identity and type details on the upper left, today's visitor trend on the upper right, weekly visitor heatmap below, and a compact 3D venue map on the lower right.
- Weekly heatmaps should trim leading/trailing closed or zero-only hours so mobile users see the active forecast window first. Overnight venues must keep a continuous evening-to-early-morning window instead of expanding to a full 24-hour grid.

## Live Mode Boundary

- When `BESTTIME_API_KEY` is configured, browser code must continue to call local `/api/besttime/*` routes only.
- The private BestTime key stays server-side and must be redacted from API errors and test fixtures.
