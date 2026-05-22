<template>
  <div>
    <PageHeader
      tag="Negocio"
      title="Mis Canchas"
      subtitle="Administra las canchas de tu negocio, sus precios y horarios"
    >
      <template v-if="hasBusiness" #action>
        <v-btn color="primary" prepend-icon="mdi-plus" @click="openCreate">
          Nueva cancha
        </v-btn>
      </template>
    </PageHeader>

    <LoadingState v-if="loading" :count="3" :sm="6" :lg="4" />

    <!-- Sin negocio: redirigir a crearlo -->
    <div v-else-if="!hasBusiness" class="bc-empty">
      <div class="bc-empty-icon"><span class="mdi mdi-stadium-variant" /></div>
      <h3 class="brand-heading bc-empty-title">Primero crea tu negocio</h3>
      <p class="bc-empty-text">
        Las canchas pertenecen a un negocio. Crea tu negocio para poder publicar canchas.
      </p>
      <v-btn to="/business" color="primary" prepend-icon="mdi-store">
        Ir a Mi Negocio
      </v-btn>
    </div>

    <!-- Con negocio pero sin canchas -->
    <div v-else-if="courts.length === 0" class="bc-empty">
      <div class="bc-empty-icon"><span class="mdi mdi-soccer-field" /></div>
      <h3 class="brand-heading bc-empty-title">Aún no tienes canchas</h3>
      <p class="bc-empty-text">
        Crea tu primera cancha para empezar a recibir reservas. Define su tipo, precio y horarios.
      </p>
      <v-btn color="primary" prepend-icon="mdi-plus" @click="openCreate">Crear primera cancha</v-btn>
    </div>

    <!-- Grid de canchas -->
    <AppGrid v-else :min="260">
      <div v-for="court in courts" :key="court.id" class="bc-card">
        <div class="bc-card-media">
          <img
            v-if="safeCover(court.images?.[0])"
            :src="safeCover(court.images?.[0])"
            :alt="court.name"
            class="bc-card-img"
          />
          <AppMediaPlaceholder v-else type="court" class="bc-card-img bc-card-img--ph" />
          <span class="bc-card-status" :class="statusClass(court.status)">
            <span class="bc-card-status-dot" />
            {{ statusLabel(court.status) }}
          </span>
        </div>

        <div class="bc-card-body">
          <div class="bc-card-top">
            <h3 class="bc-card-name line-clamp-1">{{ court.name }}</h3>
            <span class="bc-card-type">{{ courtTypeLabel(court.type) }}</span>
          </div>

          <div class="bc-card-stats">
            <span class="bc-stat">
              <span class="mdi mdi-cash" />
              {{ formatCurrency(court.pricePerHour) }}/hr
            </span>
            <span class="bc-stat">
              <span class="mdi mdi-account-group-outline" />
              {{ court.capacity ?? '—' }} jug.
            </span>
            <span v-if="hasCustomSlotPrices(court)" class="bc-stat is-accent">
              <span class="mdi mdi-tag-outline" />
              Precios especiales
            </span>
          </div>

          <div class="bc-card-slots">
            <span class="bc-slots-label">Horarios configurados</span>
            <div v-if="court.availability?.length" class="bc-slots-chips">
              <span
                v-for="a in groupedAvailability(court.availability).slice(0, 5)"
                :key="a.day"
                class="bc-slot-chip"
              >
                {{ dayShort(a.day) }}
              </span>
              <span
                v-if="groupedAvailability(court.availability).length > 5"
                class="bc-slot-chip is-more"
              >
                +{{ groupedAvailability(court.availability).length - 5 }}
              </span>
            </div>
            <span v-else class="bc-slots-none">Sin horarios definidos</span>
          </div>

          <div class="bc-card-actions">
            <v-btn
              variant="tonal"
              color="primary"
              size="small"
              prepend-icon="mdi-clock-edit-outline"
              @click="openAvailability(court)"
            >
              Horarios
            </v-btn>
            <v-spacer />
            <v-btn icon="mdi-pencil-outline" variant="text" size="small" @click="openEdit(court)" />
            <v-btn icon="mdi-delete-outline" variant="text" color="error" size="small" @click="openDelete(court)" />
          </div>
        </div>
      </div>
    </AppGrid>

    <!-- ─── Court Form Dialog ─── -->
    <CourtFormModal
      v-model="formDialog"
      :edit-mode="editMode"
      :initial="selectedCourt"
      :loading="actionLoading"
      @save="saveCourt"
    />

    <!-- ─── Availability Dialog ─── -->
    <AppModalShell
      v-model="availabilityDialog"
      :title="`Horarios: ${selectedCourt?.name ?? ''}`"
      subtitle="Los slots deben estar dentro del horario de apertura del negocio."
      :width="780"
    >
      <template #tag>Disponibilidad</template>
      <template #body>
        <CourtAvailabilityEditor
          v-if="availabilityDialog && selectedCourt"
          :key="availabilityEditorKey"
          v-model="availabilitySlots"
          :business-schedules="currentBusinessSchedules"
          :court-base-price="selectedCourt.pricePerHour"
        />
      </template>
      <template #footer>
        <v-btn variant="text" size="small" prepend-icon="mdi-broom" class="text-medium-emphasis" @click="availabilitySlots = []">
          Limpiar todo
        </v-btn>
        <v-spacer />
        <v-btn variant="text" @click="availabilityDialog = false">Cancelar</v-btn>
        <v-btn color="primary" variant="flat" :loading="actionLoading" @click="saveAvailability">
          Guardar horarios
        </v-btn>
      </template>
    </AppModalShell>

    <!-- Delete Dialog -->
    <AppConfirmDialog
      v-model="deleteDialog"
      title="Eliminar cancha"
      subtitle="Esta acción no se puede deshacer."
      icon="mdi-soccer-field"
      confirm-text="Eliminar"
      :loading="actionLoading"
      @confirm="deleteCourt"
    >
      <p class="text-body-2 text-medium-emphasis">
        Vas a eliminar <strong>{{ selectedCourt?.name }}</strong>.
        También se eliminarán sus horarios y reservas asociadas.
      </p>
    </AppConfirmDialog>

  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: 'dashboard', middleware: ['auth', 'role'], ssr: false })

