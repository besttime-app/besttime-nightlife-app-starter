# BestTime Nightlife App Starter

A Vercel-ready Next.js starter for building consumer venue-discovery apps with [BestTime](https://besttime.app) foot traffic data.

The app works immediately in demo mode with bundled New York fixture data across nightlife, cafes, shopping, and popular venues. Add `BESTTIME_API_KEY` to switch to live BestTime API data through server-side proxy routes, and add `BESTTIME_PUBLIC_API_KEY` to hydrate public forecast detail endpoints such as split weekly heatmaps.

![BestTime Nightlife Starter map preview](public/screenshots/starter-map.svg)

## Features

- Map-first venue discovery experience.
- Responsive desktop and mobile web UI.
- MapLibre 3D map using open map tiles.
- Demo mode without an API key.
- Live mode with server-side BestTime API proxy.
- Venue detail pages with weekly foot traffic heatmaps.
- SEO-friendly city and venue pages.
- PWA-ready manifest and icon.
- Starter admin page with local browser settings.
- Subtle visible BestTime attribution links.

## Local Setup

```bash
npm install
cp .env.example .env.local
npm run dev
```

Open `http://localhost:3000`.

## Demo Mode

If `BESTTIME_API_KEY` is empty, the app uses bundled NYC fixture data and shows a demo data status. The fixture includes 1,000 real public venue forecasts generated from a read-only BestTime production slice: 250 primary venues each for cafes, nightlife, shopping, and popular discovery, with current live busyness values where available.

## Live BestTime Mode

Add your private BestTime key to `.env.local`. Add the public key too if you want live venue detail pages to use the split seven-day forecast endpoint for weekly heatmaps:

```dotenv
BESTTIME_API_KEY=pri_your_key_here
BESTTIME_PUBLIC_API_KEY=pub_your_key_here
```

Restart the dev server. The browser still only calls local `/api/besttime/*` routes. The private key stays on the server.

You can also test the public Vercel demo before installing the starter:

1. Open the map.
2. Click **API keys**.
3. Paste your BestTime private key for live venue filtering.
4. Paste your public key too when testing live venue detail weekly heatmaps.

The browser demo stores those values in `localStorage` and sends them as headers to this app's `/api/besttime/*` proxy. This is useful for testing your own subscription on the hosted demo, but production forks should use `BESTTIME_API_KEY` in server env instead of browser storage.

## Admin Protection

`/admin` works without a password for local demos, but it shows a warning modal. Before sharing a deployment, configure:

```dotenv
ADMIN_PASSWORD=choose-a-password
```

## Vercel Deployment

1. Import this repository into Vercel.
2. Set `BESTTIME_API_KEY` in Vercel Project Settings if you want live data.
3. Set `BESTTIME_PUBLIC_API_KEY` if you want live detail pages to hydrate split weekly forecast heatmaps.
4. Set `ADMIN_PASSWORD` before sharing the deployment.
5. Deploy.

CLI option:

```bash
npx vercel env add BESTTIME_API_KEY production
npx vercel env add BESTTIME_PUBLIC_API_KEY production
npx vercel env add ADMIN_PASSWORD production
npx vercel deploy --prod
```

Optional public settings:

```dotenv
NEXT_PUBLIC_SITE_URL=https://your-domain.vercel.app
NEXT_PUBLIC_DEFAULT_CITY=new-york
NEXT_PUBLIC_DEFAULT_CATEGORY=nightlife
NEXT_PUBLIC_DEFAULT_RESULT_LIMIT=24
NEXT_PUBLIC_INDEX_PUBLIC_PAGES=true
NEXT_PUBLIC_ATTRIBUTION_MODE=subtle
```

## SEO And Attribution

The starter includes sitemap, robots, metadata, canonical URLs, Open Graph data, and fixture venue JSON-LD. BestTime links are visible and normal links in the footer, venue data source rows, this README, and `/about-data`.

## Milestone 1 Deferrals

This starter intentionally does not include database persistence, user accounts, billing, collection management, Google Places autocomplete, AI filter generation, or non-Vercel deployment targets.
