<template>
  <section class="explore-page">
    <div class="explore-head">
      <h1>Explora canchas disponibles</h1>
      <p>Encuentra el espacio perfecto para tu próximo partido</p>
    </div>

    <div class="explore-toolbar">
      <span class="explore-filter-label">
        <span class="mdi mdi-tune-variant" />
        Filtros
      </span>

      <div class="explore-search">
        <span class="mdi mdi-magnify" />
        <input v-model="search" type="text" placeholder="¿Dónde quieres jugar?" />
      </div>

      <div class="explore-pills">
        <v-select
          v-model="typeFilter"
          :items="courtTypes"
          label="Tipo"
          clearable
          hide-details
          density="comfortable"
          class="explore-pill"
        />
        <v-select
          v-model="sortBy"
          :items="sortOptions"
          label="Ordenar por"
          clearable
          hide-details
          density="comfortable"
          class="explore-pill"
        />
      </div>
    </div>

    <LoadingState v-if="loading" :count="6" :sm="6" :lg="4" />
    <ErrorState v-else-if="fetchError" message="No pudimos cargar las canchas." @retry="loadCourts" />

    <template v-else-if="filteredCourts.length">
      <!-- Vista móvil: carrusel horizontal con deslizamiento táctil -->
      <div class="courts-carousel">
        <CourtCard
          v-for="court in filteredCourts"
          :key="court.id"
          :court="court"
          :to="`/client/courts/${court.id}`"
          class="carousel-item"
        />
      </div>
      <!-- Vista escritorio: grid normal -->
      <AppGrid class="courts-desktop-grid" :min="280">
        <CourtCard v-for="court in filteredCourts" :key="court.id" :court="court" :to="`/client/courts/${court.id}`" />
      </AppGrid>
    </template>

    <EmptyState
      v-else
      icon="mdi-soccer-field"
      title="Sin canchas disponibles"
      :description="search || typeFilter ? 'No encontramos canchas con esos filtros.' : 'Aún no hay canchas publicadas.'"
    >
      <template v-if="search || typeFilter" #action>
        <v-btn variant="tonal" color="primary" @click="clearFilters">Limpiar filtros</v-btn>
      </template>
    </EmptyState>
  </section>
</template>

<script setup lang="ts">
definePageMeta({ layout: 'client', middleware: 'auth' })
const { apiList } = useApi()
const { data: courts, loading, error: fetchError, execute: loadCourts } =
  useAsyncState<any[]>(() => apiList<any>('/courts'), [])
const search = ref('')
const typeFilter = ref<string | null>(null)
const sortBy = ref<string | null>(null)

const courtTypes = [
  { title: 'Fútbol 5', value: 'football_5' },
  { title: 'Fútbol 7', value: 'football_7' },
  { title: 'Fútbol 8', value: 'football_8' },
  { title: 'Fútbol 11', value: 'football_11' },
  { title: 'Futsal', value: 'futsal' },
]

const sortOptions = [
  { title: 'Nombre', value: 'name' },
  { title: 'Precio menor', value: 'price_asc' },
  { title: 'Precio mayor', value: 'price_desc' },
]

const filteredCourts = computed(() => {
  let result = [...courts.value]
  if (search.value) {
    const q = search.value.toLowerCase()
    result = result.filter(c => c.name.toLowerCase().includes(q) || c.business?.name?.toLowerCase().includes(q))
  }
  if (typeFilter.value) result = result.filter(c => c.type === typeFilter.value)
  if (sortBy.value === 'name') result.sort((a, b) => a.name.localeCompare(b.name))
  else if (sortBy.value === 'price_asc') result.sort((a, b) => a.pricePerHour - b.pricePerHour)
  else if (sortBy.value === 'price_desc') result.sort((a, b) => b.pricePerHour - a.pricePerHour)
  return result
})

const clearFilters = () => { search.value = ''; typeFilter.value = null }
onMounted(loadCourts)
</script>

<style scoped>
.explore-page { padding-bottom: 14px; }
.explore-head h1 {
  font-family: 'Sora', 'Manrope', sans-serif;
  font-weight: 800;
  letter-spacing: -0.02em;
  color: var(--text-primary);
  font-size: clamp(1.6rem, 3vw, 2.2rem);
  line-height: 1.15;
}
.explore-head p {
  margin-top: 8px;
  color: var(--text-muted);
  font-size: .95rem;
}

