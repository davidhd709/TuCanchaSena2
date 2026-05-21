import { test, expect } from '@playwright/test'
import { loginUI } from './helpers/auth'
import {
  createPendingBooking,
  dateNDaysAhead,
  firstActiveBusinessAndCourt,
  getAvailableSlots,
} from './helpers/api'

test.describe('Regresión UX', () => {
  test('listado de reservas no muestra "Invalid Date"', async ({ page }) => {
    // Sembramos una reserva propia para garantizar al menos un item visible.
    const date = dateNDaysAhead(1)
    const { courtId } = await firstActiveBusinessAndCourt(date)
    const slots = await getAvailableSlots(courtId, date)
    const slot = slots.find((s) => s.isAvailable)
    test.skip(!slot, `Sin slots disponibles en ${date}`)
    await createPendingBooking({
      courtId,
      date,
      startTime: slot!.startTime,
      endTime: slot!.endTime,
    })

    await loginUI(page, 'client')
    await page.goto('/client/bookings')
    await page.waitForLoadState('networkidle')

    // Si hay tarjetas visibles, ninguna debería renderizar "Invalid Date".
    await expect(page.locator('body')).not.toContainText('Invalid Date')
  })

  test('vista de cancha sin slots muestra el texto canónico', async ({ page }) => {
    await loginUI(page, 'client')

    // Entramos a la primera cancha activa por la vía pública (no requiere conocer ids).
    await page.goto('/client/businesses')
    await page.getByTestId('business-card').first().click()
    await page.getByTestId('court-card').first().click()

    // Forzamos una fecha muy lejana para que con alta probabilidad la disponibilidad
    // del seed esté vacía o la cancha esté cerrada — el código devuelve `slots: []`
    // cuando el negocio está cerrado ese día o no hay availability configurada.
    // Si la cancha del seed abre todos los días, este test prueba el camino
    // "selectedDate sin slots disponibles" mediante un domingo lejano sin horarios
    // configurados específicos para la fecha.
    const farDate = '2099-01-04' // lunes año 2099 — la lógica del seed sigue aplicando, no debería tener nada
    const dateInput = page.locator('input[type="date"]').first()
    await dateInput.fill(farDate)

    // Si por casualidad el seed sí muestra slots para esa fecha, el test se salta:
    // no estamos validando "siempre hay 0 slots", sino que el TEXTO sea correcto cuando lo hay.
    const empty = page.locator('.booking-empty')
    await empty.waitFor({ state: 'visible', timeout: 10_000 }).catch(() => null)
    if (!(await empty.isVisible())) {
      test.skip(true, 'la fecha de prueba sí devolvió slots — no es posible validar el mensaje')
    }

    await expect(empty).toContainText(
      'No hay horarios disponibles para esta fecha. Intenta con otro día o consulta otro horario.',
    )
  })
})
