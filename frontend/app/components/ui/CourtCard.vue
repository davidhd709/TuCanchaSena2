<template>
  <NuxtLink :to="to" class="court-card">
    <div class="court-card-media">
      <img
        v-if="cover && !imgError"
        :src="cover"
        :alt="court.name"
        class="court-card-img"
        loading="lazy"
        @error="imgError = true"
      />
      <div v-else class="court-card-img court-card-img--ph"><span class="mdi mdi-soccer-field" /></div>
      <span class="court-card-status">Disponible</span>
    </div>

    <div class="court-card-body">
      <div class="court-card-top">
        <h3 class="court-card-name line-clamp-1">{{ court.name }}</h3>
        <span class="court-card-rating">
          <span class="mdi mdi-star-outline" /> {{ (court.rating ?? 4.8).toFixed(1) }}
        </span>
      </div>

      <p class="court-card-meta line-clamp-1">
        <span class="mdi mdi-map-marker-outline" />
        {{ court.business?.city ? `${court.business.city}, ${court.business?.name ?? ''}` : (court.business?.name ?? 'Bogotá') }}
      </p>

      <div class="court-card-footer">
        <div class="court-card-price">
          <span class="court-card-price-label">Precio por hora</span>
          <span class="court-card-price-amount">${{ formattedPrice }}</span>
        </div>
        <span class="court-card-cta">Ver detalles</span>
      </div>
    </div>
  </NuxtLink>
</template>

<script setup lang="ts">
const props = withDefaults(
  defineProps<{
    court: {
      id: string
      name: string
      type: string
      pricePerHour: number | string
      capacity: number
      images?: string[]
      rating?: number | null
      business?: { name?: string; city?: string } | null
    }
    to?: string
  }>(),
  { to: undefined },
)

const to = computed(() => props.to ?? `/client/courts/${props.court.id}`)
const cover = computed(() => props.court.images?.[0] ?? '')
const imgError = ref(false)
const formattedPrice = computed(() => Number(props.court.pricePerHour).toLocaleString('es-CO'))
</script>

<style scoped>
.court-card {
  display: flex;
  flex-direction: column;
  border-radius: 22px;
  overflow: hidden;
  text-decoration: none;
  border: 1px solid rgba(255,255,255,0.08);
  background: #1a2027;
  min-height: 420px;
  transition: transform .25s ease, box-shadow .25s ease, border-color .25s ease;
}
.court-card:hover {
  transform: translateY(-4px);
  border-color: rgba(111, 230, 140, 0.4);
  box-shadow: 0 22px 40px rgba(0,0,0,.35);
}

.court-card-media {
  position: relative;
  height: 262px;
  overflow: hidden;
}
.court-card-img { width: 100%; height: 100%; object-fit: cover; }
.court-card-img--ph {
  display: flex; align-items: center; justify-content: center;
  background: linear-gradient(140deg, #1e2b35, #10151c);
}
.court-card-img--ph .mdi { font-size: 3rem; color: rgba(111,230,140,.45); }

.court-card-status {
  position: absolute;
  top: 14px;
  left: 14px;
  padding: 7px 14px;
  border-radius: 999px;
  font-size: .92rem;
  font-weight: 700;
  color: #c6f8d4;
  background: rgba(69, 126, 90, 0.75);
  border: 1px solid rgba(111, 230, 140, 0.3);
}

.court-card-body { padding: 18px 18px 20px; }
.court-card-top {
  display: flex;
  justify-content: space-between;
  gap: 10px;
  align-items: center;
}
.court-card-name {
  color: #e8ecef;
  font-size: 2rem;
  font-size: clamp(1.58rem, 2vw, 2rem);
  font-weight: 700;
  line-height: 1.1;
}
.court-card-rating {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  color: #72e49f;
  font-weight: 800;
  font-size: 1.85rem;
  font-size: clamp(1.2rem,1.6vw,1.85rem);
}
.court-card-rating .mdi { font-size: 1.1rem; }

.court-card-meta {
  margin-top: 8px;
  color: #b6bdc6;
  font-size: 1.95rem;
  font-size: clamp(1.1rem,1.5vw,1.95rem);
}
.court-card-meta .mdi { color: #a8afb8; vertical-align: -1px; }

.court-card-footer {
  margin-top: 14px;
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 10px;
}
.court-card-price-label {
  display: block;
  color: #9aa4af;
  font-size: 1.5rem;
  font-size: clamp(.95rem,1.2vw,1.5rem);
}
.court-card-price-amount {
  display: block;
  color: #62db8e;
  font-size: 2.15rem;
  font-weight: 800;
  line-height: 1.1;
}
.court-card-cta {
  padding: 13px 22px;
  border-radius: 18px;
  background: #69d98c;
  color: #0c1a11;
  font-size: 1.55rem;
  font-size: clamp(1rem,1.25vw,1.55rem);
  font-weight: 700;
}

@media (max-width: 760px) {
  .court-card { min-height: auto; }
  .court-card-media { height: 204px; }
  .court-card-name { font-size: 1.4rem; }
  .court-card-price-amount { font-size: 1.55rem; }
  .court-card-meta,
  .court-card-price-label,
  .court-card-cta,
  .court-card-rating { font-size: 1rem; }
}
</style>
