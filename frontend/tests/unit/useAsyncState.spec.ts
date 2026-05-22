/**
 * TEST UNITARIO — useAsyncState (Fase 2 de arquitectura)
 * =====================================================
 * El composable encapsula el patrón loading/error/try-catch usado por las
 * páginas read-only. Usa `ref` de Vue (import explícito) → testeable aislado.
 *
 * Import relativo: el alias `~` no se resuelve en esta config de Vitest.
 */
import { useAsyncState } from '../../app/composables/useAsyncState'

describe('useAsyncState', () => {
  it('estado inicial: data = valor inicial, sin loading ni error', () => {
    const { data, loading, error } = useAsyncState(async () => [1, 2], [] as number[])
    expect(data.value).toEqual([])
    expect(loading.value).toBe(false)
    expect(error.value).toBe(false)
  })

  it('execute exitoso actualiza data y apaga loading', async () => {
    const { data, loading, error, execute } = useAsyncState(async () => 'ok', '')
    await execute()
    expect(data.value).toBe('ok')
    expect(loading.value).toBe(false)
    expect(error.value).toBe(false)
  })

  it('loading es true mientras la promesa está en vuelo', async () => {
    const { loading, execute } = useAsyncState(
      () => new Promise<string>((resolve) => setTimeout(() => resolve('x'), 5)),
      '',
    )
    const p = execute()
    expect(loading.value).toBe(true)
    await p
    expect(loading.value).toBe(false)
  })

  it('execute con error marca error y conserva el valor inicial', async () => {
    const { data, loading, error, execute } = useAsyncState(async () => {
      throw new Error('boom')
    }, 'inicial')
    await execute()
    expect(error.value).toBe(true)
    expect(data.value).toBe('inicial')
    expect(loading.value).toBe(false)
  })

  it('un execute exitoso tras un fallo resetea el flag de error', async () => {
    let shouldFail = true
    const { error, execute } = useAsyncState(async () => {
      if (shouldFail) throw new Error('boom')
      return 'recuperado'
    }, '')
    await execute()
    expect(error.value).toBe(true)
    shouldFail = false
    await execute()
    expect(error.value).toBe(false)
  })
})
