<template>
  <div>
    <PageHeader
      tag="Negocio"
      title="Mi Negocio"
      subtitle="Configura la información de tu establecimiento deportivo"
    >
      <template v-if="business" #action>
        <v-btn color="primary" prepend-icon="mdi-pencil" @click="openEdit">
          Editar negocio
        </v-btn>
      </template>
    </PageHeader>

    <!-- Cargando -->
    <LoadingState v-if="loading" :count="1" :sm="12" :lg="12" />

    <!-- Sin negocio: invitar a crearlo -->
    <div v-else-if="!business" class="mn-empty">
      <div class="mn-empty-icon"><span class="mdi mdi-stadium-variant" /></div>
      <h3 class="brand-heading mn-empty-title">Aún no tienes tu negocio registrado</h3>
      <p class="mn-empty-text">
        Crea tu negocio para empezar a publicar canchas y recibir reservas.
        Aquí defines el nombre, los horarios y los servicios que ofreces.
      </p>
      <v-btn color="primary" size="large" prepend-icon="mdi-plus" @click="openCreate">
        Crear mi negocio
      </v-btn>
    </div>

    <!-- Negocio existente -->
    <template v-else>
      <div class="mn-grid">
        <!-- Columna principal -->
        <div class="mn-main">
          <!-- Identidad -->
          <div class="mn-panel">
            <div class="mn-biz-head">
              <div class="mn-biz-logo">{{ initials }}</div>
              <div class="mn-biz-id">
                <h2 class="mn-biz-name">{{ business.name }}</h2>
                <p class="mn-biz-addr">
                  <span class="mdi mdi-map-marker-outline" /> {{ business.address }}
                </p>
              </div>
              <span class="mn-status" :class="business.isActive ? 'is-on' : 'is-off'">
                <span class="mn-status-dot" />
                {{ business.isActive ? 'Activo' : 'Inactivo' }}
              </span>
            </div>
            <p v-if="business.description" class="mn-biz-desc">{{ business.description }}</p>
            <div class="mn-biz-contact">
              <span v-if="business.phone" class="mn-contact-chip">
                <span class="mdi mdi-phone-outline" /> {{ business.phone }}
              </span>
              <span v-if="business.email" class="mn-contact-chip">
                <span class="mdi mdi-email-outline" /> {{ business.email }}
              </span>
            </div>
          </div>

          <!-- Servicios -->
          <div class="mn-panel">
            <div class="mn-panel-head">
              <h3 class="mn-panel-title">Servicios y comodidades</h3>
              <span class="mn-panel-count">{{ business.amenities?.length ?? 0 }}</span>
            </div>
            <div v-if="business.amenities?.length" class="mn-amenities">
              <span v-for="am in business.amenities" :key="am" class="mn-amenity">
                <span class="mdi" :class="amenityIcon(am)" />
                {{ am }}
              </span>
            </div>
            <p v-else class="mn-panel-empty">
              Aún no agregaste servicios. Edita tu negocio para indicar qué ofreces
              (WiFi, parqueadero, duchas, bar…).
            </p>
          </div>

          <!-- Políticas -->
          <div v-if="business.policies" class="mn-panel">
            <h3 class="mn-panel-title mb-2">Reglas y políticas</h3>
            <p class="mn-biz-desc">{{ business.policies }}</p>
          </div>
        </div>

        <!-- Panel lateral: horario -->
        <aside class="mn-aside">
          <div class="mn-panel">
            <h3 class="mn-panel-title mb-3">Horario de atención</h3>
            <ul class="mn-schedule">
              <li
                v-for="d in orderedSchedule"
                :key="d.dayOfWeek"
                class="mn-schedule-row"
                :class="{ 'is-closed': !d.isOpen }"
              >
                <span class="mn-schedule-day">{{ dayLabel(d.dayOfWeek) }}</span>
                <span class="mn-schedule-hours">
                  {{ d.isOpen ? `${d.openTime.slice(0,5)} – ${d.closeTime.slice(0,5)}` : 'Cerrado' }}
                </span>
              </li>
              <li v-if="!orderedSchedule.length" class="mn-schedule-row">
                <span class="mn-schedule-hours">Sin horario definido</span>
              </li>
            </ul>
          </div>

          <NuxtLink to="/business/courts" class="mn-link-card">
            <div class="mn-link-icon"><span class="mdi mdi-soccer-field" /></div>
            <div>
              <div class="mn-link-title">Mis Canchas</div>
              <div class="mn-link-sub">Administra canchas y horarios</div>
            </div>
            <span class="mdi mdi-chevron-right mn-link-caret" />
          </NuxtLink>
        </aside>
      </div>
    </template>

    <!-- ─── Dialog crear / editar (AppModalShell) ─── -->
    <AppModalShell
      v-model="formDialog"
      :title="editMode ? 'Editar negocio' : 'Crear mi negocio'"
      :subtitle="editMode ? 'Actualiza los datos públicos de tu negocio.' : 'Completa estos datos para empezar a recibir reservas.'"
      :width="720"
    >
      <template #tag>{{ editMode ? 'Edición' : 'Nuevo' }}</template>
      <template #body>
        <v-form ref="formRef" class="mn-form-grid">
            <p class="mn-form-section">Información general</p>
            <v-text-field
              v-model="form.name"
              label="Nombre del negocio"
              prepend-inner-icon="mdi-store"
              :rules="[r.required]"
              class="mb-2"
            />
            <v-textarea
              v-model="form.description"
              label="Descripción"
              rows="2"
              class="mb-2"
            />
            <v-row dense>
              <v-col cols="12" sm="6">
                <v-text-field
                  v-model="form.phone"
                  label="Teléfono"
                  prepend-inner-icon="mdi-phone"
                  :rules="[r.required]"
                />
              </v-col>
              <v-col cols="12" sm="6">
                <v-text-field
                  v-model="form.email"
                  label="Email del negocio"
                  type="email"
                  prepend-inner-icon="mdi-email"
                />
              </v-col>
            </v-row>
            <v-text-field
              v-model="form.address"
              label="Dirección"
              prepend-inner-icon="mdi-map-marker"
              :rules="[r.required]"
              class="mb-2"
            />
            <v-row dense>
              <v-col cols="6">
                <v-text-field
                  v-model.number="form.latitude"
                  label="Latitud"
                  type="number"
                  :rules="[r.required, r.lat]"
                  hint="Ej: 4.6097"
                  persistent-hint
                />
              </v-col>
              <v-col cols="6">
                <v-text-field
                  v-model.number="form.longitude"
                  label="Longitud"
                  type="number"
                  :rules="[r.required, r.lon]"
                  hint="Ej: -74.0817"
                  persistent-hint
                />
              </v-col>
            </v-row>

            <v-divider class="my-4" />
            <p class="mn-form-section">Servicios y comodidades</p>
            <v-select
              v-model="form.amenities"
              :items="AMENITY_OPTIONS"
              label="Lo que ofrece tu negocio"
              multiple
              chips
              closable-chips
              prepend-inner-icon="mdi-room-service-outline"
              class="mb-3"
            />

            <p class="mn-form-section">Fotos del negocio</p>
            <v-combobox
              v-model="form.images"
              label="URLs de fotos (Enter para agregar)"
              multiple
              chips
              closable-chips
              prepend-inner-icon="mdi-image-multiple-outline"
              class="mb-3"
            />

            <p class="mn-form-section">Reglas y políticas</p>
            <v-textarea
              v-model="form.policies"
              label="Reglas o políticas del negocio"
              rows="2"
              class="mb-2"
            />

            <v-divider class="my-4" />
            <p class="mn-form-section">Horario de funcionamiento</p>
            <BusinessScheduleEditor :key="scheduleEditorKey" v-model="form.schedules" />
          </v-form>
      </template>
      <template #footer>
        <v-btn variant="text" @click="formDialog = false">Cancelar</v-btn>
        <v-btn color="primary" variant="flat" :loading="actionLoading" @click="saveBusiness">
          {{ editMode ? 'Guardar cambios' : 'Crear negocio' }}
        </v-btn>
      </template>
    </AppModalShell>

    <v-snackbar v-model="snackbar.show" :color="snackbar.color" rounded="lg" location="bottom end">
      {{ snackbar.text }}
    </v-snackbar>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: 'dashboard', middleware: ['auth', 'role'] })

