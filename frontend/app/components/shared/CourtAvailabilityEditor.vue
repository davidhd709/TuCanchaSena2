<template>
  <div class="court-avail">
    <!-- Callout precio base -->
    <div class="schedule-info-callout">
      <span class="mdi mdi-information-outline" />
      <span>
        <strong>Precio base de la cancha: ${{ Number(courtBasePrice).toLocaleString('es-CO') }}/hr.</strong>
        Los horarios sin precio propio usarán este valor.
      </span>
    </div>

    <!-- Una card por día -->
    <div
      v-for="day in days"
      :key="day.value"
      class="schedule-day-card"
      :class="{ 'is-closed': !isBusinessOpen(day.value) }"
    >
      <div class="schedule-day-header">
        <div class="schedule-day-title">
          <span class="schedule-day-name">{{ day.label }}</span>
          <span v-if="isBusinessOpen(day.value)" class="schedule-day-sub">
            Horario del negocio: {{ businessHours(day.value) }}
          </span>
        </div>

        <!-- Negocio cerrado: sin acciones -->
        <span v-if="!isBusinessOpen(day.value)" class="schedule-day-closed">
          <span class="mdi mdi-store-off-outline" /> Negocio cerrado
        </span>
        <!-- Agregar horario (acción secundaria discreta) -->
        <v-btn
          v-else
          class="schedule-add-btn"
          size="small"
          variant="text"
          color="primary"
          prepend-icon="mdi-plus"
          @click="addSlot(day.value)"
        >
          Agregar horario
        </v-btn>
      </div>

      <template v-if="isBusinessOpen(day.value)">
        <!-- Sin slots -->
        <p v-if="slotsForDay(day.value).length === 0" class="schedule-empty">
          Sin horarios definidos. Usa "Agregar horario" para crear el primero.
        </p>

        <!-- Slots -->
        <template v-for="slot in slotsForDay(day.value)" :key="slot._key">
          <div class="schedule-slot-row">
            <div class="schedule-slot-times">
              <input
                v-model="slot.startTime"
                type="time"
                class="schedule-slot-input"
                aria-label="Hora de inicio"
                @input="() => validateSlot(slot, day.value)"
              />
              <span class="schedule-slot-sep">—</span>
              <input
                v-model="slot.endTime"
                type="time"
                class="schedule-slot-input"
                aria-label="Hora de fin"
                @input="() => validateSlot(slot, day.value)"
              />
            </div>

            <div class="schedule-slot-price">
              <span class="schedule-slot-price-prefix">$</span>
              <input
                v-model="slot.pricePerHourInput"
                type="number"
                min="0"
                class="schedule-slot-price-input"
                :placeholder="Number(courtBasePrice).toLocaleString('es-CO')"
                aria-label="Precio por hora (opcional)"
              />
            </div>

            <span
              class="schedule-slot-tag"
              :class="{ 'is-custom': slot.pricePerHourInput !== '' && slot.pricePerHourInput !== null }"
            >
              {{
                (slot.pricePerHourInput !== '' && slot.pricePerHourInput !== null)
                  ? `$${Number(slot.pricePerHourInput).toLocaleString('es-CO')}`
                  : `$${Number(courtBasePrice).toLocaleString('es-CO')} base`
              }}
            </span>

            <div class="schedule-slot-actions">
              <v-tooltip :text="slot.isAvailable ? 'Disponible · clic para desactivar' : 'No disponible · clic para activar'">
                <template #activator="{ props: tp }">
                  <v-btn
                    v-bind="tp"
                    :icon="slot.isAvailable ? 'mdi-eye-outline' : 'mdi-eye-off-outline'"
                    :color="slot.isAvailable ? 'success' : 'grey'"
                    variant="text"
                    size="small"
                    @click="slot.isAvailable = !slot.isAvailable"
                  />
                </template>
              </v-tooltip>
              <v-btn
                icon="mdi-trash-can-outline"
                variant="text"
                color="error"
                size="small"
                @click="removeSlot(slot._key)"
              />
            </div>
          </div>

          <!-- Error de validación -->
          <v-alert
            v-if="slot._error"
            type="error"
            density="compact"
            variant="tonal"
            rounded="lg"
            class="mb-2"
          >
            {{ slot._error }}
          </v-alert>
        </template>
      </template>
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
