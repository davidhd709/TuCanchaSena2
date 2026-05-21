/**
 * Catálogo único de estados de reserva.
 * =====================================
 * Centraliza label, icono, color lógico, clase CSS del badge y si el estado es
 * final o pendiente. Antes esta info estaba duplicada en `BookingStatusChip`,
 * el calendario de `business/bookings.vue` y el hero de `bookings/[id].vue`.
 *
 * IMPORTANTE: no cambia el contrato del backend. Los `value` son exactamente
 * los strings que envía la API y `badgeClass` mantiene la convención visual
 * existente (`status-badge is-<value>`) de la que dependen los E2E.
 *
 * Archivo en `app/utils/` → auto-importado por Nuxt y testeable de forma aislada.
 */

export type BookingStatus =
  | 'pending'
  | 'confirmed'
  | 'rejected'
  | 'cancelled'
  | 'completed'
  | 'no_show'
  | 'expired'

/** Color lógico semántico (alineado con la paleta del design system). */
export type BookingStatusColor = 'warning' | 'success' | 'info' | 'error' | 'neutral'

export interface BookingStatusMeta {
  /** String tal cual lo envía el backend. */
  value: string
  /** Etiqueta en español para la UI. */
  label: string
  /** Icono MDI (`mdi-...`). */
  icon: string
  /** Color lógico semántico. */
  color: BookingStatusColor
  /** Clase CSS del badge del design system (`status-badge is-<value>`). */
  badgeClass: string
  /** `true` si el estado es terminal (no admite más transiciones desde la UI). */
  isFinal: boolean
  /** `true` si la reserva sigue esperando acción/validación. */
  isPending: boolean
}

const meta = (
  value: BookingStatus,
  label: string,
  icon: string,
  color: BookingStatusColor,
  flags: { isFinal: boolean; isPending: boolean },
): BookingStatusMeta => ({
  value,
  label,
  icon,
  color,
  badgeClass: `is-${value}`,
  isFinal: flags.isFinal,
  isPending: flags.isPending,
})

export const BOOKING_STATUS_CATALOG: Record<BookingStatus, BookingStatusMeta> = {
  pending: meta('pending', 'Pendiente', 'mdi-clock-outline', 'warning', {
    isFinal: false,
    isPending: true,
  }),
  confirmed: meta('confirmed', 'Confirmada', 'mdi-check-circle-outline', 'success', {
    isFinal: false,
    isPending: false,
  }),
  rejected: meta('rejected', 'Rechazada', 'mdi-close-circle-outline', 'error', {
    isFinal: true,
    isPending: false,
  }),
  cancelled: meta('cancelled', 'Cancelada', 'mdi-close-circle-outline', 'error', {
    isFinal: true,
    isPending: false,
  }),
  completed: meta('completed', 'Completada', 'mdi-flag-checkered', 'info', {
    isFinal: true,
    isPending: false,
  }),
  no_show: meta('no_show', 'No Show', 'mdi-account-off-outline', 'neutral', {
    isFinal: true,
    isPending: false,
  }),
  expired: meta('expired', 'Vencida', 'mdi-timer-off-outline', 'neutral', {
    isFinal: true,
    isPending: false,
  }),
}

/** Meta para un estado desconocido — replica el fallback histórico del chip. */
function unknownStatusMeta(status: string): BookingStatusMeta {
  return {
    value: status,
    label: status,
    icon: 'mdi-help-circle-outline',
    color: 'neutral',
    badgeClass: `is-${status}`,
    isFinal: false,
    isPending: false,
  }
}

/**
 * Devuelve la metadata del estado. Para estados fuera del catálogo cae a un
 * fallback seguro (label = el propio string, icono de ayuda) sin romper el render.
 */
export function getBookingStatusMeta(status: string | null | undefined): BookingStatusMeta {
  if (!status) return unknownStatusMeta('')
  return BOOKING_STATUS_CATALOG[status as BookingStatus] ?? unknownStatusMeta(status)
}

export const bookingStatusLabel = (status: string): string => getBookingStatusMeta(status).label
export const bookingStatusIcon = (status: string): string => getBookingStatusMeta(status).icon
export const isFinalBookingStatus = (status: string): boolean => getBookingStatusMeta(status).isFinal
export const isPendingBookingStatus = (status: string): boolean =>
  getBookingStatusMeta(status).isPending
