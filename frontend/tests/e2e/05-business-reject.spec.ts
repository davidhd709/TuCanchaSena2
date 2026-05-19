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

test.describe('Flujo business — rechazar reserva y liberar slot', () => {
  test('business rechaza reserva con motivo y el slot vuelve a estar disponible', async ({
    page,
  }) => {
    // Setup independiente
    const date = dateNDaysAhead(1)
    const { courtId } = await firstActiveBusinessAndCourt(date)
    const slots = await getAvailableSlots(courtId, date)
    const slot = slots.find((s) => s.isAvailable)
    test.skip(!slot, `Sin slots disponibles en ${date}`)

    const { bookingId } = await createPendingBooking({
      courtId,
      date,
      startTime: slot!.startTime,
      endTime: slot!.endTime,
    })

    await loginUI(page, 'business')
    await page.goto('/business/bookings')
    await page.waitForLoadState('networkidle')

    const dateLabel = formatDateForUi(date)
    const card = page
      .locator('.bk-card')
      .filter({ hasText: dateLabel })
      .filter({ hasText: `${slot!.startTime}–${slot!.endTime}` })
      .first()
    await expect(card).toBeVisible({ timeout: 15_000 })
    await card.click()

    // Detail dialog → click "Rechazar" (botón tonal del detalle) abre reject dialog
    await page
      .getByRole('button', { name: 'Rechazar', exact: true })
      .first()
      .click()

    // Reject dialog: motivo + confirm (botón flat dentro del dialog de motivo)
    const rejectDialog = page.locator('.v-dialog').filter({ hasText: 'Rechazar Reserva' })
    await rejectDialog.locator('textarea').fill('Comprobante inválido (E2E)')
    await rejectDialog.getByRole('button', { name: 'Rechazar', exact: true }).click()

    // Verificación 1: status del booking es `rejected`
    const businessToken = await loginViaApi('business')
    await expect
      .poll(async () => (await bookingDetail(businessToken, bookingId)).status, {
        timeout: 15_000,
        message: 'el backend no marcó la reserva como rejected',
      })
      .toBe('rejected')

    // Verificación 2: el slot vuelve a estar disponible para nuevas reservas
    await expect
      .poll(async () => {
        const fresh = await getAvailableSlots(courtId, date)
        const same = fresh.find((s) => s.startTime === slot!.startTime)
        return same?.isAvailable
      })
      .toBe(true)
  })
})
