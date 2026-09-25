import { test, expect } from '@playwright/test'

test.describe('PWA & Performance', () => {
  test('manifest is served correctly', async ({ page }) => {
    const response = await page.request.get('/manifest.webmanifest')
    expect(response.status()).toBe(200)
    const body = await response.json()
    expect(body.name).toContain('FitGenius')
    expect(body.display).toBe('standalone')
    expect(body.icons.length).toBeGreaterThan(0)
  })

  test('favicon is served', async ({ page }) => {
    const response = await page.request.get('/favicon.svg')
    expect(response.status()).toBe(200)
    expect(response.headers()['content-type']).toContain('svg')
  })

  test('app loads within 5 seconds on login page', async ({ page }) => {
    const start = Date.now()
    await page.goto('/login')
    await page.waitForLoadState('networkidle')
    const elapsed = Date.now() - start
    expect(elapsed).toBeLessThan(5000)
  })

  test('robots.txt is served', async ({ page }) => {
    const response = await page.request.get('/robots.txt')
    expect(response.status()).toBe(200)
  })
})
