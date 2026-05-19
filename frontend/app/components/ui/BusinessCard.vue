<template>
  <NuxtLink :to="`/client/businesses/${business.id}`" class="biz-card">
    <!-- Imagen / placeholder deportivo -->
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
        <span class="mdi mdi-soccer-field" />
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
 * Tarjeta de negocio deportivo — la entrada principal de la exploración.
 * Forzamos placeholder local cuando la URL viene del seed picsum, para que
 * el visual sea deportivo y coherente con la marca.
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
  border-radius: 18px;
  box-shadow: var(--shadow-sm);
  overflow: hidden;
  text-decoration: none;
  height: 100%;
  transition: transform var(--transition), box-shadow var(--transition), border-color var(--transition);
}
.biz-card:hover {
  transform: translateY(-3px);
  box-shadow: var(--shadow-lg);
  border-color: var(--border-strong);
}

.biz-card-media {
  position: relative;
  aspect-ratio: 16 / 10;
  overflow: hidden;
  background: var(--bg-subtle);
}
.biz-card-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.5s ease;
}
.biz-card:hover .biz-card-img { transform: scale(1.04); }

/* Placeholder deportivo: gradiente verde + icono de cancha, sin imagen externa. */
.biz-card-img--ph {
  display: flex;
  align-items: center;
  justify-content: center;
  background:
    radial-gradient(circle at 30% 25%, rgba(47, 161, 138, 0.18), transparent 55%),
    radial-gradient(circle at 80% 75%, rgba(47, 161, 138, 0.12), transparent 55%),
    linear-gradient(135deg, #d9ede6 0%, #f6faf8 100%);
  position: relative;
}
.biz-card-img--ph::before,
.biz-card-img--ph::after {
  content: '';
  position: absolute;
  border: 1.5px solid rgba(31, 122, 103, 0.18);
  border-radius: 50%;
}
.biz-card-img--ph::before {
  width: 78%; height: 78%;
  top: 11%; left: 11%;
}
.biz-card-img--ph::after {
  width: 34%; height: 34%;
  top: 33%; left: 33%;
}
.biz-card-img--ph .mdi {
  position: relative;
  z-index: 1;
  font-size: 3rem;
  color: rgba(31, 122, 103, 0.55);
}

.biz-card-courts {
  position: absolute;
  top: 12px;
  right: 12px;
  display: inline-flex;
  align-items: center;
  gap: 5px;
  font-size: 0.72rem;
  font-weight: 700;
  padding: 6px 11px;
  border-radius: 100px;
  background: rgba(255, 255, 255, 0.94);
  backdrop-filter: blur(6px);
  border: 1px solid var(--border-soft);
  color: var(--text-primary);
  box-shadow: var(--shadow-sm);
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
.biz-card-meta .mdi { font-size: 1rem; color: var(--green-primary); }
.biz-card-schedule {
  font-size: 0.78rem;
  color: var(--text-faint);
  margin-top: 6px;
  display: inline-flex;
  align-items: center;
  gap: 4px;
}
.biz-card-schedule .mdi { font-size: 0.95rem; color: var(--green-primary); }

.biz-card-amenities {
  display: flex;
  flex-wrap: wrap;
  gap: 5px;
  margin-top: 12px;
}
.biz-card-amenity {
  font-size: 0.7rem;
  font-weight: 600;
  padding: 4px 10px;
  border-radius: 100px;
  background: var(--bg-subtle);
  color: var(--text-muted);
}
.biz-card-amenity.is-more {
  background: var(--green-soft);
  color: var(--green-primary);
  font-weight: 700;
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
  color: var(--green-primary);
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