/* ── Toolbar ── */
.explore-toolbar {
  margin-top: 20px;
  border: 1px solid var(--border-soft);
  border-radius: var(--radius-lg);
  padding: 14px;
  display: flex;
  align-items: center;
  gap: 12px;
  background: var(--bg-card);
  box-shadow: var(--shadow-sm);
  flex-wrap: nowrap;
}

/* Buscador */
.explore-search {
  flex: 1;
  min-width: 220px;
  display: flex;
  align-items: center;
  gap: 10px;
  border: 1px solid var(--border-medium);
  border-radius: var(--radius-pill);
  background: var(--bg-elev);
  padding: 11px 16px;
  transition: border-color .2s ease, box-shadow .2s ease;
}
.explore-search:focus-within {
  border-color: var(--green-bright);
  box-shadow: 0 0 0 3px var(--green-soft);
}
.explore-search .mdi { color: var(--text-muted); font-size: 1.25rem; }
.explore-search input {
  width: 100%;
  border: none;
  outline: none;
  color: var(--text-primary);
  background: transparent;
  font-size: .95rem;
}
.explore-search input::placeholder { color: var(--text-faint); }

/* Pills wrapper */
.explore-pills {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-shrink: 0;
}
.explore-pill { width: 160px; }
.explore-pill :deep(.v-field) {
  border-radius: var(--radius-pill) !important;
  background: var(--bg-elev) !important;
}
/* 1.1: Ocultar el label flotante cuando hay una opción seleccionada */
.explore-pill :deep(.v-field--active .v-label),
.explore-pill :deep(.v-field--focused .v-label.v-field-label--floating) {
  opacity: 0 !important;
  visibility: hidden !important;
  pointer-events: none;
}
/* Eliminar el hueco (notch) en el borde cuando el label se oculta */
.explore-pill :deep(.v-field__outline__notch) {
  max-width: 0 !important;
}

/* Label "Filtros" */
.explore-filter-label {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  border-radius: var(--radius-pill);
  background: var(--green-soft);
  color: var(--green-bright);
  border: 1px solid rgba(52, 198, 146, 0.28);
  font-weight: 800;
  font-size: 0.9rem;
  padding: 8px 16px;
  white-space: nowrap;
  flex-shrink: 0;
  order: -1; /* siempre primero en desktop */
}
.explore-filter-label .mdi { font-size: 1.1rem; }

/* ── Grids / Carrusel ── */
.app-grid { margin-top: 18px; }

/* Carrusel horizontal → sólo móvil (≤599px) */
.courts-carousel { display: none; }
/* Grid → visible por defecto */
.courts-desktop-grid { display: block; margin-top: 18px; }

/* ── iPad Air y similares (600 – 960px) ── */
@media (min-width: 600px) and (max-width: 960px) {
  .explore-toolbar { flex-wrap: wrap; gap: 10px; }
  /* El label va primero en su propia fila */
  .explore-filter-label { order: -1; width: 100%; justify-content: flex-start; }
  /* Buscador ocupa toda la fila siguiente */
  .explore-search { min-width: 100%; order: 0; }
  /* Pills en fila completa con igual ancho */
  .explore-pills { order: 1; width: 100%; }
  .explore-pill { flex: 1; width: auto; min-width: 0; }
}

/* ── Móvil (≤599px) ── */
@media (max-width: 599px) {
  .explore-toolbar { flex-wrap: wrap; border-radius: 18px; padding: 12px; gap: 10px; }

  /* "Filtros" encima del buscador */
  .explore-filter-label {
    order: -1;
    width: 100%;
    justify-content: flex-start;
  }
  .explore-search { order: 0; min-width: 100%; }
  .explore-pills   { order: 1; width: 100%; }
  .explore-pill    { flex: 1; width: auto; min-width: 0; }

  /* Carrusel activo */
  .courts-carousel {
    display: flex;
    gap: 14px;
    overflow-x: auto;
    scroll-snap-type: x mandatory;
    -webkit-overflow-scrolling: touch;
    padding: 18px 4px 14px;
    margin: 0 -4px;
    scrollbar-width: none;
  }
  .courts-carousel::-webkit-scrollbar { display: none; }
  .courts-carousel .carousel-item {
    flex: 0 0 78vw;
    max-width: 320px;
    scroll-snap-align: start;
  }
  /* Grid oculto */
  .courts-desktop-grid { display: none !important; }
}
</style>
