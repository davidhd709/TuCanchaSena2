<template>
  <div>
    <div class="d-flex align-center mb-6">
      <div>
        <h1 class="text-h5 font-weight-bold">Todas las Reservas</h1>
        <p class="text-body-2 text-medium-emphasis">Historial global de reservas</p>
      </div>
      <v-spacer />
      <v-select
        v-model="statusFilter"
        :items="statusOptions"
        label="Filtrar por estado"
        clearable
        hide-details
        style="max-width:220px"
      />
    </div>

    <v-card rounded="lg">
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
            v-if="item.paymentProofUrl"
            icon="mdi-image"
            variant="text"
            color="primary"
            size="small"
            :href="item.paymentProofUrl"
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

const { apiFetch } = useApi()
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
  try { bookings.value = await apiFetch<any[]>('/bookings') }
  catch { fetchError.value = true }
  finally { loading.value = false }
}

onMounted(loadBookings)
</script>
