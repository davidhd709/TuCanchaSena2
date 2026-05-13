<template>
  <div>
    <div class="d-flex align-center mb-6">
      <div>
        <h1 class="text-h5 font-weight-bold">Usuarios</h1>
        <p class="text-body-2 text-medium-emphasis">Gestión completa de usuarios del sistema</p>
      </div>
      <v-spacer />
      <v-btn color="primary" prepend-icon="mdi-account-plus" @click="openCreate">
        Nuevo Usuario
      </v-btn>
    </div>

    <v-card rounded="lg">
      <!-- Filters -->
      <v-card-text class="pb-0">
        <v-row dense>
          <v-col cols="12" sm="6">
            <v-text-field
              v-model="search"
              placeholder="Buscar por nombre o email..."
              prepend-inner-icon="mdi-magnify"
              clearable
              hide-details
            />
          </v-col>
          <v-col cols="6" sm="3">
            <v-select
              v-model="roleFilter"
              :items="roleOptions"
              label="Rol"
              clearable
              hide-details
            />
          </v-col>
          <v-col cols="6" sm="3">
            <v-select
              v-model="statusFilter"
              :items="[{title:'Activo',value:true},{title:'Inactivo',value:false}]"
              label="Estado"
              clearable
              hide-details
            />
          </v-col>
        </v-row>
      </v-card-text>

      <v-data-table
        :headers="headers"
        :items="filteredUsers"
        :loading="loading"
        item-value="id"
        hover
        :items-per-page="10"
      >
        <!-- User column -->
        <template #item.name="{ item }">
          <div class="d-flex align-center gap-3 py-2">
            <v-avatar
              :color="item.isActive ? 'primary' : 'grey'"
              variant="tonal"
              size="38"
            >
              <span class="text-caption font-weight-bold">
                {{ item.firstName[0] }}{{ item.lastName[0] }}
              </span>
            </v-avatar>
            <div>
              <div class="text-body-2 font-weight-medium">
                {{ item.firstName }} {{ item.lastName }}
              </div>
              <div class="text-caption text-medium-emphasis">{{ item.email }}</div>
            </div>
          </div>
        </template>

        <!-- Role column -->
        <template #item.role="{ item }">
          <v-chip :color="roleColor(item.role)" size="small" variant="tonal">
            <v-icon start size="13">{{ roleIcon(item.role) }}</v-icon>
            {{ roleLabel(item.role) }}
          </v-chip>
        </template>

        <!-- Status column -->
        <template #item.isActive="{ item }">
          <v-chip
            :color="item.isActive ? 'success' : 'error'"
            size="small"
            variant="tonal"
          >
            <v-icon start size="13">
              {{ item.isActive ? 'mdi-check-circle' : 'mdi-minus-circle' }}
            </v-icon>
            {{ item.isActive ? 'Activo' : 'Suspendido' }}
          </v-chip>
        </template>

        <!-- Actions column -->
        <template #item.actions="{ item }">
          <div class="d-flex align-center justify-end gap-1">
            <!-- Edit -->
            <v-btn
              icon="mdi-pencil"
              variant="text"
              size="small"
              color="primary"
              @click="openEdit(item)"
            >
              <v-icon>mdi-pencil</v-icon>
              <v-tooltip activator="parent" location="top">Editar</v-tooltip>
            </v-btn>

            <!-- Suspend / Reactivate toggle -->
            <v-btn
              :icon="item.isActive ? 'mdi-account-lock' : 'mdi-account-check'"
              variant="text"
              size="small"
              :color="item.isActive ? 'warning' : 'success'"
              @click="toggleStatus(item)"
            >
              <v-icon>{{ item.isActive ? 'mdi-account-lock' : 'mdi-account-check' }}</v-icon>
              <v-tooltip activator="parent" location="top">
                {{ item.isActive ? 'Suspender' : 'Reactivar' }}
              </v-tooltip>
            </v-btn>

            <!-- Delete -->
            <v-btn
              icon="mdi-delete"
              variant="text"
              size="small"
              color="error"
              @click="openDelete(item)"
            >
              <v-icon>mdi-delete</v-icon>
              <v-tooltip activator="parent" location="top">Eliminar</v-tooltip>
            </v-btn>
          </div>
        </template>
      </v-data-table>
    </v-card>

    <!-- ─── Create / Edit Dialog ────────────────────────────────────────── -->
    <v-dialog v-model="formDialog" max-width="520">
      <v-card rounded="lg">
        <v-card-title class="text-subtitle-1 font-weight-bold pa-5 pb-3">
          {{ editMode ? 'Editar Usuario' : 'Crear Usuario' }}
        </v-card-title>
        <v-divider />
        <v-card-text class="pa-5">
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
        </v-card-text>
        <v-divider />
        <v-card-actions class="pa-4">
          <v-spacer />
          <v-btn variant="text" @click="formDialog = false">Cancelar</v-btn>
          <v-btn
            color="primary"
            variant="flat"
            :loading="actionLoading"
            @click="saveUser"
          >
            {{ editMode ? 'Guardar cambios' : 'Crear usuario' }}
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- ─── Suspend Confirm Dialog ──────────────────────────────────────── -->
    <v-dialog v-model="suspendDialog" max-width="420">
      <v-card rounded="lg">
        <v-card-text class="pa-6 text-center">
          <v-icon
            size="56"
            :color="selectedUser?.isActive ? 'warning' : 'success'"
            class="mb-4"
          >
            {{ selectedUser?.isActive ? 'mdi-account-lock' : 'mdi-account-check' }}
          </v-icon>
          <h3 class="text-subtitle-1 font-weight-bold mb-2">
            {{ selectedUser?.isActive ? 'Suspender Usuario' : 'Reactivar Usuario' }}
          </h3>
          <p class="text-body-2 text-medium-emphasis">
            ¿{{ selectedUser?.isActive ? 'Suspender' : 'Reactivar' }} a
            <strong>{{ selectedUser?.firstName }} {{ selectedUser?.lastName }}</strong>?
            <template v-if="selectedUser?.isActive">
              El usuario no podrá iniciar sesión mientras esté suspendido.
            </template>
          </p>
        </v-card-text>
        <v-card-actions class="pa-4 pt-0">
          <v-spacer />
          <v-btn variant="text" @click="suspendDialog = false">Cancelar</v-btn>
          <v-btn
            :color="selectedUser?.isActive ? 'warning' : 'success'"
            variant="flat"
            :loading="actionLoading"
            @click="confirmToggleStatus"
          >
            {{ selectedUser?.isActive ? 'Suspender' : 'Reactivar' }}
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- ─── Delete Confirm Dialog ───────────────────────────────────────── -->
    <v-dialog v-model="deleteDialog" max-width="420">
      <v-card rounded="lg">
        <v-card-text class="pa-6 text-center">
          <v-icon size="56" color="error" class="mb-4">mdi-account-remove</v-icon>
          <h3 class="text-subtitle-1 font-weight-bold mb-2">Eliminar Usuario</h3>
          <p class="text-body-2 text-medium-emphasis">
            ¿Eliminar permanentemente a
            <strong>{{ selectedUser?.firstName }} {{ selectedUser?.lastName }}</strong>?
            Esta acción no se puede deshacer.
          </p>
        </v-card-text>
        <v-card-actions class="pa-4 pt-0">
          <v-spacer />
          <v-btn variant="text" @click="deleteDialog = false">Cancelar</v-btn>
          <v-btn color="error" variant="flat" :loading="actionLoading" @click="deleteUser">
            Eliminar
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Snackbar -->
    <v-snackbar v-model="snackbar.show" :color="snackbar.color" rounded="lg" location="bottom end">
      <v-icon start>{{ snackbar.color === 'success' ? 'mdi-check-circle' : 'mdi-alert-circle' }}</v-icon>
      {{ snackbar.text }}
    </v-snackbar>
  </div>
