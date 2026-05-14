<template>
  <div class="page-header">
    <div class="page-header-text">
      <span v-if="tag" class="brand-tag">{{ tag }}</span>
      <h1 class="brand-display page-header-title">{{ title }}</h1>
      <p v-if="subtitle" class="page-header-subtitle">{{ subtitle }}</p>
    </div>
    <div v-if="$slots.action" class="page-header-action">
      <slot name="action" />
    </div>
  </div>
</template>

<script setup lang="ts">
/**
 * Encabezado de página unificado. Limpio, con aire, estilo marketplace.
 */
defineProps<{
  title: string
  subtitle?: string
  /** Etiqueta corta en mayúsculas sobre el título. */
  tag?: string
}>()
</script>

<style scoped>
.page-header {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 16px;
  flex-wrap: wrap;
  margin-bottom: 28px;
}
.page-header-title {
  font-size: clamp(1.5rem, 2.6vw, 2.1rem);
  line-height: 1.15;
  margin-top: 4px;
}
.page-header-subtitle {
  font-size: 0.95rem;
  color: var(--text-muted);
  margin-top: 6px;
}
.page-header-action {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}

@media (max-width: 600px) {
  .page-header { margin-bottom: 20px; }
  .page-header-action { width: 100%; }
}
</style>
