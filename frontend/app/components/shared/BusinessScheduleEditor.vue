<template>
  <div>
    <p class="text-body-2 text-medium-emphasis mb-3">
      Activa cada día y define su horario de apertura y cierre.
    </p>
    <v-row dense>
      <v-col v-for="day in days" :key="day.value" cols="12">
        <v-card
          :variant="local[day.value].isOpen ? 'outlined' : 'tonal'"
          rounded="lg"
          class="mb-1"
        >
          <v-card-text class="pa-3">
            <div class="d-flex align-center gap-3 flex-wrap">

              <!-- Toggle abierto/cerrado -->
              <v-switch
                v-model="local[day.value].isOpen"
                color="primary"
                density="compact"
                hide-details
              />

              <span
                class="text-body-2 font-weight-medium"
                style="min-width: 88px"
                :class="!local[day.value].isOpen ? 'text-medium-emphasis' : ''"
              >
                {{ day.label }}
              </span>

              <template v-if="local[day.value].isOpen">
                <v-text-field
                  v-model="local[day.value].openTime"
                  type="time"
                  label="Apertura"
                  hide-details
                  density="compact"
                  style="max-width: 140px"
                />
                <span class="text-medium-emphasis px-1">—</span>
                <v-text-field
                  v-model="local[day.value].closeTime"
                  type="time"
                  label="Cierre"
                  hide-details
                  density="compact"
                  style="max-width: 140px"
                />
              </template>

              <span v-else class="text-caption text-medium-emphasis">
                Cerrado
              </span>
            </div>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>
  </div>
</template>

<script setup lang="ts">
type DaySchedule = {
  dayOfWeek: string
  openTime: string
  closeTime: string
  isOpen: boolean
}

const props = defineProps<{
  modelValue: DaySchedule[]
}>()

const emit = defineEmits<{
  'update:modelValue': [value: DaySchedule[]]
}>()

const days = [
  { label: 'Lunes',     value: 'monday'    },
  { label: 'Martes',    value: 'tuesday'   },
  { label: 'Miércoles', value: 'wednesday' },
  { label: 'Jueves',    value: 'thursday'  },
  { label: 'Viernes',   value: 'friday'    },
  { label: 'Sábado',    value: 'saturday'  },
  { label: 'Domingo',   value: 'sunday'    },
]

// ── Estado interno por día ─────────────────────────────────────────────────
// Objeto plano reactivo para acceso directo O(1) en el template
const local = reactive<Record<string, DaySchedule>>(
  Object.fromEntries(
    days.map(d => [d.value, {
      dayOfWeek: d.value,
      openTime:  '08:00',
      closeTime: '22:00',
      isOpen:    false,
    }])
  )
)

// ── Inicializar UNA sola vez al montar (el padre usa :key para forzar remount)
onMounted(() => {
  for (const s of props.modelValue) {
    if (local[s.dayOfWeek]) {
      local[s.dayOfWeek].openTime  = s.openTime.slice(0, 5)
      local[s.dayOfWeek].closeTime = s.closeTime.slice(0, 5)
      local[s.dayOfWeek].isOpen    = s.isOpen
    }
  }
})

// ── Emitir cambios al padre cuando el usuario edita ────────────────────────
watch(
  local,
  () => {
    emit('update:modelValue', days.map(d => ({ ...local[d.value] })))
  },
  { deep: true }
)
</script>
