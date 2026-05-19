import { test, expect, request } from '@playwright/test'
import { API_BASE } from './helpers/api'

/**
 * Validamos que el backend acepta los orígenes locales del frontend en dev,
 * sin necesidad de levantar Nuxt en un segundo puerto. Simulamos al navegador
 * mandando un GET con cabecera `Origin: http://localhost:3001` y verificamos
 * el `access-control-allow-origin` de la respuesta.
 *
 * Pre-requisito implícito: el backend debe estar arrancado con esos orígenes
 * permitidos (default de dev del propio main.ts).
 */
test.describe('CORS dev — múltiples orígenes locales', () => {
  for (const origin of [
    'http://localhost:3000',
    'http://localhost:3001',
    'http://127.0.0.1:3000',
    'http://127.0.0.1:3001',
  ]) {
    test(`backend acepta Origin ${origin}`, async () => {
      const ctx = await request.newContext({
        extraHTTPHeaders: { Origin: origin },
      })
      const res = await ctx.get(`${API_BASE}/businesses`)
      expect(res.ok(), `GET /businesses con Origin ${origin}: ${res.status()}`).toBe(true)
      const allowed = res.headers()['access-control-allow-origin']
      expect(allowed, 'falta access-control-allow-origin').toBe(origin)
      await ctx.dispose()
    })
  }

  test('backend NO acepta un Origin arbitrario', async () => {
    const ctx = await request.newContext({
      extraHTTPHeaders: { Origin: 'http://evil.example.com' },
    })
    const res = await ctx.get(`${API_BASE}/businesses`)
    // El request HTTP en sí responde (no es un browser), pero el header CORS
    // debe omitirse o no coincidir con evil.example.com.
    const allowed = res.headers()['access-control-allow-origin']
    expect(allowed === 'http://evil.example.com').toBe(false)
    await ctx.dispose()
  })
})
