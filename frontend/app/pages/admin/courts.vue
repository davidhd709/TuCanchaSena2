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
          placeholder="Buscar canchas..."
          prepend-inner-icon="mdi-magnify"
          clearable
          hide-details
          variant="outlined"
          density="compact"
          style="width:300px"
          class="custom-search-field rounded-lg"
        />
      </template>
    </PageHeader>

    <v-row class="pa-4">
      <v-col v-for="court in filteredCourts" :key="court.id" cols="12" sm="6" lg="4">
        <v-card rounded="xl" hover class="admin-card-modern">
          <v-img
            :src="court.image || 'https://cdn.vuetifyjs.com/images/cards/castle.jpg'"
            height="200"
            cover
            class="rounded-t-xl"
          >
            <div class="d-flex justify-end pa-3">
              <v-chip 
                :color="court.status === 'available' ? 'success' : 'warning'" 
                size="small" 
                class="status-chip font-weight-bold"
                variant="flat"
              >
                {{ court.status === 'available' ? 'Disponible' : 'No disponible' }}
              </v-chip>
            </div>
          </v-img>

          <v-card-text class="pa-6">
            <div class="mb-6">
              <div class="text-h6 font-weight-bold mb-1 line-clamp-1">{{ court.name }}</div>
              <div class="text-caption text-medium-emphasis d-flex align-center">
                <v-icon size="14" class="mr-1">mdi-office-building</v-icon>
                {{ court.business?.name }}
              </div>
            </div>

            <div class="d-flex justify-between align-center py-4 border-y">
              <div class="d-flex flex-column align-center flex-1-1">
                <span class="text-overline text-medium-emphasis" style="font-size: 0.6rem">Tipo</span>
                <span class="text-body-2 font-weight-bold">{{ courtTypeLabel(court.type) }}</span>
              </div>
              <v-divider vertical inset />
              <div class="d-flex flex-column align-center flex-1-1">
                <span class="text-overline text-medium-emphasis" style="font-size: 0.6rem">Precio</span>
                <span class="text-body-2 font-weight-bold text-primary">{{ formatCurrency(court.pricePerHour) }}</span>
              </div>
              <v-divider vertical inset />
              <div class="d-flex flex-column align-center flex-1-1">
                <span class="text-overline text-medium-emphasis" style="font-size: 0.6rem">Capacidad</span>
                <span class="text-body-2 font-weight-bold">{{ court.capacity ?? '—' }} jug.</span>
              </div>
            </div>
          </v-card-text>

          <v-card-actions class="pa-4 pt-0 d-flex justify-end">
            <v-btn 
              icon="mdi-delete" 
              variant="tonal" 
              color="error" 
              size="small" 
              @click="confirmDelete(court)"
              class="rounded-lg"
            />
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

/* FIX: Borde doble en el buscador */
:deep(.custom-search-field .v-field__outline) {
  display: none !important;
}
:deep(.custom-search-field .v-field) {
  border: 1px solid var(--border-soft) !important;
  border-radius: 8px !important;
  transition: border-color 0.2s ease !important;
  box-shadow: none !important;
  outline: none !important;
}
:deep(.custom-search-field .v-field--focused) {
  border-color: var(--primary) !important;
  box-shadow: none !important;
  outline: none !important;
}
:deep(.custom-search-field input) {
  box-shadow: none !important;
  outline: none !important;
  border: none !important;
}
:deep(.custom-search-field .v-field__outline__start),
:deep(.custom-search-field .v-field__outline__end),
:deep(.custom-search-field .v-field__outline__gap) {
  display: none !important;
}

/* FIX: Etiqueta Disponible completa */
.status-chip {
  min-width: 90px !important;
  text-align: center !important;
  padding: 0 12px !important;
}

/* Modern Card Styles */
.admin-card-modern {
  border: 1px solid var(--border-soft) !important;
  background: var(--bg-card) !important;
  transition: transform 0.2s ease, box-shadow 0.2s ease !important;
}
.admin-card-modern:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 24px rgba(0,0,0,0.3) !important;
}
.border-y {
  border-top: 1px solid var(--border-soft) !important;
  border-bottom: 1px solid var(--border-soft) !important;
}
</style>
