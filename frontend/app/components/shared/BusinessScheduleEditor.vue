<template>
  <div class="sched">
    <p class="app-form-hint">Activa cada día y define su horario de apertura y cierre.</p>

    <div class="sched-list">
      <div
        v-for="day in days"
        :key="day.value"
        class="sched-row"
        :class="{ 'is-open': local[day.value].isOpen }"
      >
        <!-- Día + switch -->
        <label class="sched-day">
          <v-switch
            v-model="local[day.value].isOpen"
            color="primary"
            density="compact"
            hide-details
            inset
          />
          <span class="sched-day-name">{{ day.label }}</span>
        </label>

        <!-- Horarios o cerrado -->
        <div class="sched-times">
          <template v-if="local[day.value].isOpen">
            <input
              v-model="local[day.value].openTime"
              type="time"
              class="sched-time-input"
              aria-label="Apertura"
            />
            <span class="sched-sep">—</span>
            <input
              v-model="local[day.value].closeTime"
              type="time"
              class="sched-time-input"
              aria-label="Cierre"
            />
          </template>
          <span v-else class="sched-closed">Cerrado</span>
        </div>
      </div>
    </div>
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

<style scoped>
.sched-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.sched-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 8px 14px;
  background: var(--bg-elev);
  border: 1px solid var(--border-soft);
  border-radius: var(--radius-md);
  transition: border-color var(--transition-fast), background var(--transition-fast);
}
.sched-row.is-open { border-color: rgba(52, 198, 146, 0.28); }

.sched-day {
  display: flex;
  align-items: center;
  gap: 10px;
  cursor: pointer;
  min-width: 150px;
}
.sched-day-name {
  font-size: 0.92rem;
  font-weight: 700;
  color: var(--text-secondary);
}
.sched-row.is-open .sched-day-name { color: var(--text-primary); }

.sched-times {
  display: flex;
  align-items: center;
  gap: 8px;
}
.sched-time-input {
  background: var(--bg-card);
  border: 1px solid var(--border-medium);
  border-radius: var(--radius-sm);
  color: var(--text-primary);
  padding: 7px 10px;
  font-size: 0.88rem;
  font-family: 'Manrope', sans-serif;
  outline: none;
  transition: border-color var(--transition-fast), box-shadow var(--transition-fast);
  color-scheme: dark;
}
.sched-time-input:focus {
  border-color: var(--green-bright);
  box-shadow: 0 0 0 3px var(--green-soft);
}
.sched-sep { color: var(--text-faint); }
.sched-closed {
  font-size: 0.82rem;
  font-weight: 600;
  color: var(--text-faint);
}

/* Switch más compacto. */
.sched-day :deep(.v-switch) { flex: none; }
.sched-day :deep(.v-selection-control) { min-height: auto; }

@media (max-width: 600px) {
  .sched-row {
    flex-direction: column;
    align-items: stretch;
    gap: 10px;
  }
  .sched-day { min-width: 0; }
  .sched-times { justify-content: space-between; width: 100%; min-width: 0; gap: 6px; }
  .sched-time-input { flex: 1; min-width: 0; width: 100%; padding: 7px 6px; }
}
</style>
