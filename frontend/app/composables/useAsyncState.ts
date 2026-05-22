import { ref, type Ref } from 'vue'

/**
 * useAsyncState — encapsula el patrón repetido de carga de datos:
 * `loading` + `error` + `try/catch/finally`.
 *
 * Antes este boilerplate estaba copiado en cada página read-only
 * (client/businesses, client/courts, client/bookings, ...).
 *
 * Uso:
 *   const { data: businesses, loading, error: fetchError, execute: loadBusinesses } =
 *     useAsyncState(() => apiList('/businesses'), [])
 *   onMounted(loadBusinesses)
 *
 * Import explícito de `ref` (en vez de depender solo del auto-import de Nuxt)
 * para que el composable sea testeable de forma aislada en Vitest.
 */
export interface UseAsyncStateReturn<T> {
  /** Datos resueltos (o el valor inicial mientras carga/falla). */
  data: Ref<T>
  /** `true` mientras la promesa está en vuelo. */
  loading: Ref<boolean>
  /** `true` si el último `execute` lanzó. Se resetea en cada ejecución. */
  error: Ref<boolean>
  /** Dispara el fetcher y actualiza data/loading/error. */
  execute: () => Promise<void>
}

export function useAsyncState<T>(
  fetcher: () => Promise<T>,
  initialValue: T,
): UseAsyncStateReturn<T> {
  const data = ref(initialValue) as Ref<T>
  const loading = ref(false)
  const error = ref(false)

  const execute = async (): Promise<void> => {
    loading.value = true
    error.value = false
    try {
      data.value = await fetcher()
    } catch {
      error.value = true
    } finally {
      loading.value = false
    }
  }

  return { data, loading, error, execute }
}
