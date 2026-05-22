<template>
  <div>
    <PageHeader
      tag="Administración"
      title="Negocios"
      subtitle="Gestión de negocios registrados"
    >
      <template #action>
        <v-btn color="primary" prepend-icon="mdi-plus" @click="openCreate">
          Nuevo Negocio
        </v-btn>
      </template>
    </PageHeader>

    <!-- Cards grid -->
    <v-row>
      <v-col
        v-for="biz in businesses"
        :key="biz.id"
        cols="12" sm="6" lg="4"
      >
        <v-card rounded="lg" hover class="admin-biz-card">
          <v-card-text class="pa-5">
            <div class="d-flex align-center mb-3">
              <v-avatar color="primary" variant="tonal" size="48" rounded="lg" class="mr-3">
                <v-icon>mdi-store</v-icon>
              </v-avatar>
              <div class="flex-1-1">
                <div class="text-subtitle-2 font-weight-bold">{{ biz.name }}</div>
                <div class="text-caption text-medium-emphasis">{{ biz.address }}</div>
              </div>
              <v-chip :color="biz.isActive ? 'success' : 'error'" size="x-small" variant="tonal">
                {{ biz.isActive ? 'Activo' : 'Inactivo' }}
              </v-chip>
            </div>

            <p class="text-body-2 text-medium-emphasis mb-3 line-clamp-2">
              {{ biz.description || 'Sin descripción' }}
            </p>

            <!-- Owner -->
            <div v-if="biz.owner" class="d-flex align-center gap-1 text-caption text-medium-emphasis mb-1">
              <v-icon size="13">mdi-account</v-icon>
              {{ biz.owner.firstName }} {{ biz.owner.lastName }}
            </div>

            <!-- Schedule summary -->
            <div class="d-flex flex-wrap gap-1 mt-2">
              <v-chip
                v-for="s in openDays(biz.schedules)"
                :key="s.dayOfWeek"
                size="x-small"
                color="primary"
                variant="tonal"
              >
                {{ dayShort(s.dayOfWeek) }} {{ s.openTime.slice(0,5) }}-{{ s.closeTime.slice(0,5) }}
              </v-chip>
              <v-chip
                v-if="!biz.schedules || biz.schedules.length === 0"
                size="x-small"
                color="warning"
                variant="tonal"
              >
                Sin horario
              </v-chip>
            </div>
          </v-card-text>

          <v-divider />
          <v-card-actions class="pa-3">
            <v-btn variant="text" size="small" prepend-icon="mdi-pencil" @click="openEdit(biz)">
              Editar
            </v-btn>
            <v-spacer />
            <v-btn icon="mdi-delete" variant="text" color="error" size="small" @click="openDeleteConfirm(biz)" />
          </v-card-actions>
        </v-card>
      </v-col>

      <v-col v-if="loading" cols="12" class="text-center py-10">
        <v-progress-circular indeterminate color="primary" />
      </v-col>
      <v-col v-if="!loading && businesses.length === 0" cols="12">
        <v-alert type="info" variant="tonal" rounded="lg">No hay negocios registrados.</v-alert>
      </v-col>
    </v-row>

    <!-- ─── Create / Edit Dialog ─────────────────────────────────────────── -->
    <AdminBusinessFormModal
      v-model="formDialog"
      :edit-mode="editMode"
      :initial="selectedBiz"
      :loading="actionLoading"
      :business-users="businessUsers"
      :users-loading="usersLoading"
      @save="saveBusiness"
    />

    <!-- Delete confirm -->
    <AppConfirmDialog
      v-model="deleteDialog"
      title="Desactivar negocio"
      subtitle="El negocio dejará de ser visible pero sus reservas se conservan."
      icon="mdi-store-remove"
      confirm-text="Desactivar"
      :loading="actionLoading"
      @confirm="deleteBusiness"
    >
      <p class="text-body-2 text-medium-emphasis">
        Vas a desactivar <strong>{{ selectedBiz?.name }}</strong>.
        Sus canchas y reservas activas seguirán existiendo pero el negocio no será visible.
      </p>
    </AppConfirmDialog>

  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: 'dashboard', middleware: ['auth', 'role'] })

const { apiFetch, apiList } = useApi()

