<template>
  <div class="court-detail">
    <NuxtLink to="/client/courts" class="back-link">
      <v-icon icon="mdi-arrow-left" size="18" />
      Volver a canchas
    </NuxtLink>

    <div v-if="loading" class="d-flex justify-center py-16">
      <v-progress-circular indeterminate color="primary" size="44" />
    </div>

    <template v-else-if="court">
      <!-- Galería -->
      <div class="court-gallery">
        <div class="court-gallery-main">
          <img v-if="images[0]" :src="images[0]" :alt="court.name" />
          <div v-else class="court-gallery-ph"><span class="mdi mdi-soccer-field" /></div>
          <span
            class="court-gallery-status"
            :class="court.status === 'available' ? 'is-available' : 'is-unavailable'"
          >
            <span class="court-gallery-dot" />
            {{ court.status === 'available' ? 'Disponible' : 'No disponible' }}
          </span>
        </div>
        <div v-if="images.length > 1" class="court-gallery-side">
          <div
            v-for="(im, i) in images.slice(1, 3)"
            :key="i"
            class="court-gallery-thumb"
          >
            <img :src="im" :alt="`${court.name} ${i + 2}`" />
            <span v-if="i === 1 && images.length > 3" class="court-gallery-more">
              +{{ images.length - 3 }} fotos
            </span>
          </div>
        </div>
      </div>

      <!-- Título + meta -->
      <div class="court-headline">
        <div>
          <h1 class="brand-display court-title">{{ court.name }}</h1>
          <p class="court-meta">
            <span class="mdi mdi-map-marker-outline" />
            <NuxtLink
              v-if="court.business?.id"
              :to="`/client/businesses/${court.business.id}`"
              class="court-meta-link"
            >
              {{ court.business?.name }}
            </NuxtLink>
            <template v-else>{{ court.business?.name }}</template>
            <template v-if="court.business?.address"> · {{ court.business.address }}</template>
          </p>
        </div>
        <div class="court-headline-tags">
          <span v-if="court.rating" class="court-rating-badge">
            <span class="mdi mdi-star" />
            {{ court.rating.toFixed(1) }}
            <span v-if="court.ratingCount" class="court-rating-count">({{ court.ratingCount }})</span>
          </span>
          <span class="court-type-badge">{{ courtTypeLabel(court.type) }}</span>
        </div>
      </div>

      <div class="court-grid">
        <!-- Columna info -->
        <div class="court-info">
          <div class="court-features">
            <div class="court-feature">
              <div class="court-feature-icon"><span class="mdi mdi-cash" /></div>
              <div>
                <div class="court-feature-value">${{ Number(court.pricePerHour).toLocaleString('es-CO') }}</div>
                <div class="court-feature-label">por hora</div>
              </div>
            </div>
            <div class="court-feature">
              <div class="court-feature-icon"><span class="mdi mdi-account-group-outline" /></div>
              <div>
                <div class="court-feature-value">{{ court.capacity }}</div>
                <div class="court-feature-label">jugadores</div>
              </div>
            </div>
            <div class="court-feature">
              <div class="court-feature-icon"><span class="mdi mdi-soccer-field" /></div>
              <div>
                <div class="court-feature-value">{{ courtTypeLabel(court.type) }}</div>
                <div class="court-feature-label">tipo de cancha</div>
              </div>
            </div>
          </div>

          <div v-if="court.description" class="court-section">
            <h2 class="court-section-title">Sobre esta cancha</h2>
            <div class="prose-content" v-html="court.description" />
          </div>

          <div v-if="court.amenities?.length" class="court-section">
            <h2 class="court-section-title">Características de la cancha</h2>
            <div class="court-amenities">
              <div v-for="am in court.amenities" :key="am" class="court-amenity">
                <span class="mdi" :class="amenityIcon(am)" />
                {{ am }}
              </div>
            </div>
          </div>

          <div v-if="court.business" class="court-section">
            <h2 class="court-section-title">El negocio</h2>
            <NuxtLink
              v-if="court.business.id"
              :to="`/client/businesses/${court.business.id}`"
              class="court-biz"
            >
              <div class="court-biz-info">
                <span class="court-biz-name">{{ court.business.name }}</span>
                <span v-if="court.business.address" class="court-biz-addr">
                  <span class="mdi mdi-map-marker-outline" /> {{ court.business.address }}
                </span>
              </div>
              <span class="court-biz-cta">Ver perfil <span class="mdi mdi-arrow-right" /></span>
            </NuxtLink>
            <div v-if="court.business.amenities?.length" class="court-amenities mt-3">
              <div v-for="am in court.business.amenities" :key="am" class="court-amenity">
                <span class="mdi" :class="amenityIcon(am)" />
                {{ am }}
              </div>
            </div>
          </div>
        </div>

        <!-- Panel de reserva -->
        <aside class="court-booking">
          <div class="booking-panel">
            <div class="booking-panel-price">
              <span class="booking-panel-amount">${{ Number(court.pricePerHour).toLocaleString('es-CO') }}</span>
              <span class="booking-panel-unit"> / hora</span>
            </div>

            <v-text-field
              v-model="selectedDate"
              label="Fecha de reserva"
              type="date"
              :min="today"
              prepend-inner-icon="mdi-calendar"
              hide-details
              class="mb-4"
              @update:model-value="loadSlots"
            />

            <div v-if="slotsLoading" class="d-flex align-center gap-2 py-3">
              <v-progress-circular size="18" indeterminate color="primary" />
              <span class="text-body-2 brand-muted">Cargando horarios...</span>
            </div>

            <template v-else-if="slots.length > 0">
              <p class="booking-panel-label">Horarios disponibles</p>
              <div class="slots-grid">
                <button
                  v-for="slot in slots"
                  :key="slot.startTime"
                  type="button"
                  class="slot-chip"
                  :class="{
                    'is-selected': isSelected(slot),
                    'is-disabled': !slot.isAvailable,
                  }"
                  :disabled="!slot.isAvailable"
                  @click="slot.isAvailable && toggleSlot(slot)"
                >
                  <span class="slot-chip-time">{{ slot.startTime }} – {{ slot.endTime }}</span>
                  <span class="slot-chip-price">
                    ${{ effectivePrice(slot).toLocaleString('es-CO') }}
                    <span v-if="effectivePrice(slot) !== Number(court.pricePerHour)">★</span>
                  </span>
                </button>
              </div>

              <p
                v-if="slots.some(s => s.pricePerHour !== null && s.pricePerHour !== undefined)"
                class="slot-legend"
              >
                ★ Precio especial para ese horario
              </p>

              <div v-if="selectedSlots.length > 0" class="booking-summary">
                <div class="booking-summary-row">
                  <span>{{ selectedSlots.length }} hora{{ selectedSlots.length > 1 ? 's' : '' }}</span>
                  <strong>${{ totalSelected.toLocaleString('es-CO') }}</strong>
                </div>
                <v-btn color="primary" size="large" block @click="goToBook">
                  Reservar ahora
                </v-btn>
              </div>
            </template>

            <div v-else-if="selectedDate && !slotsLoading" class="booking-empty">
              <span class="mdi mdi-calendar-remove-outline" />
              No hay horarios disponibles para esta fecha. Intenta con otro día o consulta otro horario.
            </div>

            <div v-else class="booking-empty">
              <span class="mdi mdi-calendar-search" />
              Elige una fecha para ver los horarios disponibles.
            </div>
          </div>
        </aside>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: 'client', middleware: 'auth' })

