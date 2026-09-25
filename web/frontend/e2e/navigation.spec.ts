import { test, expect } from '@playwright/test'

// Requires an authenticated session — run login first
test.describe('Navigation (authenticated)', () => {
  const email = process.env.TEST_EMAIL ?? 'admin@fitgenius.com'
  const password = process.env.TEST_PASSWORD ?? 'Admin123'

  test.beforeEach(async ({ page }) => {
    // Log in
    await page.goto('/login')
    await page.getByLabel(/email/i).fill(email)
    await page.getByLabel(/password/i).fill(password)
    await page.getByRole('button', { name: /sign in|log in/i }).click()
    await page.waitForURL(/dashboard|onboarding/, { timeout: 10_000 })
    // Skip onboarding if shown
    if (page.url().includes('onboarding')) {
      const skip = page.getByText(/skip/i)
      if (await skip.isVisible()) await skip.click()
      await page.waitForURL(/dashboard/, { timeout: 5000 })
    }
  })

  test('dashboard loads with key stats', async ({ page }) => {
    await page.goto('/dashboard')
    await expect(page.getByRole('heading', { name: /dashboard/i })).toBeVisible({ timeout: 8000 })
  })

  test('exercises page loads and shows exercises', async ({ page }) => {
    await page.goto('/exercises')
    await expect(page.getByRole('heading', { name: /exercise library/i })).toBeVisible()
    // Wait for at least one exercise card
    await expect(page.getByRole('link').filter({ hasText: /squat|push/i }).first()).toBeVisible({ timeout: 8000 })
  })

  test('exercises page search works', async ({ page }) => {
    await page.goto('/exercises')
    await page.getByLabel(/search/i).fill('squat')
    await expect(page.getByText(/squat/i).first()).toBeVisible({ timeout: 5000 })
  })

  test('exercise detail page navigates correctly', async ({ page }) => {
    await page.goto('/exercises')
    await page.getByRole('link').filter({ hasText: /squat/i }).first().click()
    await expect(page.getByRole('heading', { name: /squat/i })).toBeVisible({ timeout: 8000 })
    await expect(page.getByText(/how to perform/i)).toBeVisible()
  })

  test('progress page renders charts', async ({ page }) => {
    await page.goto('/progress')
    await expect(page.getByRole('heading', { name: /progress/i })).toBeVisible()
    // Chart metric buttons should be visible
    await expect(page.getByRole('button', { name: /volume/i })).toBeVisible({ timeout: 5000 })
  })

  test('AI coach page loads', async ({ page }) => {
    await page.goto('/coach')
    await expect(page.getByPlaceholder(/ask your ai coach/i)).toBeVisible({ timeout: 8000 })
  })

  test('achievements page loads', async ({ page }) => {
    await page.goto('/achievements')
    await expect(page.getByRole('heading', { name: /achievements/i })).toBeVisible()
  })

  test('leaderboard page loads', async ({ page }) => {
    await page.goto('/leaderboard')
    await expect(page.getByRole('heading', { name: /leaderboard/i })).toBeVisible()
  })
})
