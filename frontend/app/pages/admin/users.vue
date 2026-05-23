<template>
  <div>
    <PageHeader
      tag="Administración"
      title="Usuarios"
      subtitle="Gestión completa de usuarios del sistema"
    >
      <template #action>
        <v-btn color="primary" prepend-icon="mdi-account-plus" @click="openCreate">
          Nuevo Usuario
        </v-btn>
      </template>
    </PageHeader>

    <v-card rounded="lg" class="admin-shell-card">
      <!-- Filters -->
      <v-card-text class="pb-0 admin-toolbar">
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
        :mobile-breakpoint="768"
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
              :aria-label="`Editar usuario ${item.firstName} ${item.lastName}`"
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
              :aria-label="item.isActive ? `Suspender usuario ${item.firstName} ${item.lastName}` : `Reactivar usuario ${item.firstName} ${item.lastName}`"
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
              :aria-label="`Eliminar usuario ${item.firstName} ${item.lastName}`"
              @click="openDelete(item)"
            >
              <v-icon>mdi-delete</v-icon>
              <v-tooltip activator="parent" location="top">Eliminar</v-tooltip>
            </v-btn>
          </div>
        </template>
      </v-data-table>
    </v-card>

    <!-- ─── Create / Edit Dialog ─────────────────────────────────────────── -->
    <UserFormModal
      v-model="formDialog"
      :edit-mode="editMode"
      :initial="selectedUser"
      :loading="actionLoading"
      @save="saveUser"
    />

    <!-- ─── Suspend Confirm Dialog ──────────────────────────────────────── -->
    <AppConfirmDialog
      v-model="suspendDialog"
      :title="selectedUser?.isActive ? 'Suspender usuario' : 'Reactivar usuario'"
      :subtitle="selectedUser?.isActive ? 'El usuario no podrá iniciar sesión mientras esté suspendido.' : 'El usuario podrá volver a iniciar sesión.'"
      :tag="selectedUser?.isActive ? 'Atención' : 'Reactivación'"
      :icon="selectedUser?.isActive ? 'mdi-account-lock' : 'mdi-account-check'"
      :icon-color="selectedUser?.isActive ? 'warning' : 'success'"
      :confirm-text="selectedUser?.isActive ? 'Suspender' : 'Reactivar'"
      :confirm-color="selectedUser?.isActive ? 'warning' : 'success'"
      :loading="actionLoading"
      @confirm="confirmToggleStatus"
    >
      <p class="text-body-2 text-medium-emphasis">
        ¿{{ selectedUser?.isActive ? 'Suspender' : 'Reactivar' }} a
        <strong>{{ selectedUser?.firstName }} {{ selectedUser?.lastName }}</strong>?
      </p>
    </AppConfirmDialog>

    <!-- ─── Delete Confirm Dialog ───────────────────────────────────────── -->
    <AppConfirmDialog
      v-model="deleteDialog"
      title="Eliminar usuario"
      subtitle="Esta acción no se puede deshacer."
      icon="mdi-account-remove"
      confirm-text="Eliminar"
      :loading="actionLoading"
      @confirm="deleteUser"
    >
      <p class="text-body-2 text-medium-emphasis">
        Vas a eliminar permanentemente a
        <strong>{{ selectedUser?.firstName }} {{ selectedUser?.lastName }}</strong>.
      </p>
    </AppConfirmDialog>

    <!-- Snackbar -->
  </div>
</template>

<script setup lang="ts">
definePageMeta({
  layout: 'dashboard',
  middleware: ['auth', 'role'],
})

const { apiFetch } = useApi()
const authStore = useAuthStore()

// ── State ──────────────────────────────────────────────────────────────────
const { data: users, loading, execute: loadUsers } =
  useAsyncState<any[]>(() => apiFetch<any[]>('/users'), [])
const search = ref('')
const roleFilter = ref<string | null>(null)
const statusFilter = ref<boolean | null>(null)

const formDialog = ref(false)
const suspendDialog = ref(false)
const deleteDialog = ref(false)
const editMode = ref(false)
const selectedUser = ref<any>(null)
const actionLoading = ref(false)

const toast = useToast()

// ── Constants ──────────────────────────────────────────────────────────────
// roleOptions alimenta el filtro de rol del toolbar (el form tiene su propia copia).
const roleOptions = [
  { title: 'Super Admin', value: 'admin' },
  { title: 'Negocio', value: 'business' },
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
  const m: Record<string, string> = { admin: 'error', business: 'primary', client: 'success' }
  return m[role] ?? 'default'
}
const roleLabel = (role: string) => {
  const m: Record<string, string> = { admin: 'Super Admin', business: 'Negocio', client: 'Cliente' }
  return m[role] ?? role
}
const roleIcon = (role: string) => {
  const m: Record<string, string> = {
    admin: 'mdi-shield-crown',
    business: 'mdi-store',
    client: 'mdi-account',
  }
  return m[role] ?? 'mdi-account'
}

const notify = (text: string, color: 'success' | 'error' | 'info' | 'warning' = 'success') => {
  toast[color](text)
}

const updateUserInList = (id: string, data: Partial<any>) => {
  const idx = users.value.findIndex(u => u.id === id)
  if (idx !== -1) users.value[idx] = { ...users.value[idx], ...data }
}

// ── Actions ────────────────────────────────────────────────────────────────
const openCreate = () => {
  editMode.value = false
  selectedUser.value = null
  formDialog.value = true
}

const openEdit = (user: any) => {
  editMode.value = true
  selectedUser.value = user
  formDialog.value = true
}

// El payload llega validado desde UserFormModal.
const saveUser = async (formData: any) => {
  actionLoading.value = true
  try {
    if (editMode.value) {
      const payload: any = {
        firstName: formData.firstName,
        lastName: formData.lastName,
        phone: formData.phone || undefined,
        role: formData.role,
      }
      const updated = await apiFetch<any>(`/users/${selectedUser.value.id}`, {
        method: 'PATCH',
        body: payload,
      })
      updateUserInList(selectedUser.value.id, updated)
      notify('Usuario actualizado correctamente')
    } else {
      // Creación admin-only con rol explícito. /auth/register es público y
      // siempre crea `client`; para asignar admin/business usamos POST /users.
      await apiFetch<any>('/users', {
        method: 'POST',
        body: {
          firstName: formData.firstName,
          lastName: formData.lastName,
          email: formData.email,
          phone: formData.phone || undefined,
          role: formData.role,
          password: formData.password,
        },
      })
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

// ── Load ───────────────────────────────────────────────────────────────────
onMounted(loadUsers)
</script>

<style scoped>
.admin-shell-card {
  border: 1px solid var(--border-soft);
  background: var(--bg-card) !important;
  border-radius: var(--radius-lg) !important;
}
.admin-toolbar {
  border-bottom: 1px solid var(--border-soft);
  margin-bottom: 12px;
  padding-bottom: 14px !important;
}
:deep(.v-data-table .v-table__wrapper table tbody tr:hover) {
  background: var(--green-soft);
}
:deep(.v-data-table .v-table__wrapper table tbody td) {
  padding-top: 10px !important;
  padding-bottom: 10px !important;
}
:deep(.v-data-table .v-table__wrapper table thead th) {
  font-size: 0.72rem !important;
  letter-spacing: 0.08em;
}
:deep(.v-chip) {
  font-weight: 700;
}
:deep(.v-btn) {
  letter-spacing: 0.01em;
}
:deep(.v-btn:hover) {
  transform: translateY(-1px);
}
</style>
