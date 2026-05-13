<template>
  <div>
    <!-- Precio base info -->
    <v-alert type="info" variant="tonal" rounded="lg" class="mb-4" density="compact">
      <div class="text-body-2">
        <strong>Precio base de la cancha:</strong>
        ${{ Number(courtBasePrice).toLocaleString('es-CO') }}/hr
        · Los slots sin precio propio usarán este valor.
      </div>
    </v-alert>

    <!-- Panel por día -->
    <div v-for="day in days" :key="day.value" class="mb-3">

      <!-- Negocio cerrado -->
      <v-card v-if="!isBusinessOpen(day.value)" variant="tonal" color="grey" rounded="lg">
        <v-card-text class="pa-3 d-flex align-center gap-3">
          <v-icon color="grey">mdi-store-off</v-icon>
          <span class="text-body-2 font-weight-medium" style="min-width:90px">
            {{ day.label }}
          </span>
          <span class="text-caption text-medium-emphasis">Negocio cerrado este día</span>
        </v-card-text>
      </v-card>

      <!-- Negocio abierto -->
      <v-card v-else variant="outlined" rounded="lg">
        <v-card-text class="pa-4">
          <!-- Cabecera del día -->
          <div class="d-flex align-center justify-space-between mb-3">
            <div class="d-flex align-center gap-2">
              <v-icon color="primary" size="18">mdi-calendar-check</v-icon>
              <span class="text-body-2 font-weight-bold">{{ day.label }}</span>
              <v-chip size="x-small" color="success" variant="tonal">
                Negocio: {{ businessHours(day.value) }}
              </v-chip>
            </div>
            <v-btn
              size="small"
              variant="tonal"
              color="primary"
              prepend-icon="mdi-plus"
              @click="addSlot(day.value)"
            >
              Agregar slot
            </v-btn>
          </div>

          <!-- Sin slots -->
          <div
            v-if="slotsForDay(day.value).length === 0"
            class="text-caption text-medium-emphasis py-1"
          >
            Sin slots definidos. Haz clic en "Agregar slot" para configurar horarios.
          </div>

          <!-- Lista de slots -->
          <div
            v-for="slot in slotsForDay(day.value)"
            :key="slot._key"
            class="mb-3"
          >
            <v-row dense class="align-center">
              <!-- Hora inicio -->
              <v-col cols="6" sm="2">
                <v-text-field
                  v-model="slot.startTime"
                  type="time"
                  label="Inicio"
                  hide-details
                  density="compact"
                  @update:model-value="() => validateSlot(slot, day.value)"
                />
              </v-col>

              <!-- Hora fin -->
              <v-col cols="6" sm="2">
                <v-text-field
                  v-model="slot.endTime"
                  type="time"
                  label="Fin"
                  hide-details
                  density="compact"
                  @update:model-value="() => validateSlot(slot, day.value)"
                />
              </v-col>

              <!-- Precio override -->
              <v-col cols="12" sm="3">
                <v-text-field
                  v-model="slot.pricePerHourInput"
                  type="number"
                  label="Precio/hr (opcional)"
                  hide-details
                  density="compact"
                  prefix="$"
                  :placeholder="`${Number(courtBasePrice).toLocaleString('es-CO')}`"
                  clearable
                  min="0"
                  @click:clear="slot.pricePerHourInput = ''"
                />
              </v-col>

              <!-- Precio efectivo -->
              <v-col cols="12" sm="3">
                <v-chip
                  size="small"
                  :color="slot.pricePerHourInput !== '' && slot.pricePerHourInput !== null ? 'warning' : 'primary'"
                  variant="tonal"
                >
                  <v-icon start size="13">mdi-currency-usd</v-icon>
                  {{
                    (slot.pricePerHourInput !== '' && slot.pricePerHourInput !== null)
                      ? `$${Number(slot.pricePerHourInput).toLocaleString('es-CO')}/hr (custom)`
                      : `$${Number(courtBasePrice).toLocaleString('es-CO')}/hr (base)`
                  }}
                </v-chip>
              </v-col>

              <!-- Toggle disponible -->
              <v-col cols="auto">
                <v-tooltip :text="slot.isAvailable ? 'Disponible' : 'No disponible'">
                  <template #activator="{ props: tp }">
                    <v-btn
                      v-bind="tp"
                      :icon="slot.isAvailable ? 'mdi-check-circle' : 'mdi-minus-circle'"
                      :color="slot.isAvailable ? 'success' : 'grey'"
                      variant="text"
                      size="small"
                      @click="slot.isAvailable = !slot.isAvailable"
                    />
                  </template>
                </v-tooltip>
              </v-col>

              <!-- Eliminar slot -->
              <v-col cols="auto">
                <v-btn
                  icon="mdi-close"
                  variant="text"
                  color="error"
                  size="small"
                  @click="removeSlot(slot._key)"
                />
              </v-col>
            </v-row>

            <!-- Error de validación -->
            <v-alert
              v-if="slot._error"
              type="error"
              density="compact"
              variant="tonal"
              rounded="lg"
              class="mt-1"
            >
              {{ slot._error }}
            </v-alert>
          </div>
        </v-card-text>
      </v-card>
    </div>
  </div>
