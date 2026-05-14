<template>
  <div>
    <!-- ═══ Admin (panel de gestión) ═══ -->
    <template v-if="authStore.isAdmin">
      <PageHeader
        tag="Panel"
        title="Panel de Administración"
        subtitle="Resumen general del sistema"
      />
      <v-row class="mb-6">
        <v-col v-for="stat in adminStats" :key="stat.label" cols="12" sm="6" lg="3">
          <StatCard :label="stat.label" :value="stat.value" :icon="stat.icon" :accent="stat.color" />
        </v-col>
      </v-row>
      <v-row>
        <v-col cols="12" md="6">
          <v-card rounded="lg">
            <v-card-title class="text-subtitle-1 font-weight-bold pa-5 pb-3">Acciones Rápidas</v-card-title>
            <v-list lines="two" class="px-2 pb-2">
              <v-list-item
                v-for="action in adminActions"
                :key="action.to"
                :to="action.to"
                :prepend-icon="action.icon"
                :title="action.title"
                :subtitle="action.subtitle"
                rounded="lg"
                color="primary"
              >
                <template #append><v-icon>mdi-chevron-right</v-icon></template>
              </v-list-item>
            </v-list>
          </v-card>
        </v-col>
        <v-col cols="12" md="6">
          <v-card rounded="lg">
            <v-card-title class="text-subtitle-1 font-weight-bold pa-5 pb-3">Últimas Reservas</v-card-title>
            <v-list lines="two" class="px-2 pb-2">
              <v-list-item
                v-for="booking in recentBookings"
                :key="booking.id"
                :title="`Reserva #${booking.id.slice(0,8)}`"
                :subtitle="booking.date"
                rounded="lg"
              >
                <template #append><BookingStatusChip :status="booking.status" /></template>
              </v-list-item>
              <v-list-item v-if="recentBookings.length === 0" title="Sin reservas recientes" class="text-medium-emphasis" />
            </v-list>
            <v-card-actions class="px-4 pb-4">
              <v-btn to="/admin/bookings" variant="tonal" color="primary" size="small">Ver todas</v-btn>
            </v-card-actions>
          </v-card>
        </v-col>
      </v-row>
    </template>

    <!-- ═══ Business (panel de gestión) ═══ -->
    <template v-else-if="authStore.isBusiness">
      <PageHeader
        tag="Negocio"
        title="Mi Panel de Negocio"
        subtitle="Gestiona tu negocio, tus canchas y tus reservas"
      >
        <template #action>
          <v-btn to="/business" color="primary" prepend-icon="mdi-store">Mi Negocio</v-btn>
        </template>
      </PageHeader>

      <div class="biz-home-stats">
        <StatCard
          v-for="stat in businessStats"
          :key="stat.label"
          :label="stat.label"
          :value="stat.value"
          :icon="stat.icon"
          :accent="stat.color"
        />
      </div>

      <div class="biz-home-grid">
        <!-- Reservas pendientes -->
        <section class="biz-home-panel">
          <div class="biz-home-panel-head">
            <h2 class="biz-home-panel-title">Reservas pendientes de revisión</h2>
            <NuxtLink to="/business/bookings" class="biz-home-link">Ver todas</NuxtLink>
          </div>
          <div v-if="pendingBookings.length" class="biz-home-rows">
            <NuxtLink
              v-for="booking in pendingBookings"
              :key="booking.id"
              to="/business/bookings"
              class="biz-home-row"
            >
              <div class="biz-home-row-thumb"><span class="mdi mdi-soccer-field" /></div>
              <div class="biz-home-row-text">
                <span class="biz-home-row-title">{{ booking.court?.name ?? 'Cancha' }}</span>
                <span class="biz-home-row-sub">
                  {{ booking.date }} · {{ booking.startTime?.slice(0,5) }}–{{ booking.endTime?.slice(0,5) }}
                </span>
              </div>
              <BookingStatusChip status="pending" />
            </NuxtLink>
          </div>
          <div v-else class="biz-home-empty">
            <span class="mdi mdi-check-circle-outline" />
            Sin reservas pendientes por revisar.
          </div>
        </section>

        <!-- Acciones rápidas -->
        <section class="biz-home-panel">
          <h2 class="biz-home-panel-title mb-3">Acciones rápidas</h2>
          <div class="biz-home-actions">
            <NuxtLink
              v-for="action in businessActions"
              :key="action.to"
              :to="action.to"
              class="biz-home-action"
            >
              <div class="biz-home-action-icon"><span class="mdi" :class="action.icon" /></div>
              <div class="biz-home-action-text">
                <span class="biz-home-action-title">{{ action.title }}</span>
                <span class="biz-home-action-sub">{{ action.subtitle }}</span>
              </div>
              <span class="mdi mdi-chevron-right biz-home-action-caret" />
            </NuxtLink>
          </div>
        </section>
      </div>
    </template>

    <!-- ═══ Cliente (experiencia marketplace) ═══ -->
    <template v-else>
      <!-- Saludo -->
      <section class="home-hero">
        <div class="home-hero-text">
          <h1 class="brand-display home-hero-title">
            ¡Hola, {{ authStore.user?.firstName }}! 👋
          </h1>
          <p class="home-hero-sub">Reserva tu cancha y vive el partido.</p>
        </div>
        <v-btn to="/client/courts" color="primary" size="large" prepend-icon="mdi-magnify">
          Explorar canchas
        </v-btn>
      </section>

      <!-- Métricas ligeras -->
      <div class="home-stats">
        <StatCard
          v-for="stat in clientStats"
          :key="stat.label"
          :label="stat.label"
          :value="stat.value"
          :icon="stat.icon"
          :accent="stat.color"
        />
      </div>

      <!-- Próxima reserva destacada -->
      <section v-if="nextBooking" class="home-section">
        <h2 class="home-section-title">Tu próxima reserva</h2>
        <NuxtLink :to="`/client/bookings/${nextBooking.id}`" class="next-booking">
          <div class="next-booking-thumb">
            <img
              v-if="nextBooking.court?.images?.[0]"
              :src="nextBooking.court.images[0]"
              :alt="nextBooking.court?.name ?? 'Cancha'"
            />
            <span v-else class="mdi mdi-soccer-field" />
          </div>
          <div class="next-booking-info">
            <h3 class="next-booking-name">{{ nextBooking.court?.name ?? 'Cancha' }}</h3>
            <p class="next-booking-meta">
              <span class="mdi mdi-calendar-outline" /> {{ formatDate(nextBooking.date) }}
              <span class="mdi mdi-clock-outline ml-2" />
              {{ nextBooking.startTime?.slice(0,5) }} – {{ nextBooking.endTime?.slice(0,5) }}
            </p>
          </div>
          <BookingStatusChip :status="nextBooking.status" />
          <v-icon icon="mdi-chevron-right" class="next-booking-caret" />
        </NuxtLink>
      </section>

      <!-- Reservas recientes -->
      <section class="home-section">
        <div class="home-section-head">
          <h2 class="home-section-title">Reservas recientes</h2>
          <NuxtLink v-if="myBookings.length" to="/client/bookings" class="home-section-link">
            Ver todas
          </NuxtLink>
        </div>

        <div v-if="myBookings.length" class="home-bookings">
          <NuxtLink
            v-for="booking in myBookings"
            :key="booking.id"
            :to="`/client/bookings/${booking.id}`"
            class="home-booking-row"
          >
            <div class="home-booking-thumb">
              <img
                v-if="booking.court?.images?.[0]"
                :src="booking.court.images[0]"
                :alt="booking.court?.name ?? 'Cancha'"
              />
              <span v-else class="mdi mdi-soccer-field" />
            </div>
            <div class="home-booking-text">
              <span class="home-booking-name">{{ booking.court?.name ?? 'Cancha' }}</span>
              <span class="home-booking-when">
                {{ formatDate(booking.date) }} · {{ booking.startTime?.slice(0,5) }}–{{ booking.endTime?.slice(0,5) }}
              </span>
            </div>
            <BookingStatusChip :status="booking.status" />
          </NuxtLink>
        </div>

        <div v-else class="surface-card home-empty">
          <div class="home-empty-icon"><span class="mdi mdi-calendar-blank-outline" /></div>
          <h3 class="brand-heading">Aún no tienes reservas</h3>
          <p class="brand-muted">Explora las canchas disponibles y reserva tu primer partido.</p>
          <v-btn to="/client/courts" color="primary" class="mt-3" prepend-icon="mdi-soccer-field">
            Explorar canchas
          </v-btn>
        </div>
      </section>
    </template>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ middleware: 'auth' })

