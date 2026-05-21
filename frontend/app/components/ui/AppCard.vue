<template>
  <component :is="tag" class="app-card" :class="{ 'app-card--hover': hover, 'app-card--flush': flush }">
    <header v-if="$slots.header || title" class="app-card-header">
      <slot name="header">
        <div class="app-card-heading">
          <h3 v-if="title" class="app-card-title">
            <span v-if="icon" class="mdi" :class="icon" />
            {{ title }}
          </h3>
          <p v-if="subtitle" class="app-card-sub">{{ subtitle }}</p>
        </div>
        <div v-if="$slots.action" class="app-card-action"><slot name="action" /></div>
      </slot>
    </header>

    <div class="app-card-body" :class="{ 'is-flush': flush }">
      <slot />
    </div>

    <footer v-if="$slots.footer" class="app-card-footer">
      <slot name="footer" />
    </footer>
  </component>
</template>

<script setup lang="ts">
/**
 * AppCard — superficie estándar del design system.
 * Reemplaza las cards maquetadas a mano en cada página (.pay-card,
 * .profile-form-card, .admin-*-card, etc.).
 *
 * Uso:
 *   <AppCard title="Información personal" subtitle="..." icon="mdi-account-outline">
 *     ...contenido...
 *     <template #footer><v-btn>Guardar</v-btn></template>
 *   </AppCard>
 *
 *   <AppCard hover>...</AppCard>        // efecto hover (listados clicables)
 *   <AppCard flush>...</AppCard>        // sin padding interno (para media full-bleed)
 */
withDefaults(
  defineProps<{
    title?: string
    subtitle?: string
    /** Icono mdi opcional junto al título. */
    icon?: string
    /** Aplica elevación/realce al hover. */
    hover?: boolean
    /** Quita el padding del body (útil con imágenes a sangre). */
    flush?: boolean
    /** Etiqueta HTML del contenedor (article por defecto). */
    tag?: string
  }>(),
  { title: '', subtitle: '', icon: '', hover: false, flush: false, tag: 'article' },
)
</script>

<style scoped>
.app-card {
  background: var(--bg-card);
  border: 1px solid var(--border-soft);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-sm);
  overflow: hidden;
  transition: transform var(--transition), box-shadow var(--transition), border-color var(--transition);
}
.app-card--hover:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-md);
  border-color: var(--border-medium);
}

.app-card-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  padding: 18px 20px 0;
}
.app-card-heading { min-width: 0; }
.app-card-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-family: 'Manrope', sans-serif;
  font-size: 1.05rem;
  font-weight: 800;
  color: var(--text-primary);
  line-height: 1.25;
}
.app-card-title .mdi { color: var(--green-bright); font-size: 1.25rem; }
.app-card-sub {
  margin-top: 4px;
  font-size: 0.86rem;
  color: var(--text-muted);
}
.app-card-action { flex-shrink: 0; }

.app-card-body { padding: 20px; }
.app-card-body.is-flush { padding: 0; }
.app-card-header + .app-card-body { padding-top: 16px; }

.app-card-footer {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 10px;
  padding: 14px 20px;
  border-top: 1px solid var(--border-soft);
}

@media (max-width: 600px) {
  .app-card-header { padding: 16px 16px 0; }
  .app-card-body { padding: 16px; }
  .app-card-footer { padding: 12px 16px; }
}
</style>
