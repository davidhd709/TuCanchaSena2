<template>
  <div>
    <div class="d-flex align-center mb-6">
      <div>
        <h1 class="text-h5 font-weight-bold">Mis Negocios</h1>
        <p class="text-body-2 text-medium-emphasis">Administra tus establecimientos</p>
      </div>
    </div>

    <v-row>
      <v-col v-for="biz in businesses" :key="biz.id" cols="12" md="6">
        <v-card rounded="lg" hover>
          <v-card-text class="pa-5">
            <div class="d-flex align-center mb-4">
              <v-avatar color="primary" variant="tonal" size="52" rounded="lg" class="mr-4">
                <v-icon>mdi-store</v-icon>
              </v-avatar>
              <div class="flex-1-1">
                <h3 class="text-subtitle-1 font-weight-bold">{{ biz.name }}</h3>
                <p class="text-caption text-medium-emphasis">{{ biz.address }}</p>
              </div>
              <v-chip :color="biz.isActive ? 'success' : 'error'" size="small" variant="tonal">
                {{ biz.isActive ? 'Activo' : 'Inactivo' }}
              </v-chip>
            </div>

            <p class="text-body-2 text-medium-emphasis mb-3">
              {{ biz.description || 'Sin descripción' }}
            </p>

            <!-- Contact info -->
            <v-row dense class="mb-3">
              <v-col v-if="biz.phone" cols="12">
                <div class="d-flex align-center gap-2 text-caption text-medium-emphasis">
                  <v-icon size="13">mdi-phone</v-icon> {{ biz.phone }}
                </div>
              </v-col>
              <v-col v-if="biz.email" cols="12">
                <div class="d-flex align-center gap-2 text-caption text-medium-emphasis">
                  <v-icon size="13">mdi-email</v-icon> {{ biz.email }}
                </div>
              </v-col>
            </v-row>

            <!-- Schedule summary -->
            <div class="mb-1">
              <p class="text-caption font-weight-medium mb-1">Horario:</p>
              <div class="d-flex flex-wrap gap-1">
                <v-chip
                  v-for="s in openDays(biz.schedules)"
                  :key="s.dayOfWeek"
                  size="x-small"
                  color="primary"
                  variant="tonal"
                >
                  {{ dayShort(s.dayOfWeek) }} {{ s.openTime.slice(0,5) }}–{{ s.closeTime.slice(0,5) }}
                </v-chip>
                <v-chip v-if="openDays(biz.schedules).length === 0" size="x-small" color="warning" variant="tonal">
                  Sin horario definido
                </v-chip>
              </div>
            </div>
          </v-card-text>

          <v-divider />
          <v-card-actions class="pa-3 gap-1">
            <v-btn variant="tonal" color="primary" size="small" prepend-icon="mdi-soccer-field" :to="`/business/courts`">
              Canchas
            </v-btn>
            <v-btn variant="tonal" color="success" size="small" prepend-icon="mdi-calendar-check" :to="`/business/bookings`">
              Reservas
            </v-btn>
            <v-spacer />
            <v-btn variant="text" size="small" prepend-icon="mdi-pencil" @click="openEdit(biz)">
              Editar
            </v-btn>
          </v-card-actions>
        </v-card>
      </v-col>

      <v-col v-if="loading" cols="12" class="text-center py-10">
        <v-progress-circular indeterminate color="primary" />
      </v-col>
      <v-col v-if="!loading && businesses.length === 0" cols="12">
        <v-alert type="info" variant="tonal" rounded="lg">
          No tienes negocios registrados. Contacta al administrador para crear uno.
        </v-alert>
      </v-col>
    </v-row>

    <!-- ─── Edit Dialog ───────────────────────────────────────────────────── -->
    <v-dialog v-model="editDialog" max-width="680" scrollable>
      <v-card rounded="lg">
        <v-card-title class="text-subtitle-1 font-weight-bold pa-5 pb-3">
          Editar Negocio
        </v-card-title>
        <v-divider />

        <v-card-text class="pa-5" style="max-height:75vh">
          <v-form ref="formRef">
            <!-- Info general -->
            <p class="text-caption font-weight-bold text-medium-emphasis text-uppercase mb-3">
              Información General
            </p>

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

            <!-- Horario -->
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
          <v-btn variant="text" @click="editDialog = false">Cancelar</v-btn>
          <v-btn color="primary" variant="flat" :loading="actionLoading" @click="updateBusiness">
            Guardar cambios
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
const businesses = ref<any[]>([])
const loading = ref(false)
const editDialog = ref(false)
const scheduleEditorKey = ref(0)
const selectedBiz = ref<any>(null)
const actionLoading = ref(false)
const formRef = ref()
const snackbar = reactive({ show: false, text: '', color: 'success' })