const authStore = useAuthStore()
const { apiList } = useApi()

// El cliente usa el layout marketplace; admin/business usan el de gestión.
authStore.hydrate()
setPageLayout(authStore.isAdmin || authStore.isBusiness ? 'dashboard' : 'client')

// ── Admin data ──────────────────────────────────────────────────────────────
const adminStats = ref([
  { label: 'Usuarios', value: 0, icon: 'mdi-account-group', color: 'primary' },
  { label: 'Negocios', value: 0, icon: 'mdi-store', color: 'success' },
  { label: 'Canchas', value: 0, icon: 'mdi-soccer-field', color: 'warning' },
  { label: 'Reservas', value: 0, icon: 'mdi-calendar-check', color: 'error' },
])

const adminActions = [
  { to: '/admin/users', icon: 'mdi-account-group', title: 'Gestionar Usuarios', subtitle: 'Ver y administrar usuarios' },
  { to: '/admin/businesses', icon: 'mdi-store', title: 'Gestionar Negocios', subtitle: 'Crear y administrar negocios' },
  { to: '/admin/courts', icon: 'mdi-soccer-field', title: 'Gestionar Canchas', subtitle: 'Ver todas las canchas' },
  { to: '/admin/software', icon: 'mdi-application', title: 'Gestionar Software', subtitle: 'Administrar el módulo software' },
]

