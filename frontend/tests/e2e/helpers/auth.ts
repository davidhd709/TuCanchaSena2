/**
 * "Login" desde el punto de vista del navegador, pero implementado inyectando
 * el JWT en `localStorage` (las claves `auth_token` y `auth_user` que el store
 * `useAuthStore.hydrate()` lee). Evita pasar por el formulario y consumir el
 * throttle de `/auth/login` (limit: 5 / 60s) en cada test.
 *
 * El primer test que llame esto hará 1 (uno) POST a /auth/login para hidratar
 * el cache; el resto reusa el token vía `getAuthBundle()` cacheado.
 */

import type { Page } from '@playwright/test'
import { expect } from '@playwright/test'
import { DEMO, getAuthBundle, type Role } from './api'

export async function loginUI(page: Page, role: Role) {
  const { token, user } = await getAuthBundle(role)
  // Hay que estar en el origen del frontend para poder escribir su localStorage.
  await page.goto('/')
  await page.evaluate(
    ({ token, user }) => {
      localStorage.setItem('auth_token', token)
      localStorage.setItem('auth_user', JSON.stringify(user))
    },
    { token, user },
  )
}

/**
 * Login REAL por el formulario UI (no cacheado).
 * Solo usar en el spec que valida el formulario; los demás deben usar
 * `loginUI` para no consumir el throttle anti-bruteforce (limit 5 / 60s).
 */
export async function loginViaForm(page: Page, role: Role) {
  await page.goto('/auth/login')
  const email = page.getByLabel('Correo electrónico')
  const password = page.getByLabel('Contraseña', { exact: true })
  await expect(email).toBeVisible({ timeout: 10_000 })
  await email.fill(DEMO[role].email)
  await password.fill(DEMO[role].password)
  await page.getByTestId('login-submit').click()
  await expect(page).not.toHaveURL(/\/auth\/login$/, { timeout: 15_000 })
}
