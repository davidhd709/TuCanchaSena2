<template>
  <div>
    <!-- ─── Hero de búsqueda ─── -->
    <section class="explore-hero">
      <div class="explore-hero-bg" />
      <div class="explore-hero-content">
        <h1 class="brand-display explore-hero-title">Explora negocios deportivos</h1>
        <p class="explore-hero-sub">
          Descubre dónde jugar: revisa sus servicios, horarios y canchas antes de reservar.
        </p>
        <div class="explore-search">
          <v-text-field
            v-model="search"
            placeholder="Buscar por nombre o ubicación..."
            prepend-inner-icon="mdi-magnify"
            variant="solo"
            flat
            hide-details
            clearable
            density="comfortable"
            bg-color="surface"
          />
        </div>
      </div>
    </section>

    <!-- ─── Filtro por servicio ─── -->
    <div class="explore-filters">
      <v-select
        v-model="amenityFilter"
        :items="allAmenities"
        label="Servicio / comodidad"
        clearable
        hide-details
        density="comfortable"
        class="explore-filter"
      />
      <div class="explore-count">
        <span v-if="!loading && !fetchError">
          {{ filtered.length }} negocio{{ filtered.length === 1 ? '' : 's' }}
        </span>
      </div>
    </div>

    <LoadingState v-if="loading" :count="6" :sm="6" :lg="4" />

    <ErrorState
      v-else-if="fetchError"
      message="No pudimos cargar los negocios. Verifica tu conexión e intenta de nuevo."
      @retry="loadBusinesses"
    />

    <div v-else-if="filtered.length" class="explore-grid">
      <BusinessCard v-for="biz in filtered" :key="biz.id" :business="biz" />
    </div>

    <EmptyState
      v-else
      icon="mdi-stadium-variant"
      title="Sin negocios disponibles"
      :description="search || amenityFilter ? 'No se encontraron negocios con esos filtros.' : 'Aún no hay negocios publicados. Vuelve pronto.'"
    >
      <template v-if="search || amenityFilter" #action>
        <v-btn variant="tonal" color="primary" @click="clearFilters">Limpiar filtros</v-btn>
      </template>
    </EmptyState>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: 'client', middleware: 'auth' })

const { apiList } = useApi()
const businesses = ref<any[]>([])
const loading = ref(false)
const fetchError = ref(false)
const search = ref('')
const amenityFilter = ref<string | null>(null)

const allAmenities = computed(() => {
  const set = new Set<string>()
  businesses.value.forEach((b) => (b.amenities ?? []).forEach((a: string) => set.add(a)))
  return [...set].sort()
})

const filtered = computed(() => {
  let result = [...businesses.value]
  if (search.value) {
    const q = search.value.toLowerCase()
    result = result.filter(
      (b) =>
        b.name.toLowerCase().includes(q) ||
        (b.address ?? '').toLowerCase().includes(q),
    )
  }
  if (amenityFilter.value) {
    result = result.filter((b) => (b.amenities ?? []).includes(amenityFilter.value))
  }
  return result
})

const clearFilters = () => {
  search.value = ''
  amenityFilter.value = null
}

const loadBusinesses = async () => {
  loading.value = true
  fetchError.value = false
  try {
    businesses.value = await apiList<any>('/businesses')
  } catch {
    fetchError.value = true
  } finally {
    loading.value = false
  }
}

onMounted(loadBusinesses)
</script>

<style scoped>
.explore-hero {
  position: relative;
  border-radius: var(--radius-xl);
  overflow: hidden;
  margin-bottom: 20px;
  padding: 44px 32px;
  border: 1px solid var(--border-soft);
}
.explore-hero-bg {
  position: absolute;
  inset: 0;
  background:
    radial-gradient(circle at 80% 20%, rgba(47, 161, 138, 0.22), transparent 45%),
    radial-gradient(circle at 10% 90%, rgba(59, 130, 246, 0.12), transparent 50%),
    linear-gradient(135deg, #15222c 0%, #0f141c 100%);
}
.explore-hero-content { position: relative; max-width: 640px; }
.explore-hero-title { font-size: clamp(1.6rem, 3.4vw, 2.3rem); line-height: 1.15; }
.explore-hero-sub {
  font-size: 0.98rem;
  color: var(--text-muted);
  margin-top: 8px;
  margin-bottom: 22px;
}
.explore-search :deep(.v-field) {
  border-radius: 100px;
  box-shadow: var(--shadow-md);
  border: 1px solid var(--border-soft);
}

.explore-filters {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 24px;
  flex-wrap: wrap;
}
.explore-filter { max-width: 280px; flex: 1 1 220px; }
.explore-count {
  margin-left: auto;
  font-size: 0.85rem;
  font-weight: 600;
  color: var(--text-muted);
}

.explore-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 22px;
}

@media (max-width: 960px) {
  .explore-grid { grid-template-columns: repeat(2, 1fr); }
}
@media (max-width: 600px) {
  .explore-hero { padding: 32px 20px; }
  .explore-grid { grid-template-columns: 1fr; gap: 16px; }
  .explore-filter { max-width: none; flex: 1 1 100%; }
  .explore-count { width: 100%; margin-left: 0; }
}
</style>