const recentBookings = ref<any[]>([])

// ── Business data ────────────────────────────────────────────────────────────
const businessStats = ref([
  { label: 'Mis Canchas', value: 0, icon: 'mdi-soccer-field', color: 'primary' },
  { label: 'Reservas Hoy', value: 0, icon: 'mdi-calendar-today', color: 'success' },
  { label: 'Pendientes', value: 0, icon: 'mdi-clock-outline', color: 'warning' },
  { label: 'Completadas', value: 0, icon: 'mdi-check-circle', color: 'info' },
])

const businessActions = [
  { to: '/business', icon: 'mdi-store-outline', title: 'Mi Negocio', subtitle: 'Datos, servicios y horarios' },
  { to: '/business/courts', icon: 'mdi-soccer-field', title: 'Mis Canchas', subtitle: 'Crear y administrar canchas' },
  { to: '/business/bookings', icon: 'mdi-calendar-check-outline', title: 'Reservas', subtitle: 'Calendario y comprobantes' },
]

const pendingBookings = ref<any[]>([])

// ── Client data ──────────────────────────────────────────────────────────────
const myBookings = ref<any[]>([])

const clientStats = computed(() => [
  { label: 'Total Reservas', value: myBookings.value.length, icon: 'mdi-calendar-account', color: 'primary' },
  { label: 'Confirmadas', value: myBookings.value.filter(b => b.status === 'confirmed').length, icon: 'mdi-check-circle', color: 'success' },
  { label: 'Pendientes', value: myBookings.value.filter(b => b.status === 'pending').length, icon: 'mdi-clock-outline', color: 'warning' },
])

// Próxima reserva: la más cercana (hoy o futura) pendiente o confirmada
const nextBooking = computed(() => {
  const today = new Date().toISOString().split('T')[0]
  return [...myBookings.value]
    .filter(b => b.date >= today && (b.status === 'pending' || b.status === 'confirmed'))
    .sort((a, b) => a.date.localeCompare(b.date))[0] ?? null
})

const formatDate = (dateStr: string) => {
  if (!dateStr) return ''
  const [y, m, d] = dateStr.split('-').map(Number)
  if (!y || !m || !d) return dateStr
  return new Date(y, m - 1, d).toLocaleDateString('es-CO', {
    weekday: 'short', day: 'numeric', month: 'short',
  })
}