const route = useRoute()
const router = useRouter()
const { apiFetch } = useApi()

const court = ref<any>(null)
const loading = ref(false)
const slots = ref<any[]>([])
const slotsLoading = ref(false)
const selectedDate = ref('')
const selectedSlots = ref<any[]>([])

const today = new Date().toISOString().split('T')[0]

const courtTypes = [
  { title: 'Fútbol 5', value: 'football_5' },
  { title: 'Fútbol 7', value: 'football_7' },
  { title: 'Fútbol 8', value: 'football_8' },
  { title: 'Fútbol 11', value: 'football_11' },
  { title: 'Futsal', value: 'futsal' },
  { title: 'Fútbol Playa', value: 'beach_soccer' },
  { title: 'Mini Fútbol', value: 'mini_football' },
]
const courtTypeLabel = (type: string) => courtTypes.find(t => t.value === type)?.title ?? type

/** Filtramos picsum: si no hay imágenes reales, la galería usa placeholder local. */
const images = computed<string[]>(() => {
  const list = (court.value?.images ?? []) as string[]
  return list.filter((url) => !!safeCover(url))
})

// Icono MDI por comodidad/servicio (las no mapeadas usan un check genérico).
const AMENITY_ICONS: Record<string, string> = {
  'Iluminación LED': 'mdi-lightbulb-on-outline',
  'Iluminación nocturna': 'mdi-lightbulb-on-outline',
  Parqueadero: 'mdi-parking',
  Vestidores: 'mdi-locker-multiple',
  Duchas: 'mdi-shower',
  Cafetería: 'mdi-coffee-outline',
  'Cancha cubierta': 'mdi-home-roof',
  'Wi-Fi': 'mdi-wifi',
  WiFi: 'mdi-wifi',
  Hidratación: 'mdi-cup-water',
  Arbitraje: 'mdi-whistle',
  Baños: 'mdi-toilet',
  Bar: 'mdi-glass-cocktail',
  Restaurante: 'mdi-silverware-fork-knife',
  Seguridad: 'mdi-shield-check-outline',
  'Zona de descanso': 'mdi-sofa-outline',
  Graderías: 'mdi-bleach',
  'Tienda deportiva': 'mdi-store-outline',
  'Zona familiar': 'mdi-account-group-outline',
}
const amenityIcon = (name: string) => AMENITY_ICONS[name] ?? 'mdi-check-circle-outline'

