import { test, expect } from '@playwright/test'
import { loginViaForm } from './helpers/auth'

/**
 * Este spec es el ÚNICO que pasa por el formulario real; el resto inyecta el
 * token en localStorage para no consumir el throttle anti-bruteforce de
 * `/auth/login` (limit 5 / 60s).
 */
test.describe('Login por rol (formulario)', () => {
  test('login cliente', async ({ page }) => {
    await loginViaForm(page, 'client')
    await expect(page).not.toHaveURL(/\/auth\/login$/)
  })

  test('login business', async ({ page }) => {
    await loginViaForm(page, 'business')
    await expect(page).not.toHaveURL(/\/auth\/login$/)
  })
})
