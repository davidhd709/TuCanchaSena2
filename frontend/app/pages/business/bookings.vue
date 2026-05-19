<template>
  <div>
    <!-- ── Header ──────────────────────────────────────────────────────────── -->
    <PageHeader
      tag="Negocio"
      title="Reservas"
      subtitle="Calendario de movimiento y detalle de las reservas de tus canchas"
    >
      <template #action>
        <v-select
          v-model="selectedCourtId"
          :items="courtOptions"
          label="Filtrar por cancha"
          prepend-inner-icon="mdi-soccer-field"
          hide-details
          density="compact"
          style="max-width: 280px"
        />
      </template>
    </PageHeader>

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
              @click="openDetail(b)"
              @keydown.enter.space.prevent="openDetail(b)"
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

    <!-- ── Reservas en cards (detalle para toma de decisiones) ─────────────── -->
    <section class="bk-list">
      <h2 class="bk-list-title">
        Reservas de la semana
        <span class="bk-list-count">{{ displayBookings.length }}</span>
      </h2>

      <div v-if="displayBookings.length" class="bk-cards">
        <div
          v-for="b in sortedDisplayBookings"
          :key="b.id"
          class="bk-card"
          :class="{ 'is-pending': b.status === 'pending' }"
        >
          <div
            class="bk-card-body"
            role="button"
            tabindex="0"
            :aria-label="`Ver detalle de la reserva del ${formatDate(b.date)} a las ${b.startTime?.slice(0,5)}`"
            @click="openDetail(b)"
            @keydown.enter.space.prevent="openDetail(b)"
          >
            <div class="bk-card-head">
              <div class="bk-card-court">
                <span class="mdi mdi-soccer-field" />
                {{ b.court?.name ?? 'Cancha' }}
              </div>
              <BookingStatusChip :status="b.status" />
            </div>
            <div class="bk-card-client">
              <span class="mdi mdi-account-outline" />
              {{ b.user?.firstName }} {{ b.user?.lastName }}
            </div>
            <div class="bk-card-rows">
              <span class="bk-card-row">
                <span class="mdi mdi-calendar-outline" /> {{ formatDate(b.date) }}
              </span>
              <span class="bk-card-row">
                <span class="mdi mdi-clock-outline" />
                {{ b.startTime?.slice(0,5) }}–{{ b.endTime?.slice(0,5) }}
              </span>
            </div>
            <div class="bk-card-foot">
              <span class="bk-card-total">${{ Number(b.totalPrice ?? 0).toLocaleString('es-CO') }}</span>
              <span v-if="b.paymentProof" class="bk-card-proof">
                <span class="mdi mdi-image-check-outline" /> Comprobante
              </span>
              <span v-else class="bk-card-proof is-missing">
                <span class="mdi mdi-image-off-outline" /> Sin comprobante
              </span>
            </div>
          </div>

          <!-- Acciones rápidas solo para reservas pending. Reutilizan los handlers
               del detail dialog para no duplicar lógica. -->
          <div v-if="b.status === 'pending'" class="bk-card-quick">
            <v-btn
              color="success"
              variant="flat"
              size="small"
              prepend-icon="mdi-check"
              :disabled="actionLoading === 'quick-' + b.id"
              :loading="actionLoading === 'quick-' + b.id"
              @click.stop="quickConfirm(b)"
            >
              Confirmar
            </v-btn>
            <v-btn
              color="error"
              variant="tonal"
              size="small"
              prepend-icon="mdi-close"
              @click.stop="quickReject(b)"
            >
              Rechazar
            </v-btn>
          </div>
        </div>
      </div>

      <EmptyState
        v-else-if="!loading"
        icon="mdi-calendar-blank-outline"
        title="Sin reservas esta semana"
        :description="selectedCourtId ? 'Esta cancha no tiene reservas en el período seleccionado.' : 'No hay reservas registradas en el período seleccionado.'"
      />
    </section>

    <!-- ── Booking detail dialog (AppModalShell) ────────────────────────── -->
    <AppModalShell
      v-model="detailDialog"
      title="Detalle de Reserva"
      :width="480"
    >
      <template v-if="selectedBooking" #tag>
        <BookingStatusChip :status="selectedBooking.status" />
      </template>
      <template v-if="selectedBooking" #body>
        <v-row dense class="row-gap-3">
          <v-col cols="6">
            <div class="text-caption text-medium-emphasis mb-1">Cancha</div>
            <div class="text-body-2 font-weight-medium">{{ selectedBooking.court?.name }}</div>
          </v-col>
          <v-col cols="6">
            <div class="text-caption text-medium-emphasis mb-1">Fecha</div>
            <div class="text-body-2 font-weight-medium">{{ formatDate(selectedBooking.date) }}</div>
          </v-col>
          <v-col cols="6">
            <div class="text-caption text-medium-emphasis mb-1">Horario</div>
            <div class="text-body-2 font-weight-medium">
              {{ selectedBooking.startTime?.slice(0, 5) }} – {{ selectedBooking.endTime?.slice(0, 5) }}
            </div>
          </v-col>
          <v-col cols="6">
            <div class="text-caption text-medium-emphasis mb-1">Duración</div>
            <div class="text-body-2 font-weight-medium">{{ selectedBooking.durationHours }}h</div>
          </v-col>
          <v-col cols="6">
            <div class="text-caption text-medium-emphasis mb-1">Cliente</div>
            <div class="text-body-2 font-weight-medium">
              {{ selectedBooking.user?.firstName }} {{ selectedBooking.user?.lastName }}
            </div>
          </v-col>
          <v-col cols="6">
            <div class="text-caption text-medium-emphasis mb-1">Total</div>
            <div class="text-body-2 font-weight-bold text-success">
              ${{ Number(selectedBooking.totalPrice ?? 0).toLocaleString('es-CO') }}
            </div>
          </v-col>
          <v-col cols="6">
            <div class="text-caption text-medium-emphasis mb-1">Método de pago</div>
            <div class="text-body-2 font-weight-medium">
              {{ selectedBooking.paymentMethod === 'nequi' ? 'Nequi' : 'Transferencia' }}
            </div>
          </v-col>
          <v-col v-if="selectedBooking.paymentProof" cols="6">
            <div class="text-caption text-medium-emphasis mb-1">Comprobante</div>
            <v-btn
              size="x-small"
              variant="tonal"
              color="primary"
              prepend-icon="mdi-image"
              :href="selectedBooking.paymentProof"
              target="_blank"
            >
              Ver imagen
            </v-btn>
          </v-col>
          <v-col v-if="selectedBooking.notes" cols="12">
            <div class="text-caption text-medium-emphasis mb-1">Notas del cliente</div>
            <div class="text-body-2">{{ selectedBooking.notes }}</div>
          </v-col>
          <v-col v-if="selectedBooking.cancellationReason" cols="12">
            <div class="text-caption text-medium-emphasis mb-1">Motivo de cancelación</div>
            <div class="text-body-2 text-error">{{ selectedBooking.cancellationReason }}</div>
          </v-col>
        </v-row>
      </template>
      <template v-if="selectedBooking" #footer>
        <!-- Actions: pending -->
        <template v-if="selectedBooking.status === 'pending'">
          <v-btn
            color="success" variant="flat" size="small" prepend-icon="mdi-check"
            :loading="actionLoading === 'confirm'"
            @click="confirmBooking"
          >
            Confirmar
          </v-btn>
          <v-btn
            color="error" variant="tonal" size="small" prepend-icon="mdi-close"
            @click="openReject"
          >
            Rechazar
          </v-btn>
          <v-spacer />
          <v-btn variant="text" size="small" @click="detailDialog = false">Cerrar</v-btn>
        </template>
        <!-- Actions: confirmed -->
        <template v-else-if="selectedBooking.status === 'confirmed'">
          <v-btn
            color="info" variant="flat" size="small" prepend-icon="mdi-flag-checkered"
            :loading="actionLoading === 'complete'"
            @click="completeBooking"
          >
            Completar
          </v-btn>
          <v-btn
            color="secondary" variant="tonal" size="small" prepend-icon="mdi-account-off"
            :loading="actionLoading === 'noshow'"
            @click="noShowBooking"
          >
            No Show
          </v-btn>
          <v-spacer />
          <v-btn
            color="error" variant="text" size="small"
            @click="cancelDialog = true"
          >
            Cancelar
          </v-btn>
        </template>
        <!-- No actions for terminal states -->
        <template v-else>
          <v-spacer />
          <v-btn variant="text" @click="detailDialog = false">Cerrar</v-btn>
        </template>
      </template>
    </AppModalShell>

    <!-- ── Cancel confirm dialog (AppModalShell) ────────────────────────── -->
    <AppModalShell
      v-model="cancelDialog"
      title="¿Cancelar reserva?"
      subtitle="Esta acción no se puede deshacer."
      :width="420"
    >
      <template #tag>Atención</template>
      <template #body>
        <div class="text-center py-2">
          <v-icon size="48" color="error" class="mb-3">mdi-calendar-remove</v-icon>
          <p class="text-body-2 text-medium-emphasis">
            La reserva de
            <strong>{{ selectedBooking?.user?.firstName }} {{ selectedBooking?.user?.lastName }}</strong>
            en <strong>{{ selectedBooking?.court?.name }}</strong>
            ({{ selectedBooking?.date }} · {{ selectedBooking?.startTime?.slice(0,5) }}–{{ selectedBooking?.endTime?.slice(0,5) }})
            quedará como cancelada.
          </p>
        </div>
      </template>
      <template #footer>
        <v-btn variant="text" @click="cancelDialog = false">Volver</v-btn>
        <v-btn
          color="error"
          variant="flat"
          :loading="actionLoading === 'cancel'"
          @click="confirmCancelBooking"
        >
          Sí, cancelar
        </v-btn>
      </template>
    </AppModalShell>

    <!-- ── Reject dialog (AppModalShell) ───────────────────────────────────── -->
    <AppModalShell
      v-model="rejectDialog"
      title="Rechazar Reserva"
      subtitle="Explica el motivo al cliente para que pueda entender la decisión."
      :width="460"
    >
      <template #tag>Atención</template>
      <template #body>
        <v-textarea
          v-model="rejectReason"
          label="Motivo del rechazo"
          rows="3"
          placeholder="Comprobante no válido, horario ocupado, etc."
          :rules="[v => !!v || 'El motivo es requerido']"
        />
      </template>
      <template #footer>
        <v-btn variant="text" @click="rejectDialog = false">Cancelar</v-btn>
        <v-btn
          color="error" variant="flat"
          :loading="actionLoading === 'reject'"
          @click="rejectBooking"
        >
          Rechazar
        </v-btn>
      </template>
    </AppModalShell>

    <v-snackbar v-model="snackbar.show" :color="snackbar.color" rounded="lg" location="bottom end">
      {{ snackbar.text }}
    </v-snackbar>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: 'dashboard', middleware: ['auth', 'role'] })

