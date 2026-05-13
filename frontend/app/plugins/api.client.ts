/**
 * Plugin api.client.ts
 *
 * Crea una instancia de $fetch configurada con:
 *  - baseURL de la API
 *  - Header Authorization inyectado automáticamente desde el auth store
 *  - Interceptor de 401 → logout automático
 *  - Interceptor de 5xx → toast de error global
 *
 * Se expone como `$api` en el contexto de Nuxt.
 * Uso: const { $api } = useNuxtApp()
 *
 * También actualiza useApi() para que todas las páginas/stores
 * hereden los interceptores sin cambios adicionales.
 */
export default defineNuxtPlugin(() => {
  const authStore  = useAuthStore()
  const toast      = useToast()
  const config     = useRuntimeConfig()

  const api = $fetch.create({
    baseURL: config.public.apiBase as string,

    onRequest({ options }) {
      // Inyecta el Bearer token si existe sesión activa
      if (authStore.token) {
        const existing = (options.headers as Record<string, string>) ?? {}
        options.headers = {
          ...existing,
          Authorization: `Bearer ${authStore.token}`,
        }
      }
    },

    onResponseError({ response }) {
      if (response.status === 401) {
        // Token inválido o expirado → cierre de sesión y redirección
        toast.warning('Tu sesión expiró. Por favor inicia sesión nuevamente.')
        authStore.logout()
      } else if (response.status >= 500) {
        // Error del servidor → notificar al usuario sin romper el flujo
        toast.error('Error del servidor. Por favor intenta de nuevo.')
      }
    },
  })

  return {
    provide: { api },
  }
})
