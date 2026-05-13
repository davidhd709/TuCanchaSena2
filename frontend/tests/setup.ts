/**
 * SETUP GLOBAL DE VITEST
 * ======================
 * Este archivo se ejecuta UNA VEZ antes de todos los tests.
 * Aquí configuramos el entorno global de pruebas.
 *
 * Úsos comunes:
 * - Configurar mocks globales (ej. window.matchMedia, localStorage)
 * - Registrar plugins globales de Vue
 * - Limpiar el DOM entre tests
 */

import { vi } from 'vitest'

/**
 * Mock de window.matchMedia:
 * jsdom no implementa matchMedia (es una API solo de navegador real).
 * Sin este mock, los componentes que usan breakpoints/responsive fallarían.
 */
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
})

/**
 * Mock de localStorage y sessionStorage:
 * jsdom sí los implementa, pero a veces es útil resetearlos entre tests.
 */
beforeEach(() => {
  localStorage.clear()
  sessionStorage.clear()
})
