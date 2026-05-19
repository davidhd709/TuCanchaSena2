import { test, expect } from '@playwright/test'

test.describe('Smoke', () => {
  test('home carga sin errores de consola', async ({ page }) => {
    const errors: string[] = []
    page.on('pageerror', (err) => errors.push(err.message))
    page.on('console', (msg) => {
      if (msg.type() === 'error') errors.push(msg.text())
    })

    await page.goto('/')
    await expect(page).toHaveTitle(/.+/)
    // Hero o CTAs principales presentes
    await expect(
      page.locator('#hero-cta-register, #see-all-courts, #benefits-cta, #final-cta-register'),
    ).not.toHaveCount(0)
    // No queremos errores no controlados; los warnings de Vuetify/Nuxt sí pasan (no son `error`).
    expect(errors, `errores en consola: ${errors.join(' | ')}`).toEqual([])
  })
})
