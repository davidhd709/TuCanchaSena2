<template>
  <div>
    <PageHeader
      tag="Administración"
      title="Negocios"
      subtitle="Gestión de negocios registrados"
    >
      <template #action>
        <v-btn color="primary" prepend-icon="mdi-plus" style="padding-left: 16px !important; padding-right: 16px !important;" @click="openCreate">
          Nuevo Negocio
        </v-btn>
      </template>
    </PageHeader>

    <div class="businesses-masonry">
      <div
        v-for="biz in businesses"
        :key="biz.id"
        class="masonry-item"
      >
        <v-card rounded="xl" hover class="admin-biz-card d-flex flex-column" style="box-shadow: 0 12px 40px rgba(0,0,0,0.08) !important; transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1); border: 1px solid rgba(0,0,0,0.05); background-color: var(--bg-card); height: auto !important;">
          <!-- Business Image -->
          <v-img
            :src="biz.images?.[0] || '/images/placeholder-business.jpg'"
            height="240"
            cover
            class="rounded-t-xl"
          >
            <template #placeholder>
              <v-row class="fill-height ma-0" align="center" justify="center">
                <v-icon color="grey-lighten-2" size="48">mdi-store</v-icon>
              </v-row>
            </template>
          </v-img>

          <v-card-text class="pa-10 flex-grow-1 d-flex flex-column" style="padding: 20px !important;">
            <!-- Header: Title & Status -->
            <div class="d-flex align-start justify-space-between mb-8">
              <div class="flex-1-1" style="min-width:0">
                <div class="text-h5 font-weight-bold line-clamp-1 mb-3" style="letter-spacing: -0.5px; margin-bottom: 8px !important;">{{ biz.name }}</div>
                <div class="text-body-2 text-medium-emphasis line-clamp-1 d-flex align-center gap-2" style="margin-bottom: 12px !important;">
                  <v-icon size="18" color="primary">mdi-map-marker-outline</v-icon> {{ biz.address }}
                </div>
              </div>
              <v-chip 
                :color="biz.isActive ? 'success' : 'error'" 
                size="small" 
                variant="flat" 
                class="font-weight-bold px-4"
                style="border-radius: 20px; height: 28px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); margin-top: 4px; padding: 4px 12px !important;"
              >
                {{ biz.isActive ? 'Activo' : 'Inactivo' }}
              </v-chip>
            </div>

            <v-divider class="mb-8" style="opacity: 0.4;"></v-divider>

            <!-- Description Section -->
            <div class="mb-10" style="margin-bottom: 16px !important;">
              <div class="text-overline text-primary font-weight-black mb-3" style="letter-spacing: 1px;">Descripción del Negocio</div>
              <p class="text-body-1 text-medium-emphasis line-clamp-3" style="min-height: 5em; line-height: 1.8; opacity: 0.8;">
                {{ biz.description || 'Sin descripción disponible para este negocio.' }}
              </p>
            </div>

            <v-divider class="mb-8" style="opacity: 0.4;"></v-divider>

            <!-- Owner Section -->
            <div v-if="biz.owner" class="d-flex align-center gap-4 text-body-2 text-medium-emphasis mb-10" style="padding: 10px 0; gap: 10px !important;">
              <v-avatar color="primary" size="36" variant="flat" class="elevation-1">
                <v-icon size="18" color="white">mdi-account</v-icon>
              </v-avatar>
              <div class="d-flex flex-column">
                <span class="text-overline text-primary font-weight-bold mb-n1" style="font-size: 0.6rem;">Propietario</span>
                <span class="font-weight-bold">{{ biz.owner.firstName }} {{ biz.owner.lastName }}</span>
              </div>
            </div>

            <!-- Schedule Section -->
            <div class="mt-auto" style="margin-bottom: 0 !important;">
              <div class="text-overline text-primary font-weight-black mb-4" style="letter-spacing: 1px;">Horarios de Atención</div>
              <div class="d-flex flex-wrap gap-3" style="gap: 8px !important;">
                <v-chip
                  v-for="s in openDays(biz.schedules)"
                  :key="s.dayOfWeek"
                  size="small"
                  color="primary"
                  variant="tonal"
                  class="rounded-pill px-4 font-weight-medium"
                  style="height: 32px; border: 1px solid rgba(var(--v-theme-primary), 0.2); padding: 6px 12px !important;"
                >
                  {{ dayShort(s.dayOfWeek) }} {{ s.openTime.slice(0,5) }}-{{ s.closeTime.slice(0,5) }}
                </v-chip>
                <v-chip
                  v-if="!biz.schedules || biz.schedules.length === 0"
                  size="small"
                  color="warning"
                  variant="tonal"
                  class="rounded-pill px-4"
                  style="padding: 6px 12px !important;"
                >
                  Sin horario registrado
                </v-chip>
              </div>
            </div>
          </v-card-text>

          <v-card-actions class="pa-0 d-flex align-center" style="padding: 12px 16px !important; border-top: 1px solid rgba(255,255,255,0.08);">
            <v-btn variant="flat" size="small" prepend-icon="mdi-pencil" color="primary" class="px-6 rounded-lg font-weight-bold" style="padding-left: 16px !important; padding-right: 16px !important;" @click="openEdit(biz)">
              Editar Negocio
            </v-btn>
            <v-spacer />
            <v-btn icon="mdi-delete" variant="text" color="error" size="small" @click="openDeleteConfirm(biz)" />
          </v-card-actions>
        </v-card>
      </div>

      <div v-if="loading" class="masonry-item" style="grid-column: 1 / -1; text-align: center;">
        <v-progress-circular indeterminate color="primary" />
      </div>
      <div v-if="!loading && businesses.length === 0" class="masonry-item" style="grid-column: 1 / -1;">
        <v-alert type="info" variant="tonal" rounded="lg">No hay negocios registrados.</v-alert>
      </div>
    </div>

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
      images: formData.images || undefined,
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
/* ═══════════════════════════════════════════════════
   GRID MASONRY — 3 cols desktop · 2 tablet · 1 móvil
   Usa CSS column-count para que las tarjetas se
   acomoden sin huecos sin importar su altura.
   ════════════════════════════════════════════════ */
.businesses-masonry {
  column-count: 3;
  column-gap: 24px;
  width: 100%;
}

.masonry-item {
  break-inside: avoid;       /* nunca parte una tarjeta entre columnas */
  -webkit-column-break-inside: avoid;
  page-break-inside: avoid;
  margin-bottom: 24px;
  display: block;            /* necesario para que break-inside funcione */
}

/* Tablet: 2 columnas */
@media (max-width: 1100px) {
  .businesses-masonry { column-count: 2; }
}

/* Móvil: 1 columna */
@media (max-width: 680px) {
  .businesses-masonry {
    column-count: 1;
    column-gap: 0;
  }
}

/* ── Tarjeta ─────────────────────────────────────── */
.admin-biz-card {
  border: 1px solid var(--border-soft);
  background: var(--bg-card) !important;
  border-radius: var(--radius-lg) !important;
  /* sin height fija — altura automática según contenido */
  height: auto !important;
  min-height: unset !important;
}

.admin-biz-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 20px 48px rgba(0, 0, 0, 0.36),
              0 0 0 1px rgba(52, 198, 146, 0.18) !important;
  border-color: rgba(52, 198, 146, 0.22) !important;
}

/* ── Deep overrides de Vuetify ──────────────────── */
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
:deep(.v-card) {
  height: auto !important;
}
</style>