const form = reactive({
  name: '', description: '', phone: '', email: '',
  address: '', latitude: 0, longitude: 0,
  schedules: [] as Array<{ dayOfWeek: string; openTime: string; closeTime: string; isOpen: boolean }>,
})

const r = {
  required: (v: any) => (v !== '' && v !== null && v !== undefined) || 'Requerido',
  lat: (v: number) => (v >= -90 && v <= 90) || 'Latitud entre -90 y 90',
  lon: (v: number) => (v >= -180 && v <= 180) || 'Longitud entre -180 y 180',
}

const openDays = (schedules: any[]) => (schedules ?? []).filter(s => s.isOpen)

const dayShort = (d: string) => {
  const m: Record<string, string> = {
    monday: 'Lun', tuesday: 'Mar', wednesday: 'Mié',
    thursday: 'Jue', friday: 'Vie', saturday: 'Sáb', sunday: 'Dom',
  }
  return m[d] ?? d
}

const notify = (text: string, color = 'success') => {
  snackbar.text = text; snackbar.color = color; snackbar.show = true
}

const openEdit = (biz: any) => {
  selectedBiz.value = biz
  form.name = biz.name
  form.description = biz.description ?? ''
  form.phone = biz.phone ?? ''
  form.email = biz.email ?? ''
  form.address = biz.address ?? ''
  form.latitude = Number(biz.latitude ?? 0)
  form.longitude = Number(biz.longitude ?? 0)
  const allDays = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']
  form.schedules = allDays.map(day => {
    const existing = (biz.schedules ?? []).find((s: any) => s.dayOfWeek === day)
    return existing
      ? { dayOfWeek: day, openTime: existing.openTime.slice(0, 5), closeTime: existing.closeTime.slice(0, 5), isOpen: existing.isOpen }
      : { dayOfWeek: day, openTime: '08:00', closeTime: '22:00', isOpen: false }
  })
  scheduleEditorKey.value++   // remount editor con datos del negocio seleccionado
  editDialog.value = true
}

const updateBusiness = async () => {
  const { valid } = await formRef.value.validate()
  if (!valid) return
  actionLoading.value = true
  try {
    const payload = {
      name: form.name,
      description: form.description || undefined,
      phone: form.phone,
      email: form.email || undefined,
      address: form.address,
      latitude: form.latitude,
      longitude: form.longitude,
      schedules: form.schedules.filter(s => s.isOpen),
    }
    const updated = await apiFetch<any>(`/businesses/${selectedBiz.value.id}`, {
      method: 'PATCH', body: payload,
    })
    const idx = businesses.value.findIndex(b => b.id === selectedBiz.value.id)
    if (idx !== -1) businesses.value[idx] = updated
    editDialog.value = false
    notify('Negocio actualizado correctamente')
  } catch (e: any) {
    notify(e?.data?.message || 'Error al actualizar', 'error')
  } finally {
    actionLoading.value = false
  }
}

onMounted(async () => {
  loading.value = true
  try {
    businesses.value = await apiFetch<any[]>('/businesses/my-businesses')
  } finally {
    loading.value = false
  }
})
</script>
