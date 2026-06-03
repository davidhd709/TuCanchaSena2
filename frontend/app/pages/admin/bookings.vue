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
          variant="solo"
          flat
          density="compact"
          style="width:260px"
          class="rounded-lg"
        />
      </template>
    </PageHeader>

    <v-card rounded="xl" class="admin-shell-card pa-6">
      <v-data-table
        :headers="headers"
        :items="filteredBookings"
        :loading="loading"
        item-value="id"
        hover
        class="bookings-table-modern"
      >
        <template #item.court="{ item }">
          <div class="d-flex flex-column py-2">
            <span class="text-body-2 font-weight-bold">{{ item.court?.name ?? '—' }}</span>
            <span class="text-caption text-medium-emphasis">{{ item.court?.business?.name ?? '' }}</span>
          </div>
        </template>
        <template #item.client="{ item }">
          <span class="text-body-2 font-weight-medium">{{ item.user?.firstName }} {{ item.user?.lastName }}</span>
        </template>
        <template #item.datetime="{ item }">
          <div class="d-flex flex-column py-2">
            <span class="text-body-2 font-weight-medium">{{ new Date(item.date).toLocaleDateString() }}</span>
            <span class="text-caption text-medium-emphasis">{{ item.startTime }} – {{ item.endTime }}</span>
          </div>
        </template>
        <template #item.status="{ item }">
          <div class="d-flex justify-center">
            <BookingStatusChip :status="item.status" />
          </div>
        </template>
        <template #item.paymentProof="{ item }">
          <div class="d-flex justify-center">
            <v-btn
              v-if="item.paymentProof"
              icon="mdi-image-outline"
              variant="tonal"
              color="primary"
              size="small"
              :href="item.paymentProof"
              target="_blank"
              class="rounded-circle"
            />
            <span v-else class="text-caption text-medium-emphasis">—</span>
          </div>
        </template>
        <template #no-data>
          <EmptyState
            icon="mdi-calendar-remove-outline"
            title="Sin reservas registradas"
            description="Aún no hay reservas en el sistema."
            class="my-12"
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
