<template>
  <div>
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
              :subtitle="fmtDate(booking.date)"
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
  </div>
</template>

<script setup lang="ts">
/**
 * DashboardAdmin — vista de inicio para el rol admin.
 * Extraído de dashboard/index.vue (Fase 4). Carga sus propios datos.
 */
const { apiList } = useApi()

const fmtDate = (v: unknown) => formatDate(v, { weekday: 'short', day: 'numeric', month: 'short' })

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

onMounted(async () => {
  try {
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
  } catch (e) {
    console.error('Dashboard load error', e)
  }
})
</script>
