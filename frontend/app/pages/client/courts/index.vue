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
  color: #e9edf2;
  font-size: clamp(2rem, 2.8vw, 3rem);
  line-height: 1.1;
}
.explore-head p {
  margin-top: 8px;
  color: #aeb8c3;
  font-size: clamp(1rem, 1.2vw, 1.45rem);
}

.explore-toolbar {
  margin-top: 22px;
  border: 1px solid rgba(255,255,255,.1);
  border-radius: 28px;
  padding: 18px;
  display: flex;
  align-items: center;
  gap: 12px;
  background: linear-gradient(180deg, #1a2027, #171d24);
}
.explore-search {
  flex: 1;
  min-width: 260px;
  display: flex;
  align-items: center;
  gap: 10px;
  border: 1px solid rgba(255,255,255,.12);
  border-radius: 19px;
  background: #262d35;
  padding: 12px 16px;
}
.explore-search .mdi { color: #8f99a3; font-size: 1.25rem; }
.explore-search input {
  width: 100%;
  border: none;
  outline: none;
  color: #e7ecf2;
  background: transparent;
  font-size: clamp(.95rem,1.05vw,1.2rem);
}
.explore-pill { max-width: 170px; }
.explore-pill :deep(.v-field) {
  border-radius: 999px !important;
  background: #2a3138 !important;
}
.explore-filter-btn {
  border-radius: 999px !important;
  background: #6be08f !important;
  color: #0f2016 !important;
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
  border: 1px solid rgba(111,230,140,.5);
  border-radius: 999px;
  padding: 12px 28px;
  color: #75e79b;
  background: transparent;
  font-size: 1.1rem;
}

@media (max-width: 1100px) { .explore-grid { grid-template-columns: repeat(2, 1fr); } }
@media (max-width: 760px) {
  .explore-toolbar { flex-wrap: wrap; border-radius: 18px; padding: 12px; }
  .explore-search { min-width: 100%; }
  .explore-pill { max-width: none; flex: 1; min-width: 120px; }
  .explore-filter-btn { width: 100%; }
  .explore-grid { grid-template-columns: 1fr; }
}
</style>