const isSelected = (slot: any) =>
  selectedSlots.value.some(s => s.startTime === slot.startTime)

// Effective price: slot-level override OR court base price
const effectivePrice = (slot: any): number => {
  if (slot.pricePerHour !== null && slot.pricePerHour !== undefined) {
    return Number(slot.pricePerHour)
  }
  return Number(court.value?.pricePerHour ?? 0)
}

// Total price for all selected slots (each slot is 1 hour)
const totalSelected = computed(() =>
  selectedSlots.value.reduce((sum, s) => sum + effectivePrice(s), 0)
)

const toggleSlot = (slot: any) => {
  const idx = selectedSlots.value.findIndex(s => s.startTime === slot.startTime)
  if (idx !== -1) {
    selectedSlots.value.splice(idx, 1)
  } else {
    selectedSlots.value.push(slot)
  }
}

const loadSlots = async () => {
  if (!selectedDate.value) return
  slotsLoading.value = true
  selectedSlots.value = []
  try {
    // El backend retorna { date, dayOfWeek, courtId, slots: [...] }
    const response = await apiFetch<any>(
      `/bookings/court/${route.params.id}/available-slots?date=${selectedDate.value}`
    )
    slots.value = response.slots ?? []
  } catch (e) {
    slots.value = []
  } finally {
    slotsLoading.value = false
  }
}

const goToBook = () => {
  if (!selectedSlots.value.length) return
  const sorted = [...selectedSlots.value].sort((a, b) => a.startTime.localeCompare(b.startTime))
  router.push({
    path: `/client/courts/${route.params.id}/book`,
    query: {
      date: selectedDate.value,
      startTime: sorted[0].startTime,
      endTime: sorted[sorted.length - 1].endTime,
    },
  })
}

onMounted(async () => {
  loading.value = true
  try {
    court.value = await apiFetch<any>(`/courts/${route.params.id}`)
  } finally {
    loading.value = false
  }
})
</script>

<style scoped>
.court-detail { max-width: 1080px; margin: 0 auto; }

.back-link {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 0.88rem;
  font-weight: 600;
  color: var(--text-muted);
  text-decoration: none;
  margin-bottom: 16px;
  transition: var(--transition);
}
.back-link:hover { color: var(--green-primary); }

