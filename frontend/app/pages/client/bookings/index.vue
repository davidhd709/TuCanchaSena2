<template>
  <div>
    <div class="d-flex align-center mb-6">
      <div>
        <h1 class="text-h5 font-weight-bold">Mis Reservas</h1>
        <p class="text-body-2 text-medium-emphasis">Historial de todas tus reservas</p>
      </div>
      <v-spacer />
      <v-btn to="/client/courts" color="primary" prepend-icon="mdi-plus">
        Nueva Reserva
      </v-btn>
    </div>

    <!-- Tabs by status -->
    <v-tabs v-model="activeTab" color="primary" class="mb-4">
      <v-tab value="all">Todas</v-tab>
      <v-tab value="pending">
        Pendientes
        <v-badge v-if="pendingCount > 0" :content="pendingCount" color="warning" inline class="ml-1" />
      </v-tab>
      <v-tab value="confirmed">Confirmadas</v-tab>
      <v-tab value="completed">Completadas</v-tab>
      <v-tab value="cancelled">Canceladas</v-tab>
    </v-tabs>

    <!-- Estado de carga -->
    <LoadingState v-if="loading" :count="3" :sm="6" :lg="4" />

    <!-- Estado de error -->
    <ErrorState
      v-else-if="fetchError"
      message="No pudimos cargar tus reservas. Verifica tu conexión e intenta de nuevo."
      @retry="loadBookings"
    />

    <!-- Lista de reservas -->
    <v-row v-else>
      <v-col v-for="booking in tabBookings" :key="booking.id" cols="12" sm="6" lg="4">
        <v-card rounded="lg" hover>
          <v-card-text class="pa-5">
            <div class="d-flex align-center justify-space-between mb-3">
              <div class="d-flex align-center gap-3">
                <v-avatar color="primary" variant="tonal" size="40" rounded="lg">
                  <v-icon size="20" aria-hidden="true">mdi-soccer-field</v-icon>
                </v-avatar>
                <div>
                  <div class="text-subtitle-2 font-weight-bold">{{ booking.court?.name ?? 'Cancha' }}</div>
                  <div class="text-caption text-medium-emphasis">{{ booking.court?.business?.name }}</div>
                </div>
              </div>
              <BookingStatusChip :status="booking.status" />
            </div>

            <v-divider class="mb-3" />

            <div class="d-flex flex-column gap-1 mb-3">
              <div class="d-flex align-center gap-2 text-body-2">
                <v-icon size="16" color="primary" aria-hidden="true">mdi-calendar</v-icon>
                {{ booking.date }}
              </div>
              <div class="d-flex align-center gap-2 text-body-2">
                <v-icon size="16" color="primary" aria-hidden="true">mdi-clock-outline</v-icon>
                {{ booking.startTime }} – {{ booking.endTime }}
              </div>
              <div class="d-flex align-center gap-2 text-body-2">
                <v-icon size="16" color="primary" aria-hidden="true">mdi-cash</v-icon>
                {{ booking.paymentMethod === 'nequi' ? 'Nequi' : 'Transferencia' }}
              </div>
            </div>

            <v-btn
              v-if="booking.paymentProofUrl"
              variant="outlined"
              size="small"
              color="primary"
              prepend-icon="mdi-image"
              :href="booking.paymentProofUrl"
              target="_blank"
              block
              class="mb-2"
              :aria-label="`Ver comprobante de pago de ${booking.court?.name ?? 'la cancha'}`"
            >
              Ver comprobante
            </v-btn>

            <p v-if="booking.rejectionReason" class="text-caption text-error mt-2">
              <v-icon size="12" aria-hidden="true">mdi-alert-circle</v-icon>
              Rechazo: {{ booking.rejectionReason }}
            </p>
          </v-card-text>

          <template v-if="booking.status === 'pending'">
            <v-divider />
            <v-card-actions class="pa-3">
              <v-spacer />
              <v-btn
                color="error"
                variant="text"
                size="small"
                @click="openCancelConfirm(booking)"
              >
                Cancelar reserva
              </v-btn>
            </v-card-actions>
          </template>
        </v-card>
      </v-col>

      <!-- Estado vacío -->
      <v-col v-if="tabBookings.length === 0" cols="12">
        <EmptyState
          icon="mdi-calendar-blank-outline"
          title="Sin reservas"
          :description="activeTab === 'all' ? 'Aún no tienes ninguna reserva registrada.' : 'No tienes reservas en esta categoría.'"
        >
          <template v-if="activeTab === 'all'" #action>
            <v-btn to="/client/courts" color="primary" variant="flat" prepend-icon="mdi-soccer-field">
              Reservar una cancha
            </v-btn>
          </template>
        </EmptyState>
      </v-col>
    </v-row>

    <!-- Cancel confirm dialog -->
    <v-dialog v-model="cancelDialog" max-width="420">
      <v-card rounded="lg">
        <v-card-text class="pa-6 text-center">
          <v-icon size="52" color="error" class="mb-3">mdi-calendar-remove</v-icon>
          <h3 class="text-subtitle-1 font-weight-bold mb-2">¿Cancelar reserva?</h3>
          <p class="text-body-2 text-medium-emphasis">
            ¿Estás seguro de que deseas cancelar tu reserva en
            <strong>{{ bookingToCancel?.court?.name }}</strong>
            el <strong>{{ bookingToCancel?.date }}</strong>
            de {{ bookingToCancel?.startTime?.slice(0,5) }} a {{ bookingToCancel?.endTime?.slice(0,5) }}?
            Esta acción no se puede deshacer.
          </p>
        </v-card-text>
        <v-card-actions class="pa-4 pt-0">
          <v-spacer />
          <v-btn variant="text" @click="cancelDialog = false">Volver</v-btn>
          <v-btn
            color="error"
            variant="flat"
            :loading="cancelLoading === bookingToCancel?.id"
            @click="confirmCancel"
          >
            Sí, cancelar
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-snackbar v-model="snackbar.show" :color="snackbar.color" rounded="lg">{{ snackbar.text }}</v-snackbar>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: 'dashboard', middleware: 'auth' })

