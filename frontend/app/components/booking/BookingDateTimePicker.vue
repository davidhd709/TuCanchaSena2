<template>
  <v-card rounded="lg" class="mb-6">
    <v-card-title class="text-subtitle-1 font-weight-bold pa-5 pb-3">
      <v-icon class="mr-2" color="primary">mdi-calendar-clock</v-icon>
      Seleccionar fecha y horario
    </v-card-title>
    <v-card-text class="px-5 pb-5">

      <!-- Date picker -->
      <v-row>
        <v-col cols="12" sm="5">
          <v-text-field
            v-model="selectedDate"
            label="Fecha de la reserva"
            type="date"
            :min="today"
            prepend-inner-icon="mdi-calendar"
            variant="outlined"
            density="comfortable"
            @update:model-value="onDateChange"
          />
        </v-col>
      </v-row>

      <!-- Loading slots -->
      <div v-if="slotsLoading" class="d-flex align-center gap-2 py-4">
        <v-progress-circular size="20" width="2" indeterminate color="primary" />
        <span class="text-body-2 text-medium-emphasis">Cargando horarios disponibles...</span>
      </div>

      <!-- Slots grid -->
      <template v-else-if="slots.length > 0">
        <p class="text-body-2 font-weight-medium mb-3">Horarios disponibles:</p>
        <div class="d-flex flex-wrap gap-2 mb-4">
          <v-card
            v-for="slot in slots"
            :key="slot.startTime"
            :variant="isSelected(slot) ? 'flat' : 'outlined'"
            :color="!slot.isAvailable ? 'grey' : isSelected(slot) ? 'primary' : undefined"
            rounded="lg"
            :class="['cursor-pointer transition-card', !slot.isAvailable ? 'opacity-50' : '']"
            style="min-width: 150px"
            :ripple="slot.isAvailable"
            @click="slot.isAvailable && toggleSlot(slot)"
          >
            <v-card-text class="pa-3 text-center">
              <v-icon
                size="16"
                :color="!slot.isAvailable ? 'grey' : isSelected(slot) ? 'white' : 'primary'"
                class="mb-1"
              >
                {{ slot.isAvailable ? 'mdi-clock-outline' : 'mdi-clock-remove-outline' }}
              </v-icon>
              <div
                class="text-body-2 font-weight-bold"
                :class="isSelected(slot) ? 'text-white' : ''"
              >
                {{ slot.startTime }} – {{ slot.endTime }}
              </div>
              <div
                class="text-caption mt-1"
                :class="
                  isSelected(slot)
                    ? 'text-white'
                    : effectivePrice(slot) !== pricePerHour
                    ? 'text-warning'
                    : 'text-medium-emphasis'
                "
              >
                ${{ effectivePrice(slot).toLocaleString('es-CO') }}/hr
                <span v-if="effectivePrice(slot) !== pricePerHour">★</span>
              </div>
              <div v-if="!slot.isAvailable" class="text-caption text-error mt-1">
                No disponible
              </div>
              <v-icon
                v-if="isSelected(slot)"
                size="14"
                color="white"
                class="mt-1"
              >mdi-check-circle</v-icon>
            </v-card-text>
          </v-card>
        </div>

        <!-- Leyenda precio especial -->
        <div
          v-if="slots.some((s) => s.pricePerHour != null && s.pricePerHour !== props.pricePerHour)"
          class="text-caption text-medium-emphasis mb-3"
        >
          ★ Precio especial para este horario
        </div>

        <!-- Resumen selección -->
        <v-alert
          v-if="selectedSlots.length > 0"
          type="success"
          variant="tonal"
          rounded="lg"
          class="mt-2"
        >
          <div class="d-flex align-center justify-space-between flex-wrap gap-2">
            <div>
              <strong>{{ selectedSlots.length }}</strong>
              hora{{ selectedSlots.length > 1 ? 's' : '' }} seleccionada{{ selectedSlots.length > 1 ? 's' : '' }}
              · Total estimado:
              <strong>${{ totalSelected.toLocaleString('es-CO') }}</strong>
            </div>
            <v-btn color="success" variant="flat" size="small" @click="emitSelection">
              <v-icon start>mdi-calendar-check</v-icon>
              Reservar ahora
            </v-btn>
          </div>
        </v-alert>
      </template>

      <!-- No hay slots -->
      <v-alert
        v-else-if="selectedDate && !slotsLoading"
        type="warning"
        variant="tonal"
        rounded="lg"
      >
        <v-icon start>mdi-calendar-remove</v-icon>
        No hay horarios disponibles para esta fecha. Intenta con otro día o consulta otro horario.
      </v-alert>

      <!-- Sin fecha seleccionada -->
      <v-alert
        v-else-if="!selectedDate"
        type="info"
        variant="tonal"
        rounded="lg"
      >
        <v-icon start>mdi-calendar-question</v-icon>
        Selecciona una fecha para ver los horarios disponibles.
      </v-alert>

      <!-- Error al cargar slots -->
      <v-alert
        v-if="slotsError"
        type="error"
        variant="tonal"
        rounded="lg"
        class="mt-3"
        closable
        @click:close="slotsError = ''"
      >
        {{ slotsError }}
      </v-alert>

    </v-card-text>
  </v-card>