const { apiFetch, apiList } = useApi()

const business = ref<any>(null)
const loading = ref(false)
const formDialog = ref(false)
const editMode = ref(false)
const scheduleEditorKey = ref(0)
const actionLoading = ref(false)
const formRef = ref()
const snackbar = reactive({ show: false, text: '', color: 'success' })

const ALL_DAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']
const DAY_LABELS: Record<string, string> = {
  monday: 'Lunes', tuesday: 'Martes', wednesday: 'Miércoles', thursday: 'Jueves',
  friday: 'Viernes', saturday: 'Sábado', sunday: 'Domingo',
}
const dayLabel = (d: string) => DAY_LABELS[d] ?? d

const AMENITY_OPTIONS = [
  'WiFi', 'Baños', 'Parqueadero', 'Cancha techada', 'Bar', 'Restaurante',
  'Cafetería', 'Tienda deportiva', 'Vestidores', 'Duchas', 'Iluminación nocturna',
  'Seguridad', 'Graderías', 'Zona de descanso', 'Zona familiar',
]
const AMENITY_ICONS: Record<string, string> = {
  WiFi: 'mdi-wifi', Baños: 'mdi-toilet', Parqueadero: 'mdi-parking',
  'Cancha techada': 'mdi-home-roof', Bar: 'mdi-glass-cocktail',
  Restaurante: 'mdi-silverware-fork-knife', Cafetería: 'mdi-coffee-outline',
  'Tienda deportiva': 'mdi-store-outline', Vestidores: 'mdi-locker-multiple',
  Duchas: 'mdi-shower', 'Iluminación nocturna': 'mdi-lightbulb-on-outline',
  Seguridad: 'mdi-shield-check-outline', Graderías: 'mdi-bleach',
  'Zona de descanso': 'mdi-sofa-outline', 'Zona familiar': 'mdi-account-group-outline',
}
const amenityIcon = (name: string) => AMENITY_ICONS[name] ?? 'mdi-check-circle-outline'