const { apiFetch } = useApi()

// ── Constants ──────────────────────────────────────────────────────────────
const HOUR_HEIGHT = 64   // px per hour in the grid
const START_HOUR  = 6    // 06:00
const END_HOUR    = 23   // 23:00 (exclusive – last line at 23:00)

// ── State ──────────────────────────────────────────────────────────────────
const businesses        = ref<any[]>([])
const courts            = ref<any[]>([])
const bookings          = ref<any[]>([])
const loading           = ref(false)
const selectedBusinessId = ref<string | null>(null)
const selectedCourtId   = ref<string | null>(null)

// Selector "por cancha creada" — incluye opción "todas".
const courtOptions = computed(() => [
  { title: 'Todas las canchas', value: null },
  ...courts.value.map((c) => ({ title: c.name, value: c.id })),
])

// Reservas mostradas: filtradas por la cancha seleccionada (o todas).
const displayBookings = computed(() =>
  selectedCourtId.value
    ? bookings.value.filter((b) => b.courtId === selectedCourtId.value)
    : bookings.value,
)
const sortedDisplayBookings = computed(() =>
  [...displayBookings.value].sort(
    (a, b) =>
      (a.date as string).localeCompare(b.date) ||
      (a.startTime as string).localeCompare(b.startTime),
  ),
)

