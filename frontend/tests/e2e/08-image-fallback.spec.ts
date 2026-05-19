import { test, expect } from '@playwright/test'
import { loginUI } from './helpers/auth'

/**
 * Verifica que cuando `picsum.photos` (imágenes externas del seed) falla,
 * las cards muestran el placeholder local en vez de un icono roto.
 *
 * Importante: instalamos el `page.route` DESPUÉS del login, porque si Vuetify
 * intenta cargar algún recurso (fuente, css mdi) y queda en `networkidle` race
 * con un abort previo, el helper de login se desmonta antes de tiempo.
 */
test.describe('Imágenes externas — fallback al placeholder', () => {
  test('BusinessCard cae al placeholder si la imagen externa falla', async ({ page }) => {
    await loginUI(page, 'client')

    // Ahora sí abortamos picsum (simula entorno offline / DNS fallido).
    await page.route('**/picsum.photos/**', (route) => route.abort())

    await page.goto('/client/businesses')
    await page.waitForLoadState('networkidle')

    // Tras el abort, las imágenes <img> en BusinessCard emiten @error → imgError = true,
    // y se renderiza el div con clase `biz-card-img--ph`.
    const placeholder = page.locator('.biz-card-img--ph').first()
    await expect(placeholder).toBeVisible({ timeout: 15_000 })

    // Y ninguna <img> visible apuntando a picsum.photos debe seguir en pantalla.
    const stillThere = await page.locator('img[src*="picsum.photos"]:visible').count()
    expect(stillThere).toBe(0)
  })
})