/* Galería */
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
.court-gallery-ph {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background:
    radial-gradient(circle at 30% 25%, rgba(47, 161, 138, 0.18), transparent 55%),
    radial-gradient(circle at 80% 75%, rgba(47, 161, 138, 0.12), transparent 55%),
    linear-gradient(135deg, #182230 0%, #0f141a 100%);
}
.court-gallery-ph .mdi { font-size: 6rem; color: rgba(52, 198, 146, 0.55); }
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

/* Título */
.court-headline {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  margin: 24px 0 20px;
}
.court-title { font-size: clamp(1.5rem, 3vw, 2.1rem); line-height: 1.15; }
.court-meta {
  font-size: 0.92rem;
  color: var(--text-muted);
  margin-top: 6px;
}
.court-meta .mdi { color: var(--green-primary); vertical-align: -2px; }
.court-headline-tags {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
  flex-wrap: wrap;
}
.court-rating-badge {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 0.82rem;
  font-weight: 700;
  color: #facc15;
  padding: 7px 12px;
  border-radius: 100px;
  background: rgba(250, 204, 21, 0.1);
  border: 1px solid rgba(250, 204, 21, 0.22);
}
.court-rating-count { color: var(--text-muted); font-weight: 600; }
.court-type-badge {
  font-size: 0.78rem;
  font-weight: 700;
  padding: 7px 14px;
  border-radius: 100px;
  background: var(--green-soft);
  color: var(--green-bright);
}

/* Comodidades */
.court-amenities {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 10px;
}
.court-amenity {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 14px;
  background: var(--bg-card);
  border: 1px solid var(--border-soft);
  border-radius: var(--radius-md);
  font-size: 0.86rem;
  color: var(--text-primary);
}
.court-amenity .mdi {
  font-size: 1.1rem;
  color: var(--green-primary);
}

.court-meta-link {
  color: var(--green-bright);
  text-decoration: none;
  font-weight: 600;
}
.court-meta-link:hover { text-decoration: underline; }

.court-biz {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 14px 16px;
  background: var(--bg-card);
  border: 1px solid var(--border-soft);
  border-radius: var(--radius-md);
  text-decoration: none;
  transition: var(--transition);
}
.court-biz:hover { border-color: rgba(47, 161, 138, 0.25); }
.court-biz-info { display: flex; flex-direction: column; gap: 2px; min-width: 0; }
.court-biz-name { font-size: 0.95rem; font-weight: 700; color: var(--text-primary); }
.court-biz-addr { font-size: 0.78rem; color: var(--text-muted); }
.court-biz-addr .mdi { color: var(--green-primary); vertical-align: -1px; }
.court-biz-cta {
  flex-shrink: 0;
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 0.82rem;
  font-weight: 700;
  color: var(--green-bright);
}

/* Grid info + panel */
.court-grid {
  display: grid;
  grid-template-columns: 1fr 360px;
  gap: 32px;
  align-items: start;
}

.court-features {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
  margin-bottom: 28px;
}
.court-feature {
  display: flex;
  align-items: center;
  gap: 11px;
  padding: 16px;
  background: var(--bg-card);
  border: 1px solid var(--border-soft);
  border-radius: var(--radius-md);
}
.court-feature-icon {
  width: 40px;
  height: 40px;
  flex-shrink: 0;
  border-radius: var(--radius-sm);
  background: var(--green-soft);
  color: var(--green-primary);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.2rem;
}
.court-feature-value {
  font-weight: 700;
  font-size: 0.95rem;
  color: var(--text-primary);
}
.court-feature-label {
  font-size: 0.74rem;
  color: var(--text-muted);
}

.court-section { margin-top: 8px; }
.court-section-title {
  font-family: 'Manrope', sans-serif;
  font-size: 1.15rem;
  font-weight: 700;
  color: var(--text-primary);
  margin-bottom: 10px;
}

/* Panel de reserva */
.court-booking { position: sticky; top: 92px; }
.booking-panel {
  background: var(--bg-card);
  border: 1px solid var(--border-soft);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-md);
  padding: 22px;
}
.booking-panel-price { margin-bottom: 18px; }
.booking-panel-amount {
  font-family: 'Sora', 'Manrope', sans-serif;
  font-size: 1.6rem;
  font-weight: 800;
  color: var(--text-primary);
}
.booking-panel-unit { font-size: 0.9rem; color: var(--text-muted); }
.booking-panel-label {
  font-size: 0.82rem;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: 10px;
}

