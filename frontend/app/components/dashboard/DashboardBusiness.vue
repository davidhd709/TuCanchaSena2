<template>
  <div>
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
                {{ fmtDate(booking.date) }} · {{ booking.startTime?.slice(0,5) }}–{{ booking.endTime?.slice(0,5) }}
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
  </div>
</template>

<script setup lang="ts">
/**
 * DashboardBusiness — vista de inicio para el rol negocio.
 * Extraído de dashboard/index.vue (Fase 4). Carga sus propios datos.
 */
const { apiList } = useApi()

const fmtDate = (v: unknown) => formatDate(v, { weekday: 'short', day: 'numeric', month: 'short' })

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

onMounted(async () => {
  try {
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
  } catch (e) {
    console.error('Dashboard load error', e)
  }
})
</script>

<style scoped>
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

@media (max-width: 960px) {
  .biz-home-stats { grid-template-columns: repeat(2, 1fr); }
  .biz-home-grid { grid-template-columns: 1fr; }
}
@media (max-width: 760px) {
  .biz-home-stats { grid-template-columns: 1fr; gap: 10px; }
}
</style>
