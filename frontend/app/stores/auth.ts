import { defineStore } from 'pinia'

export interface User {
  id: string
  email: string
  firstName: string
  lastName: string
  phone?: string
  role: 'admin' | 'bussines' | 'client'
  isActive: boolean
}

interface AuthState {
  token: string | null
  user: User | null
}

export const useAuthStore = defineStore('auth', {
  state: (): AuthState => ({
    token: null,
    user: null,
  }),

  getters: {
    isAuthenticated: (state) => !!state.token && !!state.user,
    isAdmin: (state) => state.user?.role === 'admin',
    isBusiness: (state) => state.user?.role === 'bussines',
    isClient: (state) => state.user?.role === 'client',
    fullName: (state) =>
      state.user ? `${state.user.firstName} ${state.user.lastName}` : '',
    roleLabel: (state) => {
      switch (state.user?.role) {
        case 'admin': return 'Super Admin'
        case 'bussines': return 'Negocio'
        case 'client': return 'Cliente'
        default: return ''
      }
    },
  },

  actions: {
    async login(email: string, password: string) {
      const config = useRuntimeConfig()
      const data = await $fetch<{ access_token: string; user: User }>(
        `${config.public.apiBase}/auth/login`,
        {
          method: 'POST',
          body: { email, password },
        }
      )
      this.token = data.access_token
      this.user = data.user
      this._persist()
      return data
    },

    async register(payload: {
      email: string
      password: string
      firstName: string
      lastName: string
      phone?: string
      role?: string
    }) {
      const config = useRuntimeConfig()
      const data = await $fetch<{ access_token: string; user: User }>(
        `${config.public.apiBase}/auth/register`,
        {
          method: 'POST',
          body: payload,
        }
      )
      this.token = data.access_token
      this.user = data.user
      this._persist()
      return data
    },

    logout() {
      this.token = null
      this.user = null
      if (import.meta.client) {
        localStorage.removeItem('auth_token')
        localStorage.removeItem('auth_user')
      }
      navigateTo('/auth/login')
    },

    hydrate() {
      if (import.meta.client) {
        const token = localStorage.getItem('auth_token')
        const user = localStorage.getItem('auth_user')
        if (token && user) {
          this.token = token
          this.user = JSON.parse(user)
        }
      }
    },

    _persist() {
      if (import.meta.client) {
        localStorage.setItem('auth_token', this.token!)
        localStorage.setItem('auth_user', JSON.stringify(this.user))
      }
    },
  },
})