.slots-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
}
.slot-chip {
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding: 10px;
  border: 1.5px solid var(--border-soft);
  border-radius: var(--radius-sm);
  background: var(--bg-subtle);
  cursor: pointer;
  text-align: left;
  transition: var(--transition);
}
.slot-chip:hover:not(.is-disabled) {
  border-color: var(--green-primary);
  background: var(--green-soft);
}
.slot-chip.is-selected {
  border-color: var(--green-primary);
  background: var(--green-primary);
}
.slot-chip.is-selected .slot-chip-time,
.slot-chip.is-selected .slot-chip-price { color: #fff; }
.slot-chip.is-disabled {
  opacity: 0.45;
  cursor: not-allowed;
  background: var(--bg-subtle);
}
.slot-chip-time {
  font-size: 0.8rem;
  font-weight: 700;
  color: var(--text-primary);
}
.slot-chip-price {
  font-size: 0.72rem;
  color: var(--text-muted);
}
.slot-legend {
  font-size: 0.74rem;
  color: var(--text-muted);
  margin-top: 10px;
}

.booking-summary {
  margin-top: 16px;
  padding-top: 16px;
  border-top: 1px solid var(--border-soft);
}
.booking-summary-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 0.92rem;
  margin-bottom: 12px;
}
.booking-summary-row strong {
  font-size: 1.1rem;
  color: var(--text-primary);
}

.booking-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  text-align: center;
  padding: 24px 12px;
  font-size: 0.85rem;
  color: var(--text-muted);
}
.booking-empty .mdi { font-size: 2rem; color: var(--text-faint); }

/* ─── Responsive ─── */
@media (max-width: 880px) {
  .court-grid { grid-template-columns: 1fr; gap: 24px; }
  .court-booking { position: static; }
  .court-gallery { grid-template-columns: 1fr; height: auto; }
  .court-gallery-main { height: 240px; }
  .court-gallery-side { grid-template-rows: none; grid-template-columns: 1fr 1fr; height: 140px; }
  .court-features { grid-template-columns: 1fr; }
  .court-amenities { grid-template-columns: 1fr; }
}
</style>

<style>
/* Contenido enriquecido de la descripción (HTML del editor WYSIWYG) */
.prose-content { font-size: 0.92rem; color: #cbd5e1; line-height: 1.7; }
.prose-content h1 { font-size: 1.4rem; font-weight: 700; margin: .6em 0 .3em; color: var(--text-primary); }
.prose-content h2 { font-size: 1.2rem; font-weight: 700; margin: .5em 0 .25em; color: var(--text-primary); }
.prose-content h3 { font-size: 1.05rem; font-weight: 600; margin: .5em 0 .2em; color: var(--text-primary); }
.prose-content p  { margin: .5em 0; }
.prose-content ul, .prose-content ol { padding-left: 1.5em; margin: .5em 0; }
.prose-content li { margin: .25em 0; }
.prose-content blockquote {
  border-left: 4px solid rgba(var(--v-theme-primary), .6);
  margin: .6em 0; padding: .25em .8em;
  color: rgba(255, 255, 255, .55); font-style: italic;
}
.prose-content code {
  background: rgba(255, 255, 255, .08); border-radius: 4px;
  padding: 1px 5px; font-family: monospace; font-size: .85em;
}
.prose-content pre {
  background: rgba(255, 255, 255, .06); border-radius: 8px;
  padding: .8em 1em; overflow-x: auto; margin: .6em 0;
}
.prose-content pre code { background: none; padding: 0; }
.prose-content hr { border: none; border-top: 1px solid var(--border-soft); margin: .9em 0; }
.prose-content a { color: var(--green-bright); text-decoration: underline; }
.prose-content img { max-width: 100%; height: auto; border-radius: 8px; margin: .6em 0; }
.prose-content table { width: 100%; border-collapse: collapse; margin: .6em 0; font-size: .875rem; }
.prose-content th, .prose-content td {
  border: 1px solid var(--border-soft); padding: 7px 11px; text-align: left;
}
.prose-content th { background: var(--green-soft); font-weight: 600; }
.prose-content tr:nth-child(even) td { background: var(--bg-subtle); }
</style>
