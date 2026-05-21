/**
 * TEST UNITARIO — Helpers reutilizables (Fase 1 de arquitectura)
 * =============================================================
 * Cubre los nuevos módulos puros de app/utils/:
 *   - bookingStatus.ts  (catálogo de estados)
 *   - datetime.ts       (parseo/formateo seguro de fechas)
 *   - currency.ts       (formateo COP)
 *
 * Son funciones puras (sin Vue/Nuxt) → testeables de forma aislada.
 * Las aserciones sobre formato localizado se comparan contra el mismo runtime
 * (`toLocaleDateString`/`toLocaleString`) para ser agnósticas a la versión de ICU.
 */

// Import relativo: el alias `~` no está resuelto en esta config de Vitest
// (está anidado bajo `test.resolve.alias`). Los módulos son puros, sin Nuxt.
import {
  BOOKING_STATUS_CATALOG,
  getBookingStatusMeta,
  isFinalBookingStatus,
  isPendingBookingStatus,
} from '../../app/utils/bookingStatus'
import {
  DATE_FALLBACK,
  DATE_FORMAT_LONG,
  formatDate,
  formatDateTime,
  formatTime,
  formatTimeRange,
  toLocalDate,
} from '../../app/utils/datetime'
import { formatCurrency } from '../../app/utils/currency'

// ─────────────────────────────────────────────────────────────────
describe('bookingStatus — catálogo de estados', () => {
  it('cubre los 7 estados del contrato backend', () => {
    expect(Object.keys(BOOKING_STATUS_CATALOG).sort()).toEqual(
      ['cancelled', 'completed', 'confirmed', 'expired', 'no_show', 'pending', 'rejected'].sort(),
    )
  })

  it('pending: label, icono y badgeClass correctos + flags', () => {
    const meta = getBookingStatusMeta('pending')
    expect(meta.label).toBe('Pendiente')
    expect(meta.icon).toBe('mdi-clock-outline')
    expect(meta.badgeClass).toBe('is-pending')
    expect(meta.isPending).toBe(true)
    expect(meta.isFinal).toBe(false)
  })

  it('estados terminales marcan isFinal', () => {
    for (const s of ['rejected', 'cancelled', 'completed', 'no_show', 'expired']) {
      expect(isFinalBookingStatus(s)).toBe(true)
    }
    expect(isFinalBookingStatus('pending')).toBe(false)
    expect(isFinalBookingStatus('confirmed')).toBe(false)
  })

  it('solo pending es isPending', () => {
    expect(isPendingBookingStatus('pending')).toBe(true)
    expect(isPendingBookingStatus('confirmed')).toBe(false)
  })

  it('mantiene los labels históricos exactos (E2E depende de ellos)', () => {
    expect(getBookingStatusMeta('confirmed').label).toBe('Confirmada')
    expect(getBookingStatusMeta('rejected').label).toBe('Rechazada')
    expect(getBookingStatusMeta('cancelled').label).toBe('Cancelada')
    expect(getBookingStatusMeta('completed').label).toBe('Completada')
    expect(getBookingStatusMeta('no_show').label).toBe('No Show')
    expect(getBookingStatusMeta('expired').label).toBe('Vencida')
  })

  it('estado desconocido cae a un fallback seguro', () => {
    const meta = getBookingStatusMeta('algo_raro')
    expect(meta.label).toBe('algo_raro')
    expect(meta.icon).toBe('mdi-help-circle-outline')
    expect(meta.badgeClass).toBe('is-algo_raro')
  })

  it('status nulo/indefinido no rompe', () => {
    expect(() => getBookingStatusMeta(undefined)).not.toThrow()
    expect(() => getBookingStatusMeta(null)).not.toThrow()
  })
})

// ─────────────────────────────────────────────────────────────────
describe('datetime — parseo y formateo seguro', () => {
  it('toLocalDate construye fecha LOCAL para YYYY-MM-DD (sin corrimiento de TZ)', () => {
    const d = toLocalDate('2025-01-06')
    expect(d).not.toBeNull()
    expect(d!.getFullYear()).toBe(2025)
    expect(d!.getMonth()).toBe(0)
    expect(d!.getDate()).toBe(6)
  })

  it('toLocalDate devuelve null para entradas inválidas', () => {
    expect(toLocalDate('')).toBeNull()
    expect(toLocalDate(null)).toBeNull()
    expect(toLocalDate(undefined)).toBeNull()
    expect(toLocalDate('no-es-fecha')).toBeNull()
    expect(toLocalDate({})).toBeNull()
  })

  it('formatDate nunca produce "Invalid Date"', () => {
    expect(formatDate('')).toBe(DATE_FALLBACK)
    expect(formatDate(undefined)).toBe(DATE_FALLBACK)
    expect(formatDate('no-es-fecha')).toBe(DATE_FALLBACK)
    expect(formatDate('2025-01-06')).not.toContain('Invalid')
  })

  it('formatDate coincide con el render histórico (formato largo es-CO)', () => {
    const expected = new Date(2025, 0, 6).toLocaleDateString('es-CO', DATE_FORMAT_LONG)
    expect(formatDate('2025-01-06')).toBe(expected)
  })

  it('formatDateTime conserva la hora y maneja inválidos', () => {
    expect(formatDateTime('')).toBe(DATE_FALLBACK)
    expect(formatDateTime('basura')).toBe(DATE_FALLBACK)
    expect(formatDateTime('2025-01-06T14:30:00')).not.toContain('Invalid')
  })

  it('formatTime recorta a HH:MM', () => {
    expect(formatTime('08:00:00')).toBe('08:00')
    expect(formatTime('09:30')).toBe('09:30')
    expect(formatTime(null)).toBe('')
    expect(formatTime('')).toBe('')
  })

  it('formatTimeRange respeta el separador', () => {
    expect(formatTimeRange('08:00:00', '09:00:00')).toBe('08:00 – 09:00')
    expect(formatTimeRange('08:00:00', '09:00:00', '–')).toBe('08:00–09:00')
    expect(formatTimeRange(null, null)).toBe('')
  })
})

// ─────────────────────────────────────────────────────────────────
describe('currency — formateo COP', () => {
  it('antepone $ y usa separador de miles es-CO', () => {
    expect(formatCurrency(50000)).toBe(`$${(50000).toLocaleString('es-CO')}`)
    expect(formatCurrency(50000)).toContain('50')
  })

  it('valores nulos/no numéricos → $0', () => {
    expect(formatCurrency(null)).toBe('$0')
    expect(formatCurrency(undefined)).toBe('$0')
    expect(formatCurrency('abc')).toBe('$0')
    expect(formatCurrency(Number.NaN)).toBe('$0')
  })

  it('acepta strings numéricas', () => {
    expect(formatCurrency('50000')).toBe(`$${(50000).toLocaleString('es-CO')}`)
  })
})
