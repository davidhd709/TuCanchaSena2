<template>
  <div>
    <div class="d-flex align-center mb-6">
      <div>
        <h1 class="text-h5 font-weight-bold">Negocios</h1>
        <p class="text-body-2 text-medium-emphasis">Gestión de negocios registrados</p>
      </div>
      <v-spacer />
      <v-btn color="primary" prepend-icon="mdi-plus" @click="openCreate">
        Nuevo Negocio
      </v-btn>
    </div>

    <!-- Cards grid -->
    <v-row>
      <v-col
        v-for="biz in businesses"
        :key="biz.id"
        cols="12" sm="6" lg="4"
      >
        <v-card rounded="lg" hover>
          <v-card-text class="pa-5">
            <div class="d-flex align-center mb-3">
              <v-avatar color="primary" variant="tonal" size="48" rounded="lg" class="mr-3">
                <v-icon>mdi-store</v-icon>
              </v-avatar>
              <div class="flex-1-1">
                <div class="text-subtitle-2 font-weight-bold">{{ biz.name }}</div>
                <div class="text-caption text-medium-emphasis">{{ biz.address }}</div>
              </div>
              <v-chip :color="biz.isActive ? 'success' : 'error'" size="x-small" variant="tonal">
                {{ biz.isActive ? 'Activo' : 'Inactivo' }}
              </v-chip>
            </div>

            <p class="text-body-2 text-medium-emphasis mb-3 line-clamp-2">
              {{ biz.description || 'Sin descripción' }}
            </p>

            <!-- Owner -->
            <div v-if="biz.owner" class="d-flex align-center gap-1 text-caption text-medium-emphasis mb-1">
              <v-icon size="13">mdi-account</v-icon>
              {{ biz.owner.firstName }} {{ biz.owner.lastName }}
            </div>

            <!-- Schedule summary -->
            <div class="d-flex flex-wrap gap-1 mt-2">
              <v-chip
                v-for="s in openDays(biz.schedules)"
                :key="s.dayOfWeek"
                size="x-small"
                color="primary"
                variant="tonal"
              >
                {{ dayShort(s.dayOfWeek) }} {{ s.openTime.slice(0,5) }}-{{ s.closeTime.slice(0,5) }}
              </v-chip>
              <v-chip
                v-if="!biz.schedules || biz.schedules.length === 0"
                size="x-small"
                color="warning"
                variant="tonal"
              >
                Sin horario
              </v-chip>
            </div>
          </v-card-text>

          <v-divider />
          <v-card-actions class="pa-3">
            <v-btn variant="text" size="small" prepend-icon="mdi-pencil" @click="openEdit(biz)">
              Editar
            </v-btn>
            <v-spacer />
            <v-btn icon="mdi-delete" variant="text" color="error" size="small" @click="openDeleteConfirm(biz)" />
          </v-card-actions>
        </v-card>
      </v-col>

      <v-col v-if="loading" cols="12" class="text-center py-10">
        <v-progress-circular indeterminate color="primary" />
      </v-col>
      <v-col v-if="!loading && businesses.length === 0" cols="12">
        <v-alert type="info" variant="tonal" rounded="lg">No hay negocios registrados.</v-alert>
      </v-col>
    </v-row>

    <!-- ─── Create / Edit Dialog ────────────────────────────────────────── -->
    <v-dialog v-model="formDialog" max-width="680" scrollable>
      <v-card rounded="lg">
        <v-card-title class="text-subtitle-1 font-weight-bold pa-5 pb-3">
          {{ editMode ? 'Editar Negocio' : 'Crear Nuevo Negocio' }}
        </v-card-title>
        <v-divider />

        <v-card-text class="pa-5" style="max-height:75vh">
          <v-form ref="formRef">

            <!-- Section: Datos básicos -->
            <p class="text-caption font-weight-bold text-medium-emphasis text-uppercase mb-3">
              Información General
            </p>

            <!-- Owner (only on create) -->
            <v-autocomplete
              v-if="!editMode"
              v-model="form.ownerId"
              label="Propietario (usuario con rol Negocio)"
              :items="businessUsers"
              item-title="label"
              item-value="id"
              prepend-inner-icon="mdi-account"
              :rules="[r.required]"
              class="mb-2"
              :loading="usersLoading"
              no-data-text="No hay usuarios con rol Negocio"
            />

            <v-text-field
              v-model="form.name"
              label="Nombre del negocio"
              prepend-inner-icon="mdi-store"
              :rules="[r.required]"
              class="mb-2"
            />

            <v-textarea
              v-model="form.description"
              label="Descripción"
              rows="2"
              class="mb-2"
            />

            <v-row dense>
              <v-col cols="12" sm="6">
                <v-text-field
                  v-model="form.phone"
                  label="Teléfono"
                  prepend-inner-icon="mdi-phone"
                  :rules="[r.required]"
                />
              </v-col>
              <v-col cols="12" sm="6">
                <v-text-field
                  v-model="form.email"
                  label="Email del negocio"
                  type="email"
                  prepend-inner-icon="mdi-email"
                />
              </v-col>
            </v-row>

            <v-text-field
              v-model="form.address"
              label="Dirección"
              prepend-inner-icon="mdi-map-marker"
              :rules="[r.required]"
              class="mb-2"
            />

            <v-row dense>
              <v-col cols="6">
                <v-text-field
                  v-model.number="form.latitude"
                  label="Latitud"
                  type="number"
                  prepend-inner-icon="mdi-crosshairs-gps"
                  :rules="[r.required, r.lat]"
                  hint="Ej: 4.6097"
                  persistent-hint
                />
              </v-col>
              <v-col cols="6">
                <v-text-field
                  v-model.number="form.longitude"
                  label="Longitud"
                  type="number"
                  prepend-inner-icon="mdi-crosshairs-gps"
                  :rules="[r.required, r.lon]"
                  hint="Ej: -74.0817"
                  persistent-hint
                />
              </v-col>
            </v-row>

            <v-divider class="my-4" />

            <!-- Section: Horario -->
            <p class="text-caption font-weight-bold text-medium-emphasis text-uppercase mb-3">
              Horario de Funcionamiento
            </p>
            <!-- :key fuerza remount al abrir el diálogo, evitando loops reactivos -->
            <BusinessScheduleEditor :key="scheduleEditorKey" v-model="form.schedules" />

          </v-form>
        </v-card-text>

        <v-divider />
        <v-card-actions class="pa-4">
          <v-spacer />
          <v-btn variant="text" @click="formDialog = false">Cancelar</v-btn>
          <v-btn color="primary" variant="flat" :loading="actionLoading" @click="saveBusiness">
            {{ editMode ? 'Guardar cambios' : 'Crear negocio' }}
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Delete confirm -->
    <v-dialog v-model="deleteDialog" max-width="420">
      <v-card rounded="lg">
        <v-card-text class="pa-6 text-center">
          <v-icon size="56" color="error" class="mb-3">mdi-store-remove</v-icon>
          <h3 class="text-subtitle-1 font-weight-bold mb-2">Desactivar Negocio</h3>
          <p class="text-body-2 text-medium-emphasis">
            ¿Desactivar <strong>{{ selectedBiz?.name }}</strong>?
            Sus canchas y reservas activas seguirán existiendo pero el negocio no será visible.
          </p>
        </v-card-text>
        <v-card-actions class="pa-4 pt-0">
          <v-spacer />
          <v-btn variant="text" @click="deleteDialog = false">Cancelar</v-btn>
          <v-btn color="error" variant="flat" :loading="actionLoading" @click="deleteBusiness">
            Desactivar
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-snackbar v-model="snackbar.show" :color="snackbar.color" rounded="lg" location="bottom end">
      {{ snackbar.text }}
    </v-snackbar>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: 'dashboard', middleware: ['auth', 'role'] })

