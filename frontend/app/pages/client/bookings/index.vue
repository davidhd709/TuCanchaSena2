<template>
  <section>
    <header class="bookings-head">
      <h1 class="bookings-title">Mis reservas</h1>
      <p class="bookings-sub">Gestiona y revisa el historial de tus canchas reservadas.</p>
    </header>

    <!-- Tabs estilo segmented control -->
    <div class="bookings-tabs" role="tablist" aria-label="Filtrar reservas">
      <button
        v-for="tab in tabs"
        :key="tab.value"
        type="button"
        role="tab"
        :aria-selected="activeTab === tab.value"
        class="bookings-tab"
        :class="{ 'is-active': activeTab === tab.value }"
        @click="activeTab = tab.value"
      >
        {{ tab.label }}
        <span v-if="counts[tab.value] > 0" class="bookings-tab-count">{{ counts[tab.value] }}</span>
      </button>
    </div>

    <LoadingState v-if="loading" :count="3" :sm="6" :lg="4" />
    <ErrorState v-else-if="fetchError" message="No pudimos cargar tus reservas." @retry="loadBookings" />

    <template v-else>
      <!-- Próxima reserva destacada -->
      <section v-if="upcomingHighlight" class="bookings-upcoming">
        <div class="bookings-upcoming-label">Tu próxima reserva</div>
        <BookingCard :booking="upcomingHighlight" @cancel="openCancelConfirm" />
      </section>

      <ul v-if="tabBookings.length" class="bookings-list">
        <li v-for="booking in tabBookings" :key="booking.id">
          <BookingCard :booking="booking" @cancel="openCancelConfirm" />
        </li>
      </ul>

      <EmptyState
        v-else
        icon="mdi-calendar-blank-outline"
        title="Sin reservas en este filtro"
        :description="activeTab === 'all' ? 'Aún no tienes reservas. Empieza explorando canchas.' : 'No hay reservas en este estado todavía.'"
      >
        <template #action>
          <v-btn to="/client/courts" color="primary" prepend-icon="mdi-soccer">Reservar cancha</v-btn>
        </template>
      </EmptyState>
    </template>

    <AppConfirmDialog
      v-model="cancelDialog"
      title="¿Cancelar reserva?"
      subtitle="Esta acción no se puede deshacer."
      icon="mdi-calendar-remove"
      cancel-text="Volver"
      confirm-text="Sí, cancelar"
      :loading="cancelLoading === bookingToCancel?.id"
      @confirm="confirmCancel"
    >
      <p class="text-body-2 text-medium-emphasis">
        Tu reserva quedará marcada como cancelada y el horario se liberará.
      </p>
    </AppConfirmDialog>
  </section>
</template>

<script setup lang="ts">
definePageMeta({ layout: 'client', middleware: 'auth' })
const { apiFetch, apiList } = useApi()
const toast = useToast()
const { data: bookings, loading, error: fetchError, execute: loadBookings } =
  useAsyncState<any[]>(() => apiList<any>('/bookings/my-bookings'), [])
const activeTab = ref('all')
const cancelLoading = ref<string | false>(false)
const cancelDialog = ref(false)
const bookingToCancel = ref<any>(null)

const tabs = [
  { value: 'all',       label: 'Todas' },
  { value: 'confirmed', label: 'Confirmadas' },
  { value: 'pending',   label: 'Pendientes' },
  { value: 'completed', label: 'Completadas' },
] as const

const counts = computed<Record<string, number>>(() => ({
  all: bookings.value.length,
  confirmed: bookings.value.filter((b) => b.status === 'confirmed').length,
  pending: bookings.value.filter((b) => b.status === 'pending').length,
  completed: bookings.value.filter((b) => b.status === 'completed').length,
}))

const sortByDate = (a: any, b: any) => (a.date as string).localeCompare(b.date)

const tabBookings = computed(() => {
  const list = activeTab.value === 'all'
    ? [...bookings.value]
    : bookings.value.filter((b) => b.status === activeTab.value)
  // Más recientes primero (fecha descendente).
  return list.sort((a, b) => sortByDate(b, a))
})