const detailDialog   = ref(false)
const selectedBooking = ref<any>(null)
const actionLoading  = ref<string | false>(false)
const rejectDialog   = ref(false)
const rejectReason   = ref('')
const cancelDialog   = ref(false)
const snackbar       = reactive({ show: false, text: '', color: 'success' })
const calBodyRef     = ref<HTMLElement | null>(null)

// ── Week navigation ────────────────────────────────────────────────────────
const weekStart = ref(getMonday(new Date()))

function getMonday (d: Date): Date {
  const date = new Date(d)
  const day  = date.getDay()
  date.setDate(date.getDate() - (day === 0 ? 6 : day - 1))
  date.setHours(0, 0, 0, 0)
  return date
}

const prevWeek  = () => { const d = new Date(weekStart.value); d.setDate(d.getDate() - 7); weekStart.value = d }
const nextWeek  = () => { const d = new Date(weekStart.value); d.setDate(d.getDate() + 7); weekStart.value = d }
const goToToday = () => { weekStart.value = getMonday(new Date()) }

const weekDays = computed(() => {
  const today = new Date(); today.setHours(0, 0, 0, 0)
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(weekStart.value)
    d.setDate(d.getDate() + i)
    return {
      iso:      d.toISOString().split('T')[0],
      dayName:  d.toLocaleDateString('es-CO', { weekday: 'short' }),
      dayNum:   d.getDate(),
      monthShort: d.toLocaleDateString('es-CO', { month: 'short' }),
      isToday:  d.getTime() === today.getTime(),
    }
  })
})

