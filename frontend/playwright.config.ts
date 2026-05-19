/**
 * Configuración Playwright para los E2E de Tu Cancha.
 *
 * Pre-requisitos para correr la suite localmente (ver tests/e2e/README.md):
 *   1) Postgres up con la DB de Tu Cancha.
 *   2) backend/ npx prisma migrate deploy
 *   3) backend/ npm run db:seed       (crea cliente@/negocio@/admin@tucancha.local con Password123!)
 *   4) backend/ npm run start:dev     (queda escuchando en http://localhost:8001)
 *   5) frontend/ npm run dev          (queda escuchando en http://localhost:3000)
 *
 * Variables de entorno opcionales:
 *   E2E_BASE_URL    (default http://localhost:3000)
 *   E2E_API_BASE    (default http://localhost:8001/api)
 */

import { defineConfig, devices } from '@playwright/test'

const BASE_URL = process.env.E2E_BASE_URL ?? 'http://localhost:3000'

export default defineConfig({
  testDir: './tests/e2e',
  globalSetup: './tests/e2e/global-setup.ts',
  // Serializamos: los flujos crean datos en la DB seedeada y pueden interferirse entre sí.
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: 1,
  reporter: process.env.CI ? 'line' : [['list'], ['html', { open: 'never' }]],
  outputDir: 'test-results',
  timeout: 60_000,
  expect: { timeout: 10_000 },
  use: {
    baseURL: BASE_URL,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    actionTimeout: 15_000,
    navigationTimeout: 30_000,
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
})