const { apiFetch, apiList } = useApi()

// ── State ──────────────────────────────────────────────────────────────────
const myBusiness = ref<any>(null)
const courts = ref<any[]>([])
const loading = ref(false)

const formDialog = ref(false)
const availabilityDialog = ref(false)
const deleteDialog = ref(false)
const editMode = ref(false)
const selectedCourt = ref<any>(null)
const actionLoading = ref(false)
const toast = useToast()

const availabilitySlots = ref<any[]>([])
const currentBusinessSchedules = ref<any[]>([])
const availabilityEditorKey = ref(0)

const hasBusiness = computed(() => !!myBusiness.value)

// courtTypes se queda en la página: lo usa courtTypeLabel para las cards
// (el formulario tiene su propia copia en CourtFormModal).
const courtTypes = [
  { title: 'Fútbol 5', value: 'football_5' },
  { title: 'Fútbol 7', value: 'football_7' },
  { title: 'Fútbol 8', value: 'football_8' },
  { title: 'Fútbol 11', value: 'football_11' },
  { title: 'Futsal', value: 'futsal' },
  { title: 'Fútbol Playa', value: 'beach_soccer' },
  { title: 'Mini Fútbol', value: 'mini_football' },
]

// ── Helpers ────────────────────────────────────────────────────────────────
const courtTypeLabel = (type: string) => courtTypes.find(t => t.value === type)?.title ?? type

const STATUS_LABELS: Record<string, string> = {
  available: 'Disponible',
  unavailable: 'No disponible',
  maintenance: 'En mantenimiento',
}
const statusLabel = (s: string) => STATUS_LABELS[s] ?? s
const statusClass = (s: string) =>
  s === 'available' ? 'is-available' : s === 'maintenance' ? 'is-maintenance' : 'is-unavailable'

const dayShort = (d: string) => {
  const m: Record<string, string> = {
    monday: 'Lun', tuesday: 'Mar', wednesday: 'Mié',
    thursday: 'Jue', friday: 'Vie', saturday: 'Sáb', sunday: 'Dom',
  }
  return m[d] ?? d
}

const hasCustomSlotPrices = (court: any) =>
  (court.availability ?? []).some((a: any) => a.pricePerHour !== null && a.pricePerHour !== undefined)

