<template>
  <div>
    <!-- ─── Hero buscador ─── -->
    <AppHero eyebrow="Negocios deportivos" title="¿Dónde vas a jugar hoy?"
             subtitle="Descubre canchas sintéticas cerca de ti y revisa servicios, horarios y precios antes de reservar.">
      <div class="explore-search">
        <span class="mdi mdi-magnify explore-search-icon" />
        <input
          v-model="search"
          type="search"
          placeholder="Busca por nombre o ubicación..."
          class="explore-search-input"
        />
        <button
          v-if="search"
          type="button"
          class="explore-search-clear"
          aria-label="Limpiar búsqueda"
          @click="search = ''"
        >
          <span class="mdi mdi-close" />
        </button>
      </div>
    </AppHero>

    <!-- ─── Filtros tipo chip group ─── -->
    <div v-if="allAmenities.length" class="explore-chips" aria-label="Filtrar por servicio">
      <button
        type="button"
        class="explore-chip"
        :class="{ 'is-active': !amenityFilter }"
        @click="amenityFilter = null"
      >
        Todos
      </button>
      <button
        v-for="am in allAmenities"
        :key="am"
        type="button"
        class="explore-chip"
        :class="{ 'is-active': amenityFilter === am }"
        @click="amenityFilter = amenityFilter === am ? null : am"
      >
        {{ am }}
      </button>
    </div>

    <div v-if="!loading && !fetchError" class="explore-count">
      {{ filtered.length }} negocio{{ filtered.length === 1 ? '' : 's' }} disponibles
    </div>

    <LoadingState v-if="loading" :count="6" :sm="6" :lg="4" />

    <ErrorState
      v-else-if="fetchError"
      message="No pudimos cargar los negocios. Verifica tu conexión e intenta de nuevo."
      @retry="loadBusinesses"
    />

    <AppGrid v-else-if="filtered.length" :min="280">
      <BusinessCard v-for="biz in filtered" :key="biz.id" :business="biz" />
    </AppGrid>

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
const { data: businesses, loading, error: fetchError, execute: loadBusinesses } =
  useAsyncState<any[]>(() => apiList<any>('/businesses'), [])
const search = ref('')
const amenityFilter = ref<string | null>(null)

const allAmenities = computed(() => {
  const set = new Set<string>()
  businesses.value.forEach((b) => (b.amenities ?? []).forEach((a: string) => set.add(a)))
  return [...set].sort().slice(0, 10)
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

onMounted(loadBusinesses)
</script>

<style scoped>
/* Buscador grande estilo marketplace (vive dentro del slot de AppHero) */
.explore-search {
  position: relative;
  display: flex;
  align-items: center;
  background: var(--bg-card);
  border: 1px solid var(--border-medium);
  border-radius: var(--radius-pill);
  padding: 6px 12px 6px 20px;
  box-shadow: var(--shadow-md);
  max-width: 540px;
}
.explore-search:focus-within {
  border-color: var(--green-bright);
  box-shadow: 0 0 0 4px var(--green-soft), var(--shadow-md);
}
.explore-search-icon { font-size: 1.3rem; color: var(--text-muted); flex-shrink: 0; }
.explore-search-input {
  flex: 1;
  border: none;
  outline: none;
  background: transparent;
  padding: 14px 8px;
  font-size: .95rem;
  font-family: 'Manrope', sans-serif;
  color: var(--text-primary);
  min-width: 0;
}
.explore-search-input::placeholder { color: var(--text-faint); }
.explore-search-input::-webkit-search-cancel-button { -webkit-appearance: none; }
.explore-search-clear {
  display: grid; place-items: center;
  width: 34px; height: 34px;
  border-radius: 50%;
  border: none;
  background: var(--bg-subtle);
  color: var(--text-muted);
  cursor: pointer;
  transition: background .2s ease;
}
.explore-search-clear:hover { background: var(--green-soft); color: var(--green-bright); }
.explore-search-clear .mdi { font-size: 1.1rem; }

/* Chips de filtro horizontal scroll en móvil */
.explore-chips {
  display: flex;
  gap: 8px;
  margin-bottom: 18px;
  overflow-x: auto;
  padding-bottom: 4px;
  -webkit-overflow-scrolling: touch;
  scrollbar-width: thin;
}
.explore-chip {
  flex-shrink: 0;
  border: 1px solid var(--border-soft);
  background: var(--bg-card);
  color: var(--text-muted);
  padding: 8px 16px;
  border-radius: 100px;
  font-size: .82rem;
  font-weight: 700;
  cursor: pointer;
  transition: border-color .2s ease, background .2s ease, color .2s ease;
}
.explore-chip:hover { border-color: var(--green-bright); color: var(--text-primary); }
.explore-chip.is-active {
  background: var(--green-soft);
  color: var(--green-bright);
  border-color: rgba(52, 198, 146, 0.42);
}

.explore-count {
  margin-bottom: 16px;
  font-size: .85rem;
  font-weight: 600;
  color: var(--text-muted);
}

@media (max-width: 600px) {
  .explore-search { padding: 4px 8px 4px 16px; }
  .explore-search-input { padding: 12px 4px; font-size: .9rem; }
}
</style>
