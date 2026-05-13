<template>
  <div>
    <div class="d-flex align-center mb-6">
      <div>
        <h1 class="text-h5 font-weight-bold">Canchas</h1>
        <p class="text-body-2 text-medium-emphasis">Todas las canchas registradas en el sistema</p>
      </div>
      <v-spacer />
      <v-text-field
        v-model="search"
        placeholder="Buscar..."
        prepend-inner-icon="mdi-magnify"
        clearable
        hide-details
        style="max-width:260px"
        class="mr-3"
      />
    </div>

    <v-card rounded="lg">
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
          ${{ Number(item.pricePerHour).toLocaleString('es-CO') }}
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

    <v-dialog v-model="deleteDialog" max-width="400">
      <v-card rounded="lg">
        <v-card-title class="text-subtitle-1 font-weight-bold pa-5 pb-3">Eliminar Cancha</v-card-title>
        <v-card-text>¿Eliminar <strong>{{ selectedCourt?.name }}</strong>?</v-card-text>
        <v-card-actions class="pa-4 pt-0">
          <v-spacer />
          <v-btn variant="text" @click="deleteDialog = false">Cancelar</v-btn>
          <v-btn color="error" variant="tonal" :loading="actionLoading" @click="deleteCourt">Eliminar</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-snackbar v-model="snackbar.show" :color="snackbar.color" rounded="lg">{{ snackbar.text }}</v-snackbar>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: 'dashboard', middleware: ['auth', 'role'] })

const { apiFetch } = useApi()
const courts = ref<any[]>([])
const loading = ref(false)
const search = ref('')
const deleteDialog = ref(false)
const selectedCourt = ref<any>(null)
const actionLoading = ref(false)
const snackbar = reactive({ show: false, text: '', color: 'success' })

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
    snackbar.text = 'Cancha eliminada'
    snackbar.color = 'success'
  } catch (e: any) {
    snackbar.text = e?.data?.message || 'Error'
    snackbar.color = 'error'
  } finally {
    actionLoading.value = false
    deleteDialog.value = false
    snackbar.show = true
  }
}

onMounted(async () => {
  loading.value = true
  try { courts.value = await apiFetch<any[]>('/courts') }
  finally { loading.value = false }
})
</script>
