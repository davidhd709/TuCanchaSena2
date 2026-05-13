<template>
  <div>
    <div class="d-flex align-center mb-6">
      <div>
        <h1 class="text-h5 font-weight-bold">Mis Canchas</h1>
        <p class="text-body-2 text-medium-emphasis">Administra las canchas y sus horarios</p>
      </div>
      <v-spacer />
      <v-btn color="primary" prepend-icon="mdi-plus" @click="openCreate" :disabled="!selectedBusinessId">
        Nueva Cancha
      </v-btn>
    </div>

    <!-- Business selector -->
    <v-select
      v-if="businesses.length > 0"
      v-model="selectedBusinessId"
      :items="businesses.map(b => ({ title: b.name, value: b.id }))"
      label="Negocio"
      prepend-inner-icon="mdi-store"
      class="mb-5"
      style="max-width: 360px"
      hide-details
    />

    <v-alert
      v-if="!selectedBusinessId && !loading"
      type="warning"
      variant="tonal"
      rounded="lg"
      class="mb-4"
    >
      No tienes negocios registrados. Contacta al administrador.
    </v-alert>

    <v-row>
      <v-col v-for="court in courts" :key="court.id" cols="12" sm="6" lg="4">
        <v-card rounded="lg" hover>
          <v-card-text class="pa-5">
            <div class="d-flex align-center mb-3">
              <v-avatar color="success" variant="tonal" size="44" rounded="lg" class="mr-3">
                <v-icon>mdi-soccer-field</v-icon>
              </v-avatar>
              <div class="flex-1-1">
                <div class="text-subtitle-2 font-weight-bold">{{ court.name }}</div>
                <div class="text-caption text-medium-emphasis">{{ courtTypeLabel(court.type) }}</div>
              </div>
            </div>

            <!-- Pricing -->
            <div class="d-flex align-center gap-2 mb-2">
              <v-chip size="small" color="primary" variant="tonal">
                <v-icon start size="13">mdi-currency-usd</v-icon>
                ${{ Number(court.pricePerHour).toLocaleString('es-CO') }}/hr base
              </v-chip>
              <v-chip
                v-if="hasCustomSlotPrices(court)"
                size="small"
                color="warning"
                variant="tonal"
              >
                <v-icon start size="13">mdi-tag</v-icon>
                Precios especiales
              </v-chip>
            </div>

            <v-row dense class="text-body-2 mb-2">
              <v-col cols="6">
                <v-icon size="14" color="primary">mdi-account-group</v-icon>
                {{ court.capacity ?? '—' }} jugadores
              </v-col>
              <v-col cols="6">
                <v-icon size="14" :color="court.status === 'available' ? 'success' : 'warning'">mdi-circle</v-icon>
                {{ court.status === 'available' ? 'Disponible' : 'No disponible' }}
              </v-col>
            </v-row>

            <!-- Availability summary -->
            <div>
              <p class="text-caption text-medium-emphasis mb-1">Slots configurados:</p>
              <div class="d-flex flex-wrap gap-1">
                <template v-if="court.availability && court.availability.length > 0">
                  <v-chip
                    v-for="a in groupedAvailability(court.availability).slice(0, 4)"
                    :key="a.day"
                    size="x-small"
                    :color="a.hasCustomPrice ? 'warning' : 'success'"
                    variant="tonal"
                  >
                    {{ dayShort(a.day) }}: {{ a.count }} slot{{ a.count > 1 ? 's' : '' }}
                  </v-chip>
                  <v-chip
                    v-if="groupedAvailability(court.availability).length > 4"
                    size="x-small"
                    variant="tonal"
                  >
                    +{{ groupedAvailability(court.availability).length - 4 }} días
                  </v-chip>
                </template>
                <span v-else class="text-caption text-medium-emphasis">Sin horarios definidos</span>
              </div>
            </div>
          </v-card-text>

          <v-divider />
          <v-card-actions class="pa-3">
            <v-btn
              variant="tonal"
              color="primary"
              size="small"
              prepend-icon="mdi-clock-edit"
              @click="openAvailability(court)"
            >
              Horarios
            </v-btn>
            <v-spacer />
            <v-btn icon="mdi-pencil" variant="text" size="small" @click="openEdit(court)" />
            <v-btn icon="mdi-delete" variant="text" color="error" size="small" @click="openDelete(court)" />
          </v-card-actions>
        </v-card>
      </v-col>

      <v-col v-if="loading" cols="12" class="text-center py-10">
        <v-progress-circular indeterminate color="primary" />
      </v-col>
      <v-col v-if="!loading && courts.length === 0 && selectedBusinessId" cols="12">
        <v-alert type="info" variant="tonal" rounded="lg">
          No tienes canchas registradas en este negocio. ¡Crea la primera!
        </v-alert>
      </v-col>
    </v-row>

    <!-- ─── Court Form Dialog ─────────────────────────────────────────────── -->
    <v-dialog v-model="formDialog" max-width="820" scrollable>
      <v-card rounded="lg">
        <v-card-title class="text-subtitle-1 font-weight-bold pa-5 pb-3">
          {{ editMode ? 'Editar Cancha' : 'Nueva Cancha' }}
        </v-card-title>
        <v-divider />
        <v-card-text class="pa-5" style="max-height: 80vh">
          <v-form ref="formRef">
            <v-text-field
              v-model="form.name"
              label="Nombre de la cancha"
              :rules="[r.required]"
              class="mb-2"
            />

            <v-select
              v-model="form.type"
              label="Tipo de cancha"
              :items="courtTypes"
              :rules="[r.required]"
              class="mb-2"
            />

            <p class="text-caption text-medium-emphasis mb-1 mt-1">Descripción</p>
            <ClientOnly>
              <RichTextEditor v-model="form.description" class="mb-4" />
              <template #fallback>
                <v-textarea
                  v-model="form.description"
                  label="Descripción"
                  rows="3"
                  class="mb-4"
                />
              </template>
            </ClientOnly>

            <v-row dense>
              <v-col cols="6">
                <v-text-field
                  v-model.number="form.pricePerHour"
                  label="Precio base / hora"
                  type="number"
                  prefix="$"
                  :rules="[r.required, r.positive]"
                  hint="Precio por defecto para todos los slots"
                  persistent-hint
                />
              </v-col>
              <v-col cols="6">
                <v-text-field
                  v-model.number="form.capacity"
                  label="Capacidad (jugadores)"
                  type="number"
                  :rules="[r.required, r.positive]"
                />
              </v-col>
            </v-row>

            <v-select
              v-model="form.status"
              label="Estado"
              :items="[{title:'Disponible',value:'available'},{title:'No disponible',value:'unavailable'}]"
              class="mt-2"
            />
          </v-form>
        </v-card-text>
        <v-divider />
        <v-card-actions class="pa-4">
          <v-spacer />
          <v-btn variant="text" @click="formDialog = false">Cancelar</v-btn>
          <v-btn color="primary" variant="flat" :loading="actionLoading" @click="saveCourt">
            {{ editMode ? 'Guardar' : 'Crear' }}
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- ─── Availability Dialog ───────────────────────────────────────────── -->
    <v-dialog v-model="availabilityDialog" max-width="780" scrollable>
      <v-card rounded="lg">
        <v-card-title class="pa-5 pb-3">
          <div>
            <div class="text-subtitle-1 font-weight-bold">
              Horarios: {{ selectedCourt?.name }}
            </div>
            <div class="text-caption text-medium-emphasis">
              Los slots deben estar dentro del horario de apertura del negocio
            </div>
          </div>
        </v-card-title>
        <v-divider />

        <v-card-text class="pa-5" style="max-height: 70vh">
          <!-- :key fuerza remount cada vez que se abre el diálogo, evitando loops reactivos -->
          <CourtAvailabilityEditor
            v-if="availabilityDialog && selectedCourt"
            :key="availabilityEditorKey"
            v-model="availabilitySlots"
            :business-schedules="currentBusinessSchedules"
            :court-base-price="selectedCourt.pricePerHour"
          />
        </v-card-text>

        <v-divider />
        <v-card-actions class="pa-4">
          <v-btn variant="text" prepend-icon="mdi-broom" color="error" @click="availabilitySlots = []">
            Limpiar todo
          </v-btn>
          <v-spacer />
          <v-btn variant="text" @click="availabilityDialog = false">Cancelar</v-btn>
          <v-btn color="primary" variant="flat" :loading="actionLoading" @click="saveAvailability">
            Guardar Horarios
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Delete Dialog -->
    <v-dialog v-model="deleteDialog" max-width="420">
      <v-card rounded="lg">
        <v-card-text class="pa-6 text-center">
          <v-icon size="56" color="error" class="mb-3">mdi-soccer-field</v-icon>
          <h3 class="text-subtitle-1 font-weight-bold mb-2">Eliminar Cancha</h3>
          <p class="text-body-2 text-medium-emphasis">
            ¿Eliminar <strong>{{ selectedCourt?.name }}</strong>?
            Se eliminarán también todos sus horarios y reservas asociadas.
          </p>
        </v-card-text>
        <v-card-actions class="pa-4 pt-0">
          <v-spacer />
          <v-btn variant="text" @click="deleteDialog = false">Cancelar</v-btn>
          <v-btn color="error" variant="flat" :loading="actionLoading" @click="deleteCourt">Eliminar</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-snackbar v-model="snackbar.show" :color="snackbar.color" rounded="lg" location="bottom end">
      {{ snackbar.text }}
    </v-snackbar>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: 'dashboard', middleware: ['auth', 'role'], ssr: false })