// ── State ──────────────────────────────────────────────────────────────────
const businesses = ref<any[]>([])
const businessUsers = ref<any[]>([])
const loading = ref(false)
const usersLoading = ref(false)
const formDialog = ref(false)
const deleteDialog = ref(false)
const editMode = ref(false)
const selectedBiz = ref<any>(null)
const actionLoading = ref(false)
const toast = useToast()

// ── Helpers ────────────────────────────────────────────────────────────────
const dayShort = (d: string) => {
  const m: Record<string, string> = {
    monday: 'Lun', tuesday: 'Mar', wednesday: 'Mié',
    thursday: 'Jue', friday: 'Vie', saturday: 'Sáb', sunday: 'Dom',
  }
  return m[d] ?? d
}

const openDays = (schedules: any[]) =>
  (schedules ?? []).filter(s => s.isOpen)

const notify = (text: string, color: 'success' | 'error' | 'info' | 'warning' = 'success') => {
  toast[color](text)
}

// ── CRUD ───────────────────────────────────────────────────────────────────
const openCreate = async () => {
  editMode.value = false
  selectedBiz.value = null
  formDialog.value = true
  // Carga lazy de usuarios con rol Negocio para el selector de propietario.
  if (businessUsers.value.length === 0) {
    usersLoading.value = true
    try {
      const users = await apiFetch<any[]>('/users')
      businessUsers.value = users
        .filter(u => u.role === 'business' && u.isActive)
        .map(u => ({ id: u.id, label: `${u.firstName} ${u.lastName} (${u.email})` }))
    } finally {
      usersLoading.value = false
    }
  }
}

const openEdit = (biz: any) => {
  editMode.value = true
  selectedBiz.value = biz
  formDialog.value = true
}

// El payload llega validado desde AdminBusinessFormModal. La creación agrega
// ownerId; ambos filtran los horarios abiertos (igual que antes).
const saveBusiness = async (formData: any) => {
  actionLoading.value = true
  try {
    const payload: any = {
      name: formData.name,
      description: formData.description || undefined,
      phone: formData.phone,
      email: formData.email || undefined,
      address: formData.address,
      latitude: formData.latitude,
      longitude: formData.longitude,
      schedules: formData.schedules.filter((s: any) => s.isOpen),
    }

    if (!editMode.value) {
      payload.ownerId = formData.ownerId
      const created = await apiFetch<any>('/businesses', { method: 'POST', body: payload })
      businesses.value.unshift(created)
      notify('Negocio creado exitosamente')
    } else {
      const updated = await apiFetch<any>(`/businesses/${selectedBiz.value.id}`, {
        method: 'PATCH',
        body: payload,
      })
      const idx = businesses.value.findIndex(b => b.id === selectedBiz.value.id)
      if (idx !== -1) businesses.value[idx] = updated
      notify('Negocio actualizado correctamente')
    }
    formDialog.value = false
  } catch (e: any) {
    notify(e?.data?.message || 'Error al guardar negocio', 'error')
  } finally {
    actionLoading.value = false
  }
}

const openDeleteConfirm = (biz: any) => {
  selectedBiz.value = biz
  deleteDialog.value = true
}

const deleteBusiness = async () => {
  actionLoading.value = true
  try {
    await apiFetch(`/businesses/${selectedBiz.value.id}`, { method: 'DELETE' })
    businesses.value = businesses.value.filter(b => b.id !== selectedBiz.value.id)
    notify('Negocio desactivado')
    deleteDialog.value = false
  } catch (e: any) {
    notify(e?.data?.message || 'Error', 'error')
  } finally {
    actionLoading.value = false
  }
}

// ── Load ───────────────────────────────────────────────────────────────────
onMounted(async () => {
  loading.value = true
  try {
    businesses.value = await apiList<any>('/businesses')
  } finally {
    loading.value = false
  }
})
</script>

<style scoped>
.admin-biz-card {
  border: 1px solid var(--border-soft);
  background: var(--bg-card) !important;
  border-radius: var(--radius-lg) !important;
}
:deep(.v-card-text .text-subtitle-2) {
  font-size: 1rem;
  letter-spacing: 0.01em;
}
:deep(.v-chip) {
  font-weight: 700;
}
:deep(.v-card-actions) {
  border-top: 1px solid var(--border-soft);
}
</style>
