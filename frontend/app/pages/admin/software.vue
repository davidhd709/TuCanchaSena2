<template>
  <div>
    <PageHeader
      tag="Administración"
      title="Software / Landing"
      subtitle="Gestión de módulos del software"
    >
      <template #action>
        <v-btn color="primary" prepend-icon="mdi-plus" @click="openCreateDialog">
          Nuevo Software
        </v-btn>
      </template>
    </PageHeader>

    <v-row>
      <v-col v-for="sw in softwareList" :key="sw.id" cols="12" sm="6" lg="4">
        <v-card rounded="lg" hover class="admin-sw-card">
          <v-img
            v-if="sw.imagenes && sw.imagenes.length > 0"
            :src="sw.imagenes[0]"
            height="160"
            cover
            class="rounded-t-lg"
          />
          <div v-else class="d-flex align-center justify-center rounded-t-lg sw-placeholder" style="height:160px">
            <v-icon size="56" color="primary" style="opacity:0.4">mdi-image-outline</v-icon>
          </div>
          <v-card-text class="pa-4">
            <div class="d-flex align-center justify-space-between mb-2">
              <h3 class="text-subtitle-2 font-weight-bold">{{ sw.nombre }}</h3>
              <v-chip :color="sw.status === 'activo' ? 'success' : 'warning'" size="x-small" variant="tonal">
                {{ sw.status }}
              </v-chip>
            </div>
            <p class="text-body-2 text-medium-emphasis mb-3 line-clamp-2">{{ sw.descripcion }}</p>
            <div class="d-flex flex-wrap gap-1">
              <v-chip v-for="tag in sw.tags" :key="tag" size="x-small" variant="outlined">{{ tag }}</v-chip>
            </div>
          </v-card-text>
          <v-divider />
          <v-card-actions class="pa-3">
            <v-btn variant="text" size="small" prepend-icon="mdi-pencil" @click="openEditDialog(sw)">Editar</v-btn>
            <v-spacer />
            <v-btn icon="mdi-delete" variant="text" color="error" size="small" @click="confirmDelete(sw)" />
          </v-card-actions>
        </v-card>
      </v-col>
      <v-col v-if="loading" cols="12" class="text-center py-10">
        <v-progress-circular indeterminate color="primary" />
      </v-col>
      <v-col v-if="!loading && softwareList.length === 0" cols="12">
        <v-alert type="info" variant="tonal" rounded="lg">No hay software registrado.</v-alert>
      </v-col>
    </v-row>

    <!-- Create/Edit Dialog -->
    <SoftwareFormModal
      v-model="formDialog"
      :edit-mode="editMode"
      :initial="selectedSw"
      :loading="actionLoading"
      @save="saveSoftware"
    />

    <!-- Delete Dialog -->
    <AppConfirmDialog
      v-model="deleteDialog"
      title="Eliminar software"
      subtitle="Esta acción no se puede deshacer."
      icon="mdi-application-cog"
      confirm-text="Eliminar"
      :loading="actionLoading"
      @confirm="deleteSoftware"
    >
      <p class="text-body-2 text-medium-emphasis">
        Vas a eliminar <strong>{{ selectedSw?.nombre }}</strong>.
      </p>
    </AppConfirmDialog>

  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: 'dashboard', middleware: ['auth', 'role'] })

const { apiFetch } = useApi()
const { data: softwareList, loading, execute: loadSoftware } =
  useAsyncState<any[]>(() => apiFetch<any[]>('/software/admin'), [])
const formDialog = ref(false)
const deleteDialog = ref(false)
const editMode = ref(false)
const selectedSw = ref<any>(null)
const actionLoading = ref(false)
const toast = useToast()

const openCreateDialog = () => {
  editMode.value = false
  selectedSw.value = null
  formDialog.value = true
}

const openEditDialog = (sw: any) => {
  editMode.value = true
  selectedSw.value = sw
  formDialog.value = true
}

const confirmDelete = (sw: any) => { selectedSw.value = sw; deleteDialog.value = true }

// El payload llega validado desde SoftwareFormModal.
const saveSoftware = async (payload: any) => {
  actionLoading.value = true
  try {
    if (editMode.value) {
      const updated = await apiFetch<any>(`/software/${selectedSw.value.id}`, { method: 'PATCH', body: payload })
      const idx = softwareList.value.findIndex(s => s.id === selectedSw.value.id)
      if (idx !== -1) softwareList.value[idx] = updated
    } else {
      const created = await apiFetch<any>('/software', { method: 'POST', body: payload })
      softwareList.value.unshift(created)
    }
    formDialog.value = false
    toast.success(editMode.value ? 'Software actualizado' : 'Software creado')
  } catch (e: any) {
    toast.error(e?.data?.message || 'Error')
  } finally {
    actionLoading.value = false
  }
}

const deleteSoftware = async () => {
  actionLoading.value = true
  try {
    await apiFetch(`/software/${selectedSw.value.id}`, { method: 'DELETE' })
    softwareList.value = softwareList.value.filter(s => s.id !== selectedSw.value.id)
    toast.success('Software eliminado')
  } catch (e: any) {
    toast.error(e?.data?.message || 'Error')
  } finally {
    actionLoading.value = false
    deleteDialog.value = false
  }
}

onMounted(loadSoftware)
</script>

<style scoped>
.sw-placeholder {
  background:
    radial-gradient(circle at 30% 25%, rgba(52, 198, 146, 0.16), transparent 55%),
    linear-gradient(135deg, #182230 0%, #0f141a 100%);
  border-bottom: 1px solid var(--border-soft);
}
.admin-sw-card {
  border: 1px solid var(--border-soft);
  background: var(--bg-card) !important;
  border-radius: var(--radius-lg) !important;
}
:deep(.v-chip) {
  font-weight: 700;
}
:deep(.v-card-actions) {
  border-top: 1px solid var(--border-soft);
}
</style>