const weekRangeLabel = computed(() => {
  const first = weekDays.value[0]
  const last  = weekDays.value[6]
  if (!first || !last) return ''
  const f = new Date(first.iso + 'T00:00:00')
  const l = new Date(last.iso  + 'T00:00:00')
  const fStr = f.toLocaleDateString('es-CO', { day: 'numeric', month: 'long' })
  const lStr = l.toLocaleDateString('es-CO', { day: 'numeric', month: 'long', year: 'numeric' })
  return `${fStr} – ${lStr}`
})

// ── Grid dimensions ────────────────────────────────────────────────────────
const gridHours     = computed(() => Array.from({ length: END_HOUR - START_HOUR + 1 }, (_, i) => START_HOUR + i))
const totalCalHeight = computed(() => (END_HOUR - START_HOUR) * HOUR_HEIGHT)

// ── Time helpers ───────────────────────────────────────────────────────────
const toMin = (t: string) => {
  const parts = t.split(':').map(Number)
  return (parts[0] ?? 0) * 60 + (parts[1] ?? 0)
}

// ── Current time indicator ─────────────────────────────────────────────────
const currentTime = ref(new Date())
let _timer: ReturnType<typeof setInterval>

const currentTimeTop = computed(() => {
  const h = currentTime.value.getHours()
  const m = currentTime.value.getMinutes()
  if (h < START_HOUR || h >= END_HOUR) return null
  return (h * 60 + m - START_HOUR * 60) * HOUR_HEIGHT / 60
})

