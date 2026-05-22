<template>
  <AppModalShell
    :model-value="modelValue"
    :title="editMode ? 'Editar negocio' : 'Crear mi negocio'"
    :subtitle="editMode ? 'Actualiza los datos públicos de tu negocio.' : 'Completa estos datos para empezar a recibir reservas.'"
    :width="720"
    test-id="business-form-modal"
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
              :rules="[r.required, r.lat]"
              hint="Ej: 4.6097"
              persistent-hint
            />
            <v-text-field
              v-model.number="form.longitude"
              label="Longitud"
              type="number"
              :rules="[r.required, r.lon]"
              hint="Ej: -74.0817"
              persistent-hint
            />
          </div>
        </section>

        <!-- Servicios -->
        <section class="app-form-section">
          <div class="app-form-section-head">
            <h3 class="app-form-section-title"><span class="mdi mdi-room-service-outline" /> Servicios y comodidades</h3>
          </div>
          <v-select
            v-model="form.amenities"
            :items="AMENITY_OPTIONS"
            label="Lo que ofrece tu negocio"
            multiple
            chips
            closable-chips
            prepend-inner-icon="mdi-room-service-outline"
          />
        </section>

        <!-- Imágenes -->
        <section class="app-form-section">
          <div class="app-form-section-head">
            <h3 class="app-form-section-title"><span class="mdi mdi-image-multiple-outline" /> Fotos del negocio</h3>
            <p class="app-form-section-sub">Pega la URL de cada foto. Si no agregas ninguna, mostramos el logo de TuCancha.</p>
          </div>
          <v-combobox
            v-model="form.images"
            label="URLs de fotos (Enter para agregar)"
            multiple
            chips
            closable-chips
            prepend-inner-icon="mdi-image-multiple-outline"
          />
        </section>

        <!-- Reglas -->
        <section class="app-form-section">
          <div class="app-form-section-head">
            <h3 class="app-form-section-title"><span class="mdi mdi-clipboard-text-outline" /> Reglas y políticas</h3>
          </div>
          <v-textarea v-model="form.policies" label="Reglas o políticas del negocio" rows="2" />
        </section>

        <!-- Horarios -->
        <section class="app-form-section">
          <div class="app-form-section-head">
            <h3 class="app-form-section-title"><span class="mdi mdi-clock-outline" /> Horario de funcionamiento</h3>
          </div>
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
 * BusinessFormModal — formulario crear/editar del negocio (dueño).
 * Extraído de business/index.vue (Fase 10). Posee su estado de form (incluido
 * el editor de horarios), se inicializa desde `initial` al abrir y emite `save`
 * con los datos validados. La página padre arma el payload final (filtra
 * schedules abiertos y campos opcionales) — igual que antes.
 */
interface BusinessSchedule {
  dayOfWeek: string
  openTime: string
  closeTime: string
  isOpen: boolean
}
export interface BusinessFormData {
  name: string
  description: string
  phone: string
  email: string
  address: string
  latitude: number
  longitude: number
  images: string[]
  amenities: string[]
  policies: string
  schedules: BusinessSchedule[]
}

const props = defineProps<{
  modelValue: boolean
  editMode: boolean
  /** Negocio a editar (o null para creación). */
  initial?: any | null
  loading?: boolean
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void
  (e: 'save', payload: BusinessFormData): void
}>()

const ALL_DAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']

const AMENITY_OPTIONS = [
  'WiFi', 'Baños', 'Parqueadero', 'Cancha techada', 'Bar', 'Restaurante',
  'Cafetería', 'Tienda deportiva', 'Vestidores', 'Duchas', 'Iluminación nocturna',
  'Seguridad', 'Graderías', 'Zona de descanso', 'Zona familiar',
]

const r = {
  required: (v: any) => (v !== '' && v !== null && v !== undefined) || 'Requerido',
  lat: (v: number) => (v >= -90 && v <= 90) || 'Latitud entre -90 y 90',
  lon: (v: number) => (v >= -180 && v <= 180) || 'Longitud entre -180 y 180',
}

const defaultSchedules = (): BusinessSchedule[] =>
  ALL_DAYS.map((day) => ({ dayOfWeek: day, openTime: '08:00', closeTime: '22:00', isOpen: day !== 'sunday' }))

const formRef = ref()
// `:key` que fuerza el remount de BusinessScheduleEditor al abrir (evita loops reactivos).
const editorKey = ref(0)
const form = reactive<BusinessFormData>({
  name: '', description: '', phone: '', email: '', address: '',
  latitude: 0, longitude: 0, images: [], amenities: [], policies: '',
  schedules: defaultSchedules(),
})

const resetForm = () => {
  if (props.editMode && props.initial) {
    const b = props.initial
    Object.assign(form, {
      name: b.name,
      description: b.description ?? '',
      phone: b.phone ?? '',
      email: b.email ?? '',
      address: b.address ?? '',
      latitude: Number(b.latitude ?? 0),
      longitude: Number(b.longitude ?? 0),
      images: [...(b.images ?? [])],
      amenities: [...(b.amenities ?? [])],
      policies: b.policies ?? '',
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
      name: '', description: '', phone: '', email: '', address: '',
      latitude: 0, longitude: 0, images: [], amenities: [], policies: '',
      schedules: defaultSchedules(),
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
