<template>
  <div class="biz-profile">
    <NuxtLink to="/client/businesses" class="back-link">
      <v-icon icon="mdi-arrow-left" size="18" />
      Volver a negocios
    </NuxtLink>

    <div v-if="loading" class="d-flex justify-center py-16">
      <v-progress-circular indeterminate color="primary" size="44" />
    </div>

    <ErrorState
      v-else-if="fetchError"
      message="No pudimos cargar este negocio. Intenta de nuevo."
      @retry="loadBusiness"
    />

    <template v-else-if="business">
      <!-- Galería -->
      <div class="biz-gallery">
        <div class="biz-gallery-main">
          <img v-if="images[0]" :src="images[0]" :alt="business.name" />
          <div v-else class="biz-gallery-ph"><span class="mdi mdi-stadium-variant" /></div>
        </div>
        <div v-if="images.length > 1" class="biz-gallery-side">
          <div v-for="(im, i) in images.slice(1, 3)" :key="i" class="biz-gallery-thumb">
            <img :src="im" :alt="`${business.name} ${i + 2}`" />
            <span v-if="i === 1 && images.length > 3" class="biz-gallery-more">
              +{{ images.length - 3 }} fotos
            </span>
          </div>
        </div>
      </div>

      <!-- Encabezado -->
      <div class="biz-headline">
        <div>
          <h1 class="brand-display biz-title">{{ business.name }}</h1>
          <p class="biz-meta">
            <span class="mdi mdi-map-marker-outline" />
            {{ business.address }}
          </p>
        </div>
        <span class="biz-status" :class="business.isActive ? 'is-open' : 'is-closed'">
          <span class="biz-status-dot" />
          {{ business.isActive ? 'Activo' : 'No disponible' }}
        </span>
      </div>

      <div class="biz-grid">
        <!-- Columna principal -->
        <div class="biz-main">
          <section v-if="business.description" class="biz-section">
            <h2 class="biz-section-title">Sobre el negocio</h2>
            <p class="biz-text">{{ business.description }}</p>
          </section>

          <section v-if="business.amenities?.length" class="biz-section">
            <h2 class="biz-section-title">Servicios y comodidades</h2>
            <div class="biz-amenities">
              <div v-for="am in business.amenities" :key="am" class="biz-amenity">
                <span class="mdi" :class="amenityIcon(am)" />
                {{ am }}
              </div>
            </div>
          </section>

          <section v-if="business.policies" class="biz-section">
            <h2 class="biz-section-title">Reglas y políticas</h2>
            <p class="biz-text">{{ business.policies }}</p>
          </section>

          <section class="biz-section">
            <h2 class="biz-section-title">
              Canchas de este negocio
              <span class="biz-section-count">{{ courts.length }}</span>
            </h2>
            <div v-if="courts.length" class="biz-courts-grid">
              <CourtCard
                v-for="court in courts"
                :key="court.id"
                :court="{ ...court, business: { name: business.name } }"
                :to="`/client/courts/${court.id}`"
              />
            </div>
            <EmptyState
              v-else
              icon="mdi-soccer-field"
              title="Este negocio aún no tiene canchas"
              description="Vuelve pronto, el negocio podría publicar canchas más adelante."
            />
          </section>
        </div>

        <!-- Panel lateral: contacto + horarios -->
        <aside class="biz-aside">
          <div class="biz-panel">
            <h3 class="biz-panel-title">Horarios de atención</h3>
            <ul class="biz-schedule">
              <li
                v-for="d in orderedSchedule"
                :key="d.dayOfWeek"
                class="biz-schedule-row"
                :class="{ 'is-closed': !d.isOpen }"
              >
                <span class="biz-schedule-day">{{ dayLabel(d.dayOfWeek) }}</span>
                <span class="biz-schedule-hours">
                  {{ d.isOpen ? `${d.openTime} – ${d.closeTime}` : 'Cerrado' }}
                </span>
              </li>
              <li v-if="!orderedSchedule.length" class="biz-schedule-row">
                <span class="biz-schedule-hours">Sin horario definido</span>
              </li>
            </ul>

            <v-divider class="my-4" />

            <h3 class="biz-panel-title">Contacto</h3>
            <div class="biz-contact">
              <span v-if="business.phone" class="biz-contact-row">
                <span class="mdi mdi-phone-outline" /> {{ business.phone }}
              </span>
              <span v-if="business.email" class="biz-contact-row">
                <span class="mdi mdi-email-outline" /> {{ business.email }}
              </span>
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
const { apiFetch } = useApi()

const business = ref<any>(null)
const loading = ref(false)
const fetchError = ref(false)

const images = computed<string[]>(() => business.value?.images ?? [])
const courts = computed<any[]>(() =>
  (business.value?.courts ?? []).filter((c: any) => c.isActive),
)

const DAY_ORDER = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']
const DAY_LABELS: Record<string, string> = {
  monday: 'Lunes',
  tuesday: 'Martes',
  wednesday: 'Miércoles',
  thursday: 'Jueves',
  friday: 'Viernes',
  saturday: 'Sábado',
  sunday: 'Domingo',
}
const dayLabel = (d: string) => DAY_LABELS[d] ?? d

const orderedSchedule = computed(() => {
  const sched = business.value?.schedules ?? []
  return [...sched].sort(
    (a: any, b: any) => DAY_ORDER.indexOf(a.dayOfWeek) - DAY_ORDER.indexOf(b.dayOfWeek),
  )
})