const groupedAvailability = (availability: any[]) => {
  const map: Record<string, any> = {}
  for (const a of availability) {
    if (!map[a.dayOfWeek]) map[a.dayOfWeek] = { day: a.dayOfWeek, count: 0 }
    map[a.dayOfWeek].count++
  }
  const order = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']
  return order.filter(d => map[d]).map(d => map[d])
}

const notify = (text: string, color: 'success' | 'error' | 'info' | 'warning' = 'success') => {
  toast[color](text)
}

// ── CRUD ───────────────────────────────────────────────────────────────────
const openCreate = () => {
  editMode.value = false
  selectedCourt.value = null
  formDialog.value = true
}

const openEdit = (court: any) => {
  editMode.value = true
  selectedCourt.value = court
  formDialog.value = true
}

// El payload llega validado desde CourtFormModal. La creación agrega capacity y
// businessId; la edición omite capacity (igual que antes).
const saveCourt = async (formData: any) => {
  actionLoading.value = true
  try {
    if (editMode.value) {
      const updated = await apiFetch<any>(`/courts/${selectedCourt.value.id}`, {
        method: 'PATCH',
        body: {
          name: formData.name, type: formData.type, description: formData.description,
          pricePerHour: formData.pricePerHour, status: formData.status,
          images: formData.images, amenities: formData.amenities,
        },
      })
      const idx = courts.value.findIndex(c => c.id === selectedCourt.value.id)
      if (idx !== -1) courts.value[idx] = { ...courts.value[idx], ...updated }
      notify('Cancha actualizada correctamente')
    } else {
      const payload = {
        name: formData.name, type: formData.type, description: formData.description,
        pricePerHour: formData.pricePerHour, capacity: formData.capacity,
        status: formData.status, businessId: myBusiness.value.id,
        images: formData.images, amenities: formData.amenities,
      }
      const created = await apiFetch<any>('/courts', { method: 'POST', body: payload })
      courts.value.unshift({ ...created, availability: [] })
      notify('Cancha creada exitosamente')
    }
    formDialog.value = false
  } catch (e: any) {
    notify(e?.data?.message || 'Error al guardar cancha', 'error')
  } finally {
    actionLoading.value = false
  }
}

const openAvailability = async (court: any) => {
  selectedCourt.value = court
  currentBusinessSchedules.value = myBusiness.value?.schedules ?? []
  try {
    const existing = await apiFetch<any[]>(`/courts/${court.id}/availability`)
    availabilitySlots.value = existing.map(a => ({
      dayOfWeek: a.dayOfWeek,
      startTime: a.startTime.slice(0, 5),
      endTime: a.endTime.slice(0, 5),
      isAvailable: a.isAvailable,
      pricePerHour: a.pricePerHour !== null ? Number(a.pricePerHour) : null,
    }))
  } catch {
    availabilitySlots.value = []
  }
  availabilityEditorKey.value++
  availabilityDialog.value = true
}

const saveAvailability = async () => {
  const hasErrors = availabilitySlots.value.some((s: any) => s._error)
  if (hasErrors) {
    notify('Corrige los errores en los slots antes de guardar', 'error')
    return
  }
  actionLoading.value = true
  try {
    const body = {
      availability: availabilitySlots.value.map(s => ({
        dayOfWeek: s.dayOfWeek,
        startTime: s.startTime,
        endTime: s.endTime,
        isAvailable: s.isAvailable,
        ...(s.pricePerHour !== null && s.pricePerHour !== undefined
          ? { pricePerHour: Number(s.pricePerHour) }
          : {}),
      })),
    }
    const updated = await apiFetch<any>(
      `/courts/${selectedCourt.value.id}/availability`,
      { method: 'POST', body },
    )
    const idx = courts.value.findIndex(c => c.id === selectedCourt.value.id)
    if (idx !== -1) courts.value[idx] = updated
    availabilityDialog.value = false
    notify('Horarios guardados correctamente')
  } catch (e: any) {
    notify(e?.data?.message || 'Error al guardar horarios', 'error')
  } finally {
    actionLoading.value = false
  }
}

const openDelete = (court: any) => {
  selectedCourt.value = court
  deleteDialog.value = true
}