const initials = computed(() => {
  const n = business.value?.name ?? ''
  return n.split(' ').filter(Boolean).slice(0, 2).map((w: string) => w[0]).join('').toUpperCase() || 'N'
})

const orderedSchedule = computed(() => {
  const sched = business.value?.schedules ?? []
  return [...sched].sort(
    (a: any, b: any) => ALL_DAYS.indexOf(a.dayOfWeek) - ALL_DAYS.indexOf(b.dayOfWeek),
  )
})

const form = reactive({
  name: '', description: '', phone: '', email: '',
  address: '', latitude: 0, longitude: 0,
  images: [] as string[],
  amenities: [] as string[],
  policies: '',
  schedules: [] as Array<{ dayOfWeek: string; openTime: string; closeTime: string; isOpen: boolean }>,
})

const r = {
  required: (v: any) => (v !== '' && v !== null && v !== undefined) || 'Requerido',
  lat: (v: number) => (v >= -90 && v <= 90) || 'Latitud entre -90 y 90',
  lon: (v: number) => (v >= -180 && v <= 180) || 'Longitud entre -180 y 180',
}

const notify = (text: string, color = 'success') => {
  snackbar.text = text; snackbar.color = color; snackbar.show = true
}

const defaultSchedules = () =>
  ALL_DAYS.map((day) => ({ dayOfWeek: day, openTime: '08:00', closeTime: '22:00', isOpen: day !== 'sunday' }))

const openCreate = () => {
  editMode.value = false
  Object.assign(form, {
    name: '', description: '', phone: '', email: '',
    address: '', latitude: 0, longitude: 0,
    images: [], amenities: [], policies: '',
    schedules: defaultSchedules(),
  })
  scheduleEditorKey.value++
  formDialog.value = true
}