const { apiFetch } = useApi()
const bookings = ref<any[]>([])
const loading = ref(false)
const activeTab = ref('all')
const cancelLoading = ref<string | false>(false)
const cancelDialog = ref(false)
const bookingToCancel = ref<any>(null)
const snackbar = reactive({ show: false, text: '', color: 'success' })

const pendingCount = computed(() => bookings.value.filter(b => b.status === 'pending').length)

const tabBookings = computed(() => {
  if (activeTab.value === 'all') return bookings.value
  return bookings.value.filter(b => b.status === activeTab.value)
})

const openCancelConfirm = (booking: any) => {
  bookingToCancel.value = booking
  cancelDialog.value = true
}

const confirmCancel = async () => {
  if (!bookingToCancel.value) return
  cancelLoading.value = bookingToCancel.value.id
  try {
    await apiFetch(`/bookings/${bookingToCancel.value.id}`, { method: 'DELETE' })
    const idx = bookings.value.findIndex(b => b.id === bookingToCancel.value.id)
    if (idx !== -1) bookings.value[idx] = { ...bookings.value[idx], status: 'cancelled' }
    cancelDialog.value = false
    snackbar.text = 'Reserva cancelada'
    snackbar.color = 'success'
  } catch (e: any) {
    snackbar.text = e?.data?.message || 'Error al cancelar'
    snackbar.color = 'error'
  } finally {
    cancelLoading.value = false
    snackbar.show = true
  }
}

const fetchError = ref(false)

const loadBookings = async () => {
  loading.value = true
  fetchError.value = false
  try { bookings.value = await apiFetch<any[]>('/bookings/my-bookings') }
  catch { fetchError.value = true }
  finally { loading.value = false }
}

onMounted(loadBookings)
</script>