</template>

<script setup lang="ts">
definePageMeta({
  layout: 'dashboard',
  middleware: ['auth', 'role'],
})

const { apiFetch } = useApi()
const config = useRuntimeConfig()
const authStore = useAuthStore()

// ── State ──────────────────────────────────────────────────────────────────
const users = ref<any[]>([])
const loading = ref(false)
const search = ref('')
const roleFilter = ref<string | null>(null)
const statusFilter = ref<boolean | null>(null)

const formDialog = ref(false)
const suspendDialog = ref(false)
const deleteDialog = ref(false)
const editMode = ref(false)
const selectedUser = ref<any>(null)
const actionLoading = ref(false)
const showPwd = ref(false)
const formRef = ref()

const snackbar = reactive({ show: false, text: '', color: 'success' })

// ── Form ───────────────────────────────────────────────────────────────────
const form = reactive({
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
  role: 'client',
  password: '',
})

// ── Constants ──────────────────────────────────────────────────────────────
const roleOptions = [
  { title: 'Super Admin', value: 'admin' },
  { title: 'Negocio', value: 'bussines' },
  { title: 'Cliente', value: 'client' },
]

const headers = [
  { title: 'Usuario', key: 'name', sortable: false, minWidth: '220px' },
  { title: 'Teléfono', key: 'phone', sortable: false },
  { title: 'Rol', key: 'role' },
  { title: 'Estado', key: 'isActive' },
  { title: 'Acciones', key: 'actions', sortable: false, align: 'end' as const },
]

// ── Computed ───────────────────────────────────────────────────────────────
const filteredUsers = computed(() => {
  let result = [...users.value]
  if (search.value) {
    const q = search.value.toLowerCase()
    result = result.filter(
      u =>
        u.firstName.toLowerCase().includes(q) ||
        u.lastName.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q)
    )
  }
  if (roleFilter.value) result = result.filter(u => u.role === roleFilter.value)
  if (statusFilter.value !== null && statusFilter.value !== undefined)
    result = result.filter(u => u.isActive === statusFilter.value)
  return result
})

