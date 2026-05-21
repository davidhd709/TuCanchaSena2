<template>
  <section class="app-section">
    <header v-if="title || $slots.title || $slots.action" class="app-section-head">
      <div class="app-section-heading">
        <h2 class="app-section-title">
          <span v-if="icon" class="mdi" :class="icon" />
          <slot name="title">{{ title }}</slot>
          <span v-if="count !== undefined" class="app-section-count">{{ count }}</span>
        </h2>
        <p v-if="subtitle || $slots.subtitle" class="app-section-sub">
          <slot name="subtitle">{{ subtitle }}</slot>
        </p>
      </div>
      <div v-if="$slots.action" class="app-section-action"><slot name="action" /></div>
    </header>
    <slot />
  </section>
</template>

<script setup lang="ts">
/** AppSection — bloque con encabezado consistente (titulo + subtitulo + accion). */
withDefaults(
  defineProps<{ title?: string; subtitle?: string; icon?: string; count?: number }>(),
  { title: '', subtitle: '', icon: '', count: undefined },
)
</script>

<style scoped>
.app-section { margin-bottom: var(--space-8); }
.app-section-head {
  display: flex; align-items: flex-end; justify-content: space-between;
  gap: 12px; margin-bottom: var(--space-4);
}
.app-section-heading { min-width: 0; }
.app-section-title {
  display: flex; align-items: center; gap: 8px;
  font-family: 'Manrope', sans-serif; font-size: 1.2rem; font-weight: 800;
  color: var(--text-primary); line-height: 1.2;
}
.app-section-title .mdi { color: var(--green-bright); font-size: 1.3rem; }
.app-section-count {
  font-size: 0.78rem; font-weight: 800; padding: 2px 9px;
  border-radius: var(--radius-pill); background: var(--green-soft); color: var(--green-bright);
}
.app-section-sub { margin-top: 4px; font-size: 0.86rem; color: var(--text-muted); }
.app-section-action { flex-shrink: 0; }
</style>