const AMENITY_ICONS: Record<string, string> = {
  WiFi: 'mdi-wifi',
  Baños: 'mdi-toilet',
  Parqueadero: 'mdi-parking',
  Bar: 'mdi-glass-cocktail',
  Restaurante: 'mdi-silverware-fork-knife',
  Cafetería: 'mdi-coffee-outline',
  'Iluminación nocturna': 'mdi-lightbulb-on-outline',
  Vestidores: 'mdi-locker-multiple',
  Duchas: 'mdi-shower',
  Seguridad: 'mdi-shield-check-outline',
  'Zona de descanso': 'mdi-sofa-outline',
  Graderías: 'mdi-bleach',
  'Tienda deportiva': 'mdi-store-outline',
  'Zona familiar': 'mdi-account-group-outline',
  'Cancha techada': 'mdi-home-roof',
}
const amenityIcon = (name: string) => AMENITY_ICONS[name] ?? 'mdi-check-circle-outline'

const loadBusiness = async () => {
  loading.value = true
  fetchError.value = false
  try {
    business.value = await apiFetch<any>(`/businesses/${route.params.id}`)
  } catch {
    fetchError.value = true
  } finally {
    loading.value = false
  }
}

onMounted(loadBusiness)
</script>

<style scoped>
.biz-profile { max-width: 1080px; margin: 0 auto; }

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
.biz-gallery {
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: 12px;
  height: 340px;
}
.biz-gallery-main,
.biz-gallery-thumb {
  border-radius: var(--radius-lg);
  overflow: hidden;
  border: 1px solid var(--border-soft);
}
.biz-gallery-main { border-radius: var(--radius-xl); }
.biz-gallery-main img,
.biz-gallery-thumb img { width: 100%; height: 100%; object-fit: cover; }
.biz-gallery-ph {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background:
    radial-gradient(circle at 35% 30%, rgba(47, 161, 138, 0.22), transparent 55%),
    linear-gradient(135deg, #15222c 0%, #0f141c 100%);
}
.biz-gallery-ph .mdi { font-size: 6rem; color: rgba(47, 161, 138, 0.4); }
.biz-gallery-side { display: grid; grid-template-rows: 1fr 1fr; gap: 12px; }
.biz-gallery-thumb { position: relative; }
.biz-gallery-more {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(6, 8, 16, 0.6);
  color: #fff;
  font-size: 0.9rem;
  font-weight: 700;
}

/* Encabezado */
.biz-headline {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  margin: 24px 0 20px;
}
.biz-title { font-size: clamp(1.5rem, 3vw, 2.1rem); line-height: 1.15; }
.biz-meta { font-size: 0.92rem; color: var(--text-muted); margin-top: 6px; }
.biz-meta .mdi { color: var(--green-primary); vertical-align: -2px; }
.biz-status {
  flex-shrink: 0;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 0.76rem;
  font-weight: 700;
  padding: 7px 13px;
  border-radius: 100px;
  border: 1px solid var(--border-soft);
}
.biz-status-dot { width: 7px; height: 7px; border-radius: 50%; }
.biz-status.is-open { color: var(--green-bright); }
.biz-status.is-open .biz-status-dot { background: var(--green-primary); }
.biz-status.is-closed { color: #f87171; }
.biz-status.is-closed .biz-status-dot { background: #ef4444; }

/* Grid */
.biz-grid {
  display: grid;
  grid-template-columns: 1fr 320px;
  gap: 32px;
  align-items: start;
}
.biz-section { margin-bottom: 28px; }
.biz-section-title {
  font-family: 'Manrope', sans-serif;
  font-size: 1.15rem;
  font-weight: 700;
  color: var(--text-primary);
  margin-bottom: 12px;
  display: flex;
  align-items: center;
  gap: 8px;
}
.biz-section-count {
  font-size: 0.8rem;
  font-weight: 700;
  padding: 2px 9px;
  border-radius: 100px;
  background: var(--green-soft);
  color: var(--green-bright);
}
.biz-text { font-size: 0.92rem; color: var(--text-muted); line-height: 1.7; }

.biz-amenities {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 10px;
}
.biz-amenity {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 11px 14px;
  background: var(--bg-card);
  border: 1px solid var(--border-soft);
  border-radius: var(--radius-md);
  font-size: 0.84rem;
  color: var(--text-primary);
}
.biz-amenity .mdi { font-size: 1.1rem; color: var(--green-primary); }

.biz-courts-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 18px;
}

/* Panel lateral */
.biz-aside { position: sticky; top: 92px; }
.biz-panel {
  background: var(--bg-card);
  border: 1px solid var(--border-soft);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-md);
  padding: 20px;
}
.biz-panel-title {
  font-family: 'Manrope', sans-serif;
  font-size: 0.95rem;
  font-weight: 700;
  color: var(--text-primary);
  margin-bottom: 12px;
}
.biz-schedule { list-style: none; display: flex; flex-direction: column; gap: 7px; }
.biz-schedule-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 0.84rem;
}
.biz-schedule-day { color: var(--text-muted); }
.biz-schedule-hours { color: var(--text-primary); font-weight: 600; }
.biz-schedule-row.is-closed .biz-schedule-hours { color: var(--text-faint); font-weight: 500; }

.biz-contact { display: flex; flex-direction: column; gap: 8px; }
.biz-contact-row {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 0.85rem;
  color: var(--text-muted);
}
.biz-contact-row .mdi { font-size: 1rem; color: var(--green-primary); }

/* Responsive */
@media (max-width: 880px) {
  .biz-grid { grid-template-columns: 1fr; gap: 24px; }
  .biz-aside { position: static; }
  .biz-gallery { grid-template-columns: 1fr; height: auto; }
  .biz-gallery-main { height: 230px; }
  .biz-gallery-side { grid-template-rows: none; grid-template-columns: 1fr 1fr; height: 130px; }
  .biz-amenities { grid-template-columns: 1fr; }
  .biz-courts-grid { grid-template-columns: 1fr; }
}
</style>
