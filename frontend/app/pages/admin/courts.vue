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

    <!-- Cards grid (mismo diseño que negocio/cliente) -->
    <v-row>
      <v-col v-for="court in filteredCourts" :key="court.id" cols="12" sm="6" lg="4">
        <v-card rounded="lg" hover class="admin-card">
          <v-card-text class="pa-5">
            <div class="d-flex align-center mb-3">
              <v-avatar color="success" variant="tonal" size="48" rounded="lg" class="mr-3">
                <v-icon>mdi-soccer-field</v-icon>
              </v-avatar>
              <div class="flex-1-1" style="min-width:0">
                <div class="text-subtitle-2 font-weight-bold line-clamp-1">{{ court.name }}</div>
                <div class="text-caption text-medium-emphasis line-clamp-1">{{ court.business?.name }}</div>
              </div>
              <v-chip :color="court.status === 'available' ? 'success' : 'warning'" size="x-small" variant="tonal">
                {{ court.status === 'available' ? 'Disponible' : 'No disponible' }}
              </v-chip>
            </div>

            <div class="d-flex flex-wrap gap-2">
              <v-chip color="primary" size="small" variant="tonal">{{ courtTypeLabel(court.type) }}</v-chip>
              <v-chip size="small" variant="tonal" prepend-icon="mdi-cash">
                {{ formatCurrency(court.pricePerHour) }}/hr
              </v-chip>
              <v-chip size="small" variant="tonal" prepend-icon="mdi-account-group-outline">
                {{ court.capacity ?? '—' }} jug.
              </v-chip>
            </div>
          </v-card-text>

          <v-divider />
          <v-card-actions class="pa-3">
            <v-spacer />
            <v-btn icon="mdi-delete" variant="text" color="error" size="small" @click="confirmDelete(court)" />
          </v-card-actions>
        </v-card>
      </v-col>

      <v-col v-if="loading" cols="12" class="text-center py-10">
        <v-progress-circular indeterminate color="primary" />
      </v-col>
      <v-col v-if="!loading && filteredCourts.length === 0" cols="12">
        <v-alert type="info" variant="tonal" rounded="lg">No hay canchas registradas.</v-alert>
      </v-col>
    </v-row>

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
.admin-card {
  border: 1px solid var(--border-soft);
  background: var(--bg-card) !important;
  border-radius: var(--radius-lg) !important;
  height: 100%;
}
.line-clamp-1 {
  display: -webkit-box;
  -webkit-line-clamp: 1;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
:deep(.v-chip) { font-weight: 700; }
</style>
