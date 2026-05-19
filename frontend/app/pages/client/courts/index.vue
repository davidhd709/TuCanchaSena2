<template>
  <section class="explore-page">
    <div class="explore-head">
      <h1>Explora canchas disponibles</h1>
      <p>Encuentra el espacio perfecto para tu próximo partido</p>
    </div>

    <div class="explore-toolbar">
      <div class="explore-search">
        <span class="mdi mdi-magnify" />
        <input v-model="search" type="text" placeholder="¿Dónde quieres jugar?" />
      </div>

      <v-select v-model="typeFilter" :items="courtTypes" label="Tipo" clearable hide-details density="comfortable" class="explore-pill" />
      <v-select v-model="sortBy" :items="sortOptions" label="Precio" hide-details density="comfortable" class="explore-pill" />
      <v-btn class="explore-filter-btn" prepend-icon="mdi-tune-variant">Filtros</v-btn>
    </div>

    <LoadingState v-if="loading" :count="6" :sm="6" :lg="4" />
    <ErrorState v-else-if="fetchError" message="No pudimos cargar las canchas." @retry="loadCourts" />

    <div v-else-if="filteredCourts.length" class="explore-grid">
      <CourtCard v-for="court in filteredCourts" :key="court.id" :court="court" :to="`/client/courts/${court.id}`" />
    </div>

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

    <div v-if="filteredCourts.length" class="explore-more-wrap">
      <button class="explore-more">Cargar más canchas</button>
    </div>
  </section>
</template>

<script setup lang="ts">
definePageMeta({ layout: 'client', middleware: 'auth' })
const { apiList } = useApi()
const courts = ref<any[]>([])
const loading = ref(false)
const search = ref('')
const typeFilter = ref<string | null>(null)
const sortBy = ref('name')

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
  if (sortBy.value === 'price_asc') result.sort((a, b) => a.pricePerHour - b.pricePerHour)
  if (sortBy.value === 'price_desc') result.sort((a, b) => b.pricePerHour - a.pricePerHour)
  return result
})

const clearFilters = () => { search.value = ''; typeFilter.value = null }
const fetchError = ref(false)
const loadCourts = async () => {
  loading.value = true
  fetchError.value = false
  try { courts.value = await apiList<any>('/courts') }
  catch { fetchError.value = true }
  finally { loading.value = false }
}
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
}
.explore-search {
  flex: 1;
  min-width: 260px;
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
.explore-pill { max-width: 170px; }
.explore-pill :deep(.v-field) {
  border-radius: var(--radius-pill) !important;
  background: var(--bg-elev) !important;
}
.explore-filter-btn {
  border-radius: var(--radius-pill) !important;
  background: var(--green-soft) !important;
  color: var(--green-bright) !important;
  border: 1px solid rgba(52, 198, 146, 0.28) !important;
  font-weight: 800;
}

.explore-grid {
  margin-top: 18px;
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 18px;
}
.explore-more-wrap { display: flex; justify-content: center; margin-top: 18px; }
.explore-more {
  border: 1px solid rgba(52, 198, 146, 0.42);
  border-radius: var(--radius-pill);
  padding: 11px 26px;
  color: var(--green-bright);
  background: transparent;
  font-size: .92rem;
  font-weight: 700;
  cursor: pointer;
  transition: background .2s ease;
}
.explore-more:hover { background: var(--green-soft); }

@media (max-width: 1100px) { .explore-grid { grid-template-columns: repeat(2, 1fr); } }
@media (max-width: 760px) {
  .explore-toolbar { flex-wrap: wrap; border-radius: 18px; padding: 12px; }
  .explore-search { min-width: 100%; }
  .explore-pill { max-width: none; flex: 1; min-width: 120px; }
  .explore-filter-btn { width: 100%; }
  .explore-grid { grid-template-columns: 1fr; }
}
</style>
