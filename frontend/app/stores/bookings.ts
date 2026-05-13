import { defineStore } from 'pinia'

export type BookingStatus = 'pending' | 'confirmed' | 'rejected' | 'cancelled' | 'completed'

export interface Booking {
  id: string
  courtId: string
  clientId: string
  date: string
  startTime: string
  endTime: string
  status: BookingStatus
  paymentMethod: string
  paymentProofUrl?: string
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
  allBookings: Booking[]
  loading: boolean
  creating: boolean
  error: string | null
}

export const useBookingsStore = defineStore('bookings', {
  state: (): BookingsState => ({
    myBookings: [],
    allBookings: [],
    loading: false,
    creating: false,
    error: null,
  }),

  getters: {
    pendingBookings: (state) => state.myBookings.filter((b) => b.status === 'pending'),
    confirmedBookings: (state) => state.myBookings.filter((b) => b.status === 'confirmed'),
  },

  actions: {
    /** Reservas del cliente autenticado */
    async fetchMyBookings() {
      const { apiFetch } = useApi()
      this.loading = true
      this.error = null
      try {
        this.myBookings = await apiFetch<Booking[]>('/bookings/mine')
      } catch (e: any) {
        this.error = e?.data?.message ?? 'Error al cargar tus reservas'
        throw e
      } finally {
        this.loading = false
      }
    },

    /** Todas las reservas (admin / business) */
    async fetchAllBookings() {
      const { apiFetch } = useApi()
      this.loading = true
      this.error = null
      try {
        this.allBookings = await apiFetch<Booking[]>('/bookings')
      } catch (e: any) {
        this.error = e?.data?.message ?? 'Error al cargar las reservas'
        throw e
      } finally {
        this.loading = false
      }
    },

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
        if (payload.notes)         formData.append('notes', payload.notes)
        if (payload.paymentProof)  formData.append('paymentProof', payload.paymentProof)

        const booking = await apiFetch<Booking>('/bookings', {
          method: 'POST',
          body: formData,
        })

        // Agrega la nueva reserva a la lista local para UI reactiva inmediata
        this.myBookings.unshift(booking)
        return booking
      } catch (e: any) {
        this.error = e?.data?.message ?? 'Error al crear la reserva'
        throw e
      } finally {
        this.creating = false
      }
    },

    /** Actualiza el estado de una reserva (admin/business) */
    async updateStatus(bookingId: string, status: BookingStatus) {
      const { apiFetch } = useApi()
      try {
        const updated = await apiFetch<Booking>(`/bookings/${bookingId}/status`, {
          method: 'PATCH',
          body: { status },
        })
        // Actualiza en la lista local si existe
        const idx = this.allBookings.findIndex((b) => b.id === bookingId)
        if (idx !== -1) this.allBookings[idx] = updated
        return updated
      } catch (e: any) {
        this.error = e?.data?.message ?? 'Error al actualizar la reserva'
        throw e
      }
    },
  },
})
