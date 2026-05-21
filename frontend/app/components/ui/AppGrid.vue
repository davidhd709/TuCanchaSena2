<template>
  <div class="app-grid" :class="{ 'is-fixed-cols': cols > 0 }" :style="gridStyle">
    <slot />
  </div>
</template>

<script setup lang="ts">
/**
 * AppGrid — grid responsivo reutilizable.
 * Reemplaza los grids de listado maquetados por página (.explore-grid,
 * .courts-grid, .bk-cards, .bc-grid, .biz-courts-grid, etc.).
 *
 * Por defecto usa `auto-fill` con un ancho mínimo de columna (`min`), de modo
 * que el número de columnas se ajusta solo al ancho disponible.
 *
 * Uso:
 *   <AppGrid :min="280">
 *     <CourtCard v-for="c in courts" :key="c.id" :court="c" />
 *   </AppGrid>
 *
 *   <AppGrid :cols="3" :gap="14"> ... </AppGrid>   // columnas fijas en desktop
 */
const props = withDefaults(
  defineProps<{
    /** Ancho mínimo de cada columna en px (modo auto-fill). */
    min?: number
    /** Número fijo de columnas (si se define, ignora `min`). Apila en móvil. */
    cols?: number
    /** Separación entre celdas en px. */
    gap?: number
  }>(),
  { min: 280, cols: 0, gap: 18 },
)

const gridStyle = computed(() => {
  if (props.cols > 0) {
    return {
      '--app-grid-cols': `repeat(${props.cols}, minmax(0, 1fr))`,
      gap: `${props.gap}px`,
    }
  }
  return {
    gridTemplateColumns: `repeat(auto-fill, minmax(min(${props.min}px, 100%), 1fr))`,
    gap: `${props.gap}px`,
  }
})
</script>

<style scoped>
.app-grid {
  display: grid;
  align-items: start;
}
/* Modo columnas fijas: usa la var en desktop y apila en móvil. */
.app-grid.is-fixed-cols { grid-template-columns: var(--app-grid-cols); }
@media (max-width: 600px) {
  .app-grid.is-fixed-cols { grid-template-columns: 1fr; }
}
</style>
