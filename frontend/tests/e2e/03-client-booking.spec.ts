import { test, expect } from '@playwright/test'
import { loginUI } from './helpers/auth'
import { dateNDaysAhead, firstActiveBusinessAndCourt } from './helpers/api'
import { proofPdf } from './helpers/fixtures'

test.describe('Flujo cliente — reserva con comprobante (UI completa)', () => {
  test('cliente crea reserva, sube PDF y ve estado Pendiente', async ({ page }) => {
    const targetDate = dateNDaysAhead(7)
    // Resolvemos por API qué negocio/cancha tiene slots reales para esa fecha,
    // y luego navegamos a su URL directamente. Así el spec no depende del orden
    // del listado ni de cambios en el seed.
    const { businessId } = await firstActiveBusinessAndCourt(targetDate)

    await loginUI(page, 'client')

    await page.goto(`/client/businesses/${businessId}`)

    const firstCourt = page.getByTestId('court-card').first()
    await expect(firstCourt).toBeVisible()
    await firstCourt.click()

    // Detalle de cancha: elegir fecha → slot → "Reservar ahora"
    await expect(page).toHaveURL(/\/client\/courts\/.+/)
    const dateInput = page.locator('input[type="date"]').first()
    await dateInput.fill(targetDate)

    const firstAvailableSlot = page
      .locator('button.slot-chip:not(.is-disabled)')
      .first()
    await expect(firstAvailableSlot, 'no hay slots disponibles para la fecha').toBeVisible({
      timeout: 15_000,
    })
    await firstAvailableSlot.click()

    await page.getByTestId('create-booking').click()

    // Página de pago
    await expect(page).toHaveURL(/\/client\/courts\/.+\/book/)

    // Upload del comprobante PDF (input oculto en el componente)
    const fileInput = page.getByTestId('payment-proof-input')
    await fileInput.setInputFiles({
      name: proofPdf.name,
      mimeType: proofPdf.mimeType,
      buffer: proofPdf.buffer,
    })

    // El botón se habilita cuando uploadState === 'uploaded'
    const submitBtn = page.getByTestId('submit-booking')
    await expect(submitBtn).toBeEnabled({ timeout: 15_000 })
    await submitBtn.click()

    // Diálogo de éxito → ver reserva
    await expect(page.getByTestId('booking-success')).toBeVisible({ timeout: 20_000 })
    await page.getByTestId('view-booking').click()

    // Detalle de la reserva: chip "Pendiente" (estado vía data-status, no clase visual)
    await expect(page).toHaveURL(/\/client\/bookings\/.+/)
    await expect(page.locator('[data-status="pending"]').first()).toContainText('Pendiente')
  })
})
