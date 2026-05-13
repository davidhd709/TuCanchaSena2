/**
 * useApi — wrapper liviano sobre el plugin $api.
 *
 * Todos los stores y páginas deben usar este composable en lugar de
 * llamar $fetch directamente. De este modo heredan automáticamente:
 *  - Header Authorization
 *  - Interceptor 401 → logout
 *  - Interceptor 5xx → toast de error
 */
export const useApi = () => {
  const { $api } = useNuxtApp()

  const apiFetch = <T>(
    endpoint: string,
    options: Parameters<typeof $fetch>[1] = {},
  ): Promise<T> => {
    // $api ya incluye baseURL + interceptores del plugin api.client.ts
    return ($api as typeof $fetch)<T>(endpoint, options)
  }

  return { apiFetch }
}
