/**
 * Helper de formateo de moneda (COP).
 * ===================================
 * Centraliza el patrón `'$' + Number(x).toLocaleString('es-CO')` repetido en
 * cards, páginas de reserva y el detalle de cancha.
 *
 * Se usa el prefijo `$` manual + separador de miles `es-CO` (en lugar de
 * `Intl.NumberFormat({ style: 'currency' })`) para garantizar una salida
 * idéntica byte a byte al render actual y evitar diferencias de ICU
 * (`$ 50.000` vs `COP 50.000` según la versión de Node).
 *
 * Archivo en `app/utils/` → auto-importado por Nuxt y testeable de forma aislada.
 */

export const CURRENCY_LOCALE = 'es-CO'

export interface FormatCurrencyOptions {
  locale?: string
  symbol?: string
}

/**
 * `formatCurrency(50000)` → "$50.000".
 * Valores nulos/no numéricos se tratan como 0 → "$0".
 */
export function formatCurrency(value: unknown, options: FormatCurrencyOptions = {}): string {
  const symbol = options.symbol ?? '$'
  const locale = options.locale ?? CURRENCY_LOCALE
  const n = Number(value ?? 0)
  if (!Number.isFinite(n)) return `${symbol}0`
  return `${symbol}${n.toLocaleString(locale)}`
}