// ── Lane assignment (handles overlapping bookings per day) ─────────────────
function laidOutBookings (iso: string): any[] {
  const dayBookings = displayBookings.value.filter(b => b.date === iso)
  if (!dayBookings.length) return []

  const sorted = dayBookings
    .map(b => ({ ...b }))
    .sort((a, b) => a.startTime.localeCompare(b.startTime))

  const laneEnds: string[] = []

  for (const b of sorted) {
    let placed = false
    for (let i = 0; i < laneEnds.length; i++) {
      if ((laneEnds[i] ?? '') <= b.startTime) {
        laneEnds[i] = b.endTime
        b._lane = i
        placed = true
        break
      }
    }
    if (!placed) {
      b._lane = laneEnds.length
      laneEnds.push(b.endTime)
    }
  }

  const total = laneEnds.length
  for (const b of sorted) b._totalLanes = total

  return sorted
}

// ── Booking block positioning ──────────────────────────────────────────────
function bookingBlockStyle (b: any): Record<string, string> {
  const startMin     = toMin(b.startTime)
  const endMin       = toMin(b.endTime)
  const gridStartMin = START_HOUR * 60

  const top    = (startMin - gridStartMin) * HOUR_HEIGHT / 60
  const height = Math.max((endMin - startMin) * HOUR_HEIGHT / 60 - 3, 22)
  const lane   = b._lane ?? 0
  const total  = b._totalLanes ?? 1

  return {
    position:  'absolute',
    top:       `${top}px`,
    height:    `${height}px`,
    left:      `calc(${(lane / total) * 100}% + 2px)`,
    width:     `calc(${100 / total}% - 4px)`,
    zIndex:    '1',
  }
}

// ── Status legend ──────────────────────────────────────────────────────────
const statusLegend = [
  { value: 'pending',   label: 'Pendiente',  color: 'primary'   },
  { value: 'confirmed', label: 'Confirmada', color: 'success'   },
  { value: 'completed', label: 'Completada', color: 'info'      },
  { value: 'cancelled', label: 'Cancelada',  color: 'error'     },
  { value: 'no_show',   label: 'No Show',    color: 'secondary' },
]

// ── Helpers ────────────────────────────────────────────────────────────────
/** Acepta `YYYY-MM-DD`, ISO con `T` o Date. Devuelve `null` si no es parseable. */
const toLocalDate = (value: unknown): Date | null => {
  if (!value) return null
  if (value instanceof Date) return Number.isNaN(value.getTime()) ? null : value
  if (typeof value !== 'string') return null
  const ymd = /^(\d{4})-(\d{2})-(\d{2})/.exec(value)
  if (ymd) {
    const d = new Date(Number(ymd[1]), Number(ymd[2]) - 1, Number(ymd[3]))
    return Number.isNaN(d.getTime()) ? null : d
  }
  const d = new Date(value)
  return Number.isNaN(d.getTime()) ? null : d
}

const formatDate = (dateStr: unknown) => {
  const d = toLocalDate(dateStr)
  if (!d) return 'Fecha no disponible'
  return d.toLocaleDateString('es-CO', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  })
}

const notify = (text: string, color = 'success') => {
  snackbar.text = text; snackbar.color = color; snackbar.show = true
}

const updateInList = (id: string, patch: any) => {
  const idx = bookings.value.findIndex(b => b.id === id)
  if (idx !== -1) bookings.value[idx] = { ...bookings.value[idx], ...patch }
}

// ── Dialog ─────────────────────────────────────────────────────────────────
const openDetail = (booking: any) => {
  selectedBooking.value = booking
  detailDialog.value = true
}

// ── Acciones rápidas (cards) — reutilizan el flujo del detail dialog. ─────
const quickConfirm = async (booking: any) => {
  actionLoading.value = `quick-${booking.id}`
  try {
    const updated = await apiFetch<any>(`/bookings/${booking.id}/confirm`, { method: 'POST' })
    updateInList(booking.id, updated)
    notify('Reserva confirmada correctamente')
  } catch (e: any) { notify(e?.data?.message || 'Error al confirmar', 'error') }
  finally { actionLoading.value = false }
}