/** Destacamos la próxima reserva confirmada o pendiente (no la del tab actual). */
const upcomingHighlight = computed(() => {
  if (activeTab.value !== 'all') return null
  const todayIso = new Date().toISOString().slice(0, 10)
  return [...bookings.value]
    .filter((b) =>
      (b.status === 'confirmed' || b.status === 'pending')
      && typeof b.date === 'string'
      && b.date.slice(0, 10) >= todayIso,
    )
    .sort(sortByDate)[0] ?? null
})

const openCancelConfirm = (booking: any) => { bookingToCancel.value = booking; cancelDialog.value = true }
const confirmCancel = async () => {
  if (!bookingToCancel.value) return
  cancelLoading.value = bookingToCancel.value.id
  try {
    await apiFetch(`/bookings/${bookingToCancel.value.id}`, { method: 'DELETE' })
    const idx = bookings.value.findIndex((b) => b.id === bookingToCancel.value.id)
    if (idx !== -1) bookings.value[idx] = { ...bookings.value[idx], status: 'cancelled' }
    cancelDialog.value = false
    toast.success('Reserva cancelada')
  } catch (e: any) {
    toast.error(e?.data?.message || 'Error al cancelar')
  } finally { cancelLoading.value = false }
}

onMounted(loadBookings)
</script>

<style scoped>
.bookings-head { margin-bottom: 20px; }
.bookings-title {
  font-family: 'Sora', 'Manrope', sans-serif;
  font-weight: 800;
  letter-spacing: -0.02em;
  font-size: clamp(1.6rem, 3vw, 2.1rem);
  line-height: 1.15;
  color: var(--text-primary);
}
.bookings-sub {
  color: var(--text-muted);
  margin-top: 6px;
  font-size: .95rem;
}

/* Tabs segmented control */
.bookings-tabs {
  display: inline-flex;
  background: var(--bg-card);
  border: 1px solid var(--border-soft);
  border-radius: 12px;
  padding: 4px;
  gap: 2px;
  margin-bottom: 22px;
  overflow-x: auto;
  max-width: 100%;
  -webkit-overflow-scrolling: touch;
}
.bookings-tab {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  flex-shrink: 0;
  border: none;
  background: transparent;
  color: var(--text-muted);
  padding: 8px 16px;
  border-radius: 8px;
  font-size: .9rem;
  font-weight: 700;
  cursor: pointer;
  transition: background .2s ease, color .2s ease;
}
.bookings-tab:hover { color: var(--text-primary); }
.bookings-tab.is-active {
  background: var(--green-soft);
  color: var(--green-bright);
  border: 1px solid rgba(52, 198, 146, 0.32);
  box-shadow: var(--shadow-sm);
}
.bookings-tab-count {
  display: inline-grid;
  place-items: center;
  min-width: 20px;
  height: 20px;
  padding: 0 6px;
  border-radius: var(--radius-pill);
  background: var(--bg-elev);
  color: var(--text-muted);
  font-size: .68rem;
  font-weight: 800;
}
.bookings-tab.is-active .bookings-tab-count {
  background: rgba(52, 198, 146, 0.22);
  color: var(--green-bright);
}

/* Upcoming highlight */
.bookings-upcoming {
  margin-bottom: 28px;
  padding: 16px;
  border-radius: 18px;
  background: linear-gradient(135deg, rgba(47, 161, 138, 0.10), var(--bg-card));
  border: 1px solid rgba(47, 161, 138, 0.22);
}
.bookings-upcoming-label {
  font-size: .76rem;
  font-weight: 800;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: var(--green-primary);
  margin-bottom: 10px;
}

/* Lista */
.bookings-list {
  list-style: none;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

@media (max-width: 600px) {
  .bookings-tabs { display: flex; }
  .bookings-tab { padding: 8px 12px; font-size: .85rem; }
}
</style>