const deleteCourt = async () => {
  actionLoading.value = true
  try {
    await apiFetch(`/courts/${selectedCourt.value.id}`, { method: 'DELETE' })
    courts.value = courts.value.filter(c => c.id !== selectedCourt.value.id)
    notify('Cancha eliminada')
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
    const list = await apiList<any>('/businesses/my-businesses')
    myBusiness.value = list[0] ?? null
    if (myBusiness.value) {
      courts.value = await apiList<any>(`/courts/by-business/${myBusiness.value.id}`)
    }
  } catch (e) {
    console.error(e)
  } finally {
    loading.value = false
  }
})
</script>

<style scoped>

.bc-card {
  display: flex;
  flex-direction: column;
  background: var(--bg-card);
  border: 1px solid var(--border-soft);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-sm);
  overflow: hidden;
  transition: transform var(--transition), box-shadow var(--transition), border-color var(--transition);
}
.bc-card:hover {
  transform: translateY(-3px);
  box-shadow: var(--shadow-lg);
  border-color: rgba(47, 161, 138, 0.22);
}

.bc-card-media { position: relative; height: 150px; overflow: hidden; }
.bc-card-img { width: 100%; height: 100%; object-fit: cover; }
/* Contenedor del placeholder; el visual lo provee AppMediaPlaceholder. */
.bc-card-img--ph { display: block; }
.bc-card-status {
  position: absolute;
  top: 10px;
  left: 10px;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 0.7rem;
  font-weight: 700;
  padding: 5px 10px;
  border-radius: var(--radius-pill);
  background: rgba(12, 16, 20, 0.82);
  backdrop-filter: blur(8px);
  border: 1px solid var(--border-medium);
}
.bc-card-status-dot { width: 6px; height: 6px; border-radius: 50%; }
.bc-card-status.is-available { color: var(--green-bright); }
.bc-card-status.is-available .bc-card-status-dot { background: var(--green-bright); }
.bc-card-status.is-unavailable { color: #fca5a5; }
.bc-card-status.is-unavailable .bc-card-status-dot { background: var(--accent-error); }
.bc-card-status.is-maintenance { color: #93c5fd; }
.bc-card-status.is-maintenance .bc-card-status-dot { background: var(--accent-info); }

.bc-card-body { display: flex; flex-direction: column; padding: 15px 16px 16px; flex: 1; }
.bc-card-top {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 10px;
}
.bc-card-name { font-size: 1rem; font-weight: 700; color: var(--text-primary); }
.bc-card-type {
  flex-shrink: 0;
  font-size: 0.68rem;
  font-weight: 700;
  padding: 4px 9px;
  border-radius: 8px;
  background: var(--green-soft);
  color: var(--green-bright);
}

.bc-card-stats { display: flex; flex-wrap: wrap; gap: 6px 12px; margin-top: 10px; }
.bc-stat {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  font-size: 0.78rem;
  color: var(--text-muted);
}
.bc-stat .mdi { font-size: 0.95rem; color: var(--green-bright); }
.bc-stat.is-accent { color: var(--green-bright); }
.bc-stat.is-accent .mdi { color: var(--green-bright); }

.bc-card-slots { margin-top: 12px; }
.bc-slots-label {
  display: block;
  font-size: 0.7rem;
  color: var(--text-faint);
  margin-bottom: 5px;
}
.bc-slots-chips { display: flex; flex-wrap: wrap; gap: 4px; }
.bc-slot-chip {
  font-size: 0.66rem;
  font-weight: 600;
  padding: 3px 8px;
  border-radius: 6px;
  background: var(--bg-subtle);
  border: 1px solid var(--border-soft);
  color: var(--text-muted);
}
.bc-slot-chip.is-more { color: var(--green-bright); }
.bc-slots-none { font-size: 0.76rem; color: var(--text-faint); }

.bc-card-actions {
  display: flex;
  align-items: center;
  gap: 4px;
  margin-top: 14px;
  padding-top: 12px;
  border-top: 1px solid var(--border-soft);
}

/* ─── Estado vacío ─── */
.bc-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  padding: 64px 24px;
  background: var(--bg-card);
  border: 1px solid var(--border-soft);
  border-radius: var(--radius-xl);
}
.bc-empty-icon {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  background: var(--green-soft);
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 16px;
}
.bc-empty-icon .mdi { font-size: 2.2rem; color: var(--green-primary); }
.bc-empty-title { font-size: 1.1rem; margin-bottom: 8px; }
.bc-empty-text {
  font-size: 0.88rem;
  color: var(--text-muted);
  max-width: 420px;
  line-height: 1.6;
  margin-bottom: 20px;
}

</style>