const { apiFetch } = useApi()

// ── State ──────────────────────────────────────────────────────────────────
const businesses = ref<any[]>([])
const courts = ref<any[]>([])
const loading = ref(false)
const selectedBusinessId = ref<string | null>(null)

const formDialog = ref(false)
const availabilityDialog = ref(false)
const deleteDialog = ref(false)
const editMode = ref(false)
const selectedCourt = ref<any>(null)
const actionLoading = ref(false)
const formRef = ref()
const snackbar = reactive({ show: false, text: '', color: 'success' })

// Availability editor state
const availabilitySlots = ref<any[]>([])
const currentBusinessSchedules = ref<any[]>([])
const availabilityEditorKey = ref(0)  // incrementar para forzar remount

// ── Form ───────────────────────────────────────────────────────────────────
const form = reactive({
  name: '',
  type: '',
  description: '',
  pricePerHour: 50000,
  capacity: 10,
  status: 'available',
})

// ── Constants ──────────────────────────────────────────────────────────────
const courtTypes = [
  { title: 'Fútbol 5', value: 'football_5' },
  { title: 'Fútbol 7', value: 'football_7' },
  { title: 'Fútbol 8', value: 'football_8' },
  { title: 'Fútbol 11', value: 'football_11' },
  { title: 'Futsal', value: 'futsal' },
  { title: 'Fútbol Playa', value: 'beach_soccer' },
  { title: 'Mini Fútbol', value: 'mini_football' },
]

