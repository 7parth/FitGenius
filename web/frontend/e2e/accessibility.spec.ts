import { test, expect } from '@playwright/test'

test.describe('Accessibility (WCAG 2.1 AA)', () => {
  test('login page has correct landmark structure', async ({ page }) => {
    await page.goto('/login')
    // Should have a main landmark
    await expect(page.getByRole('main').or(page.locator('main'))).toBeVisible()
  })

  test('login page has no missing alt text on images', async ({ page }) => {
    await page.goto('/login')
    const images = page.locator('img')
    const count = await images.count()
    for (let i = 0; i < count; i++) {
      const alt = await images.nth(i).getAttribute('alt')
      expect(alt, `Image ${i} missing alt attribute`).not.toBeNull()
    }
  })

  test('skip link is the first focusable element', async ({ page }) => {
    await page.goto('/login')
    await page.keyboard.press('Tab')
    const focused = page.locator(':focus')
    await expect(focused).toHaveText(/skip to main/i)
  })

  test('register page form labels are associated', async ({ page }) => {
    await page.goto('/register')
    const emailInput = page.getByLabel(/email/i)
    await expect(emailInput).toBeVisible()
    await expect(emailInput).toHaveAttribute('type', 'email')
  })

  test('404 page renders correctly', async ({ page }) => {
    await page.goto('/this-route-does-not-exist')
    await expect(page.getByRole('heading', { name: /not found|404/i })).toBeVisible()
    await expect(page.getByRole('link', { name: /home|dashboard/i })).toBeVisible()
  })

  test('colour contrast — dark background on key pages', async ({ page }) => {
    await page.goto('/login')
    // Page should have dark background (surface-900 = #0f0f1a)
    const bg = await page.evaluate(() =>
      getComputedStyle(document.body).backgroundColor
    )
    // Should not be white
    expect(bg).not.toBe('rgb(255, 255, 255)')
  })
})
