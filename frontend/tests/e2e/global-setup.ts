/**
 * `globalSetup` corre una sola vez antes de toda la suite.
 *
 * Hacemos 2 logins reales (client + business) y persistimos
 * `{token, user}` por rol en archivos JSON. Los helpers reusan estos
 * archivos para no consumir el throttle anti-bruteforce
 * (`@Throttle({ limit: 5, ttl: 60_000 })` sobre `/auth/login`).
 *
 * Si necesitas regenerar los tokens, borra `test-results/auth-*.json`
 * o reinicia el backend antes de correr la suite.
 */

import { request } from '@playwright/test'
import { mkdir, writeFile } from 'node:fs/promises'
import { join } from 'node:path'

const API_BASE = process.env.E2E_API_BASE ?? 'http://localhost:8001/api'
const DEMO = {
  client: { email: 'cliente@tucancha.local', password: 'Password123!' },
  business: { email: 'negocio@tucancha.local', password: 'Password123!' },
  admin: { email: 'admin@tucancha.local', password: 'Password123!' },
}

export const AUTH_DIR = join(process.cwd(), 'test-results')

export default async function globalSetup() {
  await mkdir(AUTH_DIR, { recursive: true })
  for (const [role, creds] of Object.entries(DEMO)) {
    const ctx = await request.newContext()
    const res = await ctx.post(`${API_BASE}/auth/login`, { data: creds })
    if (!res.ok()) {
      // Si el throttler bloquea aquí, esperamos un poco y reintentamos una vez.
      if (res.status() === 429) {
        await new Promise((r) => setTimeout(r, 65_000))
        const retry = await ctx.post(`${API_BASE}/auth/login`, { data: creds })
        if (!retry.ok()) {
          throw new Error(
            `globalSetup: login ${role} sigue fallando tras reintento: ${retry.status()}`,
          )
        }
        const body = await retry.json()
        await writeFile(join(AUTH_DIR, `auth-${role}.json`), JSON.stringify(body))
        await ctx.dispose()
        continue
      }
      throw new Error(`globalSetup: login ${role} falló: ${res.status()} ${await res.text()}`)
    }
    const body = await res.json()
    await writeFile(join(AUTH_DIR, `auth-${role}.json`), JSON.stringify(body))
    await ctx.dispose()
  }
}