const openEdit = () => {
  if (!business.value) return
  editMode.value = true
  const b = business.value
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
  scheduleEditorKey.value++
  formDialog.value = true
}

const saveBusiness = async () => {
  const { valid } = await formRef.value.validate()
  if (!valid) return
  actionLoading.value = true
  try {
    const payload: any = {
      name: form.name,
      description: form.description || undefined,
      phone: form.phone,
      email: form.email || undefined,
      address: form.address,
      latitude: form.latitude,
      longitude: form.longitude,
      images: form.images,
      amenities: form.amenities,
      policies: form.policies || undefined,
      schedules: form.schedules.filter((s) => s.isOpen),
    }
    if (editMode.value) {
      business.value = await apiFetch<any>(`/businesses/${business.value.id}`, {
        method: 'PATCH',
        body: payload,
      })
      notify('Negocio actualizado correctamente')
    } else {
      business.value = await apiFetch<any>('/businesses', { method: 'POST', body: payload })
      notify('¡Negocio creado! Ya puedes agregar canchas.')
    }
    formDialog.value = false
  } catch (e: any) {
    notify(e?.data?.message || 'Error al guardar el negocio', 'error')
  } finally {
    actionLoading.value = false
  }
}

const loadBusiness = async () => {
  loading.value = true
  try {
    const list = await apiList<any>('/businesses/my-businesses')
    business.value = list[0] ?? null
  } finally {
    loading.value = false
  }
}

onMounted(loadBusiness)
</script>

<style scoped>
.mn-grid {
  display: grid;
  grid-template-columns: 1fr 320px;
  gap: 24px;
  align-items: start;
}
.mn-main { display: flex; flex-direction: column; gap: 18px; }
.mn-aside { display: flex; flex-direction: column; gap: 18px; position: sticky; top: 92px; }

.mn-panel {
  background: var(--bg-card);
  border: 1px solid var(--border-soft);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-sm);
  padding: 20px;
}
.mn-panel-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 14px;
}
.mn-panel-title {
  font-family: 'Manrope', sans-serif;
  font-size: 1rem;
  font-weight: 700;
  color: var(--text-primary);
}
.mn-panel-count {
  font-size: 0.78rem;
  font-weight: 700;
  padding: 2px 9px;
  border-radius: 100px;
  background: var(--green-soft);
  color: var(--green-bright);
}
.mn-panel-empty { font-size: 0.86rem; color: var(--text-muted); line-height: 1.6; }

