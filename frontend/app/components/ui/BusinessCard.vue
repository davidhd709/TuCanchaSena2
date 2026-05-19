<template>
  <NuxtLink :to="`/client/businesses/${business.id}`" class="biz-card">
    <!-- Imagen -->
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
        <span class="mdi mdi-stadium-variant" />
      </div>
      <span class="biz-card-courts">
        <span class="mdi mdi-soccer-field" />
        {{ courtCount }} {{ courtCount === 1 ? 'cancha' : 'canchas' }}
      </span>
    </div>

    <!-- Información -->
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
          v-for="am in business.amenities.slice(0, 4)"
          :key="am"
          class="biz-card-amenity"
        >
          {{ am }}
        </span>
        <span v-if="business.amenities.length > 4" class="biz-card-amenity is-more">
          +{{ business.amenities.length - 4 }}
        </span>
      </div>

      <div class="biz-card-footer">
        <span class="biz-card-cta">
          Ver negocio
          <span class="mdi mdi-arrow-right" />
        </span>
      </div>
    </div>
  </NuxtLink>
</template>

<script setup lang="ts">
/**
 * Tarjeta de negocio deportivo — la entrada principal de la exploración.
 * El cliente decide dónde jugar viendo el lugar, sus servicios y sus canchas.
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

const cover = computed(() => props.business.images?.[0] ?? '')
const imgError = ref(false)
const courtCount = computed(() => props.business._count?.courts ?? 0)

// Resumen de horario: toma el primer día abierto como referencia.
const scheduleLabel = computed(() => {
  const open = props.business.schedules?.find((s) => s.isOpen)
  if (!open) return ''
  return `Abre ${open.openTime} – ${open.closeTime}`
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
  height: 100%;
  transition: transform var(--transition), box-shadow var(--transition), border-color var(--transition);
}
.biz-card:hover {
  transform: translateY(-4px);
  box-shadow: var(--shadow-lg);
  border-color: rgba(47, 161, 138, 0.25);
}

.biz-card-media {
  position: relative;
  height: 180px;
  overflow: hidden;
}
.biz-card-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.5s ease;
}
.biz-card:hover .biz-card-img { transform: scale(1.05); }
.biz-card-img--ph {
  display: flex;
  align-items: center;
  justify-content: center;
  background:
    radial-gradient(circle at 35% 30%, rgba(47, 161, 138, 0.22), transparent 55%),
    linear-gradient(135deg, #1e2b35, #0f141c);
}
.biz-card-img--ph .mdi { font-size: 3.4rem; color: rgba(47, 161, 138, 0.5); }

.biz-card-courts {
  position: absolute;
  bottom: 12px;
  left: 12px;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 0.74rem;
  font-weight: 700;
  padding: 6px 11px;
  border-radius: 100px;
  background: rgba(6, 8, 16, 0.82);
  backdrop-filter: blur(6px);
  border: 1px solid var(--border-soft);
  color: var(--text-primary);
}
.biz-card-courts .mdi { color: var(--green-primary); font-size: 0.9rem; }

.biz-card-body {
  display: flex;
  flex-direction: column;
  padding: 16px 18px 18px;
  flex: 1;
}
.biz-card-name {
  font-family: 'Manrope', sans-serif;
  font-size: 1.08rem;
  font-weight: 700;
  color: var(--text-primary);
}
.biz-card-meta {
  font-size: 0.8rem;
  color: var(--text-muted);
  margin-top: 5px;
}
.biz-card-meta .mdi { font-size: 0.95rem; color: var(--green-primary); vertical-align: -2px; }
.biz-card-schedule {
  font-size: 0.77rem;
  color: var(--text-faint);
  margin-top: 4px;
}
.biz-card-schedule .mdi { font-size: 0.9rem; vertical-align: -2px; }

.biz-card-amenities {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-top: 12px;
}
.biz-card-amenity {
  font-size: 0.68rem;
  font-weight: 600;
  padding: 4px 9px;
  border-radius: 100px;
  background: var(--bg-subtle);
  border: 1px solid var(--border-soft);
  color: var(--text-muted);
}
.biz-card-amenity.is-more { color: var(--green-bright); }

.biz-card-footer {
  margin-top: auto;
  padding-top: 14px;
}
.biz-card-cta {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  font-size: 0.84rem;
  font-weight: 700;
  color: var(--green-bright);
}
.biz-card-cta .mdi { transition: transform var(--transition); }
.biz-card:hover .biz-card-cta .mdi { transform: translateX(3px); }
</style>
