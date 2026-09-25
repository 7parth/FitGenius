import { test, expect } from '@playwright/test'

// Test credentials — match what you registered manually
const TEST_EMAIL = process.env.TEST_EMAIL ?? 'test@fitgenius.com'
const TEST_PASSWORD = process.env.TEST_PASSWORD ?? 'TestPass1'

test.describe('Authentication', () => {
  test('shows login page at /login', async ({ page }) => {
    await page.goto('/login')
    await expect(page).toHaveTitle(/FitGenius/)
    await expect(page.getByRole('heading', { name: /sign in|log in|welcome/i })).toBeVisible()
    await expect(page.getByLabel(/email/i)).toBeVisible()
    await expect(page.getByLabel(/password/i)).toBeVisible()
  })

  test('redirects unauthenticated users to login', async ({ page }) => {
    await page.goto('/dashboard')
    await expect(page).toHaveURL(/login/)
  })

  test('shows validation errors for empty submit', async ({ page }) => {
    await page.goto('/login')
    await page.getByRole('button', { name: /sign in|log in/i }).click()
    // Form should show validation or not submit
    await expect(page).toHaveURL(/login/)
  })

  test('shows error for wrong credentials', async ({ page }) => {
    await page.goto('/login')
    await page.getByLabel(/email/i).fill('nobody@example.com')
    await page.getByLabel(/password/i).fill('WrongPass1')
    await page.getByRole('button', { name: /sign in|log in/i }).click()
    await expect(page.getByRole('alert').or(page.getByText(/invalid|incorrect|wrong/i))).toBeVisible({ timeout: 5000 })
  })

  test('register page is accessible', async ({ page }) => {
    await page.goto('/register')
    await expect(page.getByLabel(/email/i)).toBeVisible()
    await expect(page.getByLabel(/password/i).first()).toBeVisible()
    await expect(page.getByLabel(/name/i)).toBeVisible()
  })

  test('register page has skip-link for keyboard navigation', async ({ page }) => {
    await page.goto('/register')
    await page.keyboard.press('Tab')
    const skipLink = page.getByText(/skip to main/i)
    await expect(skipLink).toBeFocused()
  })
})
