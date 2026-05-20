<template>
  <div class="app-media-ph" :class="{ 'is-dense': dense }">
    <img src="/logo-placeholder.webp" alt="TuCancha" class="app-media-ph-logo" loading="lazy" />
    <span v-if="label && !dense" class="app-media-ph-label">{{ label }}</span>
  </div>
</template>

<script setup lang="ts">
/**
 * Placeholder de imagen del design system.
 * Se usa cuando no hay foto real (o la URL viene del seed picsum, filtrada por
 * `safeCover`). Muestra el logo real de Tu Cancha sobre un gradient dark/green
 * en lugar de un icono genérico.
 *
 * Uso:
 *   <AppMediaPlaceholder label="Imagen de cancha" />
 *   <AppMediaPlaceholder dense />   // miniaturas (sin texto, logo más chico)
 */
withDefaults(
  defineProps<{
    /** Texto opcional bajo el logo (oculto en modo dense). */
    label?: string
    /** Versión compacta para miniaturas/avatares. */
    dense?: boolean
  }>(),
  { label: '', dense: false },
)
</script>

<style scoped>
.app-media-ph {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  position: relative;
  background:
    radial-gradient(circle at 30% 25%, rgba(52, 198, 146, 0.18), transparent 55%),
    radial-gradient(circle at 80% 80%, rgba(52, 198, 146, 0.10), transparent 55%),
    linear-gradient(135deg, #182230 0%, #0f141a 100%);
  overflow: hidden;
}
.app-media-ph-logo {
  width: 46%;
  max-width: 130px;
  min-width: 48px;
  object-fit: contain;
  opacity: 0.92;
  filter: drop-shadow(0 4px 12px rgba(0, 0, 0, 0.3));
}
.app-media-ph.is-dense .app-media-ph-logo {
  width: 64%;
  max-width: 52px;
  min-width: 28px;
}
.app-media-ph-label {
  font-size: 0.76rem;
  font-weight: 600;
  letter-spacing: 0.04em;
  color: var(--text-faint);
  text-transform: uppercase;
}
</style>
