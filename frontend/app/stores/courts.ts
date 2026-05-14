import { defineStore } from 'pinia'

export interface Court {
  id: string
  name: string
  description?: string
  type: string
  capacity: number
  pricePerHour: number
  isActive: boolean
  status?: string
  businessId: string
  images?: string[]
  amenities?: string[]
  rating?: number | null
  ratingCount?: number
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
  currentCourt: Court | null
  loading: boolean
  error: string | null
}

export const useCourtsStore = defineStore('courts', {
  state: (): CourtsState => ({
    currentCourt: null,
    loading: false,
    error: null,
  }),

  actions: {
    async fetchCourt(id: string) {
      const { apiFetch } = useApi()
      this.loading = true
      this.error = null
      try {
        this.currentCourt = await apiFetch<Court>(`/courts/${id}`)
        return this.currentCourt
      } catch (e: any) {
        this.error = useApiError(e)
        throw e
      } finally {
        this.loading = false
      }
    },
  },
})
