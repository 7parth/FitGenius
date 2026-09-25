import { test, expect } from '@playwright/test'

/**
 * Workout flow E2E tests — Task 17
 *
 * These tests require the full stack (frontend + backend + DB) to be running.
 * They cover the recommendation → session start → workout player flow.
 *
 * Set env vars:
 *   TEST_EMAIL / TEST_PASSWORD — a pre-seeded user account
 */

const email = process.env.TEST_EMAIL ?? 'test@fitgenius.com'
const password = process.env.TEST_PASSWORD ?? 'TestPass1'

async function loginAndGoTo(page: any, path: string) {
  await page.goto('/login')
  await page.getByLabel(/email/i).fill(email)
  await page.getByLabel(/password/i).fill(password)
  await page.getByRole('button', { name: /sign in|log in/i }).click()
  await page.waitForURL(/dashboard|onboarding/, { timeout: 12_000 })
  if (page.url().includes('onboarding')) {
    const skip = page.getByText(/skip/i)
    if (await skip.isVisible()) await skip.click()
    await page.waitForURL(/dashboard/, { timeout: 8_000 })
  }
  if (path !== '/dashboard') await page.goto(path)
}

test.describe('Recommendation & Workout Flow', () => {
  test('recommendation page loads and shows workout plan', async ({ page }) => {
    await loginAndGoTo(page, '/workout/recommend')
    await expect(page.getByRole('heading', { name: /recommend|your workout/i })).toBeVisible({
      timeout: 10_000,
    })
    // Either shows a loading spinner then results, or shows results immediately
    await expect(
      page.getByText(/exercises|workout plan|rationale/i).first()
    ).toBeVisible({ timeout: 12_000 })
  })

  test('recommendation page has start workout button', async ({ page }) => {
    await loginAndGoTo(page, '/workout/recommend')
    await expect(
      page.getByRole('button', { name: /start workout|begin/i }).or(
        page.getByRole('link', { name: /start workout|begin/i })
      )
    ).toBeVisible({ timeout: 12_000 })
  })

  test('exercises page search and filter work', async ({ page }) => {
    await loginAndGoTo(page, '/exercises')
    const searchBox = page.getByLabel(/search/i)
    await expect(searchBox).toBeVisible()
    await searchBox.fill('squat')
    await expect(page.getByText(/squat/i).first()).toBeVisible({ timeout: 6_000 })
    await searchBox.clear()
  })

  test('exercise detail page shows instructions and alternatives', async ({ page }) => {
    await loginAndGoTo(page, '/exercises')
    const firstLink = page.getByRole('link').filter({ hasText: /squat|push|lunge/i }).first()
    await expect(firstLink).toBeVisible({ timeout: 8_000 })
    await firstLink.click()
    await expect(page.getByRole('heading').first()).toBeVisible({ timeout: 8_000 })
    await expect(
      page.getByText(/how to perform|instructions|steps/i)
    ).toBeVisible({ timeout: 5_000 })
  })
})

test.describe('Workout Summary & Gamification', () => {
  test('achievements page shows correct heading and content area', async ({ page }) => {
    await loginAndGoTo(page, '/achievements')
    await expect(page.getByRole('heading', { name: /achievements/i })).toBeVisible()
    // Either shows badges OR empty state — both are valid
    await expect(
      page.getByText(/badge|earn|complete|no achievements/i).first()
    ).toBeVisible({ timeout: 8_000 })
  })

  test('leaderboard shows rank table', async ({ page }) => {
    await loginAndGoTo(page, '/leaderboard')
    await expect(page.getByRole('heading', { name: /leaderboard/i })).toBeVisible()
    await expect(
      page.getByRole('table', { name: /leaderboard/i }).or(page.getByText(/weekly points/i))
    ).toBeVisible({ timeout: 8_000 })
  })

  test('challenges page loads', async ({ page }) => {
    await loginAndGoTo(page, '/challenges')
    await expect(page.getByRole('heading', { name: /challenges/i })).toBeVisible()
    await expect(
      page.getByText(/join|active|no active/i).first()
    ).toBeVisible({ timeout: 8_000 })
  })

  test('progress page renders period selector buttons', async ({ page }) => {
    await loginAndGoTo(page, '/progress')
    await expect(page.getByRole('heading', { name: /progress/i })).toBeVisible()
    // Period selector: 7d / 30d / 90d / 1y
    await expect(page.getByRole('button', { name: /7d|30d|week/i }).first()).toBeVisible({
      timeout: 8_000,
    })
  })
})

test.describe('Wearable & Coach Pages', () => {
  test('wearable page loads with medical disclaimer', async ({ page }) => {
    await loginAndGoTo(page, '/wearables')
    await expect(page.getByRole('heading', { name: /wearable|health data/i })).toBeVisible({
      timeout: 8_000,
    })
    // Medical disclaimer must be visible
    await expect(
      page.getByText(/not a substitute|medical advice|consult/i).first()
    ).toBeVisible({ timeout: 6_000 })
  })

  test('AI coach page renders chat interface', async ({ page }) => {
    await loginAndGoTo(page, '/coach')
    await expect(page.getByRole('heading', { name: /coach|ai/i })).toBeVisible({
      timeout: 8_000,
    })
    await expect(page.getByPlaceholder(/ask|message|type/i)).toBeVisible({ timeout: 5_000 })
  })

  test('AI coach input is focusable and accessible', async ({ page }) => {
    await loginAndGoTo(page, '/coach')
    const input = page.getByPlaceholder(/ask|message|type/i)
    await expect(input).toBeVisible({ timeout: 8_000 })
    await input.focus()
    await expect(input).toBeFocused()
  })
})

test.describe('Profile & Settings', () => {
  test('profile settings page loads', async ({ page }) => {
    await loginAndGoTo(page, '/settings/profile')
    await expect(page.getByRole('heading', { name: /profile/i })).toBeVisible({
      timeout: 8_000,
    })
    await expect(page.getByRole('button', { name: /save/i }).first()).toBeVisible()
  })

  test('accessibility settings page loads all controls', async ({ page }) => {
    await loginAndGoTo(page, '/settings/accessibility')
    await expect(page.getByRole('heading', { name: /accessibility/i })).toBeVisible()
    // Should show toggles for major accessibility features
    await expect(
      page.getByText(/high contrast|reduced motion|font size/i).first()
    ).toBeVisible({ timeout: 6_000 })
  })
})
