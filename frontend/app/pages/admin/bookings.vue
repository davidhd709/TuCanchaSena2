<template>
  <div>
    <PageHeader
      tag="Administración"
      title="Todas las Reservas"
      subtitle="Historial global de reservas"
    >
      <template #action>
        <v-select
          v-model="statusFilter"
          :items="statusOptions"
          label="Filtrar por estado"
          clearable
          hide-details
          style="max-width:220px"
        />
      </template>
    </PageHeader>

    <v-card rounded="lg" class="admin-shell-card">
      <v-data-table
        :headers="headers"
        :items="filteredBookings"
        :loading="loading"
        item-value="id"
        hover
      >
        <template #item.court="{ item }">
          <div class="text-body-2 font-weight-medium">{{ item.court?.name ?? '—' }}</div>
          <div class="text-caption text-medium-emphasis">{{ item.court?.business?.name ?? '' }}</div>
        </template>
        <template #item.client="{ item }">
          {{ item.user?.firstName }} {{ item.user?.lastName }}
        </template>
        <template #item.datetime="{ item }">
          <div class="text-body-2">{{ item.date }}</div>
          <div class="text-caption text-medium-emphasis">{{ item.startTime }} – {{ item.endTime }}</div>
        </template>
        <template #item.status="{ item }">
          <BookingStatusChip :status="item.status" />
        </template>
        <template #item.paymentProof="{ item }">
          <v-btn
            v-if="item.paymentProof"
            icon="mdi-image"
            variant="text"
            color="primary"
            size="small"
            :href="item.paymentProof"
            target="_blank"
            aria-label="Ver comprobante de pago"
          />
          <span v-else class="text-caption text-medium-emphasis">—</span>
        </template>
        <template #no-data>
          <EmptyState
            icon="mdi-calendar-remove-outline"
            title="Sin reservas registradas"
            description="Aún no hay reservas en el sistema."
            class="my-4"
          />
        </template>
      </v-data-table>
    </v-card>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: 'dashboard', middleware: ['auth', 'role'] })

const { apiList } = useApi()
const bookings = ref<any[]>([])
const loading = ref(false)
const statusFilter = ref<string | null>(null)

const statusOptions = [
  { title: 'Pendiente', value: 'pending' },
  { title: 'Confirmada', value: 'confirmed' },
  { title: 'Cancelada', value: 'cancelled' },
  { title: 'Completada', value: 'completed' },
  { title: 'No Show', value: 'no_show' },
]

const headers = [
  { title: 'Cancha', key: 'court', sortable: false },
  { title: 'Cliente', key: 'client', sortable: false },
  { title: 'Fecha y hora', key: 'datetime', sortable: false },
  { title: 'Estado', key: 'status' },
  { title: 'Método de pago', key: 'paymentMethod' },
  { title: 'Comprobante', key: 'paymentProof', sortable: false },
]

const filteredBookings = computed(() => {
  if (!statusFilter.value) return bookings.value
  return bookings.value.filter(b => b.status === statusFilter.value)
})

const fetchError = ref(false)

const loadBookings = async () => {
  loading.value = true
  fetchError.value = false
  try { bookings.value = await apiList<any>('/bookings') }
  catch { fetchError.value = true }
  finally { loading.value = false }
}

onMounted(loadBookings)
</script>

<style scoped>
.admin-shell-card {
  border: 1px solid var(--border-soft);
  background: var(--bg-card) !important;
  border-radius: var(--radius-lg) !important;
}
:deep(.v-data-table .v-table__wrapper table tbody tr:hover) {
  background: var(--green-soft);
}
:deep(.v-data-table .v-table__wrapper table tbody td) {
  padding-top: 10px !important;
  padding-bottom: 10px !important;
}
:deep(.v-data-table .v-table__wrapper table thead th) {
  font-size: 0.72rem !important;
  letter-spacing: 0.08em;
}
</style>
