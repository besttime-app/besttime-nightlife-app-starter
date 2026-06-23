import { expect, test, type Page } from '@playwright/test'

const resetLocationChoice = async (page: Page) => {
  await page.addInitScript(() => {
    window.localStorage.clear()
  })
}

const closeLocationModalWithDemoFallback = async (page: Page) => {
  const dialog = page.getByRole('dialog', { name: 'Choose a starting location' })

  await expect(dialog).toBeVisible()
  await expect(page.getByRole('button', { name: 'Use my location' })).toBeFocused()
  await page.keyboard.press('Escape')
  await expect(dialog).toBeHidden()
  await expect.poll(() => page.evaluate(() => window.localStorage.getItem('besttime.location-choice'))).toBe('nyc-demo')
}

test('desktop app shell renders map controls and category interactions', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'desktop', 'desktop-only coverage')
  await resetLocationChoice(page)
  const venueRequests: string[] = []
  page.on('request', request => {
    const url = new URL(request.url())
    if (url.pathname === '/api/besttime/venues') venueRequests.push(url.search)
  })

  await page.goto('/')
  await closeLocationModalWithDemoFallback(page)

  await expect(page.getByRole('heading', { name: /BestTime venues in New York/i })).toBeVisible()
  await expect(page.locator('[aria-label="Venue map"]:visible')).toBeVisible()
  await expect(page.locator('.maplibregl-ctrl-zoom-in:visible').first()).toBeVisible()
  await expect(page.locator('.maplibregl-ctrl-attrib:visible').first()).toBeVisible()
  await page.waitForTimeout(250)
  expect(venueRequests).toHaveLength(0)

  const cafes = page.getByRole('button', { name: 'Cafes' }).first()
  await Promise.all([
    page.waitForResponse(response => response.url().includes('/api/besttime/venues') && response.url().includes('category=cafes')),
    cafes.click()
  ])

  await expect(cafes).toHaveAttribute('aria-pressed', 'true')
  await expect(page.locator('aside h2').filter({ hasText: 'Nolita Espresso Counter' })).toBeVisible()
})

test('location modal can use browser coordinates for venue requests', async ({ context, page }, testInfo) => {
  test.skip(testInfo.project.name !== 'desktop', 'desktop-only coverage')
  await context.grantPermissions(['geolocation'])
  await context.setGeolocation({ latitude: 40.7209, longitude: -73.9872 })
  await resetLocationChoice(page)

  await page.goto('/')

  const locationRequest = page.waitForRequest(request => {
    const url = new URL(request.url())

    return url.pathname === '/api/besttime/venues' && url.searchParams.get('lat') === '40.7209' && url.searchParams.get('lng') === '-73.9872'
  })

  await page.getByRole('button', { name: 'Use my location' }).click()
  await locationRequest

  await expect(page.getByRole('dialog', { name: 'Choose a starting location' })).toBeHidden()
  await expect(page.getByText('Near you').first()).toBeVisible()
  await expect(page.getByRole('heading', { name: /BestTime venues near you/i })).toBeVisible()
})

test('mobile filters and detail CTA remain reachable above navigation', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'mobile', 'mobile-only coverage')
  await resetLocationChoice(page)

  await page.goto('/')
  await closeLocationModalWithDemoFallback(page)

  await expect(page.locator('[aria-label="Venue map"]:visible')).toBeVisible()
  await expect(page.locator('.maplibregl-ctrl-zoom-in:visible').first()).toBeVisible()
  await expect(page.locator('.maplibregl-ctrl-attrib:visible').first()).toBeVisible()

  await page.locator('summary:visible').filter({ hasText: 'Advanced filters' }).click()
  await expect(page.locator('select:visible').first()).toBeVisible()

  const detailsLink = page.getByRole('link', { name: /Details/i }).first()
  await detailsLink.scrollIntoViewIfNeeded()
  await expect(detailsLink).toBeVisible()

  const detailBox = await detailsLink.boundingBox()
  const navBox = await page.getByRole('navigation', { name: 'Mobile' }).boundingBox()

  expect(detailBox).not.toBeNull()
  expect(navBox).not.toBeNull()
  expect(detailBox!.y + detailBox!.height).toBeLessThanOrEqual(navBox!.y)
})
