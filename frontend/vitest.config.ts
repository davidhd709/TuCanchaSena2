/**
 * CONFIGURACIÓN DE VITEST — Frontend (Nuxt 4 + Vue 3)
 * =====================================================
 * Vitest es el framework de testing recomendado para proyectos Vite/Nuxt.
 * Comparte la misma configuración que Vite, así que es muy rápido de configurar.
 */

import { defineConfig } from 'vitest/config'
import vue from '@vitejs/plugin-vue'
import { fileURLToPath } from 'node:url'

export default defineConfig({
  plugins: [
    /**
     * El plugin de Vue permite que Vitest entienda y compile archivos .vue
     * Sin este plugin, Vitest no sabría cómo manejar los Single File Components
     */
    vue(),
  ],

  test: {
    /**
     * Entorno de simulación del navegador:
     * 'jsdom' simula el DOM del navegador en Node.js
     * Necesario para testear componentes Vue que usan APIs del navegador (document, window, etc.)
     *
     * Alternativa: 'happy-dom' (más rápido pero menos completo que jsdom)
     */
    environment: 'jsdom',

    /**
     * globals: true → hace que funciones como describe(), it(), expect() estén
     * disponibles globalmente sin necesidad de importarlas en cada archivo de test.
     * (Mismo comportamiento que Jest)
     */
    globals: true,

    /**
     * Dónde buscar los archivos de test:
     * Busca en tests/unit/ y también dentro de src/ o app/ si hay archivos *.spec.ts
     */
    include: ['tests/**/*.spec.ts', 'app/**/*.spec.ts'],

    /**
     * Archivos de configuración que se ejecutan ANTES de cada test suite.
     * Útil para configurar mocks globales, plugins de Vue, etc.
     */
    setupFiles: ['tests/setup.ts'],

    /**
     * Configuración de paths (aliases) para que @/ funcione igual que en Nuxt
     * Esto permite usar `import { ... } from '@/stores/auth'` en los tests
     */
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./app', import.meta.url)),
        '~': fileURLToPath(new URL('./app', import.meta.url)),
      },
    },

    /**
     * Configuración del reporte de cobertura de código.
     * Se activa con `npm run test:cov`
     */
    coverage: {
      provider: 'v8',          // Motor de cobertura (v8 es el más rápido)
      reporter: ['text', 'html', 'lcov'], // Formatos: consola, HTML navegable, y lcov para CI
      reportsDirectory: '../coverage/frontend',
      include: ['app/**/*.{ts,vue}'],
      exclude: [
        'app/**/*.d.ts',
        'app/plugins/**',       // Plugins de Nuxt (inicialización, no lógica)
        'app/middleware/**',    // Middleware de Nuxt
      ],
    },
  },
})