const quickReject = (booking: any) => {
  // Reusa el reject dialog existente para capturar el motivo obligatorio.
  selectedBooking.value = booking
  rejectReason.value = ''
  rejectDialog.value = true
}

// ── Actions ────────────────────────────────────────────────────────────────
const confirmBooking = async () => {
  actionLoading.value = 'confirm'
  try {
    const updated = await apiFetch<any>(`/bookings/${selectedBooking.value.id}/confirm`, { method: 'POST' })
    updateInList(selectedBooking.value.id, updated)
    selectedBooking.value = { ...selectedBooking.value, ...updated }
    notify('Reserva confirmada correctamente')
  } catch (e: any) { notify(e?.data?.message || 'Error al confirmar', 'error') }
  finally { actionLoading.value = false }
}

const openReject = () => {
  rejectReason.value = ''
  rejectDialog.value = true
}

const rejectBooking = async () => {
  if (!rejectReason.value.trim()) return
  actionLoading.value = 'reject'
  try {
    const updated = await apiFetch<any>(`/bookings/${selectedBooking.value.id}/reject`, {
      method: 'POST',
      body: { cancellationReason: rejectReason.value },
    })
    updateInList(selectedBooking.value.id, updated)
    selectedBooking.value = { ...selectedBooking.value, ...updated }
    rejectDialog.value = false
    notify('Reserva rechazada')
  } catch (e: any) { notify(e?.data?.message || 'Error al rechazar', 'error') }
  finally { actionLoading.value = false }
}

const completeBooking = async () => {
  actionLoading.value = 'complete'
  try {
    const updated = await apiFetch<any>(`/bookings/${selectedBooking.value.id}/complete`, { method: 'POST' })
    updateInList(selectedBooking.value.id, updated)
    selectedBooking.value = { ...selectedBooking.value, ...updated }
    notify('Reserva completada')
  } catch (e: any) { notify(e?.data?.message || 'Error', 'error') }
  finally { actionLoading.value = false }
}

const noShowBooking = async () => {
  actionLoading.value = 'noshow'
  try {
    const updated = await apiFetch<any>(`/bookings/${selectedBooking.value.id}/no-show`, { method: 'POST' })
    updateInList(selectedBooking.value.id, updated)
    selectedBooking.value = { ...selectedBooking.value, ...updated }
    notify('Marcado como no-show')
  } catch (e: any) { notify(e?.data?.message || 'Error', 'error') }
  finally { actionLoading.value = false }
}

const confirmCancelBooking = async () => {
  actionLoading.value = 'cancel'
  try {
    await apiFetch(`/bookings/${selectedBooking.value.id}`, { method: 'DELETE' })
    updateInList(selectedBooking.value.id, { status: 'cancelled' })
    selectedBooking.value = { ...selectedBooking.value, status: 'cancelled' }
    cancelDialog.value = false
    detailDialog.value = false
    notify('Reserva cancelada')
  } catch (e: any) { notify(e?.data?.message || 'Error', 'error') }
  finally { actionLoading.value = false }
}

// ── Load data ──────────────────────────────────────────────────────────────
const { apiList } = useApi()

const loadBookings = async () => {
  if (!selectedBusinessId.value) return
  loading.value = true
  try {
    bookings.value = await apiList<any>(`/bookings/business/${selectedBusinessId.value}`)
    courts.value = await apiList<any>(`/courts/by-business/${selectedBusinessId.value}`)
  } catch (e) {
    bookings.value = []
  } finally {
    loading.value = false
  }
}

watch(selectedBusinessId, loadBookings)

onMounted(async () => {
  // Tick timer for current-time indicator
  _timer = setInterval(() => { currentTime.value = new Date() }, 60_000)

  // Load my business (singular)
  try {
    businesses.value = await apiList<any>('/businesses/my-businesses')
    if (businesses.value.length > 0) selectedBusinessId.value = businesses.value[0].id
  } catch (e) { console.error(e) }

  // Scroll to current hour
  await nextTick()
  if (calBodyRef.value) {
    const now = new Date()
    const scrollToHour = Math.max(0, now.getHours() - 1)
    calBodyRef.value.scrollTop = (scrollToHour - START_HOUR) * HOUR_HEIGHT
  }
})

