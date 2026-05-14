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

  /**
   * apiList — para endpoints que devuelven una lista.
   * El backend pagina varios endpoints (`{ data, total, page, pageSize }`)
   * mientras otros devuelven un array plano. Este helper desempaqueta
   * ambos casos y siempre retorna un array, así las páginas no se rompen.
   */
  const apiList = async <T>(
    endpoint: string,
    options: Parameters<typeof $fetch>[1] = {},
  ): Promise<T[]> => {
    const res = await ($api as typeof $fetch)<any>(endpoint, options)
    if (Array.isArray(res)) return res as T[]
    if (res && Array.isArray(res.data)) return res.data as T[]
    return []
  }

  return { apiFetch, apiList }
}