const r = {
  required: (v: any) => (v !== '' && v !== null && v !== undefined) || 'Requerido',
  positive: (v: number) => v > 0 || 'Debe ser mayor a 0',
}

// ── Helpers ────────────────────────────────────────────────────────────────
const courtTypeLabel = (type: string) => courtTypes.find(t => t.value === type)?.title ?? type

const dayShort = (d: string) => {
  const m: Record<string, string> = {
    monday: 'Lun', tuesday: 'Mar', wednesday: 'Mié',
    thursday: 'Jue', friday: 'Vie', saturday: 'Sáb', sunday: 'Dom',
  }
  return m[d] ?? d
}

const hasCustomSlotPrices = (court: any) =>
  (court.availability ?? []).some((a: any) => a.pricePerHour !== null && a.pricePerHour !== undefined)

const groupedAvailability = (availability: any[]) => {
  const map: Record<string, any> = {}
  for (const a of availability) {
    if (!map[a.dayOfWeek]) map[a.dayOfWeek] = { day: a.dayOfWeek, count: 0, hasCustomPrice: false }
    map[a.dayOfWeek].count++
    if (a.pricePerHour !== null && a.pricePerHour !== undefined) map[a.dayOfWeek].hasCustomPrice = true
  }
  const order = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']
  return order.filter(d => map[d]).map(d => map[d])
}

const notify = (text: string, color = 'success') => {
  snackbar.text = text; snackbar.color = color; snackbar.show = true
}

// ── CRUD ───────────────────────────────────────────────────────────────────
const openCreate = () => {
  editMode.value = false
  Object.assign(form, {
    name: '', type: '', description: '',
    pricePerHour: 50000, capacity: 10, status: 'available',
  })
  formDialog.value = true
}

const openEdit = (court: any) => {
  editMode.value = true
  selectedCourt.value = court
  Object.assign(form, {
    name: court.name,
    type: court.type,
    description: court.description ?? '',
    pricePerHour: Number(court.pricePerHour),
    capacity: court.capacity ?? 10,
    status: court.status ?? 'available',
  })
  formDialog.value = true
}

