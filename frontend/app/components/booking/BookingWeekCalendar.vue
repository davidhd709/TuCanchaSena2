<template>
  <div>
    <!-- ── Week navigation ─────────────────────────────────────────────────── -->
    <div class="d-flex align-center gap-2 mb-4 flex-wrap">
      <v-btn-group density="compact" variant="tonal" rounded="lg">
        <v-btn icon="mdi-chevron-left" aria-label="Semana anterior" @click="prevWeek" />
        <v-btn @click="goToToday" class="px-4">Hoy</v-btn>
        <v-btn icon="mdi-chevron-right" aria-label="Semana siguiente" @click="nextWeek" />
      </v-btn-group>

      <span class="text-subtitle-2 font-weight-medium ml-1">{{ weekRangeLabel }}</span>

      <v-spacer />

      <v-chip v-if="loading" size="small" variant="tonal" color="primary">
        <v-progress-circular size="12" width="2" indeterminate class="mr-2" />
        Cargando...
      </v-chip>
    </div>

    <!-- ── Status legend ───────────────────────────────────────────────────── -->
    <div class="cal-legend d-flex flex-wrap gap-2 mb-4">
      <v-chip
        v-for="s in statusLegend"
        :key="s.value"
        :color="s.color"
        class="cal-legend-chip"
        size="small"
        variant="flat"
        density="compact"
      >
        {{ s.label }}
      </v-chip>
    </div>

    <!-- ── Calendar card ──────────────────────────────────────────────────────
         En móvil queda dentro de un <details> colapsable (cerrado por default
         para reducir densidad). En tablet/desktop el CSS lo fuerza siempre
         visible y oculta el toggle. -->
    <details class="cal-wrapper">
      <summary class="cal-wrapper-toggle">
        <span class="mdi mdi-calendar-month-outline" />
        <span>Ver calendario semanal</span>
        <span class="cal-wrapper-caret mdi mdi-chevron-down" />
      </summary>
      <v-card rounded="lg" class="overflow-hidden">

        <!-- Day header row -->
        <div class="cal-header d-flex">
          <div class="cal-time-col" />
          <div
            v-for="day in weekDays"
            :key="day.iso"
            class="cal-day-header flex-1-1 text-center pa-2"
            :class="{ 'cal-day-header--today': day.isToday }"
          >
            <div class="text-caption text-medium-emphasis text-uppercase">{{ day.dayName }}</div>
            <div class="mt-1 d-flex justify-center">
              <v-avatar
                v-if="day.isToday"
                color="primary"
                size="28"
                class="text-body-2 font-weight-bold"
              >
                {{ day.dayNum }}
              </v-avatar>
              <span v-else class="text-body-2 font-weight-bold">{{ day.dayNum }}</span>
            </div>
            <div class="text-caption text-medium-emphasis">{{ day.monthShort }}</div>
          </div>
        </div>

        <v-divider />

        <!-- Scrollable body -->
        <div ref="calBodyRef" class="cal-body" style="overflow-y: auto; max-height: 620px; overflow-x: auto">
          <div class="d-flex" :style="`min-width: 640px; height: ${totalCalHeight}px; position: relative`">

            <!-- Time labels column -->
            <div class="cal-time-col" style="position: relative; flex-shrink: 0">
              <div
                v-for="h in gridHours"
                :key="h"
                class="text-caption text-right pr-2 cal-time-label"
                :style="{ top: `${(h - START_HOUR) * HOUR_HEIGHT - 8}px`, width: '52px' }"
              >
                {{ String(h).padStart(2, '0') }}:00
              </div>
            </div>

            <!-- Day columns -->
            <div
              v-for="day in weekDays"
              :key="day.iso"
              class="cal-day-col flex-1-1"
              :class="{ 'cal-today-bg': day.isToday }"
              style="position: relative; min-width: 80px"
            >
              <!-- Full-hour lines -->
              <div
                v-for="h in gridHours"
                :key="'h' + h"
                :style="`position: absolute; top: ${(h - START_HOUR) * HOUR_HEIGHT}px; left: 0; right: 0;
                         border-top: 1px solid rgba(255,255,255,${h % 2 === 0 ? '.08' : '.04'})`"
              />
              <!-- Half-hour dashed lines -->
              <div
                v-for="h in gridHours"
                :key="'hh' + h"
                :style="`position: absolute; top: ${(h - START_HOUR) * HOUR_HEIGHT + HOUR_HEIGHT / 2}px; left: 0; right: 0;
                         border-top: 1px dashed rgba(255,255,255,.045)`"
              />

              <!-- Booking blocks -->
              <div
                v-for="b in laidOutBookings(day.iso ?? '')"
                :key="b.id"
                class="booking-block"
                :class="`booking-${b.status}`"
                :style="bookingBlockStyle(b)"
                role="button"
                tabindex="0"
                :aria-label="`Reserva de ${b.user?.firstName ?? ''} ${b.user?.lastName ?? ''} en ${b.court?.name ?? 'cancha'}, ${(b.startTime ?? '').slice(0,5)}–${(b.endTime ?? '').slice(0,5)}`"
                @click="emit('select', b)"
                @keydown.enter.space.prevent="emit('select', b)"
              >
                <div class="booking-title text-caption font-weight-bold text-truncate">
                  {{ b.court?.name ?? 'Cancha' }}
                </div>
                <div class="booking-time text-caption">
                  {{ b.startTime.slice(0, 5) }}–{{ b.endTime.slice(0, 5) }}
                </div>
                <div class="booking-client text-caption text-truncate">
                  <v-icon size="9" style="vertical-align: middle">mdi-account</v-icon>
                  {{ b.user?.firstName ?? '' }} {{ b.user?.lastName ?? '' }}
                </div>
              </div>

              <!-- Current time indicator -->
              <template v-if="day.isToday && currentTimeTop !== null">
                <div
                  class="current-time-line"
                  :style="`position: absolute; top: ${currentTimeTop}px; left: 0; right: 0; height: 2px;
                           background: #f44336; z-index: 3; pointer-events: none`"
                >
                  <div style="position: absolute; left: -4px; top: -4px; width: 10px; height: 10px;
                               border-radius: 50%; background: #f44336" />
                </div>
              </template>
            </div>
          </div>
        </div>
      </v-card>
    </details>
  </div>
