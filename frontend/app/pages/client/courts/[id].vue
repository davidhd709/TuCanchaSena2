<template>
  <div>
    <v-btn
      to="/client/courts"
      variant="text"
      prepend-icon="mdi-arrow-left"
      class="mb-4 px-0"
    >
      Volver a Canchas
    </v-btn>

    <div v-if="loading" class="d-flex justify-center py-16">
      <v-progress-circular indeterminate color="primary" size="48" />
    </div>

    <template v-else-if="court">
      <!-- Court header -->
      <v-row class="mb-6">
        <v-col cols="12" md="7">
          <div
            class="rounded-lg d-flex align-center justify-center mb-4"
            style="height:220px; background: linear-gradient(135deg,#e8f5e9,#c8e6c9)"
          >
            <v-icon size="96" color="success">mdi-soccer-field</v-icon>
          </div>
        </v-col>
        <v-col cols="12" md="5">
          <div class="d-flex flex-wrap gap-2 mb-3">
            <v-chip color="primary" variant="tonal">{{ courtTypeLabel(court.type) }}</v-chip>
            <v-chip
              :color="court.status === 'available' ? 'success' : 'warning'"
              variant="tonal"
            >
              {{ court.status === 'available' ? 'Disponible' : 'No disponible' }}
            </v-chip>
          </div>
          <h1 class="text-h5 font-weight-bold mb-1">{{ court.name }}</h1>
          <p class="text-body-2 text-medium-emphasis mb-4">
            <v-icon size="14">mdi-store</v-icon> {{ court.business?.name }}
            <template v-if="court.business?.city">
              · <v-icon size="14">mdi-map-marker</v-icon> {{ court.business.city }}
            </template>
          </p>
          <!-- Descripción enriquecida (HTML del editor WYSIWYG) -->
          <div
            v-if="court.description"
            class="prose-content text-body-2 mb-4"
            v-html="court.description"
          />
          <v-row dense class="mb-4">
            <v-col cols="6">
              <v-card variant="tonal" color="primary" rounded="lg" class="pa-3 text-center">
                <div class="text-h6 font-weight-bold">${{ Number(court.pricePerHour).toLocaleString('es-CO') }}</div>
                <div class="text-caption">por hora</div>
              </v-card>
            </v-col>
            <v-col cols="6">
              <v-card variant="tonal" color="success" rounded="lg" class="pa-3 text-center">
                <div class="text-h6 font-weight-bold">{{ court.capacity }}</div>
                <div class="text-caption">jugadores</div>
              </v-card>
            </v-col>
          </v-row>
        </v-col>
      </v-row>

      <!-- Date picker & slot selector -->
      <v-card rounded="lg" class="mb-6">
        <v-card-title class="text-subtitle-1 font-weight-bold pa-5 pb-3">
          Seleccionar fecha y horario
        </v-card-title>
        <v-card-text class="px-5 pb-5">
          <v-row>
            <v-col cols="12" sm="5">
              <v-text-field
                v-model="selectedDate"
                label="Fecha"
                type="date"
                :min="today"
                prepend-inner-icon="mdi-calendar"
                @update:model-value="loadSlots"
              />
            </v-col>
          </v-row>

          <div v-if="slotsLoading" class="d-flex align-center gap-2 py-4">
            <v-progress-circular size="20" indeterminate color="primary" />
            <span class="text-body-2 text-medium-emphasis">Cargando horarios...</span>
          </div>

          <template v-else-if="slots.length > 0">
            <p class="text-body-2 font-weight-medium mb-3">Horarios disponibles:</p>
            <div class="d-flex flex-wrap gap-2 mb-4">
              <v-card
                v-for="slot in slots"
                :key="slot.startTime"
                :variant="isSelected(slot) ? 'flat' : 'outlined'"
                :color="!slot.isAvailable ? 'grey' : isSelected(slot) ? 'primary' : undefined"
                rounded="lg"
                :class="['cursor-pointer', !slot.isAvailable ? 'opacity-50' : '']"
                style="min-width:160px"
                @click="slot.isAvailable && toggleSlot(slot)"
              >
                <v-card-text class="pa-3 text-center">
                  <v-icon
                    size="16"
                    :color="!slot.isAvailable ? 'grey' : isSelected(slot) ? 'white' : 'primary'"
                    class="mb-1"
                  >
                    {{ slot.isAvailable ? 'mdi-clock-outline' : 'mdi-clock-remove' }}
                  </v-icon>
                  <div
                    class="text-body-2 font-weight-bold"
                    :class="isSelected(slot) ? 'text-white' : ''"
                  >
                    {{ slot.startTime }} – {{ slot.endTime }}
                  </div>
                  <!-- Effective price: slot price if set, else court base price -->
                  <div
                    class="text-caption mt-1"
                    :class="isSelected(slot) ? 'text-white' : effectivePrice(slot) !== Number(court.pricePerHour) ? 'text-warning' : 'text-medium-emphasis'"
                  >
                    ${{ effectivePrice(slot).toLocaleString('es-CO') }}/hr
                    <span v-if="effectivePrice(slot) !== Number(court.pricePerHour)">★</span>
                  </div>
                  <div
                    v-if="!slot.isAvailable"
                    class="text-caption text-error mt-1"
                  >
                    No disponible
                  </div>
                </v-card-text>
              </v-card>
            </div>

            <!-- Legend for custom prices -->
            <div
              v-if="slots.some(s => s.pricePerHour !== null && s.pricePerHour !== undefined)"
              class="text-caption text-medium-emphasis mb-3"
            >
              ★ Precio especial para este horario
            </div>

            <div v-if="selectedSlots.length > 0">
              <v-alert type="success" variant="tonal" rounded="lg">
                <div class="d-flex align-center justify-space-between flex-wrap gap-2">
                  <div>
                    <strong>{{ selectedSlots.length }}</strong> hora{{ selectedSlots.length > 1 ? 's' : '' }} seleccionada{{ selectedSlots.length > 1 ? 's' : '' }}
                    · Total estimado: <strong>${{ totalSelected.toLocaleString('es-CO') }}</strong>
                  </div>
                  <v-btn color="success" variant="flat" size="small" @click="goToBook">
                    Reservar ahora
                  </v-btn>
                </div>
              </v-alert>
            </div>
          </template>

          <v-alert
            v-else-if="selectedDate && !slotsLoading"
            type="warning"
            variant="tonal"
            rounded="lg"
          >
            No hay horarios disponibles para esta fecha.
          </v-alert>
        </v-card-text>
      </v-card>
    </template>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: 'dashboard', middleware: 'auth' })

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

