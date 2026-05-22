<template>
  <div class="court-gallery">
    <div class="court-gallery-main">
      <img v-if="photos[0]" :src="photos[0]" :alt="name" />
      <AppMediaPlaceholder v-else label="Imagen de cancha" class="court-gallery-ph" />
      <span
        class="court-gallery-status"
        :class="status === 'available' ? 'is-available' : 'is-unavailable'"
      >
        <span class="court-gallery-dot" />
        {{ status === 'available' ? 'Disponible' : 'No disponible' }}
      </span>
    </div>
    <div v-if="photos.length > 1" class="court-gallery-side">
      <div
        v-for="(im, i) in photos.slice(1, 3)"
        :key="i"
        class="court-gallery-thumb"
      >
        <img :src="im" :alt="`${name} ${i + 2}`" />
        <span v-if="i === 1 && photos.length > 3" class="court-gallery-more">
          +{{ photos.length - 3 }} fotos
        </span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
/**
 * CourtGallery — galería del detalle de cancha (imagen principal + miniaturas).
 * Extraída de client/courts/[id]/index.vue (Fase 11). Presentacional: filtra las
 * imágenes del seed (picsum) con safeCover, igual que el resto de la app.
 */
const props = defineProps<{
  images?: string[]
  name?: string
  status?: string
}>()

const photos = computed<string[]>(() =>
  (props.images ?? []).filter((url) => !!safeCover(url)),
)
</script>

<style scoped>
.court-gallery {
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: 12px;
  height: 360px;
}
.court-gallery-main {
  position: relative;
  border-radius: var(--radius-xl);
  overflow: hidden;
  border: 1px solid var(--border-soft);
}
.court-gallery-main img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
/* Contenedor del placeholder; el visual lo provee AppMediaPlaceholder. */
.court-gallery-ph { width: 100%; height: 100%; }
.court-gallery-status {
  position: absolute;
  top: 16px;
  left: 16px;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 0.76rem;
  font-weight: 700;
  padding: 7px 13px;
  border-radius: var(--radius-pill);
  background: rgba(12, 16, 20, 0.82);
  backdrop-filter: blur(8px);
  border: 1px solid var(--border-medium);
  box-shadow: var(--shadow-sm);
}
.court-gallery-dot { width: 7px; height: 7px; border-radius: 50%; }
.court-gallery-status.is-available { color: var(--green-bright); }
.court-gallery-status.is-available .court-gallery-dot { background: var(--green-bright); }
.court-gallery-status.is-unavailable { color: #fca5a5; }
.court-gallery-status.is-unavailable .court-gallery-dot { background: var(--accent-error); }

.court-gallery-side {
  display: grid;
  grid-template-rows: 1fr 1fr;
  gap: 12px;
}
.court-gallery-thumb {
  position: relative;
  border-radius: var(--radius-lg);
  overflow: hidden;
  border: 1px solid var(--border-soft);
}
.court-gallery-thumb img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.court-gallery-more {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(15, 31, 28, 0.55);
  color: #fff;
  font-size: 0.92rem;
  font-weight: 700;
}

@media (max-width: 880px) {
  .court-gallery { grid-template-columns: 1fr; height: auto; }
  .court-gallery-main { height: 240px; }
  .court-gallery-side { grid-template-rows: none; grid-template-columns: 1fr 1fr; height: 140px; }
}
</style>
