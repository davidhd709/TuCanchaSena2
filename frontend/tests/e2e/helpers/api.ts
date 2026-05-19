/**
 * Cliente mínimo del backend para preparar fixtures de E2E.
 * Cada spec lo usa para sembrar reservas y consultar disponibilidad sin pasar
 * por la UI, lo que reduce flake y mantiene los specs independientes.
 */

import type { APIRequestContext } from '@playwright/test'
import { request } from '@playwright/test'
import { readFile } from 'node:fs/promises'
import { join } from 'node:path'

export const API_BASE = process.env.E2E_API_BASE ?? 'http://localhost:8001/api'

export const DEMO = {
  client: { email: 'cliente@tucancha.local', password: 'Password123!' },
  business: { email: 'negocio@tucancha.local', password: 'Password123!' },
  admin: { email: 'admin@tucancha.local', password: 'Password123!' },
} as const

export type Role = keyof typeof DEMO

/**
 * El backend protege `/auth/login` con `@Throttle({ limit: 5, ttl: 60_000 })`
 * (anti-bruteforce). Eso baja con cada login real, así que cacheamos el token Y
 * el user payload por rol en `globalThis` y los reusamos en TODA la corrida.
 * Tanto `loginViaApi` como `loginUI` los aprovechan.
 */
export type AuthBundle = { token: string; user: any }
type AuthCacheBag = { [k in Role]?: AuthBundle }
const cacheKey = '__tucancha_e2e_auth_cache__'
function authCache(): AuthCacheBag {
  const g = globalThis as any
  if (!g[cacheKey]) g[cacheKey] = {} as AuthCacheBag
  return g[cacheKey] as AuthCacheBag
}

export async function loginViaApi(role: Role): Promise<string> {
  return (await getAuthBundle(role)).token
}

export async function getAuthBundle(role: Role): Promise<AuthBundle> {
  const cache = authCache()
  if (cache[role]) return cache[role]!
  // Preferimos el archivo generado por `global-setup.ts` para no consumir
  // el throttle de /auth/login (5/min). Si el archivo no existe (corrida
  // sin globalSetup), caemos al login HTTP directo.
  try {
    const raw = await readFile(
      join(process.cwd(), 'test-results', `auth-${role}.json`),
      'utf-8',
    )
    const parsed = JSON.parse(raw) as { access_token: string; user: any }
    cache[role] = { token: parsed.access_token, user: parsed.user }
    return cache[role]!
  } catch {
    // Fallback: login directo si el archivo no existe.
  }
  const ctx = await request.newContext()
  const res = await ctx.post(`${API_BASE}/auth/login`, { data: DEMO[role] })
  if (!res.ok()) {
    throw new Error(`Login API falló para ${role}: ${res.status()} ${await res.text()}`)
  }
  const body = (await res.json()) as { access_token: string; user: any }
  await ctx.dispose()
  cache[role] = { token: body.access_token, user: body.user }
  return cache[role]!
}

async function authed(token: string): Promise<APIRequestContext> {
  return request.newContext({
    extraHTTPHeaders: { Authorization: `Bearer ${token}` },
  })
}

/**
 * Devuelve `{ businessId, courtId, businessName, courtName }` del primer negocio/cancha
 * que produzcan al menos un slot disponible en `targetDate`. Esto evita falsos negativos
 * cuando el seed tiene varios negocios y algunos no abren ese día.
 */
