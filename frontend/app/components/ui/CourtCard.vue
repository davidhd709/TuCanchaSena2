<template>
  <NuxtLink :to="to" class="court-card" data-testid="court-card">
    <div class="court-card-media">
      <img
        v-if="cover && !imgError"
        :src="cover"
        :alt="court.name"
        class="court-card-img"
        loading="lazy"
        @error="imgError = true"
      />
      <div v-else class="court-card-img court-card-img--ph">
        <AppMediaPlaceholder />
      </div>
      <span class="court-card-type">{{ typeLabel }}</span>
    </div>

    <div class="court-card-body">
      <div class="court-card-top">
        <h3 class="court-card-name line-clamp-1">{{ court.name }}</h3>
        <span v-if="court.rating != null" class="court-card-rating">
          <span class="mdi mdi-star" /> {{ Number(court.rating).toFixed(1) }}
        </span>
      </div>

      <p class="court-card-meta line-clamp-1">
        <span class="mdi mdi-map-marker-outline" />
        {{ court.business?.name ?? 'Negocio deportivo' }}
      </p>

      <div class="court-card-footer">
        <div class="court-card-price">
          <span class="court-card-price-label">Desde</span>
          <span class="court-card-price-amount">{{ formatCurrency(court.pricePerHour) }}</span>
          <span class="court-card-price-unit">/ hora</span>
        </div>
        <span class="court-card-cta">
          Ver detalles
          <span class="mdi mdi-arrow-right" />
        </span>
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
const cover = computed(() => safeCover(props.court.images?.[0]))
const imgError = ref(false)

const TYPE_LABELS: Record<string, string> = {
  football_5: 'Fútbol 5',
  football_7: 'Fútbol 7',
  football_11: 'Fútbol 11',
  futsal: 'Futsal',
  tennis: 'Tenis',
  paddle: 'Pádel',
  basketball: 'Básquet',
  volleyball: 'Vóley',
}
const typeLabel = computed(() => TYPE_LABELS[props.court.type] ?? 'Cancha')
</script>

<style scoped>
.court-card {
  display: flex;
  flex-direction: column;
  background: var(--bg-card);
  border-radius: var(--radius-lg);
  overflow: hidden;
  text-decoration: none;
  border: 1px solid var(--border-soft);
  box-shadow: var(--shadow-sm);
  transition: transform var(--transition), box-shadow var(--transition), border-color var(--transition);
}
.court-card:hover {
  transform: translateY(-3px);
  border-color: var(--border-medium);
  box-shadow: var(--shadow-lg);
}

.court-card-media {
  position: relative;
  aspect-ratio: 16 / 10;
  overflow: hidden;
  background: var(--bg-subtle);
}
.court-card-img {
  width: 100%; height: 100%; object-fit: cover;
  transition: transform 0.5s ease;
}
.court-card:hover .court-card-img { transform: scale(1.04); }

/* Placeholder con logo real (visual provisto por AppMediaPlaceholder). */
.court-card-img--ph { padding: 0; }

.court-card-type {
  position: absolute;
  top: 12px; left: 12px;
  padding: 5px 12px;
  border-radius: var(--radius-pill);
  font-size: .72rem;
  font-weight: 800;
  color: var(--green-bright);
  background: rgba(12, 16, 20, 0.78);
  backdrop-filter: blur(8px);
  border: 1px solid rgba(52, 198, 146, 0.28);
  white-space: nowrap;
}

.court-card-body { padding: 14px 16px 16px; }
.court-card-top {
  display: flex;
  justify-content: space-between;
  gap: 10px;
  align-items: center;
}
.court-card-name {
  color: var(--text-primary);
  font-size: 1.05rem;
  font-weight: 800;
  line-height: 1.2;
  font-family: 'Manrope', sans-serif;
}
.court-card-rating {
  display: inline-flex;
  align-items: center;
  gap: 3px;
  color: #facc15;
  font-weight: 800;
  font-size: .85rem;
  flex-shrink: 0;
}
.court-card-rating .mdi { font-size: 1rem; }

.court-card-meta {
  margin-top: 12px;
  color: var(--text-muted);
  font-size: .82rem;
  display: inline-flex;
  align-items: center;
  gap: 4px;
}
.court-card-meta .mdi { font-size: 1rem; color: var(--green-bright); }

.court-card-footer {
  margin-top: 14px;
  padding-top: 12px;
  border-top: 1px solid var(--border-soft);
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
}
.court-card-price { display: flex; align-items: baseline; gap: 4px; }
.court-card-price-label {
  color: var(--text-faint);
  font-size: .72rem;
  font-weight: 600;
}
.court-card-price-amount {
  color: var(--text-primary);
  font-size: 1.3rem;
  font-weight: 800;
  line-height: 1;
}
.court-card-price-unit {
  color: var(--text-muted);
  font-size: .78rem;
}
.court-card-cta {
  display: inline-flex;
  align-items: center;
  gap: 3px;
  color: var(--green-bright);
  font-size: .85rem;
  font-weight: 800;
}
.court-card-cta .mdi { transition: transform var(--transition); }
.court-card:hover .court-card-cta .mdi { transform: translateX(2px); }

.line-clamp-1 {
  display: -webkit-box;
  -webkit-line-clamp: 1;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style>