</template>

<script setup lang="ts">
/**
 * BookingDateTimePicker
 * Selector de fecha y slots disponibles para el flujo de reserva.
 *
 * Props:
 *   - courtId: ID de la cancha
 *   - pricePerHour: precio base de la cancha (para calcular totales)
 *   - initialDate: fecha pre-seleccionada (ej: cuando volvemos del book tras un 409)
 *
 * Emite:
 *   - slot-selected: { date, startTime, endTime, totalPrice }
 */

interface Slot {
  startTime: string
  endTime: string
  isAvailable: boolean
  pricePerHour?: number | null
}

interface SlotSelectedPayload {
  date: string
  startTime: string
  endTime: string
  totalPrice: number
}

const props = defineProps<{
  courtId: string
  pricePerHour: number
  initialDate?: string
}>()

const emit = defineEmits<{
  (e: 'slot-selected', payload: SlotSelectedPayload): void
}>()

const { apiFetch } = useApi()

const selectedDate = ref(props.initialDate ?? '')
const slots = ref<Slot[]>([])
const selectedSlots = ref<Slot[]>([])
const slotsLoading = ref(false)
const slotsError = ref('')

const today = new Date().toISOString().split('T')[0]

// —— Helpers ——

const effectivePrice = (slot: Slot): number => {
  if (slot.pricePerHour !== null && slot.pricePerHour !== undefined) {
    return Number(slot.pricePerHour)
  }
  return props.pricePerHour
}

const isSelected = (slot: Slot) =>
  selectedSlots.value.some((s) => s.startTime === slot.startTime)

const totalSelected = computed(() =>
  selectedSlots.value.reduce((sum, s) => sum + effectivePrice(s), 0),
)

// —— Acciones ——

const toggleSlot = (slot: Slot) => {
  const idx = selectedSlots.value.findIndex((s) => s.startTime === slot.startTime)
  if (idx !== -1) {
    selectedSlots.value.splice(idx, 1)
  } else {
    selectedSlots.value.push(slot)
  }
}

const loadSlots = async () => {
  if (!selectedDate.value) return
  slotsLoading.value = true
  slotsError.value = ''
  selectedSlots.value = []
  try {
    const response = await apiFetch<{ slots: Slot[] }>(
      `/bookings/court/${props.courtId}/available-slots?date=${selectedDate.value}`,
    )
    slots.value = response.slots ?? []
  } catch {
    slotsError.value = 'No se pudieron cargar los horarios. Intenta de nuevo.'
    slots.value = []
  } finally {
    slotsLoading.value = false
  }
}

const onDateChange = () => {
  loadSlots()
}

const emitSelection = () => {
  if (!selectedSlots.value.length) return
  const sorted = [...selectedSlots.value].sort((a, b) =>
    a.startTime.localeCompare(b.startTime),
  )
  emit('slot-selected', {
    date: selectedDate.value,
    startTime: sorted[0].startTime,
    endTime: sorted[sorted.length - 1].endTime,
    totalPrice: totalSelected.value,
  })
}

/** Permite refrescar slots externamente (ej. tras un error 409) */
const refresh = () => {
  if (selectedDate.value) loadSlots()
}

defineExpose({ refresh })

// Cargar si ya viene fecha inicial (ej. desde query param al volver de book.vue)
onMounted(() => {
  if (selectedDate.value) loadSlots()
})
</script>

<style scoped>
.transition-card {
  transition: transform 0.15s ease, box-shadow 0.15s ease;
}
.transition-card:hover:not(.opacity-50) {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.12);
}
</style>
