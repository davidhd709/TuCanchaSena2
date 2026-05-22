<template>
  <AppModalShell
    :model-value="modelValue"
    :title="editMode ? 'Editar cancha' : 'Nueva cancha'"
    :subtitle="editMode ? 'Actualiza los datos de tu cancha.' : 'Crea una cancha y define sus características.'"
    :width="820"
    test-id="court-form-modal"
    @update:model-value="(v) => emit('update:modelValue', v)"
  >
    <template #tag>{{ editMode ? 'Edición' : 'Nuevo' }}</template>
    <template #body>
      <v-form ref="formRef">
        <!-- Información general -->
        <section class="app-form-section">
          <div class="app-form-section-head">
            <h3 class="app-form-section-title"><span class="mdi mdi-soccer-field" /> Información general</h3>
          </div>
          <v-text-field
            v-model="form.name"
            label="Nombre de la cancha"
            :rules="[r.required]"
          />
          <v-select
            v-model="form.type"
            label="Tipo de cancha"
            :items="courtTypes"
            :rules="[r.required]"
          />
          <p class="app-form-hint">Descripción</p>
          <ClientOnly>
            <RichTextEditor v-model="form.description" />
            <template #fallback>
              <v-textarea v-model="form.description" label="Descripción" rows="3" />
            </template>
          </ClientOnly>
        </section>

        <!-- Detalles -->
        <section class="app-form-section">
          <div class="app-form-section-head">
            <h3 class="app-form-section-title"><span class="mdi mdi-tune-variant" /> Detalles y disponibilidad</h3>
          </div>
          <div class="app-form-grid cols-2">
            <v-text-field
              v-model.number="form.pricePerHour"
              label="Precio base / hora"
              type="number"
              prefix="$"
              :rules="[r.required, r.positive]"
              hint="Precio por defecto para todos los slots"
              persistent-hint
            />
            <v-text-field
              v-model.number="form.capacity"
              label="Capacidad (jugadores)"
              type="number"
              :rules="[r.required, r.positive]"
            />
          </div>
          <v-select
            v-model="form.status"
            label="Estado"
            :items="STATUS_ITEMS"
          />
          <v-select
            v-model="form.amenities"
            :items="COURT_AMENITY_OPTIONS"
            label="Características de la cancha"
            multiple
            chips
            closable-chips
            prepend-inner-icon="mdi-soccer-field"
          />
        </section>

        <!-- Imágenes -->
        <section class="app-form-section">
          <div class="app-form-section-head">
            <h3 class="app-form-section-title"><span class="mdi mdi-image-multiple-outline" /> Fotos de la cancha</h3>
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
      </v-form>
    </template>
    <template #footer>
      <v-btn variant="text" @click="emit('update:modelValue', false)">Cancelar</v-btn>
      <v-btn color="primary" variant="flat" :loading="loading" @click="onSave">
        {{ editMode ? 'Guardar cambios' : 'Crear cancha' }}
      </v-btn>
    </template>
  </AppModalShell>
</template>

<script setup lang="ts">
/**
 * CourtFormModal — formulario crear/editar de cancha.
 * Extraído de business/courts/index.vue (Fase 9). Posee su estado de form, se
 * inicializa desde `initial` al abrir y emite `save` con el payload validado.
 * La página padre arma el body de create/edit (la creación agrega businessId y
 * capacity; la edición omite capacity, como antes).
 */
export interface CourtFormPayload {
  name: string
  type: string
  description: string
  pricePerHour: number
  capacity: number
  status: string
  images: string[]
  amenities: string[]
}

const props = defineProps<{
  modelValue: boolean
  editMode: boolean
  /** Cancha a editar (o null para creación). */
  initial?: any | null
  loading?: boolean
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void
  (e: 'save', payload: CourtFormPayload): void
}>()

const courtTypes = [
  { title: 'Fútbol 5', value: 'football_5' },
  { title: 'Fútbol 7', value: 'football_7' },
  { title: 'Fútbol 8', value: 'football_8' },
  { title: 'Fútbol 11', value: 'football_11' },
  { title: 'Futsal', value: 'futsal' },
  { title: 'Fútbol Playa', value: 'beach_soccer' },
  { title: 'Mini Fútbol', value: 'mini_football' },
]

const STATUS_ITEMS = [
  { title: 'Disponible', value: 'available' },
  { title: 'No disponible', value: 'unavailable' },
  { title: 'En mantenimiento', value: 'maintenance' },
]

const COURT_AMENITY_OPTIONS = [
  'Iluminación LED', 'Cancha cubierta', 'Césped sintético nuevo', 'Vestidores',
  'Hidratación', 'Arbitraje', 'Graderías', 'Marcador electrónico',
]

const r = {
  required: (v: any) => (v !== '' && v !== null && v !== undefined) || 'Requerido',
  positive: (v: number) => v > 0 || 'Debe ser mayor a 0',
}

const EMPTY: CourtFormPayload = {
  name: '', type: '', description: '',
  pricePerHour: 50000, capacity: 10, status: 'available',
  images: [], amenities: [],
}

const formRef = ref()
const form = reactive<CourtFormPayload>({ ...EMPTY })

const resetForm = () => {
  if (props.editMode && props.initial) {
    Object.assign(form, {
      name: props.initial.name,
      type: props.initial.type,
      description: props.initial.description ?? '',
      pricePerHour: Number(props.initial.pricePerHour),
      capacity: props.initial.capacity ?? 10,
      status: props.initial.status ?? 'available',
      images: [...(props.initial.images ?? [])],
      amenities: [...(props.initial.amenities ?? [])],
    })
  } else {
    Object.assign(form, { ...EMPTY, images: [], amenities: [] })
  }
}

// Al abrir el modal, sincroniza el formulario con los datos a editar/crear.
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
