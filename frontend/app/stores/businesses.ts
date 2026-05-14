import { defineStore } from 'pinia'

export interface Business {
  id: string
  name: string
  description?: string
  address?: string
  city?: string
  phone?: string
  email?: string
  isActive: boolean
  ownerId: string
  courts?: Array<{ id: string; name: string }>
}

interface BusinessesState {
  businesses: Business[]
  currentBusiness: Business | null
  loading: boolean
  error: string | null
}

export const useBusinessesStore = defineStore('businesses', {
  state: (): BusinessesState => ({
    businesses: [],
    currentBusiness: null,
    loading: false,
    error: null,
  }),

  getters: {
    activeBusinesses: (state) => state.businesses.filter((b) => b.isActive),
  },

  actions: {
    async fetchBusinesses(force = false) {
      if (!force && this.businesses.length > 0) return

      const { apiFetch } = useApi()
      this.loading = true
      this.error = null
      try {
        this.businesses = await apiFetch<Business[]>('/businesses')
      } catch (e: any) {
        this.error = useApiError(e)
        throw e
      } finally {
        this.loading = false
      }
    },

    async fetchBusiness(id: string) {
      const { apiFetch } = useApi()
      this.loading = true
      this.error = null
      try {
        this.currentBusiness = await apiFetch<Business>(`/businesses/${id}`)
        return this.currentBusiness
      } catch (e: any) {
        this.error = useApiError(e)
        throw e
      } finally {
        this.loading = false
      }
    },
  },
})
