<template>
  <div>
    <PageHeader
      tag="Administración"
      title="Usuarios"
      subtitle="Gestión completa de usuarios del sistema"
    >
      <template #action>
        <v-btn color="primary" prepend-icon="mdi-account-plus" size="default" class="px-5" style="padding-left: 16px !important; padding-right: 16px !important;" @click="openCreate">
          Nuevo Usuario
        </v-btn>
      </template>
    </PageHeader>

    <!-- Filtros -->
    <v-row dense class="mb-6">
      <v-col cols="12" sm="6">
        <v-text-field
          v-model="search"
          placeholder="Buscar por nombre o email..."
          prepend-inner-icon="mdi-magnify"
          clearable
          hide-details
          class="pa-0"
        />
      </v-col>
      <v-col cols="6" sm="3">
        <v-select
          v-model="roleFilter"
          :items="roleOptions"
          label="Rol"
          clearable
          hide-details
          class="pa-0"
        />
      </v-col>
      <v-col cols="6" sm="3">
        <v-select
          v-model="statusFilter"
          :items="[{title:'Activo',value:true},{title:'Inactivo',value:false}]"
          label="Estado"
          clearable
          hide-details
          class="pa-0"
        />
      </v-col>
    </v-row>

    <!-- Cards grid (mismo diseño que negocio/cliente) -->
    <v-row class="gap-4">
      <v-col v-for="u in filteredUsers" :key="u.id" cols="12" sm="6" lg="4" class="pa-4">
        <v-card rounded="lg" hover class="admin-card h-100">
          <v-card-text class="pt-4 pb-2 px-4" style="padding-top: 16px !important; padding-left: 16px !important; padding-right: 16px !important;">
            <div class="d-flex align-center mb-3 pl-1 pt-3">
              <v-avatar :color="u.isActive ? 'primary' : 'grey'" variant="tonal" size="48" rounded="lg" style="margin-right: 16px;">
                <span class="text-caption font-weight-bold">{{ u.firstName[0] }}{{ u.lastName[0] }}</span>
              </v-avatar>
              <div class="flex-1-1" style="min-width:0">
                <div class="text-subtitle-2 font-weight-bold line-clamp-1 mb-1">{{ u.firstName }} {{ u.lastName }}</div>
                <div class="text-caption text-medium-emphasis line-clamp-1">{{ u.email }}</div>
              </div>
              <v-chip :color="u.isActive ? 'success' : 'error'" size="x-small" variant="tonal" class="mr-1" style="padding-left: 10px !important; padding-right: 10px !important;">
                {{ u.isActive ? 'Activo' : 'Suspendido' }}
              </v-chip>
            </div>

            <div class="d-flex align-center justify-space-between mt-3 pb-3" style="margin-top: 12px; margin-bottom: 12px !important;">
              <v-chip :color="roleColor(u.role)" size="small" variant="tonal" style="gap: 6px; display: inline-flex; align-items: center; padding-left: 10px !important; padding-right: 10px !important;">
                <v-icon start size="13" style="margin-right: 4px;">{{ roleIcon(u.role) }}</v-icon>
                {{ roleLabel(u.role) }}
              </v-chip>
              <span v-if="u.phone" class="text-caption text-medium-emphasis d-inline-flex align-center gap-1" style="margin-right: 8px;">
                <v-icon size="14">mdi-phone-outline</v-icon> {{ u.phone }}
              </span>
            </div>
          </v-card-text>

          <v-divider />
          <v-card-actions class="pa-4 d-flex align-center">
            <v-btn 
              v-if="authStore.user?.role !== 'admin'"
              variant="text" 
              size="small" 
              color="primary" 
              prepend-icon="mdi-pencil" 
              @click="openEdit(u)"
            >
              Editar
            </v-btn>
            <v-spacer />
            <div class="d-flex align-center gap-2" style="display: flex; align-items: center; gap: 8px;">
              <v-btn
                :icon="u.isActive ? 'mdi-account-lock' : 'mdi-account-check'"
                variant="text"
                size="small"
                :color="u.isActive ? 'warning' : 'success'"
                :aria-label="u.isActive ? 'Suspender usuario' : 'Reactivar usuario'"
                @click="toggleStatus(u)"
              >
                <v-icon>{{ u.isActive ? 'mdi-account-lock' : 'mdi-account-check' }}</v-icon>
                <v-tooltip activator="parent" location="top">{{ u.isActive ? 'Suspender' : 'Reactivar' }}</v-tooltip>
              </v-btn>
              <v-btn icon="mdi-delete" variant="text" size="small" color="error" aria-label="Eliminar usuario" @click="openDelete(u)" />
            </div>
          </v-card-actions>
        </v-card>
      </v-col>

      <v-col v-if="loading" cols="12" class="text-center py-10">
        <v-progress-circular indeterminate color="primary" />
      </v-col>
      <v-col v-if="!loading && filteredUsers.length === 0" cols="12">
        <v-alert type="info" variant="tonal" rounded="lg">No hay usuarios con esos filtros.</v-alert>
      </v-col>
    </v-row>

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

// ── Computed ───────────────────────────────────────────────────────────────
const filteredUsers = computed(() => {
  let result = [...users.value]
  if (search.value) {
    const q = search.value.toLowerCase().trim()
    result = result.filter(
      u =>
        `${u.firstName} ${u.lastName}`.toLowerCase().includes(q) ||
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
.admin-card {
  border: 1px solid var(--border-soft);
  background: var(--bg-card) !important;
  border-radius: var(--radius-lg) !important;
  height: 100%;
}
.line-clamp-1 {
  display: -webkit-box;
  -webkit-line-clamp: 1;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
:deep(.v-chip) { font-weight: 700; }
</style>