const saveCourt = async () => {
  const { valid } = await formRef.value.validate()
  if (!valid) return
  actionLoading.value = true
  try {
    if (editMode.value) {
      const updated = await apiFetch<any>(`/courts/${selectedCourt.value.id}`, {
        method: 'PATCH',
        body: {
          name: form.name, type: form.type, description: form.description,
          pricePerHour: form.pricePerHour, status: form.status,
        },
      })
      const idx = courts.value.findIndex(c => c.id === selectedCourt.value.id)
      if (idx !== -1) courts.value[idx] = { ...courts.value[idx], ...updated }
      notify('Cancha actualizada correctamente')
    } else {
      const payload = {
        name: form.name, type: form.type, description: form.description,
        pricePerHour: form.pricePerHour, capacity: form.capacity,
        status: form.status, businessId: selectedBusinessId.value,
      }
      const created = await apiFetch<any>('/courts', { method: 'POST', body: payload })
      courts.value.unshift({ ...created, availability: [] })
      notify('Cancha creada exitosamente')
    }
    formDialog.value = false
  } catch (e: any) {
    notify(e?.data?.message || 'Error al guardar cancha', 'error')
  } finally {
    actionLoading.value = false
  }
}

const openAvailability = async (court: any) => {
  selectedCourt.value = court

  // Horarios del negocio (restricciones)
  const biz = businesses.value.find(b => b.id === selectedBusinessId.value)
  currentBusinessSchedules.value = biz?.schedules ?? []

  // Cargar disponibilidad existente
  try {
    const existing = await apiFetch<any[]>(`/courts/${court.id}/availability`)
    availabilitySlots.value = existing.map(a => ({
      dayOfWeek: a.dayOfWeek,
      startTime: a.startTime.slice(0, 5),
      endTime:   a.endTime.slice(0, 5),
      isAvailable: a.isAvailable,
      pricePerHour: a.pricePerHour !== null ? Number(a.pricePerHour) : null,
    }))
  } catch {
    availabilitySlots.value = []
  }

  // Incrementar key ANTES de mostrar el diálogo → el componente remonta con los datos frescos
  availabilityEditorKey.value++
  availabilityDialog.value = true
}

const saveAvailability = async () => {
  // Client-side validation: check for errors in slots
  const hasErrors = availabilitySlots.value.some((s: any) => s._error)
  if (hasErrors) {
    notify('Corrige los errores en los slots antes de guardar', 'error')
    return
  }

  actionLoading.value = true
  try {
    const body = {
      availability: availabilitySlots.value.map(s => ({
        dayOfWeek: s.dayOfWeek,
        startTime: s.startTime,
        endTime: s.endTime,
        isAvailable: s.isAvailable,
        ...(s.pricePerHour !== null && s.pricePerHour !== undefined
          ? { pricePerHour: Number(s.pricePerHour) }
          : {}),
      })),
    }

    const updated = await apiFetch<any>(
      `/courts/${selectedCourt.value.id}/availability`,
      { method: 'POST', body }
    )

    // Update court in list
    const idx = courts.value.findIndex(c => c.id === selectedCourt.value.id)
    if (idx !== -1) courts.value[idx] = updated

    availabilityDialog.value = false
    notify('Horarios guardados correctamente')
  } catch (e: any) {
    notify(e?.data?.message || 'Error al guardar horarios', 'error')
  } finally {
    actionLoading.value = false
  }
}

const openDelete = (court: any) => {
  selectedCourt.value = court
  deleteDialog.value = true
}

const deleteCourt = async () => {
  actionLoading.value = true
  try {
    await apiFetch(`/courts/${selectedCourt.value.id}`, { method: 'DELETE' })
    courts.value = courts.value.filter(c => c.id !== selectedCourt.value.id)
    notify('Cancha eliminada')
    deleteDialog.value = false
  } catch (e: any) {
    notify(e?.data?.message || 'Error', 'error')
  } finally {
    actionLoading.value = false
  }
}

// ── Load ───────────────────────────────────────────────────────────────────
const loadCourts = async () => {
  if (!selectedBusinessId.value) return
  loading.value = true
  try {
    courts.value = await apiFetch<any[]>(`/courts/by-business/${selectedBusinessId.value}`)
  } finally {
    loading.value = false
  }
}

watch(selectedBusinessId, loadCourts)

onMounted(async () => {
  try {
    businesses.value = await apiFetch<any[]>('/businesses/my-businesses')
    if (businesses.value.length > 0) {
      selectedBusinessId.value = businesses.value[0].id
    }
  } catch (e) {
    console.error(e)
  }
})
</script>
