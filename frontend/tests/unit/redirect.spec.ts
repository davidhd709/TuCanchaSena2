/**
 * TEST UNITARIO — safeRedirectPath (redirección post-login)
 * Verifica que solo se acepten rutas internas y se bloqueen open-redirects.
 * Import relativo: el alias `~` no se resuelve en esta config de Vitest.
 */
import { safeRedirectPath } from '../../app/utils/redirect'

describe('safeRedirectPath', () => {
  it('acepta rutas internas absolutas', () => {
    expect(safeRedirectPath('/client/courts/abc-123')).toBe('/client/courts/abc-123')
    expect(safeRedirectPath('/dashboard')).toBe('/dashboard')
  })

  it('permite query params (incluso con ":" en horas)', () => {
    const path = '/client/courts/abc/book?date=2026-05-22&startTime=08:00&endTime=09:00'
    expect(safeRedirectPath(path)).toBe(path)
  })

  it('bloquea URLs externas y protocol-relative → fallback', () => {
    expect(safeRedirectPath('https://evil.com')).toBe('/dashboard')
    expect(safeRedirectPath('//evil.com')).toBe('/dashboard')
    expect(safeRedirectPath('/\\evil.com')).toBe('/dashboard')
    expect(safeRedirectPath('http://x/y')).toBe('/dashboard')
  })

  it('bloquea valores no-ruta o vacíos → fallback', () => {
    expect(safeRedirectPath('dashboard')).toBe('/dashboard') // no empieza con '/'
    expect(safeRedirectPath('')).toBe('/dashboard')
    expect(safeRedirectPath(undefined)).toBe('/dashboard')
    expect(safeRedirectPath(null)).toBe('/dashboard')
    expect(safeRedirectPath(['/x'])).toBe('/dashboard')
  })

  it('respeta un fallback personalizado', () => {
    expect(safeRedirectPath(undefined, '/client/courts')).toBe('/client/courts')
  })
})
