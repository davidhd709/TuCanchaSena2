<template>
  <div>
    <PageHeader
      tag="Administración"
      title="Canchas"
      subtitle="Todas las canchas registradas en el sistema"
    >
      <template #action>
        <v-text-field
          v-model="search"
          placeholder="Buscar..."
          prepend-inner-icon="mdi-magnify"
          clearable
          hide-details
          style="max-width:260px"
        />
      </template>
    </PageHeader>

    <v-card rounded="lg" class="admin-shell-card">
      <v-data-table
        :headers="headers"
        :items="filteredCourts"
        :loading="loading"
        item-value="id"
        hover
      >
        <template #item.name="{ item }">
          <div class="d-flex align-center gap-3 py-1">
            <v-avatar color="success" variant="tonal" size="36" rounded="lg">
              <v-icon size="18">mdi-soccer-field</v-icon>
            </v-avatar>
            <div>
              <div class="text-body-2 font-weight-medium">{{ item.name }}</div>
              <div class="text-caption text-medium-emphasis">{{ item.business?.name }}</div>
            </div>
          </div>
        </template>
        <template #item.type="{ item }">
          <v-chip color="primary" size="small" variant="tonal">{{ courtTypeLabel(item.type) }}</v-chip>
        </template>
        <template #item.pricePerHour="{ item }">
          {{ formatCurrency(item.pricePerHour) }}
        </template>
        <template #item.status="{ item }">
          <v-chip :color="item.status === 'available' ? 'success' : 'warning'" size="small" variant="tonal">
            {{ item.status === 'available' ? 'Disponible' : 'No disponible' }}
          </v-chip>
        </template>
        <template #item.actions="{ item }">
          <v-btn icon="mdi-delete" variant="text" color="error" size="small" @click="confirmDelete(item)" />
        </template>
      </v-data-table>
    </v-card>

    <AppConfirmDialog
      v-model="deleteDialog"
      title="Eliminar cancha"
      subtitle="Esta acción no se puede deshacer."
      icon="mdi-soccer-field"
      confirm-text="Eliminar"
      :loading="actionLoading"
      @confirm="deleteCourt"
    >
      <p class="text-body-2 text-medium-emphasis">
        Vas a eliminar <strong>{{ selectedCourt?.name }}</strong>.
      </p>
    </AppConfirmDialog>

  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: 'dashboard', middleware: ['auth', 'role'] })

const { apiFetch, apiList } = useApi()
const { data: courts, loading, execute: loadCourts } =
  useAsyncState<any[]>(() => apiList<any>('/courts'), [])
const search = ref('')
const deleteDialog = ref(false)
const selectedCourt = ref<any>(null)
const actionLoading = ref(false)
const toast = useToast()

const headers = [
  { title: 'Cancha', key: 'name', sortable: false },
  { title: 'Tipo', key: 'type' },
  { title: 'Precio/hora', key: 'pricePerHour' },
  { title: 'Jugadores', key: 'capacity' },
  { title: 'Estado', key: 'status' },
  { title: 'Acciones', key: 'actions', sortable: false, align: 'end' as const },
]

const filteredCourts = computed(() => {
  if (!search.value) return courts.value
  const q = search.value.toLowerCase()
  return courts.value.filter(c =>
    c.name.toLowerCase().includes(q) || c.business?.name?.toLowerCase().includes(q)
  )
})

const courtTypeLabel = (type: string) => {
  const map: Record<string, string> = {
    football_5: 'Fútbol 5', football_7: 'Fútbol 7', football_8: 'Fútbol 8',
    football_11: 'Fútbol 11', futsal: 'Futsal', beach_soccer: 'Fútbol Playa',
    mini_football: 'Mini Fútbol',
  }
  return map[type] ?? type
}

const confirmDelete = (c: any) => { selectedCourt.value = c; deleteDialog.value = true }

const deleteCourt = async () => {
  actionLoading.value = true
  try {
    await apiFetch(`/courts/${selectedCourt.value.id}`, { method: 'DELETE' })
    courts.value = courts.value.filter(c => c.id !== selectedCourt.value.id)
    toast.success('Cancha eliminada')
  } catch (e: any) {
    toast.error(e?.data?.message || 'Error')
  } finally {
    actionLoading.value = false
    deleteDialog.value = false
  }
}

onMounted(loadCourts)
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
:deep(.v-chip) {
  font-weight: 700;
}
</style>
