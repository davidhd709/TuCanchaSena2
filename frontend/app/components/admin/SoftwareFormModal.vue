<template>
  <AppModalShell
    :model-value="modelValue"
    :title="editMode ? 'Editar software' : 'Crear software'"
    :width="560"
    test-id="software-form-modal"
    @update:model-value="(v) => emit('update:modelValue', v)"
  >
    <template #tag>{{ editMode ? 'Edición' : 'Nuevo' }}</template>
    <template #body>
      <v-form ref="formRef">
        <v-text-field v-model="form.nombre" label="Nombre" :rules="[required]" class="mb-2" />
        <v-textarea v-model="form.descripcion" label="Descripción" rows="2" class="mb-2" />
        <v-text-field v-model="form.version" label="Versión" class="mb-2" />
        <v-select
          v-model="form.status"
          label="Estado"
          :items="STATUS_ITEMS"
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
    </template>
    <template #footer>
      <v-btn variant="text" @click="emit('update:modelValue', false)">Cancelar</v-btn>
      <v-btn color="primary" variant="flat" :loading="loading" @click="onSave">
        {{ editMode ? 'Guardar cambios' : 'Crear' }}
      </v-btn>
    </template>
  </AppModalShell>
</template>

<script setup lang="ts">
/**
 * SoftwareFormModal — formulario crear/editar de software.
 * Extraído de admin/software.vue (Fase 8). Posee su propio estado de form:
 * al abrir, se inicializa desde `initial` (edición) o con valores por defecto
 * (creación), y emite `save` con el payload tras validar. La página padre solo
 * conoce el editMode/initial y la acción de guardar.
 */
export interface SoftwareFormPayload {
  nombre: string
  descripcion: string
  version: string
  status: string
  tags: string[]
}

const props = defineProps<{
  modelValue: boolean
  editMode: boolean
  /** Software a editar (o null para creación). */
  initial?: any | null
  loading?: boolean
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void
  (e: 'save', payload: SoftwareFormPayload): void
}>()

const STATUS_ITEMS = [
  { title: 'Activo', value: 'activo' },
  { title: 'Inactivo', value: 'inactivo' },
]
const required = (v: string) => !!v || 'Requerido'

const EMPTY: SoftwareFormPayload = { nombre: '', descripcion: '', version: '', status: 'activo', tags: [] }

const formRef = ref()
const form = reactive<SoftwareFormPayload>({ ...EMPTY })

const resetForm = () => {
  if (props.editMode && props.initial) {
    Object.assign(form, {
      nombre: props.initial.nombre ?? '',
      descripcion: props.initial.descripcion ?? '',
      version: props.initial.version ?? '',
      status: props.initial.status ?? 'activo',
      tags: props.initial.tags ?? [],
    })
  } else {
    Object.assign(form, { ...EMPTY, tags: [] })
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