export async function firstActiveBusinessAndCourt(targetDate?: string): Promise<{
  businessId: string
  courtId: string
  businessName: string
  courtName: string
}> {
  const ctx = await request.newContext()
  const bizRes = await ctx.get(`${API_BASE}/businesses`)
  if (!bizRes.ok()) throw new Error(`GET /businesses falló: ${bizRes.status()}`)
  const bizBody = await bizRes.json()
  const businesses = Array.isArray(bizBody) ? bizBody : bizBody.data
  await ctx.dispose()

  const clientToken = await loginViaApi('client')

  for (const biz of businesses) {
    if (biz.isActive === false) continue

    const courtsCtx = await request.newContext()
    const courtsRes = await courtsCtx.get(`${API_BASE}/courts/by-business/${biz.id}`)
    if (!courtsRes.ok()) {
      await courtsCtx.dispose()
      continue
    }
    const courtsBody = await courtsRes.json()
    const courts = Array.isArray(courtsBody) ? courtsBody : courtsBody.data
    await courtsCtx.dispose()

    for (const court of courts) {
      if (court.isActive === false || court.status !== 'available') continue
      if (!targetDate) {
        return {
          businessId: biz.id,
          courtId: court.id,
          businessName: biz.name,
          courtName: court.name,
        }
      }
      const slots = await getAvailableSlots(court.id, targetDate, clientToken)
      if (slots.some((s) => s.isAvailable)) {
        return {
          businessId: biz.id,
          courtId: court.id,
          businessName: biz.name,
          courtName: court.name,
        }
      }
    }
  }
  throw new Error(
    `No hay negocio/cancha con slots disponibles en ${targetDate ?? '(sin fecha)'}`,
  )
}

/** YYYY-MM-DD con N días hacia adelante. */
export function dateNDaysAhead(n: number): string {
  const d = new Date()
  d.setDate(d.getDate() + n)
  return d.toISOString().slice(0, 10)
}

/**
 * Formatea una fecha YYYY-MM-DD igual que el frontend, donde `b.date` viene del
 * backend como ISO UTC y `new Date(iso)` se convierte a hora local con un shift
 * de TZ. Replicamos el mismo shift para que el filtro encuentre la card real.
 * Si en el futuro se arregla el shift en frontend, este helper también debe
 * actualizarse.
 */
export function formatDateForUi(yyyymmdd: string): string {
  return new Date(`${yyyymmdd}T00:00:00.000Z`).toLocaleDateString('es-CO', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

/**
 * Crea una reserva como cliente (sin comprobante para que quede `pending`).
 * Devuelve `{ bookingId, courtId, date, startTime, endTime }` para que el spec
 * pueda referirse a ella sin depender de otros tests.
 */
export async function createPendingBooking(opts: {
  courtId: string
  date: string
  startTime: string
  endTime: string
  clientToken?: string
}) {
  const token = opts.clientToken ?? (await loginViaApi('client'))
  const ctx = await authed(token)
  const res = await ctx.post(`${API_BASE}/bookings`, {
    multipart: {
      courtId: opts.courtId,
      date: opts.date,
      startTime: opts.startTime,
      endTime: opts.endTime,
      paymentMethod: 'transferencia',
      notes: 'E2E fixture',
    },
  })
  if (!res.ok()) {
    throw new Error(
      `POST /bookings falló para ${opts.date} ${opts.startTime}: ${res.status()} ${await res.text()}`,
    )
  }
  const booking = (await res.json()) as { id: string }
  await ctx.dispose()
  return { bookingId: booking.id, token, ...opts }
}

/**
 * `available-slots` requiere JWT. Si no nos pasan token, hacemos un login de cliente
 * descartable para no obligar a cada caller a manejarlo.
 */
export async function getAvailableSlots(courtId: string, date: string, token?: string) {
  const t = token ?? (await loginViaApi('client'))
  const ctx = await authed(t)
  const res = await ctx.get(
    `${API_BASE}/bookings/court/${courtId}/available-slots?date=${date}`,
  )
  if (!res.ok()) throw new Error(`GET available-slots falló: ${res.status()} ${await res.text()}`)
  const body = await res.json()
  await ctx.dispose()
  return body.slots as Array<{ startTime: string; endTime: string; isAvailable: boolean }>
}

export async function bookingDetail(token: string, id: string) {
  const ctx = await authed(token)
  const res = await ctx.get(`${API_BASE}/bookings/${id}`)
  if (!res.ok()) throw new Error(`GET /bookings/:id falló: ${res.status()}`)
  const body = await res.json()
  await ctx.dispose()
  return body
}
