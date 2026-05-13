import { defineStore } from 'pinia'

export interface Court {
  id: string
  name: string
  description?: string
  type: string
  capacity: number
  pricePerHour: number
  isActive: boolean
  businessId: string
  business?: {
    id: string
    name: string
    city?: string
    address?: string
  }
  availability?: CourtAvailability[]
}

export interface CourtAvailability {
  id: string
  dayOfWeek: number
  openTime: string
  closeTime: string
}

interface CourtsState {
  courts: Court[]
  currentCourt: Court | null
  loading: boolean
  error: string | null
}

export const useCourtsStore = defineStore('courts', {
  state: (): CourtsState => ({
    courts: [],
    currentCourt: null,
    loading: false,
    error: null,
  }),

  getters: {
    activeCourts: (state) => state.courts.filter((c) => c.isActive),
  },

  actions: {
    async fetchCourts() {
      const { apiFetch } = useApi()
      this.loading = true
      this.error = null
      try {
        this.courts = await apiFetch<Court[]>('/courts')
      } catch (e: any) {
        this.error = e?.data?.message ?? 'Error al cargar las canchas'
        throw e
      } finally {
        this.loading = false
      }
    },

    async fetchCourt(id: string) {
      const { apiFetch } = useApi()
      this.loading = true
      this.error = null
      try {
        this.currentCourt = await apiFetch<Court>(`/courts/${id}`)
        return this.currentCourt
      } catch (e: any) {
        this.error = e?.data?.message ?? 'Error al cargar la cancha'
        throw e
      } finally {
        this.loading = false
      }
    },

    clearCurrentCourt() {
      this.currentCourt = null
    },
  },
})
