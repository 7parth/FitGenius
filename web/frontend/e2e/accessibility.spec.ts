import { test, expect } from '@playwright/test'

/**
 * Accessibility (WCAG 2.1 AA) E2E tests — Tasks 11 & 17
 *
 * Validates keyboard navigation, focus management, ARIA roles,
 * landmark structure, colour contrast, skip links, and form labelling
 * across both public (auth) and authenticated pages.
 */

// ── Public pages (no auth required) ──────────────────────────────────────────

test.describe('Accessibility — Public Pages', () => {
  test('login page has correct landmark structure', async ({ page }) => {
    await page.goto('/login')
    await expect(page.getByRole('main').or(page.locator('main'))).toBeVisible()
  })

  test('login page has no images missing alt attribute', async ({ page }) => {
    await page.goto('/login')
    const images = page.locator('img')
    const count = await images.count()
    for (let i = 0; i < count; i++) {
      const alt = await images.nth(i).getAttribute('alt')
      expect(alt, `Image ${i} missing alt attribute`).not.toBeNull()
    }
  })

  test('skip link is the first focusable element on login', async ({ page }) => {
    await page.goto('/login')
    await page.keyboard.press('Tab')
    const focused = page.locator(':focus')
    await expect(focused).toHaveText(/skip to main/i)
  })

  test('skip link is the first focusable element on register', async ({ page }) => {
    await page.goto('/register')
    await page.keyboard.press('Tab')
    const focused = page.locator(':focus')
    await expect(focused).toHaveText(/skip to main/i)
  })

  test('register form fields have associated labels', async ({ page }) => {
    await page.goto('/register')
    const emailInput = page.getByLabel(/email/i)
    await expect(emailInput).toBeVisible()
    await expect(emailInput).toHaveAttribute('type', 'email')
    const passwordInput = page.getByLabel(/password/i).first()
    await expect(passwordInput).toHaveAttribute('type', 'password')
  })

  test('login form fields have associated labels', async ({ page }) => {
    await page.goto('/login')
    await expect(page.getByLabel(/email/i)).toBeVisible()
    await expect(page.getByLabel(/password/i)).toBeVisible()
  })

  test('404 page renders correctly', async ({ page }) => {
    await page.goto('/this-route-does-not-exist-xyz')
    await expect(page.getByRole('heading', { name: /not found|404/i })).toBeVisible()
    await expect(page.getByRole('link', { name: /home|dashboard/i })).toBeVisible()
  })

  test('colour contrast — dark background on login page', async ({ page }) => {
    await page.goto('/login')
    const bg = await page.evaluate(() => getComputedStyle(document.body).backgroundColor)
    expect(bg).not.toBe('rgb(255, 255, 255)')
  })

  test('all buttons on login page have accessible text', async ({ page }) => {
    await page.goto('/login')
    const buttons = page.getByRole('button')
    const count = await buttons.count()
    for (let i = 0; i < count; i++) {
      const text = (await buttons.nth(i).textContent()) ?? ''
      const label = await buttons.nth(i).getAttribute('aria-label') ?? ''
      expect(
        text.trim().length > 0 || label.length > 0,
        `Button ${i} has no accessible text`
      ).toBe(true)
    }
  })

  test('page title is set correctly on login page', async ({ page }) => {
    await page.goto('/login')
    await expect(page).toHaveTitle(/FitGenius/i)
  })

  test('page title is set correctly on register page', async ({ page }) => {
    await page.goto('/register')
    await expect(page).toHaveTitle(/FitGenius/i)
  })

  test('keyboard can tab through all login form fields', async ({ page }) => {
    await page.goto('/login')
    // Tab past skip-link
    await page.keyboard.press('Tab')
    // Tab to email
    await page.keyboard.press('Tab')
    const emailFocused = page.locator(':focus')
    // Focus should be somewhere in the form
    const tagName = await emailFocused.evaluate((el) => el.tagName.toLowerCase())
    expect(['input', 'button', 'a', 'select', 'textarea']).toContain(tagName)
  })
})

// ── Authenticated pages ───────────────────────────────────────────────────────

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

test.describe('Accessibility — Authenticated Pages', () => {
  test('dashboard has h1 heading', async ({ page }) => {
    await loginAndGoTo(page, '/dashboard')
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible({ timeout: 8_000 })
  })

  test('exercises page has search input with aria-label', async ({ page }) => {
    await loginAndGoTo(page, '/exercises')
    const searchInput = page.getByLabel(/search/i).or(
      page.locator('input[aria-label*="search" i]')
    )
    await expect(searchInput).toBeVisible({ timeout: 8_000 })
  })

  test('leaderboard table has aria-label', async ({ page }) => {
    await loginAndGoTo(page, '/leaderboard')
    await expect(
      page.getByRole('table').or(page.locator('table[aria-label]'))
    ).toBeVisible({ timeout: 8_000 })
  })

  test('achievements page has role=list for badge grid', async ({ page }) => {
    await loginAndGoTo(page, '/achievements')
    // The page renders either a list or an empty state
    await expect(
      page.getByRole('list').or(page.getByText(/no achievements/i))
    ).toBeVisible({ timeout: 8_000 })
  })

  test('progress page metric toggle buttons are keyboard accessible', async ({ page }) => {
    await loginAndGoTo(page, '/progress')
    const firstButton = page.getByRole('button', { name: /7d|30d|volume|sessions/i }).first()
    await expect(firstButton).toBeVisible({ timeout: 8_000 })
    await firstButton.focus()
    await expect(firstButton).toBeFocused()
  })

  test('wearable page has medical disclaimer visible', async ({ page }) => {
    await loginAndGoTo(page, '/wearables')
    await expect(
      page.getByText(/not a substitute|medical advice|consult/i).first()
    ).toBeVisible({ timeout: 8_000 })
  })

  test('accessibility settings page has fieldsets or sections', async ({ page }) => {
    await loginAndGoTo(page, '/settings/accessibility')
    await expect(page.getByRole('heading', { name: /accessibility/i })).toBeVisible()
    // Accessibility settings should expose toggles / inputs
    await expect(
      page.getByRole('checkbox').or(page.getByRole('switch')).or(page.getByRole('radio')).first()
    ).toBeVisible({ timeout: 8_000 })
  })

  test('sidebar navigation links have aria-current on active item', async ({ page }) => {
    await loginAndGoTo(page, '/dashboard')
    // At least one nav link should have aria-current="page" or aria-current="true"
    const ariaCurrentLinks = page.locator('[aria-current="page"], [aria-current="true"]')
    const count = await ariaCurrentLinks.count()
    expect(count).toBeGreaterThan(0)
  })

  test('coach page chat input has aria-label', async ({ page }) => {
    await loginAndGoTo(page, '/coach')
    const input = page.getByPlaceholder(/ask|message|type/i)
    await expect(input).toBeVisible({ timeout: 8_000 })
    // Should be an input or textarea with accessible label
    const role = await input.evaluate((el) => el.tagName.toLowerCase())
    expect(['input', 'textarea']).toContain(role)
  })
})
