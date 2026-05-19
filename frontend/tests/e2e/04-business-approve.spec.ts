import { test, expect } from '@playwright/test'
import { loginUI } from './helpers/auth'
import {
  bookingDetail,
  createPendingBooking,
  dateNDaysAhead,
  firstActiveBusinessAndCourt,
  formatDateForUi,
  getAvailableSlots,
  loginViaApi,
} from './helpers/api'

test.describe('Flujo business — aprobar reserva pendiente', () => {
  test('business aprueba reserva y queda confirmada', async ({ page }) => {
    // Setup independiente: el spec crea su propia reserva pendiente vía API.
    const date = dateNDaysAhead(1)
    const { courtId } = await firstActiveBusinessAndCourt(date)
    const slots = await getAvailableSlots(courtId, date)
    const slot = slots.find((s) => s.isAvailable)
    test.skip(!slot, `Sin slots disponibles en ${date} (otro spec o seed los ocupó todos)`)

    const { bookingId } = await createPendingBooking({
      courtId,
      date,
      startTime: slot!.startTime,
      endTime: slot!.endTime,
    })

    // Login business y entrar al panel de reservas
    await loginUI(page, 'business')
    await page.goto('/business/bookings')
    await page.waitForLoadState('networkidle')

    // Localizar la card de la reserva: filtramos por fecha visible y hora de inicio.
    // No usamos el nombre del cliente porque el backend serializa la relación como
    // `user.*` mientras esta vista del frontend la lee como `client.*` (bug aparte).
    const dateLabel = formatDateForUi(date)
    const card = page
      .locator('.bk-card')
      .filter({ hasText: dateLabel })
      .filter({ hasText: `${slot!.startTime}–${slot!.endTime}` })
      .first()
    await expect(card, 'reserva pendiente no visible en business/bookings').toBeVisible({
      timeout: 15_000,
    })
    await card.click()

    // Dialog → Confirmar
    await page.getByRole('button', { name: 'Confirmar', exact: true }).click()

    // Verificación de servidor: el booking ahora es `confirmed`
    const businessToken = await loginViaApi('business')
    await expect
      .poll(async () => (await bookingDetail(businessToken, bookingId)).status, {
        timeout: 15_000,
        message: 'el backend no marcó la reserva como confirmed',
      })
      .toBe('confirmed')
  })
})
