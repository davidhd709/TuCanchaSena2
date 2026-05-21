/**
 * Helpers de fecha/hora reutilizables.
 * ====================================
 * Centraliza el parseo seguro y el formateo que estaba duplicado en
 * `BookingCard`, `bookings/[id].vue` y `business/bookings.vue`.
 *
 * Reglas de seguridad:
 *  - Nunca renderiza "Invalid Date": cae a `DATE_FALLBACK`.
 *  - `toLocalDate` trata `YYYY-MM-DD` como fecha LOCAL a medianoche (evita el
 *    corrimiento de día por zona horaria de `new Date('2025-01-01')`).
 *
 * NO cambia la zona horaria ni la lógica de negocio del backend.
 * Archivo en `app/utils/` → auto-importado por Nuxt y testeable de forma aislada.
 */

export const DATE_LOCALE = 'es-CO'
export const DATE_FALLBACK = 'Fecha no disponible'

/** Formato largo por defecto: "lunes, 5 de mayo de 2025". */
export const DATE_FORMAT_LONG: Intl.DateTimeFormatOptions = {
  weekday: 'long',
  day: 'numeric',
  month: 'long',
  year: 'numeric',
}

/** Formato corto: "lun, 05 may". */
export const DATE_FORMAT_SHORT: Intl.DateTimeFormatOptions = {
  weekday: 'short',
  day: '2-digit',
  month: 'short',
}

/** Formato fecha+hora para timestamps: "05 may 2025, 14:30". */
export const DATETIME_FORMAT: Intl.DateTimeFormatOptions = {
  day: '2-digit',
  month: 'short',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
}

/**
 * Acepta `YYYY-MM-DD`, ISO con `T`, timestamp numérico o `Date`.
 * Devuelve `null` si no es parseable. Para `YYYY-MM-DD` construye una fecha
 * LOCAL (sin corrimiento de zona horaria).
 */
export function toLocalDate(value: unknown): Date | null {
  if (value === null || value === undefined || value === '') return null
  if (value instanceof Date) return Number.isNaN(value.getTime()) ? null : value
  if (typeof value === 'number') {
    const d = new Date(value)
    return Number.isNaN(d.getTime()) ? null : d
  }
  if (typeof value !== 'string') return null
  const ymd = /^(\d{4})-(\d{2})-(\d{2})/.exec(value)
  if (ymd) {
    const d = new Date(Number(ymd[1]), Number(ymd[2]) - 1, Number(ymd[3]))
    return Number.isNaN(d.getTime()) ? null : d
  }
  const d = new Date(value)
  return Number.isNaN(d.getTime()) ? null : d
}

/**
 * Formatea una fecha (normalizada al día local). Por defecto usa el formato
 * largo. Devuelve `DATE_FALLBACK` si la entrada no es parseable.
 */
export function formatDate(
  value: unknown,
  options: Intl.DateTimeFormatOptions = DATE_FORMAT_LONG,
  locale: string = DATE_LOCALE,
): string {
  const d = toLocalDate(value)
  if (!d) return DATE_FALLBACK
  return d.toLocaleDateString(locale, options)
}

/**
 * Formatea un timestamp completo conservando la hora (no normaliza el día).
 * Pensado para `createdAt`, `updatedAt`, etc. Devuelve `DATE_FALLBACK` si es inválido.
 */
export function formatDateTime(
  value: unknown,
  options: Intl.DateTimeFormatOptions = DATETIME_FORMAT,
  locale: string = DATE_LOCALE,
): string {
  if (value === null || value === undefined || value === '') return DATE_FALLBACK
  const d = value instanceof Date ? value : new Date(value as string | number)
  if (Number.isNaN(d.getTime())) return DATE_FALLBACK
  return d.toLocaleDateString(locale, options)
}

/** Recorta una hora `HH:MM:SS` (o `HH:MM`) a `HH:MM`. Devuelve '' si es inválida. */
export function formatTime(value: unknown): string {
  if (typeof value !== 'string' || value.length < 4) return ''
  return value.slice(0, 5)
}

/**
 * Rango horario legible: `formatTimeRange('08:00:00', '09:00:00')` → "08:00 – 09:00".
 * El separador es configurable (algunos lugares usan `–` sin espacios).
 */
export function formatTimeRange(start: unknown, end: unknown, separator = ' – '): string {
  const s = formatTime(start)
  const e = formatTime(end)
  if (!s && !e) return ''
  return `${s}${separator}${e}`
}
