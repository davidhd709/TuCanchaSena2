<template>
  <div class="app-media-ph" :class="{ 'is-dense': isCompact }" :style="ratioStyle">
    <img src="/logo-placeholder.webp" alt="TuCancha" class="app-media-ph-logo" loading="lazy" />
    <span v-if="resolvedLabel && !isCompact" class="app-media-ph-label">{{ resolvedLabel }}</span>
  </div>
</template>

<script setup lang="ts">
/**
 * Placeholder de imagen del design system (marca TuCancha).
 * Se usa cuando no hay foto real — o la URL viene del seed picsum, filtrada
 * por `safeCover`. Muestra el logo real de TuCancha sobre un gradient
 * dark/green, nunca un icono genérico ni una imagen externa.
 *
 * Uso:
 *   <AppMediaPlaceholder type="court" />
 *   <AppMediaPlaceholder type="business" label="Foto del negocio" />
 *   <AppMediaPlaceholder compact />            // miniaturas (logo chico, sin texto)
 *   <AppMediaPlaceholder ratio="16/10" />      // fuerza un aspect-ratio
 */
const props = withDefaults(
  defineProps<{
    /** Texto opcional bajo el logo (oculto en compact). Tiene prioridad sobre `type`. */
    label?: string
    /** Tipo de contenido — define un label por defecto. */
    type?: 'court' | 'business' | 'booking' | 'generic'
    /** Versión compacta para miniaturas/avatares (logo más chico, sin texto). */
    compact?: boolean
    /** Alias histórico de `compact`. */
    dense?: boolean
    /** Aspect-ratio opcional, p.ej. "16/10" o "1/1". */
    ratio?: string
  }>(),
  { label: '', type: 'generic', compact: false, dense: false, ratio: '' },
)

const isCompact = computed(() => props.compact || props.dense)

const DEFAULT_LABELS: Record<string, string> = {
  court: 'Imagen de cancha',
  business: 'Foto del negocio',
  booking: 'Reserva',
  generic: '',
}
const resolvedLabel = computed(() => props.label || DEFAULT_LABELS[props.type] || '')

const ratioStyle = computed(() => (props.ratio ? { aspectRatio: props.ratio } : {}))
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