</template>

<script setup lang="ts">
/**
 * BookingWeekCalendar — vista de calendario semanal de reservas (panel negocio).
 * Presentacional: recibe las reservas a mostrar y emite `select` al hacer click
 * sobre un bloque. La lógica de semana/grilla/lanes vive en useWeekCalendar.
 */
const props = defineProps<{
  bookings: any[]
  loading?: boolean
}>()

const emit = defineEmits<{
  (e: 'select', booking: any): void
}>()

const {
  calBodyRef,
  weekDays,
  weekRangeLabel,
  gridHours,
  totalCalHeight,
  currentTimeTop,
  prevWeek,
  nextWeek,
  goToToday,
  laidOutBookings,
  bookingBlockStyle,
  START_HOUR,
  HOUR_HEIGHT,
} = useWeekCalendar(() => props.bookings)

// Leyenda de colores (alineada con los colores de los bloques del calendario).
const statusLegend = [
  { value: 'pending', label: 'Pendiente', color: 'primary' },
  { value: 'confirmed', label: 'Confirmada', color: 'success' },
  { value: 'completed', label: 'Completada', color: 'info' },
  { value: 'cancelled', label: 'Cancelada', color: 'error' },
  { value: 'no_show', label: 'No Show', color: 'secondary' },
]
</script>

<style scoped>
/* ── Calendar layout ─────────────────────────────────────────────────────── */
.cal-time-col {
  width: 56px;
  flex-shrink: 0;
}

