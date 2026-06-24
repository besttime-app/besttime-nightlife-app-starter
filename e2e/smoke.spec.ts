import { expect, test, type Page } from '@playwright/test'

const resetLocationChoice = async (page: Page) => {
  await page.addInitScript(() => {
    window.localStorage.clear()
  })
}

const closeLocationModalWithDemoFallback = async (page: Page) => {
  const dialog = page.getByRole('dialog', { name: 'Choose a starting location' })
  const useLocationButton = page.getByRole('button', { name: 'Use my location' })
  const demoButton = page.getByRole('button', { name: 'Explore NYC demo' })
  const closeButton = page.getByRole('button', { name: 'Close location prompt' })
  const focusState = () => page.evaluate(() => {
    const activeElement = document.activeElement
    const openDialog = document.querySelector('[role="dialog"][aria-modal="true"]')
    const backgroundNavigation = activeElement?.closest('nav[aria-label="Primary"], nav[aria-label="Mobile"]')

    return {
      isInsideDialog: Boolean(openDialog && activeElement && openDialog.contains(activeElement)),
      isInBackgroundNavigation: Boolean(backgroundNavigation)
    }
  })

  await expect(dialog).toBeVisible()
  await expect(useLocationButton).toBeFocused()

  await page.keyboard.press('Tab')
  await expect(demoButton).toBeFocused()
  await expect.poll(focusState).toEqual({ isInsideDialog: true, isInBackgroundNavigation: false })

  await page.keyboard.press('Tab')
  await expect(closeButton).toBeFocused()
  await expect.poll(focusState).toEqual({ isInsideDialog: true, isInBackgroundNavigation: false })

  await page.keyboard.press('Shift+Tab')
  await expect(demoButton).toBeFocused()
  await expect.poll(focusState).toEqual({ isInsideDialog: true, isInBackgroundNavigation: false })

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

test('venue detail page renders forecast, attribution, and venue map', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'desktop', 'desktop route smoke coverage')

  await page.goto('/venues/demo-nyc-bar-1')

  await expect(page.getByRole('heading', { name: 'Lower East Side Cocktail Room' })).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Weekly busyness forecast' })).toBeVisible()
  await expect(page.getByRole('link', { name: 'View BestTime data' })).toHaveAttribute('href', 'https://besttime.app')
  await expect(page.locator('[aria-label="Map centered on Lower East Side Cocktail Room"]')).toBeVisible()
})

test('admin warns when password is not configured', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'desktop', 'desktop route smoke coverage')

  await page.goto('/admin')

  await expect(page.getByRole('dialog', { name: 'Admin is unprotected' })).toBeVisible()
  await expect(page.getByText(/ADMIN_PASSWORD/).first()).toBeVisible()
  await page.getByRole('button', { name: 'I understand' }).click()
  await expect(page.getByRole('heading', { name: 'Starter admin' })).toBeVisible()
})

test('seo pages expose crawlable venue and data-source links', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'desktop', 'desktop route smoke coverage')

  await page.goto('/cities/new-york/nightlife')
  await expect(page.getByRole('heading', { name: 'New York nightlife foot traffic demo' })).toBeVisible()
  await expect(page.getByRole('link', { name: /Lower East Side Cocktail Room/ })).toHaveAttribute('href', '/venues/demo-nyc-bar-1')

  await page.goto('/about-data')
  await expect(page.getByRole('heading', { name: 'About the foot traffic data' })).toBeVisible()
  await expect(page.getByRole('link', { name: 'BestTime' })).toHaveAttribute('href', 'https://besttime.app')
  await expect(page.getByRole('link', { name: 'docs' })).toHaveAttribute('href', 'https://besttime.app/api/v1/docs')
})
