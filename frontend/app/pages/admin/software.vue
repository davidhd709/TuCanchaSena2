<template>
  <div>
    <div class="d-flex align-center mb-6">
      <div>
        <h1 class="text-h5 font-weight-bold">Software / Landing</h1>
        <p class="text-body-2 text-medium-emphasis">Gestión de módulos del software</p>
      </div>
      <v-spacer />
      <v-btn color="primary" prepend-icon="mdi-plus" @click="openCreateDialog">
        Nuevo Software
      </v-btn>
    </div>

    <v-row>
      <v-col v-for="sw in softwareList" :key="sw.id" cols="12" sm="6" lg="4">
        <v-card rounded="lg" hover>
          <v-img
            v-if="sw.imagenes && sw.imagenes.length > 0"
            :src="sw.imagenes[0]"
            height="160"
            cover
            class="rounded-t-lg"
          />
          <div v-else class="d-flex align-center justify-center bg-grey-lighten-4 rounded-t-lg" style="height:160px">
            <v-icon size="56" color="grey-lighten-1">mdi-image-outline</v-icon>
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
    <v-dialog v-model="formDialog" max-width="560">
      <v-card rounded="lg">
        <v-card-title class="text-subtitle-1 font-weight-bold pa-5 pb-3">
          {{ editMode ? 'Editar Software' : 'Crear Software' }}
        </v-card-title>
        <v-card-text>
          <v-form ref="formRef">
            <v-text-field v-model="form.nombre" label="Nombre" :rules="[r.required]" class="mb-2" />
            <v-textarea v-model="form.descripcion" label="Descripción" rows="2" class="mb-2" />
            <v-text-field v-model="form.version" label="Versión" class="mb-2" />
            <v-select
              v-model="form.status"
              label="Estado"
              :items="[{title:'Activo',value:'activo'},{title:'Inactivo',value:'inactivo'}]"
              class="mb-2"
            />
            <v-combobox
              v-model="form.tags"
              label="Tags (Enter para agregar)"
              multiple
              chips
              closable-chips
              class="mb-2"
            />
          </v-form>
        </v-card-text>
        <v-card-actions class="pa-4 pt-0">
          <v-spacer />
          <v-btn variant="text" @click="formDialog = false">Cancelar</v-btn>
          <v-btn color="primary" :loading="actionLoading" @click="saveSoftware">
            {{ editMode ? 'Guardar' : 'Crear' }}
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Delete Dialog -->
    <v-dialog v-model="deleteDialog" max-width="400">
      <v-card rounded="lg">
        <v-card-title class="text-subtitle-1 font-weight-bold pa-5 pb-3">Eliminar Software</v-card-title>
        <v-card-text>¿Eliminar <strong>{{ selectedSw?.nombre }}</strong>?</v-card-text>
        <v-card-actions class="pa-4 pt-0">
          <v-spacer />
          <v-btn variant="text" @click="deleteDialog = false">Cancelar</v-btn>
          <v-btn color="error" variant="tonal" :loading="actionLoading" @click="deleteSoftware">Eliminar</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-snackbar v-model="snackbar.show" :color="snackbar.color" rounded="lg">{{ snackbar.text }}</v-snackbar>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: 'dashboard', middleware: ['auth', 'role'] })

const { apiFetch } = useApi()
const softwareList = ref<any[]>([])
const loading = ref(false)
const formDialog = ref(false)
const deleteDialog = ref(false)
const editMode = ref(false)
const selectedSw = ref<any>(null)
const actionLoading = ref(false)
const formRef = ref()
const snackbar = reactive({ show: false, text: '', color: 'success' })

const form = reactive({ nombre: '', descripcion: '', version: '', status: 'activo', tags: [] as string[] })
const r = { required: (v: string) => !!v || 'Requerido' }

const openCreateDialog = () => {
  editMode.value = false
  Object.assign(form, { nombre: '', descripcion: '', version: '', status: 'activo', tags: [] })
  formDialog.value = true
}

const openEditDialog = (sw: any) => {
  editMode.value = true
  selectedSw.value = sw
  Object.assign(form, { nombre: sw.nombre, descripcion: sw.descripcion, version: sw.version, status: sw.status, tags: sw.tags ?? [] })
  formDialog.value = true
}

const confirmDelete = (sw: any) => { selectedSw.value = sw; deleteDialog.value = true }

const saveSoftware = async () => {
  const { valid } = await formRef.value.validate()
  if (!valid) return
  actionLoading.value = true
  try {
    if (editMode.value) {
      const updated = await apiFetch<any>(`/software/${selectedSw.value.id}`, { method: 'PATCH', body: form })
      const idx = softwareList.value.findIndex(s => s.id === selectedSw.value.id)
      if (idx !== -1) softwareList.value[idx] = updated
    } else {
      const created = await apiFetch<any>('/software', { method: 'POST', body: form })
      softwareList.value.unshift(created)
    }
    formDialog.value = false
    snackbar.text = editMode.value ? 'Software actualizado' : 'Software creado'
    snackbar.color = 'success'
  } catch (e: any) {
    snackbar.text = e?.data?.message || 'Error'
    snackbar.color = 'error'
  } finally {
    actionLoading.value = false
    snackbar.show = true
  }
}

const deleteSoftware = async () => {
  actionLoading.value = true
  try {
    await apiFetch(`/software/${selectedSw.value.id}`, { method: 'DELETE' })
    softwareList.value = softwareList.value.filter(s => s.id !== selectedSw.value.id)
    snackbar.text = 'Software eliminado'
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
  try { softwareList.value = await apiFetch<any[]>('/software/admin') }
  finally { loading.value = false }
})
</script>
