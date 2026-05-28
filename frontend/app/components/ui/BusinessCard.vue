<template>
  <NuxtLink :to="`/client/businesses/${business.id}`" class="biz-card" data-testid="business-card">
    <div class="biz-card-media">
      <img
        v-if="cover && !imgError"
        :src="cover"
        :alt="business.name"
        class="biz-card-img"
        loading="lazy"
        @error="imgError = true"
      />
      <div v-else class="biz-card-img biz-card-img--ph">
        <AppMediaPlaceholder />
      </div>
      <span class="biz-card-courts">
        <span class="mdi mdi-soccer-field" />
        {{ courtCount }} {{ courtCount === 1 ? 'cancha' : 'canchas' }}
      </span>
    </div>

    <div class="biz-card-body">
      <h3 class="biz-card-name line-clamp-1">{{ business.name }}</h3>
      <p class="biz-card-meta line-clamp-1">
        <span class="mdi mdi-map-marker-outline" />
        {{ business.address }}
      </p>

      <p v-if="scheduleLabel" class="biz-card-schedule">
        <span class="mdi mdi-clock-outline" />
        {{ scheduleLabel }}
      </p>

      <div v-if="business.amenities?.length" class="biz-card-amenities">
        <span
          v-for="am in business.amenities.slice(0, 3)"
          :key="am"
          class="biz-card-amenity"
        >
          {{ am }}
        </span>
        <span v-if="business.amenities.length > 3" class="biz-card-amenity is-more">
          +{{ business.amenities.length - 3 }}
        </span>
      </div>

      <div class="biz-card-footer">
        <span class="biz-card-cta">
          Ver canchas
          <span class="mdi mdi-arrow-right" />
        </span>
      </div>
    </div>
  </NuxtLink>
</template>

<script setup lang="ts">
/**
 * Card de negocio deportivo — dark premium.
 * Si la URL viene del seed picsum, mostramos placeholder local
 * (`.biz-card-img--ph`) en lugar del paisaje aleatorio.
 */
const props = defineProps<{
  business: {
    id: string
    name: string
    address: string
    images?: string[]
    amenities?: string[]
    schedules?: { dayOfWeek: string; openTime: string; closeTime: string; isOpen: boolean }[]
    _count?: { courts: number }
  }
}>()

const cover = computed(() => safeCover(props.business.images?.[0]))
const imgError = ref(false)
const courtCount = computed(() => props.business._count?.courts ?? 0)

const scheduleLabel = computed(() => {
  const open = props.business.schedules?.find((s) => s.isOpen)
  if (!open) return ''
  return `Abre ${open.openTime?.slice(0, 5)} – ${open.closeTime?.slice(0, 5)}`
})
</script>

<style scoped>
.biz-card {
  display: flex;
  flex-direction: column;
  background: var(--bg-card);
  border: 1px solid var(--border-soft);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-sm);
  overflow: hidden;
  text-decoration: none;
  height: auto;
  transition: transform var(--transition), box-shadow var(--transition), border-color var(--transition);
}
.biz-card:hover {
  transform: translateY(-3px);
  box-shadow: var(--shadow-lg);
  border-color: var(--border-medium);
}

.biz-card-media {
  position: relative;
  aspect-ratio: 16 / 10;
  overflow: hidden;
  background: var(--bg-subtle);
}
.biz-card-img {
  width: 100%; height: 100%; object-fit: cover;
  transition: transform 0.5s ease;
}
.biz-card:hover .biz-card-img { transform: scale(1.04); }

/* Placeholder con logo real (visual provisto por AppMediaPlaceholder). */
.biz-card-img--ph { padding: 0; }

.biz-card-courts {
  position: absolute;
  top: 12px; right: 12px;
  display: inline-flex;
  align-items: center;
  gap: 5px;
  font-size: 0.72rem;
  font-weight: 800;
  padding: 5px 11px;
  border-radius: var(--radius-pill);
  background: rgba(12, 16, 20, 0.78);
  backdrop-filter: blur(8px);
  border: 1px solid var(--border-medium);
  color: var(--text-primary);
}
.biz-card-courts .mdi { color: var(--green-bright); font-size: 0.9rem; }

.biz-card-body {
  display: flex;
  flex-direction: column;
  padding: 16px 18px 18px;
  flex: 1;
}
.biz-card-name {
  font-family: 'Manrope', sans-serif;
  font-size: 1.05rem;
  font-weight: 800;
  color: var(--text-primary);
  line-height: 1.25;
}
.biz-card-meta {
  font-size: 0.82rem;
  color: var(--text-muted);
  margin-top: 6px;
  display: inline-flex;
  align-items: center;
  gap: 4px;
}
.biz-card-meta .mdi { font-size: 1rem; color: var(--green-bright); }
.biz-card-schedule {
  font-size: 0.78rem;
  color: var(--text-faint);
  margin-top: 6px;
  display: inline-flex;
  align-items: center;
  gap: 4px;
}
.biz-card-schedule .mdi { font-size: 0.95rem; color: var(--green-bright); }

.biz-card-amenities {
  display: flex;
  flex-wrap: wrap;
  gap: 5px;
  margin-top: 12px;
}
.biz-card-amenity {
  font-size: 0.7rem;
  font-weight: 700;
  padding: 3px 10px;
  border-radius: var(--radius-pill);
  background: var(--bg-elev);
  color: var(--text-secondary);
  border: 1px solid var(--border-soft);
}
.biz-card-amenity.is-more {
  background: var(--green-soft);
  color: var(--green-bright);
  border-color: rgba(52, 198, 146, 0.32);
}

.biz-card-footer {
  margin-top: auto;
  padding-top: 14px;
}
.biz-card-cta {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 0.88rem;
  font-weight: 800;
  color: var(--green-bright);
}
.biz-card-cta .mdi { transition: transform var(--transition); }
.biz-card:hover .biz-card-cta .mdi { transform: translateX(3px); }

.line-clamp-1 {
  display: -webkit-box;
  -webkit-line-clamp: 1;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style>