/* Identidad */
.mn-biz-head { display: flex; align-items: center; gap: 14px; }
.mn-biz-logo {
  width: 56px;
  height: 56px;
  flex-shrink: 0;
  border-radius: var(--radius-md);
  background: linear-gradient(135deg, var(--green-primary), var(--green-dark));
  color: #fff;
  font-family: 'Sora', sans-serif;
  font-weight: 800;
  font-size: 1.2rem;
  display: flex;
  align-items: center;
  justify-content: center;
}
.mn-biz-id { flex: 1; min-width: 0; }
.mn-biz-name {
  font-family: 'Sora', 'Manrope', sans-serif;
  font-size: 1.25rem;
  font-weight: 800;
  color: var(--text-primary);
}
.mn-biz-addr { font-size: 0.84rem; color: var(--text-muted); margin-top: 2px; }
.mn-biz-addr .mdi { color: var(--green-primary); vertical-align: -2px; }
.mn-status {
  flex-shrink: 0;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 0.74rem;
  font-weight: 700;
  padding: 6px 11px;
  border-radius: 100px;
  border: 1px solid var(--border-soft);
}
.mn-status-dot { width: 7px; height: 7px; border-radius: 50%; }
.mn-status.is-on { color: var(--green-bright); }
.mn-status.is-on .mn-status-dot { background: var(--green-primary); }
.mn-status.is-off { color: #f87171; }
.mn-status.is-off .mn-status-dot { background: #ef4444; }
.mn-biz-desc {
  font-size: 0.88rem;
  color: var(--text-muted);
  line-height: 1.65;
  margin-top: 14px;
}
.mn-biz-contact { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 14px; }
.mn-contact-chip {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 0.8rem;
  color: var(--text-muted);
  padding: 6px 11px;
  background: var(--bg-subtle);
  border: 1px solid var(--border-soft);
  border-radius: 100px;
}
.mn-contact-chip .mdi { color: var(--green-primary); font-size: 0.95rem; }

/* Servicios */
.mn-amenities { display: flex; flex-wrap: wrap; gap: 8px; }
.mn-amenity {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  font-size: 0.82rem;
  color: var(--text-primary);
  padding: 8px 12px;
  background: var(--bg-subtle);
  border: 1px solid var(--border-soft);
  border-radius: var(--radius-md);
}
.mn-amenity .mdi { color: var(--green-primary); font-size: 1rem; }

/* Horario */
.mn-schedule { list-style: none; display: flex; flex-direction: column; gap: 7px; }
.mn-schedule-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 0.84rem;
}
.mn-schedule-day { color: var(--text-muted); }
.mn-schedule-hours { color: var(--text-primary); font-weight: 600; }
.mn-schedule-row.is-closed .mn-schedule-hours { color: var(--text-faint); font-weight: 500; }

/* Link card */
.mn-link-card {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px;
  background: var(--bg-card);
  border: 1px solid var(--border-soft);
  border-radius: var(--radius-lg);
  text-decoration: none;
  transition: var(--transition);
}
.mn-link-card:hover { border-color: rgba(47, 161, 138, 0.25); }
.mn-link-icon {
  width: 42px;
  height: 42px;
  flex-shrink: 0;
  border-radius: var(--radius-md);
  background: var(--green-soft);
  color: var(--green-primary);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.2rem;
}
.mn-link-title { font-size: 0.92rem; font-weight: 700; color: var(--text-primary); }
.mn-link-sub { font-size: 0.76rem; color: var(--text-muted); }
.mn-link-caret { margin-left: auto; color: var(--text-faint); }

/* Estado vacío */
.mn-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  padding: 64px 24px;
  background: var(--bg-card);
  border: 1px solid var(--border-soft);
  border-radius: var(--radius-xl);
}
.mn-empty-icon {
  width: 84px;
  height: 84px;
  border-radius: 50%;
  background: var(--green-soft);
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 18px;
}
.mn-empty-icon .mdi { font-size: 2.4rem; color: var(--green-primary); }
.mn-empty-title { font-size: 1.15rem; margin-bottom: 8px; }
.mn-empty-text {
  font-size: 0.9rem;
  color: var(--text-muted);
  max-width: 440px;
  line-height: 1.65;
  margin-bottom: 22px;
}

.mn-form-section {
  font-size: 0.72rem;
  font-weight: 700;
  letter-spacing: 1px;
  text-transform: uppercase;
  color: var(--text-muted);
  margin-bottom: 12px;
}

.mn-form-card {
  background: linear-gradient(180deg, #1a212c, #151b24) !important;
}
.mn-form-grid {
  display: grid;
  gap: 12px;
}
.mn-form-actions {
  position: sticky;
  bottom: 0;
  background: linear-gradient(180deg, rgba(21, 27, 36, 0.72), rgba(21, 27, 36, 0.95));
  backdrop-filter: blur(6px);
}
:deep(.mn-form-card .v-field) {
  border-color: rgba(47, 161, 138, 0.28) !important;
}
:deep(.mn-form-card .v-field:hover) {
  border-color: rgba(47, 161, 138, 0.4) !important;
}
:deep(.mn-form-card .v-field--focused) {
  border-color: rgba(47, 161, 138, 0.6) !important;
  box-shadow: 0 0 0 3px rgba(47, 161, 138, 0.18) !important;
}

@media (max-width: 880px) {
  .mn-grid { grid-template-columns: 1fr; }
  .mn-aside { position: static; }
}
</style>
