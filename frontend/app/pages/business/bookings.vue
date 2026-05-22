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

    <!-- ── Calendario semanal (componente extraído en Fase 3) ──────────────── -->
    <BookingWeekCalendar :bookings="displayBookings" :loading="loading" @select="openDetail" />

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
              <span class="bk-card-total">{{ formatCurrency(b.totalPrice) }}</span>
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
              data-testid="confirm-booking"
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
              data-testid="reject-booking"
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
              {{ formatCurrency(selectedBooking.totalPrice) }}
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
            data-testid="detail-confirm-booking"
            :loading="actionLoading === 'confirm'"
            @click="confirmBooking"
          >
            Confirmar
          </v-btn>
          <v-btn
            color="error" variant="tonal" size="small" prepend-icon="mdi-close"
            data-testid="detail-reject-booking"
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
      test-id="reject-modal"
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
          data-testid="reject-submit"
          :loading="actionLoading === 'reject'"
          @click="rejectBooking"
        >
          Rechazar
        </v-btn>
      </template>
    </AppModalShell>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: 'dashboard', middleware: ['auth', 'role'] })

const { apiFetch } = useApi()

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
const toast          = useToast()

// ── Helpers ────────────────────────────────────────────────────────────────
// `formatDate` y `formatCurrency` provienen de app/utils/* (auto-import Nuxt).
// El formato de fecha por defecto (weekday largo) coincide exactamente con el
// que esperan los E2E (helpers/api.ts → formatDateForUi).

// Notificación unificada vía el toast global (useToast). `color` se mapea a los
// métodos del composable (success/error/info/warning).
const notify = (text: string, color: 'success' | 'error' | 'info' | 'warning' = 'success') => {
  toast[color](text)
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
  // Carga del negocio (singular). El timer y el auto-scroll del calendario
  // viven ahora en BookingWeekCalendar / useWeekCalendar.
  try {
    businesses.value = await apiList<any>('/businesses/my-businesses')
    if (businesses.value.length > 0) selectedBusinessId.value = businesses.value[0].id
  } catch (e) { console.error(e) }
})
</script>

<style scoped>
/* El calendario semanal (layout, bloques y leyenda) vive en
   BookingWeekCalendar.vue. Aquí solo quedan las cards de reservas. */

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

@media (max-width: 960px) {
  .bk-cards { grid-template-columns: repeat(2, 1fr); }
}
@media (max-width: 600px) {
  .bk-cards { grid-template-columns: 1fr; }

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
</style>
