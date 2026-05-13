<template>
  <div>
    <div class="d-flex align-center mb-6">
      <div>
        <h1 class="text-h5 font-weight-bold">Explorar Canchas</h1>
        <p class="text-body-2 text-medium-emphasis">Encuentra y reserva la cancha perfecta</p>
      </div>
    </div>

    <!-- Filters -->
    <v-row class="mb-4" dense>
      <v-col cols="12" sm="5">
        <v-text-field
          v-model="search"
          placeholder="Buscar por nombre o negocio..."
          prepend-inner-icon="mdi-magnify"
          clearable
          hide-details
        />
      </v-col>
      <v-col cols="12" sm="4">
        <v-select
          v-model="typeFilter"
          :items="courtTypes"
          label="Tipo de cancha"
          clearable
          hide-details
        />
      </v-col>
      <v-col cols="12" sm="3">
        <v-select
          v-model="sortBy"
          :items="sortOptions"
          label="Ordenar por"
          hide-details
        />
      </v-col>
    </v-row>

    <v-row>
      <v-col v-for="court in filteredCourts" :key="court.id" cols="12" sm="6" lg="4">
        <v-card rounded="lg" hover class="h-100 d-flex flex-column">
          <div
            class="d-flex align-center justify-center bg-success-lighten-4"
            style="height:140px; background: linear-gradient(135deg,#e8f5e9,#c8e6c9)"
          >
            <v-icon size="64" color="success">mdi-soccer-field</v-icon>
          </div>
          <v-card-text class="pa-4 flex-1-1">
            <div class="d-flex align-center justify-space-between mb-1">
              <h3 class="text-subtitle-2 font-weight-bold">{{ court.name }}</h3>
              <v-chip color="primary" size="x-small" variant="tonal">
                {{ courtTypeLabel(court.type) }}
              </v-chip>
            </div>
            <p class="text-caption text-medium-emphasis mb-2">
              <v-icon size="12">mdi-store</v-icon> {{ court.business?.name }}
              <template v-if="court.business?.city">
                · <v-icon size="12">mdi-map-marker</v-icon> {{ court.business.city }}
              </template>
            </p>
            <p class="text-body-2 text-medium-emphasis mb-3 line-clamp-2">
              {{ court.description || 'Cancha disponible para reservar' }}
            </p>
            <div class="d-flex align-center justify-space-between">
              <div class="text-h6 font-weight-bold text-primary">
                ${{ Number(court.pricePerHour).toLocaleString('es-CO') }}
                <span class="text-caption font-weight-regular text-medium-emphasis">/hora</span>
              </div>
              <div class="text-caption text-medium-emphasis">
                <v-icon size="14">mdi-account-group</v-icon>
                {{ court.capacity }} jugadores
              </div>
            </div>
          </v-card-text>
          <v-divider />
          <v-card-actions class="pa-3">
            <v-btn
              :to="`/client/courts/${court.id}`"
              color="primary"
              variant="tonal"
              block
              prepend-icon="mdi-calendar-plus"
            >
              Ver disponibilidad
            </v-btn>
          </v-card-actions>
        </v-card>
      </v-col>

      <v-col v-if="loading" cols="12" class="text-center py-10">
        <v-progress-circular indeterminate color="primary" />
      </v-col>
      <v-col v-if="!loading && filteredCourts.length === 0" cols="12">
        <v-alert type="info" variant="tonal" rounded="lg">
          No se encontraron canchas con los filtros aplicados.
        </v-alert>
      </v-col>
    </v-row>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: 'dashboard', middleware: 'auth' })

const { apiFetch } = useApi()
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
  { title: 'Fútbol Playa', value: 'beach_soccer' },
  { title: 'Mini Fútbol', value: 'mini_football' },
]

const sortOptions = [
  { title: 'Nombre', value: 'name' },
  { title: 'Precio (menor)', value: 'price_asc' },
  { title: 'Precio (mayor)', value: 'price_desc' },
]

const courtTypeLabel = (type: string) => courtTypes.find(t => t.value === type)?.title ?? type

const filteredCourts = computed(() => {
  let result = [...courts.value]
  if (search.value) {
    const q = search.value.toLowerCase()
    result = result.filter(c =>
      c.name.toLowerCase().includes(q) ||
      c.business?.name?.toLowerCase().includes(q)
    )
  }
  if (typeFilter.value) {
    result = result.filter(c => c.type === typeFilter.value)
  }
  if (sortBy.value === 'name') result.sort((a, b) => a.name.localeCompare(b.name))
  if (sortBy.value === 'price_asc') result.sort((a, b) => a.pricePerHour - b.pricePerHour)
  if (sortBy.value === 'price_desc') result.sort((a, b) => b.pricePerHour - a.pricePerHour)
  return result
})

onMounted(async () => {
  loading.value = true
  try { courts.value = await apiFetch<any[]>('/courts') }
  finally { loading.value = false }
})
</script>