// ── Load data on mount ───────────────────────────────────────────────────────
onMounted(async () => {
  authStore.hydrate()

  try {
    if (authStore.isAdmin) {
      const [users, businesses, courts, bookings] = await Promise.allSettled([
        apiList<any>('/users'),
        apiList<any>('/businesses'),
        apiList<any>('/courts'),
        apiList<any>('/bookings'),
      ])
      adminStats.value[0].value = users.status === 'fulfilled' ? users.value.length : 0
      adminStats.value[1].value = businesses.status === 'fulfilled' ? businesses.value.length : 0
      adminStats.value[2].value = courts.status === 'fulfilled' ? courts.value.length : 0
      adminStats.value[3].value = bookings.status === 'fulfilled' ? bookings.value.length : 0
      if (bookings.status === 'fulfilled') {
        recentBookings.value = bookings.value.slice(0, 5)
      }
    } else if (authStore.isBusiness) {
      const myBusinesses = await apiList<any>('/businesses/my-businesses')
      if (myBusinesses.length > 0) {
        const firstBusiness = myBusinesses[0]
        const bookings = await apiList<any>(`/bookings/business/${firstBusiness.id}`)
        pendingBookings.value = bookings.filter((b: any) => b.status === 'pending').slice(0, 5)
        businessStats.value[2].value = bookings.filter((b: any) => b.status === 'pending').length
        businessStats.value[3].value = bookings.filter((b: any) => b.status === 'completed').length
        const courts = await apiList<any>(`/courts/by-business/${firstBusiness.id}`)
        businessStats.value[0].value = courts.length
      }
    } else {
      const bookings = await apiList<any>('/bookings/my-bookings')
      myBookings.value = bookings.slice(0, 6)
    }
  } catch (e) {
    console.error('Dashboard load error', e)
  }
})
</script>

<style scoped>
/* ─── Saludo ─── */
.home-hero {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 20px;
  flex-wrap: wrap;
  margin-bottom: 28px;
}
.home-hero-title { font-size: clamp(1.6rem, 3.2vw, 2.2rem); line-height: 1.15; }
.home-hero-sub { font-size: 1rem; color: var(--text-muted); margin-top: 6px; }

/* ─── Métricas ─── */
.home-stats {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 14px;
  margin-bottom: 36px;
}

/* ─── Secciones ─── */
.home-section { margin-bottom: 36px; }
.home-section-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 14px;
}
.home-section-title {
  font-family: 'Manrope', sans-serif;
  font-size: 1.15rem;
  font-weight: 700;
  color: var(--text-primary);
  margin-bottom: 14px;
}
.home-section-head .home-section-title { margin-bottom: 0; }
.home-section-link {
  font-size: 0.85rem;
  font-weight: 600;
  color: var(--green-primary);
  text-decoration: none;
}
.home-section-link:hover { color: var(--green-dark); }

