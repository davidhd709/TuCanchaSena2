<template>
  <AppModalShell
    :model-value="modelValue"
    :title="editMode ? 'Editar negocio' : 'Crear nuevo negocio'"
    :subtitle="editMode ? 'Actualiza los datos públicos del negocio.' : 'Asigna el propietario y completa la información.'"
    :width="680"
    test-id="admin-business-form-modal"
    @update:model-value="(v) => emit('update:modelValue', v)"
  >
    <template #tag>{{ editMode ? 'Edición' : 'Nuevo' }}</template>
    <template #body>
      <v-form ref="formRef">
        <!-- Información general -->
        <section class="app-form-section">
          <div class="app-form-section-head">
            <h3 class="app-form-section-title"><span class="mdi mdi-store" /> Información general</h3>
          </div>
          <v-autocomplete
            v-if="!editMode"
            v-model="form.ownerId"
            label="Propietario (usuario con rol Negocio)"
            :items="businessUsers"
            item-title="label"
            item-value="id"
            prepend-inner-icon="mdi-account"
            :rules="[r.required]"
            :loading="usersLoading"
            no-data-text="No hay usuarios con rol Negocio"
          />
          <v-text-field
            v-model="form.name"
            label="Nombre del negocio"
            prepend-inner-icon="mdi-store"
            :rules="[r.required]"
          />
          <v-textarea v-model="form.description" label="Descripción" rows="2" />
          <div class="app-form-grid cols-2">
            <v-text-field
              v-model="form.phone"
              label="Teléfono"
              prepend-inner-icon="mdi-phone"
              :rules="[r.required]"
            />
            <v-text-field
              v-model="form.email"
              label="Email del negocio"
              type="email"
              prepend-inner-icon="mdi-email"
            />
          </div>
          <v-text-field
            v-model="form.address"
            label="Dirección"
            prepend-inner-icon="mdi-map-marker"
            :rules="[r.required]"
          />
          <div class="app-form-grid cols-2">
            <v-text-field
              v-model.number="form.latitude"
              label="Latitud"
              type="number"
              prepend-inner-icon="mdi-crosshairs-gps"
              :rules="[r.required, r.lat]"
              hint="Ej: 4.6097"
              persistent-hint
            />
            <v-text-field
              v-model.number="form.longitude"
              label="Longitud"
              type="number"
              prepend-inner-icon="mdi-crosshairs-gps"
              :rules="[r.required, r.lon]"
              hint="Ej: -74.0817"
              persistent-hint
            />
          </div>
        </section>

        <!-- Horarios -->
        <section class="app-form-section">
          <div class="app-form-section-head">
            <h3 class="app-form-section-title"><span class="mdi mdi-clock-outline" /> Horario de funcionamiento</h3>
          </div>
          <!-- :key fuerza remount al abrir el diálogo, evitando loops reactivos -->
          <BusinessScheduleEditor :key="editorKey" v-model="form.schedules" />
        </section>
      </v-form>
    </template>
    <template #footer>
      <v-btn variant="text" @click="emit('update:modelValue', false)">Cancelar</v-btn>
      <v-btn color="primary" variant="flat" :loading="loading" @click="onSave">
        {{ editMode ? 'Guardar cambios' : 'Crear negocio' }}
      </v-btn>
    </template>
  </AppModalShell>
</template>

<script setup lang="ts">
/**
 * AdminBusinessFormModal — formulario crear/editar de negocio (panel admin).
 * Extraído de admin/businesses.vue (Fase 10). A diferencia del de dueño, pide
 * el `ownerId` (solo en creación) y no maneja amenities/imágenes/políticas.
 * La página padre carga `businessUsers` y arma el payload final.
 */
interface BusinessSchedule {
  dayOfWeek: string
  openTime: string
  closeTime: string
  isOpen: boolean
}
export interface AdminBusinessFormData {
  ownerId: string
  name: string
  description: string
  phone: string
  email: string
  address: string
  latitude: number
  longitude: number
  schedules: BusinessSchedule[]
}

const props = defineProps<{
  modelValue: boolean
  editMode: boolean
  /** Negocio a editar (o null para creación). */
  initial?: any | null
  loading?: boolean
  /** Usuarios con rol Negocio para asignar como propietario (solo creación). */
  businessUsers?: Array<{ id: string; label: string }>
  usersLoading?: boolean
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void
  (e: 'save', payload: AdminBusinessFormData): void
}>()

const ALL_DAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']

const r = {
  required: (v: any) => (v !== '' && v !== null && v !== undefined) || 'Requerido',
  lat: (v: number) => (v >= -90 && v <= 90) || 'Latitud entre -90 y 90',
  lon: (v: number) => (v >= -180 && v <= 180) || 'Longitud entre -180 y 180',
}

const defaultSchedules = (): BusinessSchedule[] =>
  ALL_DAYS.map((day) => ({ dayOfWeek: day, openTime: '08:00', closeTime: '22:00', isOpen: day !== 'sunday' }))

const formRef = ref()
const editorKey = ref(0)
const form = reactive<AdminBusinessFormData>({
  ownerId: '', name: '', description: '', phone: '', email: '',
  address: '', latitude: 0, longitude: 0, schedules: defaultSchedules(),
})

const resetForm = () => {
  if (props.editMode && props.initial) {
    const b = props.initial
    Object.assign(form, {
      ownerId: b.ownerId ?? '',
      name: b.name,
      description: b.description ?? '',
      phone: b.phone ?? '',
      email: b.email ?? '',
      address: b.address ?? '',
      latitude: Number(b.latitude ?? 0),
      longitude: Number(b.longitude ?? 0),
      schedules: ALL_DAYS.map((day) => {
        const existing = (b.schedules ?? []).find((s: any) => s.dayOfWeek === day)
        return existing
          ? {
              dayOfWeek: day,
              openTime: existing.openTime.slice(0, 5),
              closeTime: existing.closeTime.slice(0, 5),
              isOpen: existing.isOpen,
            }
          : { dayOfWeek: day, openTime: '08:00', closeTime: '22:00', isOpen: false }
      }),
    })
  } else {
    Object.assign(form, {
      ownerId: '', name: '', description: '', phone: '', email: '',
      address: '', latitude: 0, longitude: 0, schedules: defaultSchedules(),
    })
  }
  editorKey.value++
}

// Al abrir el modal, sincroniza el formulario y remonta el editor de horarios.
watch(
  () => props.modelValue,
  (open) => { if (open) resetForm() },
)

const onSave = async () => {
  const { valid } = await formRef.value.validate()
  if (!valid) return
  emit('save', { ...form })
}
</script>
