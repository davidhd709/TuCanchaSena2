<template>
  <div>
    <!-- Admin Dashboard -->
    <template v-if="authStore.isAdmin">
      <div class="d-flex align-center mb-6">
        <div>
          <h1 class="text-h5 font-weight-bold">Panel de Administración</h1>
          <p class="text-body-2 text-medium-emphasis">Resumen general del sistema</p>
        </div>
      </div>

      <!-- Stats Cards -->
      <v-row class="mb-6">
        <v-col v-for="stat in adminStats" :key="stat.label" cols="12" sm="6" lg="3">
          <v-card :color="stat.color" variant="tonal" rounded="lg">
            <v-card-text class="d-flex align-center justify-space-between pa-5">
              <div>
                <p class="text-body-2 font-weight-medium mb-1">{{ stat.label }}</p>
                <p class="text-h4 font-weight-bold">{{ stat.value }}</p>
              </div>
              <v-icon :color="stat.color" size="48">{{ stat.icon }}</v-icon>
            </v-card-text>
          </v-card>
        </v-col>
      </v-row>

      <!-- Quick Actions -->
      <v-row>
        <v-col cols="12" md="6">
          <v-card rounded="lg">
            <v-card-title class="text-subtitle-1 font-weight-bold pa-5 pb-3">
              Acciones Rápidas
            </v-card-title>
            <v-list lines="two" class="px-2 pb-2">
              <v-list-item
                v-for="action in adminActions"
                :key="action.to"
                :to="action.to"
                :prepend-icon="action.icon"
                :title="action.title"
                :subtitle="action.subtitle"
                rounded="lg"
                active-color="primary"
              >
                <template #append>
                  <v-icon>mdi-chevron-right</v-icon>
                </template>
              </v-list-item>
            </v-list>
          </v-card>
        </v-col>
        <v-col cols="12" md="6">
          <v-card rounded="lg">
            <v-card-title class="text-subtitle-1 font-weight-bold pa-5 pb-3">
              Últimas Reservas
            </v-card-title>
            <v-list lines="two" class="px-2 pb-2">
              <v-list-item
                v-for="booking in recentBookings"
                :key="booking.id"
                :title="`Reserva #${booking.id.slice(0,8)}`"
                :subtitle="booking.date"
                rounded="lg"
              >
                <template #append>
                  <BookingStatusChip :status="booking.status" />
                </template>
              </v-list-item>
              <v-list-item v-if="recentBookings.length === 0" title="Sin reservas recientes" class="text-medium-emphasis" />
            </v-list>
            <v-card-actions class="px-4 pb-4">
              <v-btn to="/admin/bookings" variant="tonal" color="primary" size="small">
                Ver todas
              </v-btn>
            </v-card-actions>
          </v-card>
        </v-col>
      </v-row>
    </template>

    <!-- Business Dashboard -->
    <template v-else-if="authStore.isBusiness">
      <div class="d-flex align-center mb-6">
        <div>
          <h1 class="text-h5 font-weight-bold">Mi Panel de Negocio</h1>
          <p class="text-body-2 text-medium-emphasis">Gestiona tus canchas y reservas</p>
        </div>
        <v-spacer />
        <v-btn to="/business" color="primary" prepend-icon="mdi-store">
          Mis Negocios
        </v-btn>
      </div>

      <v-row class="mb-6">
        <v-col v-for="stat in businessStats" :key="stat.label" cols="12" sm="6" lg="3">
          <v-card :color="stat.color" variant="tonal" rounded="lg">
            <v-card-text class="d-flex align-center justify-space-between pa-5">
              <div>
                <p class="text-body-2 font-weight-medium mb-1">{{ stat.label }}</p>
                <p class="text-h4 font-weight-bold">{{ stat.value }}</p>
              </div>
              <v-icon :color="stat.color" size="48">{{ stat.icon }}</v-icon>
            </v-card-text>
          </v-card>
        </v-col>
      </v-row>

      <v-row>
        <v-col cols="12" md="6">
          <v-card rounded="lg">
            <v-card-title class="text-subtitle-1 font-weight-bold pa-5 pb-3">
              Reservas Pendientes de Revisión
            </v-card-title>
            <v-list lines="two" class="px-2 pb-2">
              <v-list-item
                v-for="booking in pendingBookings"
                :key="booking.id"
                :title="`${booking.court?.name ?? 'Cancha'} - ${booking.date}`"
                :subtitle="`${booking.startTime} - ${booking.endTime}`"
                rounded="lg"
              >
                <template #append>
                  <BookingStatusChip status="pending" />
                </template>
              </v-list-item>
              <v-list-item v-if="pendingBookings.length === 0" title="Sin reservas pendientes" class="text-medium-emphasis" />
            </v-list>
            <v-card-actions class="px-4 pb-4">
              <v-btn to="/business/bookings" variant="tonal" color="primary" size="small">
                Ver todas
              </v-btn>
            </v-card-actions>
          </v-card>
        </v-col>
        <v-col cols="12" md="6">
          <v-card rounded="lg">
            <v-card-title class="text-subtitle-1 font-weight-bold pa-5 pb-3">
              Acciones Rápidas
            </v-card-title>
            <v-list lines="two" class="px-2 pb-2">
              <v-list-item
                v-for="action in businessActions"
                :key="action.to"
                :to="action.to"
                :prepend-icon="action.icon"
                :title="action.title"
                :subtitle="action.subtitle"
                rounded="lg"
                active-color="primary"
              >
                <template #append>
                  <v-icon>mdi-chevron-right</v-icon>
                </template>
              </v-list-item>
            </v-list>
          </v-card>
        </v-col>
      </v-row>
    </template>

    <!-- Client Dashboard -->
    <template v-else>
      <div class="d-flex align-center mb-6">
        <div>
          <h1 class="text-h5 font-weight-bold">¡Hola, {{ authStore.user?.firstName }}!</h1>
          <p class="text-body-2 text-medium-emphasis">Aquí están tus próximas reservas</p>
        </div>
        <v-spacer />
        <v-btn to="/client/courts" color="primary" prepend-icon="mdi-soccer-field">
          Reservar Cancha
        </v-btn>
      </div>

      <!-- Client stats -->
      <v-row class="mb-6">
        <v-col v-for="stat in clientStats" :key="stat.label" cols="12" sm="4">
          <v-card :color="stat.color" variant="tonal" rounded="lg">
            <v-card-text class="d-flex align-center justify-space-between pa-5">
              <div>
                <p class="text-body-2 font-weight-medium mb-1">{{ stat.label }}</p>
                <p class="text-h4 font-weight-bold">{{ stat.value }}</p>
              </div>
              <v-icon :color="stat.color" size="48">{{ stat.icon }}</v-icon>
            </v-card-text>
          </v-card>
        </v-col>
      </v-row>

      <!-- Upcoming bookings -->
      <v-row>
        <v-col cols="12" md="8">
          <v-card rounded="lg">
            <v-card-title class="text-subtitle-1 font-weight-bold pa-5 pb-3">
              Mis Reservas
            </v-card-title>
            <v-list lines="three" class="px-2 pb-2">
              <v-list-item
                v-for="booking in myBookings"
                :key="booking.id"
                :title="`${booking.court?.name ?? 'Cancha'}`"
                :subtitle="`${booking.date} · ${booking.startTime} - ${booking.endTime}`"
                rounded="lg"
              >
                <template #prepend>
                  <v-avatar color="primary" variant="tonal" size="44" rounded="lg">
                    <v-icon>mdi-soccer-field</v-icon>
                  </v-avatar>
                </template>
                <template #append>
                  <BookingStatusChip :status="booking.status" />
                </template>
              </v-list-item>
              <v-list-item
                v-if="myBookings.length === 0"
                title="No tienes reservas aún"
                subtitle="¡Explora las canchas disponibles!"
                class="text-medium-emphasis"
              />
            </v-list>
            <v-card-actions class="px-4 pb-4">
              <v-btn to="/client/bookings" variant="tonal" color="primary" size="small">
                Ver historial completo
              </v-btn>
            </v-card-actions>
          </v-card>
        </v-col>
        <v-col cols="12" md="4">
          <v-card rounded="lg" color="primary" variant="tonal">
            <v-card-text class="pa-5">
              <v-icon size="40" color="primary" class="mb-3">mdi-calendar-plus</v-icon>
              <h3 class="text-subtitle-1 font-weight-bold mb-2">Hacer una Reserva</h3>
              <p class="text-body-2 mb-4">Explora todas las canchas disponibles y elige tu horario favorito.</p>
              <v-btn to="/client/courts" color="primary" block>
                Explorar Canchas
              </v-btn>
            </v-card-text>
          </v-card>
        </v-col>
      </v-row>
    </template>
  </div>
