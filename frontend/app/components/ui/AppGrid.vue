<template>
  <div class="app-grid" :class="{ 'is-fixed-cols': cols > 0, 'is-masonry': cols === 0 }" :style="gridStyle">
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
  // Modo masonry: delegamos conteo de columnas a CSS responsivo (3/2/1)
  return {
    '--app-grid-gap': `${props.gap}px`,
    '--app-grid-min': `${props.min}px`,
  }
})
</script>

<style scoped>
.app-grid {
  display: grid;
  align-items: start;
}
/* Modo masonry (auto-fill): usa columnas CSS para un masonry natural
   Los items deben evitar saltos dentro de la columna y ser inline-block
   para respetar el ancho de columna y mantener la proporción de imágenes. */
.app-grid.is-masonry {
  display: block;
  /* gap controlable vía variable desde JS */
  column-gap: var(--app-grid-gap, 18px);
}
.app-grid.is-masonry > * {
  display: inline-block;
  width: 100%;
  vertical-align: top;
  break-inside: avoid;
  -webkit-column-break-inside: avoid;
  page-break-inside: avoid;
  margin-bottom: 12px; /* separación vertical uniforme y reducida */
}
/* Column count responsive: desktop 3, tablet 2, móvil 1 */
@media (min-width: 1024px) {
  .app-grid.is-masonry { column-count: 3; }
}
@media (min-width: 600px) and (max-width: 1023px) {
  .app-grid.is-masonry { column-count: 2; }
}
@media (max-width: 599px) {
  .app-grid.is-masonry { column-count: 1; }
}
/* Modo columnas fijas: usa la var en desktop y apila en móvil. */
.app-grid.is-fixed-cols { grid-template-columns: var(--app-grid-cols); }
@media (max-width: 600px) {
  .app-grid.is-fixed-cols { grid-template-columns: 1fr; }
}
</style>
