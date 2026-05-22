import { defineStore } from 'pinia'
// Fuente canónica del tipo: el catálogo de estados en app/utils/bookingStatus.ts
// (evita la duplicación que provocaba el warning de auto-import de unimport).
// Se importa solo para uso local en este archivo; el auto-import global resuelve
// `BookingStatus` desde utils.
import type { BookingStatus } from '~/utils/bookingStatus'

export interface Booking {
  id: string
  courtId: string
  clientId: string
  date: string
  startTime: string
  endTime: string
  status: BookingStatus
  paymentMethod: string
  paymentProof?: string
  cancellationReason?: string
  notes?: string
  totalPrice: number
  court?: {
    id: string
    name: string
    business?: { id: string; name: string }
  }
  client?: { id: string; firstName: string; lastName: string; email: string }
  createdAt: string
}

export interface CreateBookingPayload {
  courtId: string
  date: string
  startTime: string
  endTime: string
  paymentMethod: string
  paymentProof?: File | null
  notes?: string
}

interface BookingsState {
  myBookings: Booking[]
  creating: boolean
  error: string | null
}

export const useBookingsStore = defineStore('bookings', {
  state: (): BookingsState => ({
    myBookings: [],
    creating: false,
    error: null,
  }),

  actions: {
    /** Crea una reserva con comprobante de pago (multipart/form-data) */
    async createBooking(payload: CreateBookingPayload): Promise<Booking> {
      const { apiFetch } = useApi()
      this.creating = true
      this.error = null
      try {
        const formData = new FormData()
        formData.append('courtId',       payload.courtId)
        formData.append('date',          payload.date)
        formData.append('startTime',     payload.startTime)
        formData.append('endTime',       payload.endTime)
        formData.append('paymentMethod', payload.paymentMethod)
        if (payload.notes)        formData.append('notes', payload.notes)
        if (payload.paymentProof) formData.append('paymentProof', payload.paymentProof)

        const booking = await apiFetch<Booking>('/bookings', {
          method: 'POST',
          body: formData,
        })

        // Agrega la nueva reserva a la lista local para UI reactiva inmediata
        this.myBookings.unshift(booking)
        return booking
      } catch (e: any) {
        this.error = useApiError(e)
        throw e
      } finally {
        this.creating = false
      }
    },
  },
})