</template>

<script setup lang="ts">
definePageMeta({
  layout: 'dashboard',
  middleware: 'auth',
})

const authStore = useAuthStore()
const { apiFetch } = useApi()

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
  { to: '/business/courts', icon: 'mdi-soccer-field', title: 'Mis Canchas', subtitle: 'Administrar canchas' },
  { to: '/business/bookings', icon: 'mdi-calendar-check', title: 'Reservas', subtitle: 'Confirmar / rechazar' },
  { to: '/business', icon: 'mdi-store', title: 'Mis Negocios', subtitle: 'Ver configuración' },
]

const pendingBookings = ref<any[]>([])

// ── Client data ──────────────────────────────────────────────────────────────
const myBookings = ref<any[]>([])

const clientStats = computed(() => [
  { label: 'Total Reservas', value: myBookings.value.length, icon: 'mdi-calendar-account', color: 'primary' },
  { label: 'Confirmadas', value: myBookings.value.filter(b => b.status === 'confirmed').length, icon: 'mdi-check-circle', color: 'success' },
  { label: 'Pendientes', value: myBookings.value.filter(b => b.status === 'pending').length, icon: 'mdi-clock-outline', color: 'warning' },
])

// ── Load data on mount ───────────────────────────────────────────────────────
onMounted(async () => {
  authStore.hydrate()

  try {
    if (authStore.isAdmin) {
      const [users, businesses, courts, bookings] = await Promise.allSettled([
        apiFetch<any[]>('/users'),
        apiFetch<any[]>('/businesses'),
        apiFetch<any[]>('/courts'),
        apiFetch<any[]>('/bookings'),
      ])
      adminStats.value[0].value = users.status === 'fulfilled' ? users.value.length : 0
      adminStats.value[1].value = businesses.status === 'fulfilled' ? businesses.value.length : 0
      adminStats.value[2].value = courts.status === 'fulfilled' ? courts.value.length : 0
      adminStats.value[3].value = bookings.status === 'fulfilled' ? bookings.value.length : 0
      if (bookings.status === 'fulfilled') {
        recentBookings.value = bookings.value.slice(0, 5)
      }
    } else if (authStore.isBusiness) {
      const myBusinesses = await apiFetch<any[]>('/businesses/my-businesses')
      if (myBusinesses.length > 0) {
        const firstBusiness = myBusinesses[0]
        const bookings = await apiFetch<any[]>(`/bookings/business/${firstBusiness.id}`)
        pendingBookings.value = bookings.filter((b: any) => b.status === 'pending').slice(0, 5)
        businessStats.value[2].value = bookings.filter((b: any) => b.status === 'pending').length
        businessStats.value[3].value = bookings.filter((b: any) => b.status === 'completed').length
        const courts = await apiFetch<any[]>(`/courts/by-business/${firstBusiness.id}`)
        businessStats.value[0].value = courts.length
      }
    } else {
      const bookings = await apiFetch<any[]>('/bookings/my-bookings')
      myBookings.value = bookings.slice(0, 6)
    }
  } catch (e) {
    console.error('Dashboard load error', e)
  }
})
</script>
