<template>
  <AppModalShell
    :model-value="modelValue"
    :title="editMode ? 'Editar usuario' : 'Crear usuario'"
    :subtitle="editMode ? 'Actualiza los datos del usuario.' : 'Crea una cuenta y asigna su rol.'"
    :width="520"
    test-id="user-form-modal"
    @update:model-value="(v) => emit('update:modelValue', v)"
  >
    <template #tag>{{ editMode ? 'Edición' : 'Nuevo' }}</template>
    <template #body>
      <v-form ref="formRef">
        <v-row>
          <v-col cols="6">
            <v-text-field
              v-model="form.firstName"
              label="Nombre"
              prepend-inner-icon="mdi-account-outline"
              :rules="[r.required]"
            />
          </v-col>
          <v-col cols="6">
            <v-text-field
              v-model="form.lastName"
              label="Apellido"
              :rules="[r.required]"
            />
          </v-col>
        </v-row>

        <v-text-field
          v-model="form.email"
          label="Correo electrónico"
          type="email"
          prepend-inner-icon="mdi-email-outline"
          :rules="[r.required, r.email]"
          :disabled="editMode"
          class="mb-1"
        />

        <v-text-field
          v-model="form.phone"
          label="Teléfono (opcional)"
          prepend-inner-icon="mdi-phone-outline"
          class="mb-1"
        />

        <v-select
          v-model="form.role"
          label="Rol"
          :items="roleOptions"
          prepend-inner-icon="mdi-account-key-outline"
          :rules="[r.required]"
          class="mb-1"
        />

        <v-text-field
          v-if="!editMode"
          v-model="form.password"
          label="Contraseña"
          :type="showPwd ? 'text' : 'password'"
          prepend-inner-icon="mdi-lock-outline"
          :append-inner-icon="showPwd ? 'mdi-eye-off' : 'mdi-eye'"
          :rules="[r.required, r.minLength]"
          @click:append-inner="showPwd = !showPwd"
        />
      </v-form>
    </template>
    <template #footer>
      <v-btn variant="text" @click="emit('update:modelValue', false)">Cancelar</v-btn>
      <v-btn color="primary" variant="flat" :loading="loading" @click="onSave">
        {{ editMode ? 'Guardar cambios' : 'Crear usuario' }}
      </v-btn>
    </template>
  </AppModalShell>
</template>

<script setup lang="ts">
/**
 * UserFormModal — formulario crear/editar de usuario.
 * Extraído de admin/users.vue (Fase 8). Posee su estado de form, se inicializa
 * desde `initial` al abrir y emite `save` con el payload validado. El email es
 * de solo lectura en edición y la contraseña solo se pide en creación.
 */
export interface UserFormPayload {
  firstName: string
  lastName: string
  email: string
  phone: string
  role: string
  password: string
}

const props = defineProps<{
  modelValue: boolean
  editMode: boolean
  /** Usuario a editar (o null para creación). */
  initial?: any | null
  loading?: boolean
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void
  (e: 'save', payload: UserFormPayload): void
}>()

const roleOptions = [
  { title: 'Super Admin', value: 'admin' },
  { title: 'Negocio', value: 'business' },
  { title: 'Cliente', value: 'client' },
]

const r = {
  required: (v: string) => !!v || 'Este campo es requerido',
  email: (v: string) => /.+@.+\..+/.test(v) || 'Email inválido',
  minLength: (v: string) => v.length >= 6 || 'Mínimo 6 caracteres',
}

const EMPTY: UserFormPayload = {
  firstName: '', lastName: '', email: '', phone: '', role: 'client', password: '',
}

const formRef = ref()
const showPwd = ref(false)
const form = reactive<UserFormPayload>({ ...EMPTY })

const resetForm = () => {
  showPwd.value = false
  if (props.editMode && props.initial) {
    Object.assign(form, {
      firstName: props.initial.firstName ?? '',
      lastName: props.initial.lastName ?? '',
      email: props.initial.email ?? '',
      phone: props.initial.phone ?? '',
      role: props.initial.role ?? 'client',
      password: '',
    })
  } else {
    Object.assign(form, { ...EMPTY })
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