<style>
/* Estilos para contenido enriquecido de la cancha (mismo que el editor) */
.prose-content h1 { font-size: 1.5rem; font-weight: 700; margin: .6em 0 .3em; }
.prose-content h2 { font-size: 1.25rem; font-weight: 700; margin: .5em 0 .25em; }
.prose-content h3 { font-size: 1.05rem; font-weight: 600; margin: .5em 0 .2em; }
.prose-content p  { margin: .4em 0; }
.prose-content ul, .prose-content ol { padding-left: 1.5em; margin: .4em 0; }
.prose-content li { margin: .2em 0; }
.prose-content blockquote {
  border-left: 4px solid rgba(var(--v-theme-primary), .5);
  margin: .5em 0; padding: .25em .75em;
  color: rgba(0,0,0,.6); font-style: italic;
}
.prose-content code {
  background: rgba(0,0,0,.07); border-radius: 4px;
  padding: 1px 5px; font-family: monospace; font-size: .85em;
}
.prose-content pre {
  background: rgba(0,0,0,.06); border-radius: 6px;
  padding: .75em 1em; overflow-x: auto; margin: .5em 0;
}
.prose-content pre code { background: none; padding: 0; }
.prose-content hr { border: none; border-top: 2px solid rgba(0,0,0,.12); margin: .75em 0; }
.prose-content a  { color: rgb(var(--v-theme-primary)); text-decoration: underline; }
.prose-content img { max-width: 100%; height: auto; border-radius: 6px; margin: .5em 0; }
.prose-content table { width: 100%; border-collapse: collapse; margin: .5em 0; font-size: .875rem; }
.prose-content th, .prose-content td {
  border: 1px solid rgba(0,0,0,.18); padding: 6px 10px; text-align: left;
}
.prose-content th { background: rgba(var(--v-theme-primary), .08); font-weight: 600; }
.prose-content tr:nth-child(even) td { background: rgba(0,0,0,.02); }
</style>
