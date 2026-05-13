<template>
  <div>
    <!-- ── Header ──────────────────────────────────────────────────────────── -->
    <div class="d-flex align-center mb-5 flex-wrap gap-3">
      <div>
        <h1 class="text-h5 font-weight-bold">Reservas</h1>
        <p class="text-body-2 text-medium-emphasis">Vista semanal de tus canchas</p>
      </div>
      <v-spacer />
      <v-select
        v-if="businesses.length > 1"
        v-model="selectedBusinessId"
        :items="businesses.map(b => ({ title: b.name, value: b.id }))"
        label="Negocio"
        prepend-inner-icon="mdi-store"
        hide-details
        density="compact"
        style="max-width: 260px"
      />
    </div>

    <!-- ── Week navigation ─────────────────────────────────────────────────── -->
    <div class="d-flex align-center gap-2 mb-4 flex-wrap">
      <v-btn-group density="compact" variant="tonal" rounded="lg">
        <v-btn icon="mdi-chevron-left" @click="prevWeek" />
        <v-btn @click="goToToday" class="px-4">Hoy</v-btn>
        <v-btn icon="mdi-chevron-right" @click="nextWeek" />
      </v-btn-group>

      <span class="text-subtitle-2 font-weight-medium ml-1">{{ weekRangeLabel }}</span>

      <v-spacer />

      <v-chip v-if="loading" size="small" variant="tonal" color="primary">
        <v-progress-circular size="12" width="2" indeterminate class="mr-2" />
        Cargando...
      </v-chip>
    </div>

    <!-- ── Status legend ───────────────────────────────────────────────────── -->
    <div class="d-flex flex-wrap gap-2 mb-4">
      <v-chip
        v-for="s in statusLegend"
        :key="s.value"
        :color="s.color"
        size="small"
        variant="tonal"
        density="compact"
      >
        {{ s.label }}
      </v-chip>
    </div>

    <!-- ── Calendar card ───────────────────────────────────────────────────── -->
    <v-card rounded="lg" class="overflow-hidden">

      <!-- Day header row -->
      <div class="cal-header d-flex">
        <div class="cal-time-col" />
        <div
          v-for="day in weekDays"
          :key="day.iso"
          class="cal-day-header flex-1-1 text-center pa-2"
          :class="{ 'bg-primary-lighten': day.isToday }"
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
              class="text-caption text-right pr-2"
              style="position: absolute; line-height: 1; color: rgba(0,0,0,.45)"
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
            :style="`position: relative; border-left: 1px solid rgba(0,0,0,.08); min-width: 80px`"
          >
            <!-- Full-hour lines -->
            <div
              v-for="h in gridHours"
              :key="'h' + h"
              :style="`position: absolute; top: ${(h - START_HOUR) * HOUR_HEIGHT}px; left: 0; right: 0;
                       border-top: 1px solid rgba(0,0,0,${h % 2 === 0 ? '.1' : '.05'})`"
            />
            <!-- Half-hour dashed lines -->
            <div
              v-for="h in gridHours"
              :key="'hh' + h"
              :style="`position: absolute; top: ${(h - START_HOUR) * HOUR_HEIGHT + HOUR_HEIGHT / 2}px; left: 0; right: 0;
                       border-top: 1px dashed rgba(0,0,0,.06)`"
            />

            <!-- Booking blocks -->
            <div
              v-for="b in laidOutBookings(day.iso)"
              :key="b.id"
              class="booking-block"
              :class="`booking-${b.status}`"
              :style="bookingBlockStyle(b)"
              @click="openDetail(b)"
            >
              <div class="booking-title text-caption font-weight-bold text-truncate">
                {{ b.court?.name ?? 'Cancha' }}
              </div>
              <div class="booking-time text-caption">
                {{ b.startTime.slice(0, 5) }}–{{ b.endTime.slice(0, 5) }}
              </div>
              <div class="booking-client text-caption text-truncate">
                <v-icon size="9" style="vertical-align: middle">mdi-account</v-icon>
                {{ b.client?.firstName ?? '' }} {{ b.client?.lastName ?? '' }}
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

    <!-- No bookings info -->
    <div v-if="!loading && bookings.length === 0" class="mt-4">
      <v-alert type="info" variant="tonal" rounded="lg">
        No hay reservas registradas para este negocio.
      </v-alert>
    </div>

    <!-- ── Booking detail dialog ────────────────────────────────────────────── -->
    <v-dialog v-model="detailDialog" max-width="480">
      <v-card v-if="selectedBooking" rounded="lg">
        <v-card-title class="text-subtitle-1 font-weight-bold pa-5 pb-3 d-flex align-center gap-2">
          <v-icon color="primary">mdi-calendar-check</v-icon>
          Detalle de Reserva
          <v-spacer />
          <BookingStatusChip :status="selectedBooking.status" />
        </v-card-title>
        <v-divider />

        <v-card-text class="pa-5">
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
                {{ selectedBooking.client?.firstName }} {{ selectedBooking.client?.lastName }}
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
            <v-col v-if="selectedBooking.paymentProofUrl" cols="6">
              <div class="text-caption text-medium-emphasis mb-1">Comprobante</div>
              <v-btn
                size="x-small"
                variant="tonal"
                color="primary"
                prepend-icon="mdi-image"
                :href="selectedBooking.paymentProofUrl"
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
        </v-card-text>

        <!-- Actions: pending -->
        <template v-if="selectedBooking.status === 'pending'">
          <v-divider />
          <v-card-actions class="pa-4 gap-2 flex-wrap">
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
          </v-card-actions>
        </template>

        <!-- Actions: confirmed -->
        <template v-else-if="selectedBooking.status === 'confirmed'">
          <v-divider />
          <v-card-actions class="pa-4 gap-2 flex-wrap">
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
          </v-card-actions>
        </template>

        <!-- No actions for terminal states -->
        <template v-else>
          <v-divider />
          <v-card-actions class="pa-4">
            <v-spacer />
            <v-btn variant="text" @click="detailDialog = false">Cerrar</v-btn>
          </v-card-actions>
        </template>
      </v-card>
    </v-dialog>

    <!-- ── Cancel confirm dialog ──────────────────────────────────────────── -->
    <v-dialog v-model="cancelDialog" max-width="420">
      <v-card rounded="lg">
        <v-card-text class="pa-6 text-center">
          <v-icon size="52" color="error" class="mb-3">mdi-calendar-remove</v-icon>
          <h3 class="text-subtitle-1 font-weight-bold mb-2">¿Cancelar reserva?</h3>
          <p class="text-body-2 text-medium-emphasis">
            Esta acción no se puede deshacer. La reserva de
            <strong>{{ selectedBooking?.client?.firstName }} {{ selectedBooking?.client?.lastName }}</strong>
            en <strong>{{ selectedBooking?.court?.name }}</strong>
            ({{ selectedBooking?.date }} · {{ selectedBooking?.startTime?.slice(0,5) }}–{{ selectedBooking?.endTime?.slice(0,5) }})
            quedará como cancelada.
          </p>
        </v-card-text>
        <v-card-actions class="pa-4 pt-0">
          <v-spacer />
          <v-btn variant="text" @click="cancelDialog = false">Volver</v-btn>
          <v-btn
            color="error"
            variant="flat"
            :loading="actionLoading === 'cancel'"
            @click="confirmCancelBooking"
          >
            Sí, cancelar
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- ── Reject dialog ───────────────────────────────────────────────────── -->
    <v-dialog v-model="rejectDialog" max-width="420">
      <v-card rounded="lg">
        <v-card-title class="text-subtitle-1 font-weight-bold pa-5 pb-3">
          Rechazar Reserva
        </v-card-title>
        <v-card-text>
          <v-textarea
            v-model="rejectReason"
            label="Motivo del rechazo"
            rows="3"
            placeholder="Explica el motivo del rechazo al cliente..."
            :rules="[v => !!v || 'El motivo es requerido']"
          />
        </v-card-text>
        <v-card-actions class="pa-4 pt-0">
          <v-spacer />
          <v-btn variant="text" @click="rejectDialog = false">Cancelar</v-btn>
          <v-btn
            color="error" variant="flat"
            :loading="actionLoading === 'reject'"
            @click="rejectBooking"
          >
            Rechazar
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

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
const bookings          = ref<any[]>([])
const loading           = ref(false)
const selectedBusinessId = ref<string | null>(null)

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
  const f = new Date(weekDays.value[0].iso + 'T00:00:00')
  const l = new Date(weekDays.value[6].iso + 'T00:00:00')
  const fStr = f.toLocaleDateString('es-CO', { day: 'numeric', month: 'long' })
  const lStr = l.toLocaleDateString('es-CO', { day: 'numeric', month: 'long', year: 'numeric' })
  return `${fStr} – ${lStr}`
})

// ── Grid dimensions ────────────────────────────────────────────────────────
const gridHours     = computed(() => Array.from({ length: END_HOUR - START_HOUR + 1 }, (_, i) => START_HOUR + i))
const totalCalHeight = computed(() => (END_HOUR - START_HOUR) * HOUR_HEIGHT)

// ── Time helpers ───────────────────────────────────────────────────────────
const toMin = (t: string) => {
  const [h, m] = t.split(':').map(Number)
  return h * 60 + m
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
  const dayBookings = bookings.value.filter(b => b.date === iso)
  if (!dayBookings.length) return []

  const sorted = dayBookings
    .map(b => ({ ...b }))
    .sort((a, b) => a.startTime.localeCompare(b.startTime))

  const laneEnds: string[] = []

  for (const b of sorted) {
    let placed = false
    for (let i = 0; i < laneEnds.length; i++) {
      if (laneEnds[i] <= b.startTime) {
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
  { value: 'pending',   label: 'Pendiente',  color: 'warning'   },
  { value: 'confirmed', label: 'Confirmada', color: 'success'   },
  { value: 'completed', label: 'Completada', color: 'info'      },
  { value: 'cancelled', label: 'Cancelada',  color: 'error'     },
  { value: 'no_show',   label: 'No Show',    color: 'secondary' },
]

// ── Helpers ────────────────────────────────────────────────────────────────
const formatDate = (dateStr: string) => {
  if (!dateStr) return ''
  const [y, mo, d] = dateStr.split('-').map(Number)
  return new Date(y, mo - 1, d).toLocaleDateString('es-CO', {
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
const loadBookings = async () => {
  if (!selectedBusinessId.value) return
  loading.value = true
  try {
    bookings.value = await apiFetch<any[]>(`/bookings/business/${selectedBusinessId.value}`)
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

  // Load businesses
  try {
    businesses.value = await apiFetch<any[]>('/businesses/my-businesses')
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

.cal-header {
  border-bottom: 1px solid rgba(0, 0, 0, .1);
  background: rgba(0, 0, 0, .02);
}

.cal-day-header {
  min-width: 80px;
  border-left: 1px solid rgba(0, 0, 0, .06);
}

.cal-today-bg {
  background: rgba(var(--v-theme-primary), .04);
}

.bg-primary-lighten {
  background: rgba(var(--v-theme-primary), .06) !important;
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

.booking-pending {
  background: rgba(255, 152, 0, .18);
  border-left-color: #FB8C00;
  color: #E65100;
}
.booking-confirmed {
  background: rgba(67, 160, 71, .18);
  border-left-color: #43A047;
  color: #1B5E20;
}
.booking-completed {
  background: rgba(30, 136, 229, .18);
  border-left-color: #1E88E5;
  color: #0D47A1;
}
.booking-cancelled {
  background: rgba(117, 117, 117, .14);
  border-left-color: #9E9E9E;
  color: #757575;
  opacity: .7;
}
.booking-no_show {
  background: rgba(142, 36, 170, .14);
  border-left-color: #8E24AA;
  color: #6A1B9A;
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
</style>