const { apiFetch } = useApi()

// ── State ──────────────────────────────────────────────────────────────────
const businesses = ref<any[]>([])
const businessUsers = ref<any[]>([])
const loading = ref(false)
const usersLoading = ref(false)
const formDialog = ref(false)
const scheduleEditorKey = ref(0)
const deleteDialog = ref(false)
const editMode = ref(false)
const selectedBiz = ref<any>(null)
const actionLoading = ref(false)
const formRef = ref()
const snackbar = reactive({ show: false, text: '', color: 'success' })

// ── Form ───────────────────────────────────────────────────────────────────
const defaultSchedules = () => [
  { dayOfWeek: 'monday', openTime: '08:00', closeTime: '22:00', isOpen: true },
  { dayOfWeek: 'tuesday', openTime: '08:00', closeTime: '22:00', isOpen: true },
  { dayOfWeek: 'wednesday', openTime: '08:00', closeTime: '22:00', isOpen: true },
  { dayOfWeek: 'thursday', openTime: '08:00', closeTime: '22:00', isOpen: true },
  { dayOfWeek: 'friday', openTime: '08:00', closeTime: '22:00', isOpen: true },
  { dayOfWeek: 'saturday', openTime: '08:00', closeTime: '22:00', isOpen: true },
  { dayOfWeek: 'sunday', openTime: '08:00', closeTime: '22:00', isOpen: false },
]

const form = reactive({
  ownerId: '',
  name: '',
  description: '',
  phone: '',
  email: '',
  address: '',
  latitude: 0,
  longitude: 0,
  schedules: defaultSchedules() as Array<{
    dayOfWeek: string; openTime: string; closeTime: string; isOpen: boolean
  }>,
})