// ── Helpers ────────────────────────────────────────────────────────────────
const roleColor = (role: string) => {
  const m: Record<string, string> = { admin: 'error', bussines: 'primary', client: 'success' }
  return m[role] ?? 'default'
}
const roleLabel = (role: string) => {
  const m: Record<string, string> = { admin: 'Super Admin', bussines: 'Negocio', client: 'Cliente' }
  return m[role] ?? role
}
const roleIcon = (role: string) => {
  const m: Record<string, string> = {
    admin: 'mdi-shield-crown',
    bussines: 'mdi-store',
    client: 'mdi-account',
  }
  return m[role] ?? 'mdi-account'
}

const notify = (text: string, color = 'success') => {
  snackbar.text = text; snackbar.color = color; snackbar.show = true
}

const updateUserInList = (id: string, data: Partial<any>) => {
  const idx = users.value.findIndex(u => u.id === id)
  if (idx !== -1) users.value[idx] = { ...users.value[idx], ...data }
}

// ── Actions ────────────────────────────────────────────────────────────────
const openCreate = () => {
  editMode.value = false
  Object.assign(form, { firstName: '', lastName: '', email: '', phone: '', role: 'client', password: '' })
  showPwd.value = false
  formDialog.value = true
}

const openEdit = (user: any) => {
  editMode.value = true
  selectedUser.value = user
  Object.assign(form, {
    firstName: user.firstName,
    lastName: user.lastName,
    email: user.email,
    phone: user.phone ?? '',
    role: user.role,
    password: '',
  })
  formDialog.value = true
}

const saveUser = async () => {
  const { valid } = await formRef.value.validate()
  if (!valid) return
  actionLoading.value = true
  try {
    if (editMode.value) {
      const payload: any = {
        firstName: form.firstName,
        lastName: form.lastName,
        phone: form.phone || undefined,
        role: form.role,
      }
      const updated = await apiFetch<any>(`/users/${selectedUser.value.id}`, {
        method: 'PATCH',
        body: payload,
      })
      updateUserInList(selectedUser.value.id, updated)
      notify('Usuario actualizado correctamente')
    } else {
      // Create via /auth/register
      const created = await $fetch<any>(`${config.public.apiBase}/auth/register`, {
        method: 'POST',
        body: {
          firstName: form.firstName,
          lastName: form.lastName,
          email: form.email,
          phone: form.phone || undefined,
          role: form.role,
          password: form.password,
        },
      })
      // Reload list to get full user object
      users.value = await apiFetch<any[]>('/users')
      notify('Usuario creado exitosamente')
    }
    formDialog.value = false
  } catch (e: any) {
    notify(e?.data?.message || 'Error al guardar usuario', 'error')
  } finally {
    actionLoading.value = false
  }
}

const toggleStatus = (user: any) => {
  selectedUser.value = user
  suspendDialog.value = true
}

const confirmToggleStatus = async () => {
  if (!selectedUser.value) return
  actionLoading.value = true
  try {
    if (selectedUser.value.isActive) {
      // Suspend → DELETE (soft delete / deactivate)
      await apiFetch(`/users/${selectedUser.value.id}`, { method: 'DELETE' })
      updateUserInList(selectedUser.value.id, { isActive: false })
      notify('Usuario suspendido')
    } else {
      // Reactivate → PATCH isActive: true
      const updated = await apiFetch<any>(`/users/${selectedUser.value.id}`, {
        method: 'PATCH',
        body: { isActive: true },
      })
      updateUserInList(selectedUser.value.id, { isActive: true, ...updated })
      notify('Usuario reactivado', 'success')
    }
    suspendDialog.value = false
  } catch (e: any) {
    notify(e?.data?.message || 'Error al cambiar estado', 'error')
  } finally {
    actionLoading.value = false
  }
}

const openDelete = (user: any) => {
  selectedUser.value = user
  deleteDialog.value = true
}

const deleteUser = async () => {
  if (!selectedUser.value) return
  actionLoading.value = true
  try {
    await apiFetch(`/users/${selectedUser.value.id}`, { method: 'DELETE' })
    users.value = users.value.filter(u => u.id !== selectedUser.value.id)
    notify('Usuario eliminado correctamente')
    deleteDialog.value = false
  } catch (e: any) {
    notify(e?.data?.message || 'Error al eliminar usuario', 'error')
  } finally {
    actionLoading.value = false
  }
}

// ── Validation rules ───────────────────────────────────────────────────────
const r = {
  required: (v: string) => !!v || 'Este campo es requerido',
  email: (v: string) => /.+@.+\..+/.test(v) || 'Email inválido',
  minLength: (v: string) => v.length >= 6 || 'Mínimo 6 caracteres',
}

// ── Load ───────────────────────────────────────────────────────────────────
onMounted(async () => {
  loading.value = true
  try {
    users.value = await apiFetch<any[]>('/users')
  } catch (e) {
    console.error(e)
  } finally {
    loading.value = false
  }
})
</script>