onUnmounted(() => clearInterval(_timer))
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

/* ── Reservas en cards ───────────────────────────────────────────────────── */
.bk-list { margin-top: 28px; }
.bk-list-title {
  font-family: 'Manrope', sans-serif;
  font-size: 1.1rem;
  font-weight: 700;
  color: var(--text-primary);
  display: flex;
  align-items: center;
  gap: 9px;
  margin-bottom: 14px;
}
.bk-list-count {
  font-size: 0.78rem;
  font-weight: 700;
  padding: 2px 9px;
  border-radius: 100px;
  background: var(--green-soft);
  color: var(--green-bright);
}
.bk-cards {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 14px;
}
.bk-card {
  text-align: left;
  background: var(--bg-card);
  border: 1px solid var(--border-soft);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-sm);
  padding: 16px;
  cursor: pointer;
  transition: transform var(--transition), box-shadow var(--transition), border-color var(--transition);
}
.bk-card:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-md);
  border-color: rgba(47, 161, 138, 0.22);
}
.bk-card-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}
.bk-card-court {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 0.92rem;
  font-weight: 700;
  color: var(--text-primary);
  min-width: 0;
}
.bk-card-court .mdi { color: var(--green-primary); font-size: 1rem; flex-shrink: 0; }
.bk-card-client {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 0.82rem;
  color: var(--text-muted);
  margin-top: 8px;
}
.bk-card-client .mdi { font-size: 0.95rem; }
.bk-card-rows {
  display: flex;
  flex-wrap: wrap;
  gap: 6px 14px;
  margin-top: 8px;
}
.bk-card-row {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  font-size: 0.8rem;
  color: var(--text-muted);
}
.bk-card-row .mdi { font-size: 0.95rem; color: var(--green-primary); }
.bk-card-foot {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px solid var(--border-soft);
}
.bk-card-total {
  font-size: 1rem;
  font-weight: 800;
  color: var(--text-primary);
}
.bk-card-proof {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 0.72rem;
  font-weight: 600;
  color: var(--green-bright);
}
.bk-card-proof.is-missing { color: var(--text-faint); }
.bk-card-proof .mdi { font-size: 0.9rem; }

.bk-card.is-pending {
  border-color: rgba(47, 161, 138, 0.35);
  box-shadow: 0 0 0 1px rgba(47, 161, 138, 0.18), var(--shadow-sm);
}
.bk-card-quick {
  display: flex;
  gap: 10px;
  padding: 12px 16px 16px;
  border-top: 1px solid var(--border-soft);
  background: rgba(15, 20, 26, 0.4);
}
.bk-card-quick .v-btn {
  flex: 1;
  min-height: 40px;
  font-weight: 700;
  letter-spacing: .01em;
}

/* Wrapper colapsable del calendario en móvil. */
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

@media (max-width: 960px) {
  .bk-cards { grid-template-columns: repeat(2, 1fr); }
}
@media (max-width: 600px) {
  .bk-cards { grid-template-columns: 1fr; }
  .cal-wrapper-toggle { display: inline-flex; }

  /* Acciones rápidas más tocables en móvil: altura mínima 44px (target táctil),
     gap mayor y separación clara del cuerpo de la card. */
  .bk-card-quick {
    padding: 14px 14px 16px;
    gap: 12px;
  }
  .bk-card-quick .v-btn { min-height: 44px; font-size: .92rem; }
  .bk-card.is-pending {
    border-color: rgba(47, 161, 138, 0.45);
    box-shadow: 0 0 0 2px rgba(47, 161, 138, 0.16), var(--shadow-sm);
  }
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
