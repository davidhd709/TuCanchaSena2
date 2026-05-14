<template>
  <section>
    <div class="mb-head">
      <h1>Mis Reservas</h1>
      <p>Gestiona y revisa el historial de tus canchas reservadas.</p>
    </div>

    <div class="mb-tabs">
      <button
        v-for="tab in tabs"
        :key="tab.value"
        class="mb-tab"
        :class="{ 'is-active': activeTab === tab.value }"
        @click="activeTab = tab.value"
      >
        {{ tab.label }}
      </button>
    </div>

    <LoadingState v-if="loading" :count="3" :sm="6" :lg="4" />
    <ErrorState v-else-if="fetchError" message="No pudimos cargar tus reservas." @retry="loadBookings" />

    <div v-else class="mb-grid">
      <BookingCard v-for="booking in tabBookings" :key="booking.id" :booking="booking" @cancel="openCancelConfirm" />
      <EmptyState
        v-if="tabBookings.length === 0"
        icon="mdi-calendar-blank-outline"
        title="Sin reservas"
        :description="activeTab === 'all' ? 'Aún no tienes reservas.' : 'No hay reservas en este estado.'"
      />
    </div>

    <v-dialog v-model="cancelDialog" max-width="420">
      <v-card rounded="lg">
        <v-card-text class="pa-6 text-center">
          <v-icon size="52" color="error" class="mb-3">mdi-calendar-remove</v-icon>
          <h3 class="text-subtitle-1 font-weight-bold mb-2">¿Cancelar reserva?</h3>
          <p class="text-body-2 text-medium-emphasis">Esta acción no se puede deshacer.</p>
        </v-card-text>
        <v-card-actions class="pa-4 pt-0"><v-spacer /><v-btn variant="text" @click="cancelDialog = false">Volver</v-btn><v-btn color="error" :loading="cancelLoading === bookingToCancel?.id" @click="confirmCancel">Sí, cancelar</v-btn></v-card-actions>
      </v-card>
    </v-dialog>

    <v-snackbar v-model="snackbar.show" :color="snackbar.color" rounded="lg">{{ snackbar.text }}</v-snackbar>
  </section>
</template>

<script setup lang="ts">
definePageMeta({ layout: 'client', middleware: 'auth' })
const { apiFetch, apiList } = useApi()
const bookings = ref<any[]>([])
const loading = ref(false)
const activeTab = ref('all')
const cancelLoading = ref<string | false>(false)
const cancelDialog = ref(false)
const bookingToCancel = ref<any>(null)
const snackbar = reactive({ show: false, text: '', color: 'success' })

const tabs = [
  { value: 'all', label: 'Todas' },
  { value: 'confirmed', label: 'Próximas' },
  { value: 'pending', label: 'Pendientes' },
  { value: 'completed', label: 'Completadas' },
]

const tabBookings = computed(() => activeTab.value === 'all' ? bookings.value : bookings.value.filter(b => b.status === activeTab.value))

const openCancelConfirm = (booking: any) => { bookingToCancel.value = booking; cancelDialog.value = true }
const confirmCancel = async () => {
  if (!bookingToCancel.value) return
  cancelLoading.value = bookingToCancel.value.id
  try {
    await apiFetch(`/bookings/${bookingToCancel.value.id}`, { method: 'DELETE' })
    const idx = bookings.value.findIndex(b => b.id === bookingToCancel.value.id)
    if (idx !== -1) bookings.value[idx] = { ...bookings.value[idx], status: 'cancelled' }
    cancelDialog.value = false
    snackbar.text = 'Reserva cancelada'; snackbar.color = 'success'
  } catch (e: any) {
    snackbar.text = e?.data?.message || 'Error al cancelar'; snackbar.color = 'error'
  } finally { cancelLoading.value = false; snackbar.show = true }
}

const fetchError = ref(false)
const loadBookings = async () => {
  loading.value = true
  fetchError.value = false
  try { bookings.value = await apiList<any>('/bookings/my-bookings') }
  catch { fetchError.value = true }
  finally { loading.value = false }
}
onMounted(loadBookings)
</script>

<style scoped>
.mb-head h1 {
  color: #e7edf2;
  font-size: clamp(2rem, 2.7vw, 3.2rem);
  line-height: 1.05;
}
.mb-head p {
  color: #aab3bd;
  margin-top: 8px;
  font-size: clamp(1rem, 1.1vw, 1.35rem);
}

.mb-tabs {
  margin-top: 20px;
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}
.mb-tab {
  border: 1px solid rgba(255,255,255,.08);
  background: #2a3135;
  color: #bac2cb;
  border-radius: 12px;
  padding: 10px 18px;
  font-size: clamp(.95rem, 1.05vw, 1.2rem);
  font-weight: 700;
  transition: background .18s ease, color .18s ease, transform .18s ease, border-color .18s ease;
}
.mb-tab:hover {
  transform: translateY(-1px);
  border-color: rgba(111, 230, 140, 0.32);
  color: #d6dee6;
}
.mb-tab.is-active { background: #18ab58; color: #eafff1; border-color: transparent; }
.mb-tab:active { transform: translateY(0); }

.mb-grid {
  margin-top: 18px;
  display: grid;
  gap: 18px;
  grid-template-columns: repeat(3, minmax(0,1fr));
  align-items: start;
}

@media (max-width: 1100px) { .mb-grid { grid-template-columns: repeat(2, 1fr); } }
@media (max-width: 760px) { .mb-grid { grid-template-columns: 1fr; } }
</style>