// ── Validation ─────────────────────────────────────────────────────────────
const r = {
  required: (v: any) => (v !== '' && v !== null && v !== undefined) || 'Requerido',
  lat: (v: number) => (v >= -90 && v <= 90) || 'Latitud entre -90 y 90',
  lon: (v: number) => (v >= -180 && v <= 180) || 'Longitud entre -180 y 180',
}

// ── Helpers ────────────────────────────────────────────────────────────────
const dayShort = (d: string) => {
  const m: Record<string, string> = {
    monday: 'Lun', tuesday: 'Mar', wednesday: 'Mié',
    thursday: 'Jue', friday: 'Vie', saturday: 'Sáb', sunday: 'Dom',
  }
  return m[d] ?? d
}

const openDays = (schedules: any[]) =>
  (schedules ?? []).filter(s => s.isOpen)

const notify = (text: string, color = 'success') => {
  snackbar.text = text; snackbar.color = color; snackbar.show = true
}

// ── CRUD ───────────────────────────────────────────────────────────────────
const openCreate = async () => {
  editMode.value = false
  Object.assign(form, {
    ownerId: '', name: '', description: '', phone: '', email: '',
    address: '', latitude: 0, longitude: 0, schedules: defaultSchedules(),
  })
  scheduleEditorKey.value++   // remount editor con datos frescos
  formDialog.value = true
  // Load business-role users
  if (businessUsers.value.length === 0) {
    usersLoading.value = true
    try {
      const users = await apiFetch<any[]>('/users')
      businessUsers.value = users
        .filter(u => u.role === 'bussines' && u.isActive)
        .map(u => ({ id: u.id, label: `${u.firstName} ${u.lastName} (${u.email})` }))
    } finally {
      usersLoading.value = false
    }
  }
}

const openEdit = (biz: any) => {
  editMode.value = true
  selectedBiz.value = biz
  form.ownerId = biz.ownerId
  form.name = biz.name
  form.description = biz.description ?? ''
  form.phone = biz.phone ?? ''
  form.email = biz.email ?? ''
  form.address = biz.address ?? ''
  form.latitude = Number(biz.latitude ?? 0)
  form.longitude = Number(biz.longitude ?? 0)
  // Map existing schedules, fill missing days as closed
  const allDays = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']
  form.schedules = allDays.map(day => {
    const existing = (biz.schedules ?? []).find((s: any) => s.dayOfWeek === day)
    return existing
      ? { dayOfWeek: day, openTime: existing.openTime.slice(0, 5), closeTime: existing.closeTime.slice(0, 5), isOpen: existing.isOpen }
      : { dayOfWeek: day, openTime: '08:00', closeTime: '22:00', isOpen: false }
  })
  scheduleEditorKey.value++   // remount editor con datos del negocio seleccionado
  formDialog.value = true
}

const saveBusiness = async () => {
  const { valid } = await formRef.value.validate()
  if (!valid) return

  // Only include open days in schedules
  const schedulesToSend = form.schedules.filter(s => s.isOpen)

  actionLoading.value = true
  try {
    const payload: any = {
      name: form.name,
      description: form.description || undefined,
      phone: form.phone,
      email: form.email || undefined,
      address: form.address,
      latitude: form.latitude,
      longitude: form.longitude,
      schedules: schedulesToSend,
    }

    if (!editMode.value) {
      payload.ownerId = form.ownerId
      const created = await apiFetch<any>('/businesses', { method: 'POST', body: payload })
      businesses.value.unshift(created)
      notify('Negocio creado exitosamente')
    } else {
      const updated = await apiFetch<any>(`/businesses/${selectedBiz.value.id}`, {
        method: 'PATCH',
        body: payload,
      })
      const idx = businesses.value.findIndex(b => b.id === selectedBiz.value.id)
      if (idx !== -1) businesses.value[idx] = updated
      notify('Negocio actualizado correctamente')
    }
    formDialog.value = false
  } catch (e: any) {
    notify(e?.data?.message || 'Error al guardar negocio', 'error')
  } finally {
    actionLoading.value = false
  }
}

const openDeleteConfirm = (biz: any) => {
  selectedBiz.value = biz
  deleteDialog.value = true
}

const deleteBusiness = async () => {
  actionLoading.value = true
  try {
    await apiFetch(`/businesses/${selectedBiz.value.id}`, { method: 'DELETE' })
    businesses.value = businesses.value.filter(b => b.id !== selectedBiz.value.id)
    notify('Negocio desactivado')
    deleteDialog.value = false
  } catch (e: any) {
    notify(e?.data?.message || 'Error', 'error')
  } finally {
    actionLoading.value = false
  }
}

// ── Load ───────────────────────────────────────────────────────────────────
onMounted(async () => {
  loading.value = true
  try {
    businesses.value = await apiFetch<any[]>('/businesses')
  } finally {
    loading.value = false
  }
})
</script>
