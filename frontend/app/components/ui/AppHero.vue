<template>
  <section class="app-hero">
    <div class="app-hero-bg" aria-hidden="true">
      <div class="app-hero-blob app-hero-blob-1" />
      <div class="app-hero-blob app-hero-blob-2" />
    </div>
    <div class="app-hero-content">
      <span v-if="eyebrow" class="app-hero-eyebrow">{{ eyebrow }}</span>
      <h1 class="app-hero-title">
        <slot name="title">{{ title }}</slot>
      </h1>
      <p v-if="subtitle || $slots.subtitle" class="app-hero-sub">
        <slot name="subtitle">{{ subtitle }}</slot>
      </p>
      <div v-if="$slots.actions" class="app-hero-actions">
        <slot name="actions" />
      </div>
      <div v-if="$slots.default" class="app-hero-extra">
        <slot />
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
/**
 * AppHero — encabezado destacado reutilizable para vistas de app (no marketing).
 * Reemplaza los heroes maquetados por página (.client-home-hero, .explore-hero…).
 *
 * Uso:
 *   <AppHero eyebrow="Negocios deportivos" title="¿Dónde vas a jugar hoy?"
 *            subtitle="Descubre canchas cerca de ti.">
 *     <template #actions>
 *       <v-btn color="primary">Reservar</v-btn>
 *     </template>
 *   </AppHero>
 *
 * Para contenido libre debajo del subtítulo (p.ej. un buscador), usar el slot
 * por defecto.
 */
withDefaults(
  defineProps<{
    eyebrow?: string
    title?: string
    subtitle?: string
  }>(),
  { eyebrow: '', title: '', subtitle: '' },
)
</script>

<style scoped>
.app-hero {
  position: relative;
  overflow: hidden;
  border-radius: var(--radius-xl);
  padding: 36px 32px;
  margin-bottom: var(--space-8);
  border: 1px solid var(--border-soft);
  background:
    radial-gradient(circle at 85% 20%, rgba(52, 198, 146, 0.16), transparent 50%),
    radial-gradient(circle at 10% 90%, rgba(52, 198, 146, 0.08), transparent 55%),
    linear-gradient(135deg, #15211f 0%, #0e1418 100%);
}
.app-hero-bg { position: absolute; inset: 0; pointer-events: none; }
.app-hero-blob {
  position: absolute;
  border-radius: 50%;
  filter: blur(60px);
}
.app-hero-blob-1 {
  width: 260px; height: 260px;
  background: rgba(52, 198, 146, 0.16);
  top: -60px; right: -60px;
}
.app-hero-blob-2 {
  width: 200px; height: 200px;
  background: rgba(52, 198, 146, 0.10);
  bottom: -40px; left: -40px;
}
.app-hero-content { position: relative; max-width: 720px; }
.app-hero-eyebrow {
  display: inline-block;
  font-size: 0.76rem;
  font-weight: 800;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  color: var(--green-bright);
  background: var(--green-soft);
  padding: 4px 12px;
  border-radius: var(--radius-pill);
  margin-bottom: 10px;
}
.app-hero-title {
  font-family: 'Sora', 'Manrope', sans-serif;
  font-weight: 800;
  letter-spacing: -0.02em;
  font-size: clamp(1.6rem, 3.4vw, 2.3rem);
  line-height: 1.15;
  color: var(--text-primary);
}
.app-hero-sub {
  font-size: 0.98rem;
  color: var(--text-muted);
  margin-top: 8px;
  max-width: 560px;
}
.app-hero-actions {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
  margin-top: 20px;
}
.app-hero-extra { margin-top: 20px; }

@media (max-width: 600px) {
  .app-hero { padding: 24px 18px; }
  .app-hero-actions { width: 100%; }
}
</style>