/* ─── Próxima reserva ─── */
.next-booking {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 16px;
  background: var(--bg-card);
  border: 1px solid var(--border-soft);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-sm);
  text-decoration: none;
  transition: var(--transition);
}
.next-booking:hover { box-shadow: var(--shadow-md); transform: translateY(-2px); }
.next-booking-thumb {
  width: 56px;
  height: 56px;
  flex-shrink: 0;
  border-radius: var(--radius-md);
  overflow: hidden;
  background:
    radial-gradient(circle at 35% 30%, rgba(47, 161, 138, 0.22), transparent 60%),
    linear-gradient(135deg, #1e2b35, #0f141c);
  display: flex;
  align-items: center;
  justify-content: center;
}
.next-booking-thumb img { width: 100%; height: 100%; object-fit: cover; }
.next-booking-thumb .mdi { font-size: 1.7rem; color: rgba(47, 161, 138, 0.65); }
.next-booking-info { flex: 1; min-width: 0; }
.next-booking-name { font-size: 1rem; font-weight: 700; color: var(--text-primary); }
.next-booking-meta { font-size: 0.83rem; color: var(--text-muted); margin-top: 2px; }
.next-booking-meta .mdi { color: var(--green-primary); vertical-align: -2px; }
.next-booking-caret { color: var(--text-faint); }

/* ─── Lista de reservas recientes ─── */
.home-bookings {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.home-booking-row {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 14px;
  background: var(--bg-card);
  border: 1px solid var(--border-soft);
  border-radius: var(--radius-md);
  text-decoration: none;
  transition: var(--transition);
}
.home-booking-row:hover { border-color: var(--border-strong); box-shadow: var(--shadow-sm); }
.home-booking-thumb {
  width: 44px;
  height: 44px;
  flex-shrink: 0;
  border-radius: var(--radius-sm);
  overflow: hidden;
  background: var(--green-soft);
  display: flex;
  align-items: center;
  justify-content: center;
}
.home-booking-thumb img { width: 100%; height: 100%; object-fit: cover; }
.home-booking-thumb .mdi { font-size: 1.2rem; color: var(--green-primary); }
.home-booking-text { flex: 1; min-width: 0; display: flex; flex-direction: column; }
.home-booking-name { font-size: 0.9rem; font-weight: 600; color: var(--text-primary); }
.home-booking-when { font-size: 0.77rem; color: var(--text-muted); }

/* ─── Estado vacío ─── */
.home-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  padding: 48px 24px;
}
.home-empty-icon {
  width: 72px;
  height: 72px;
  border-radius: 50%;
  background: var(--green-soft);
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 14px;
}
.home-empty-icon .mdi { font-size: 2rem; color: var(--green-primary); }

/* ─── Inicio del negocio ─── */
.biz-home-stats {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 14px;
  margin-bottom: 28px;
}
.biz-home-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 18px;
  align-items: start;
}
.biz-home-panel {
  background: var(--bg-card);
  border: 1px solid var(--border-soft);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-sm);
  padding: 20px;
}
.biz-home-panel-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 14px;
}
.biz-home-panel-title {
  font-family: 'Manrope', sans-serif;
  font-size: 1rem;
  font-weight: 700;
  color: var(--text-primary);
}
.biz-home-link {
  font-size: 0.82rem;
  font-weight: 600;
  color: var(--green-bright);
  text-decoration: none;
}
.biz-home-rows { display: flex; flex-direction: column; gap: 8px; }
.biz-home-row {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 11px 12px;
  background: var(--bg-subtle);
  border: 1px solid var(--border-soft);
  border-radius: var(--radius-md);
  text-decoration: none;
  transition: var(--transition);
}
.biz-home-row:hover { border-color: rgba(47, 161, 138, 0.25); }
.biz-home-row-thumb {
  width: 38px;
  height: 38px;
  flex-shrink: 0;
  border-radius: var(--radius-sm);
  background: var(--green-soft);
  display: flex;
  align-items: center;
  justify-content: center;
}
.biz-home-row-thumb .mdi { color: var(--green-primary); font-size: 1.1rem; }
.biz-home-row-text { flex: 1; min-width: 0; display: flex; flex-direction: column; }
.biz-home-row-title { font-size: 0.88rem; font-weight: 600; color: var(--text-primary); }
.biz-home-row-sub { font-size: 0.75rem; color: var(--text-muted); }
.biz-home-empty {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 20px;
  font-size: 0.85rem;
  color: var(--text-muted);
}
.biz-home-empty .mdi { color: var(--green-primary); font-size: 1.1rem; }

.biz-home-actions { display: flex; flex-direction: column; gap: 8px; }
.biz-home-action {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  border-radius: var(--radius-md);
  text-decoration: none;
  transition: var(--transition);
}
.biz-home-action:hover { background: var(--bg-subtle); }
.biz-home-action-icon {
  width: 40px;
  height: 40px;
  flex-shrink: 0;
  border-radius: var(--radius-md);
  background: var(--green-soft);
  color: var(--green-primary);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.15rem;
}
.biz-home-action-text { flex: 1; min-width: 0; display: flex; flex-direction: column; }
.biz-home-action-title { font-size: 0.9rem; font-weight: 700; color: var(--text-primary); }
.biz-home-action-sub { font-size: 0.76rem; color: var(--text-muted); }
.biz-home-action-caret { color: var(--text-faint); }

/* ─── Responsive ─── */
@media (max-width: 960px) {
  .biz-home-stats { grid-template-columns: repeat(2, 1fr); }
  .biz-home-grid { grid-template-columns: 1fr; }
}
@media (max-width: 760px) {
  .home-stats { grid-template-columns: 1fr; gap: 10px; }
  .home-hero .v-btn { width: 100%; }
  .biz-home-stats { grid-template-columns: 1fr; gap: 10px; }
}
</style>