</template>

<script setup lang="ts">
type RawSlot = {
  dayOfWeek: string
  startTime: string
  endTime: string
  isAvailable: boolean
  pricePerHour: number | null
}

type InternalSlot = RawSlot & {
  _key: number
  _error: string
  pricePerHourInput: string | number | null
}

const props = defineProps<{
  modelValue: RawSlot[]
  businessSchedules: Array<{
    dayOfWeek: string
    openTime: string
    closeTime: string
    isOpen: boolean
  }>
  courtBasePrice: number
}>()

const emit = defineEmits<{
  'update:modelValue': [value: RawSlot[]]
}>()

// ── Clave única por slot ───────────────────────────────────────────────────
let _keyCounter = 0
const nextKey = () => ++_keyCounter

// ── Estado interno ─────────────────────────────────────────────────────────
const slots = ref<InternalSlot[]>([])

// Inicializar UNA SOLA VEZ al montar el componente (el padre usa :key para forzar remount)
onMounted(() => {
  slots.value = props.modelValue.map(s => ({
    ...s,
    startTime: s.startTime.slice(0, 5),
    endTime:   s.endTime.slice(0, 5),
    _key:   nextKey(),
    _error: '',
    pricePerHourInput: s.pricePerHour !== null && s.pricePerHour !== undefined
      ? String(s.pricePerHour) : '',
  }))
})

// ── Emitir al padre cuando el usuario modifica los slots ───────────────────
watch(
  slots,
  (val) => {
    emit(
      'update:modelValue',
      val.map(({ _key, _error, pricePerHourInput, ...rest }) => ({
        ...rest,
        pricePerHour:
          pricePerHourInput !== '' && pricePerHourInput !== null
            ? Number(pricePerHourInput)
            : null,
      }))
    )
  },
  { deep: true }
)

// ── Constantes de días ─────────────────────────────────────────────────────
const days = [
  { label: 'Lunes',     value: 'monday'    },
  { label: 'Martes',    value: 'tuesday'   },
  { label: 'Miércoles', value: 'wednesday' },
  { label: 'Jueves',    value: 'thursday'  },
  { label: 'Viernes',   value: 'friday'    },
  { label: 'Sábado',    value: 'saturday'  },
  { label: 'Domingo',   value: 'sunday'    },
]

// ── Helpers de horario del negocio ─────────────────────────────────────────
const getBusinessSchedule = (day: string) =>
  props.businessSchedules.find(s => s.dayOfWeek === day)

const isBusinessOpen = (day: string) => getBusinessSchedule(day)?.isOpen ?? false

const businessOpenTime  = (day: string) =>
  getBusinessSchedule(day)?.openTime?.slice(0, 5)  ?? '00:00'
const businessCloseTime = (day: string) =>
  getBusinessSchedule(day)?.closeTime?.slice(0, 5) ?? '23:59'
const businessHours = (day: string) => {
  const s = getBusinessSchedule(day)
  if (!s) return '—'
  return `${s.openTime.slice(0, 5)} – ${s.closeTime.slice(0, 5)}`
}

// ── Slots por día ──────────────────────────────────────────────────────────
const slotsForDay = (day: string) =>
  slots.value.filter(s => s.dayOfWeek === day)

// ── Validación ─────────────────────────────────────────────────────────────
const toMin = (t: string) => {
  const [h, m] = t.split(':').map(Number)
  return h * 60 + m
}

const validateSlot = (slot: InternalSlot, day: string) => {
  slot._error = ''
  if (!slot.startTime || !slot.endTime) return

  const start   = toMin(slot.startTime)
  const end     = toMin(slot.endTime)
  const openMin  = toMin(businessOpenTime(day))
  const closeMin = toMin(businessCloseTime(day))

  if (end - start < 60) {
    slot._error = 'El slot debe ser de mínimo 1 hora.'; return
  }
  if (start < openMin) {
    slot._error = `Inicio no puede ser antes de la apertura del negocio (${businessOpenTime(day)}).`; return
  }
  if (end > closeMin) {
    slot._error = `Fin no puede superar el cierre del negocio (${businessCloseTime(day)}).`; return
  }
}

// ── Agregar / eliminar slots ───────────────────────────────────────────────
const addSlot = (day: string) => {
  const openTime = businessOpenTime(day)
  const [oh] = openTime.split(':').map(Number)
  const endTime  = `${String(oh + 1).padStart(2, '0')}:00`

  slots.value.push({
    dayOfWeek: day,
    startTime: openTime,
    endTime,
    isAvailable: true,
    pricePerHour: null,
    pricePerHourInput: '',
    _key:   nextKey(),
    _error: '',
  })
}

const removeSlot = (key: number) => {
  const idx = slots.value.findIndex(s => s._key === key)
  if (idx !== -1) slots.value.splice(idx, 1)
}
</script>