.cal-time-label {
  position: absolute;
  line-height: 1;
  color: var(--text-muted);
}

.cal-header {
  border-bottom: 1px solid var(--border-soft);
  background: linear-gradient(180deg, rgba(27, 33, 42, .96), rgba(23, 28, 35, .96));
}

.cal-day-header {
  min-width: 80px;
  border-left: 1px solid var(--border-soft);
}

.cal-today-bg {
  background: linear-gradient(180deg, rgba(47, 161, 138, .12), rgba(47, 161, 138, .04));
}

.cal-day-header--today {
  background: linear-gradient(180deg, rgba(47, 161, 138, .2), rgba(47, 161, 138, .08)) !important;
  box-shadow: inset 0 -1px 0 rgba(88, 214, 141, .2);
}

.cal-legend {
  row-gap: 8px;
}

.cal-legend-chip {
  min-height: 28px !important;
  padding-inline: 10px !important;
  border: 1px solid rgba(47, 161, 138, .22) !important;
  font-size: .72rem !important;
  font-weight: 700 !important;
  letter-spacing: .02em;
}

/* ── Booking blocks ──────────────────────────────────────────────────────── */
.booking-block {
  position: absolute;
  border-radius: 6px;
  padding: 3px 6px;
  cursor: pointer;
  overflow: hidden;
  border-left: 3px solid transparent;
  transition: filter .15s, transform .1s;
  box-sizing: border-box;
}

.booking-block:hover {
  filter: brightness(0.92);
  transform: scale(1.015);
  z-index: 4 !important;
}

/* Colores de bloque alineados con BookingStatusChip (mismo "idioma" visual). */
.booking-pending {
  background: var(--accent-warning-soft);
  border-left-color: var(--accent-warning);
  color: #f5d28a;
}
.booking-confirmed {
  background: var(--green-soft);
  border-left-color: var(--green-bright);
  color: #86efac;
}
.booking-completed {
  background: var(--accent-info-soft);
  border-left-color: var(--accent-info);
  color: #93c5fd;
}
.booking-cancelled,
.booking-rejected {
  background: var(--accent-error-soft);
  border-left-color: var(--accent-error);
  color: #fca5a5;
  opacity: .8;
}
.booking-no_show {
  background: var(--accent-neutral-soft);
  border-left-color: var(--accent-neutral);
  color: #cbd5e1;
}
.booking-expired {
  background: rgba(100, 116, 139, .18);
  border-left-color: #64748b;
  color: #94a3b8;
}

.booking-title {
  line-height: 1.3;
  font-size: 11px !important;
}
.booking-time {
  font-size: 10px !important;
  opacity: .85;
}
.booking-client {
  font-size: 10px !important;
  opacity: .75;
  margin-top: 1px;
}

/* ── Wrapper colapsable del calendario en móvil ──────────────────────────── */
.cal-wrapper > summary { list-style: none; }
.cal-wrapper > summary::-webkit-details-marker { display: none; }
.cal-wrapper-toggle {
  display: none;
  align-items: center;
  gap: 8px;
  padding: 12px 14px;
  background: var(--bg-card);
  border: 1px solid var(--border-soft);
  border-radius: var(--radius-lg);
  cursor: pointer;
  margin-bottom: 12px;
  color: var(--text-primary);
  font-weight: 600;
}
.cal-wrapper-toggle .mdi { color: var(--green-primary); font-size: 1.2rem; }
.cal-wrapper-caret { margin-left: auto; transition: transform 0.2s ease; }
.cal-wrapper[open] .cal-wrapper-caret { transform: rotate(180deg); }

@media (max-width: 600px) {
  .cal-wrapper-toggle { display: inline-flex; }
}

/* Desktop/tablet: el calendario siempre visible, sin toggle. */
@media (min-width: 601px) {
  .cal-wrapper > summary {
    display: none;
    pointer-events: none;
  }
  .cal-wrapper > *:not(summary) { display: revert; }
}
</style>
