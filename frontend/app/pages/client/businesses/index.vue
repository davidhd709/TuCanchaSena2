<template>
  <div>
    <!-- ─── Hero buscador ─── -->
    <section class="explore-hero">
      <div class="explore-hero-bg" aria-hidden="true" />
      <div class="explore-hero-content">
        <span class="explore-hero-eyebrow">Negocios deportivos</span>
        <h1 class="explore-hero-title">¿Dónde vas a jugar hoy?</h1>
        <p class="explore-hero-sub">
          Descubre canchas sintéticas cerca de ti y revisa servicios, horarios y precios antes de reservar.
        </p>
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
      </div>
    </section>

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
/* Hero buscador */
.explore-hero {
  position: relative;
  overflow: hidden;
  border-radius: 22px;
  padding: 36px 32px 32px;
  margin-bottom: 24px;
  background:
    radial-gradient(circle at 85% 25%, rgba(47, 161, 138, 0.18), transparent 50%),
    radial-gradient(circle at 12% 80%, rgba(31, 122, 103, 0.10), transparent 55%),
    linear-gradient(135deg, #f0fbf6 0%, #ffffff 100%);
  border: 1px solid var(--border-soft);
}
.explore-hero-content { position: relative; max-width: 720px; }
.explore-hero-eyebrow {
  display: inline-block;
  font-size: .76rem;
  font-weight: 800;
  color: var(--green-primary);
  background: var(--green-soft);
  padding: 4px 12px;
  border-radius: 100px;
  margin-bottom: 10px;
  letter-spacing: 0.04em;
  text-transform: uppercase;
}
.explore-hero-title {
  font-family: 'Sora', 'Manrope', sans-serif;
  font-weight: 800;
  letter-spacing: -0.02em;
  font-size: clamp(1.6rem, 3.3vw, 2.2rem);
  line-height: 1.15;
  color: var(--text-primary);
  margin-bottom: 8px;
}
.explore-hero-sub {
  font-size: .94rem;
  color: var(--text-muted);
  margin-bottom: 20px;
  max-width: 540px;
}

/* Buscador grande estilo marketplace */
.explore-search {
  position: relative;
  display: flex;
  align-items: center;
  background: #fff;
  border: 1px solid var(--border-soft);
  border-radius: 100px;
  padding: 6px 12px 6px 20px;
  box-shadow: var(--shadow-md);
  max-width: 540px;
}
.explore-search:focus-within {
  border-color: var(--green-primary);
  box-shadow: 0 0 0 4px rgba(31, 122, 103, 0.12), var(--shadow-md);
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
.explore-search-clear:hover { background: var(--green-soft); color: var(--green-primary); }
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
.explore-chip:hover { border-color: var(--green-primary); color: var(--text-primary); }
.explore-chip.is-active {
  background: var(--green-primary);
  color: #fff;
  border-color: var(--green-primary);
}

.explore-count {
  margin-bottom: 16px;
  font-size: .85rem;
  font-weight: 600;
  color: var(--text-muted);
}

.explore-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 20px;
}

@media (max-width: 960px) {
  .explore-grid { grid-template-columns: repeat(2, 1fr); gap: 16px; }
}
@media (max-width: 600px) {
  .explore-hero { padding: 24px 18px; }
  .explore-grid { grid-template-columns: 1fr; gap: 14px; }
  .explore-search { padding: 4px 8px 4px 16px; }
  .explore-search-input { padding: 12px 4px; font-size: .9rem; }
}
</style>
