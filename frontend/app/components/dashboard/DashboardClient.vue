<template>
  <div>
    <!-- Hero comercial -->
    <section class="client-home-hero">
      <div class="client-home-hero-bg" aria-hidden="true">
        <div class="client-home-hero-blob client-home-hero-blob-1" />
        <div class="client-home-hero-blob client-home-hero-blob-2" />
      </div>
      <div class="client-home-hero-content">
        <span class="client-home-hero-greet">Hola, {{ authStore.user?.firstName ?? 'jugador' }} 👋</span>
        <h1 class="client-home-hero-title">
          Reserva tu cancha y juega <span class="client-home-hero-accent">hoy mismo</span>.
        </h1>
        <p class="client-home-hero-sub">
          Encuentra canchas sintéticas cerca de ti, revisa disponibilidad y reserva en minutos.
        </p>
        <div class="client-home-hero-actions">
          <v-btn
            to="/client/courts"
            color="primary"
            size="large"
            prepend-icon="mdi-soccer"
            class="client-home-hero-cta"
          >
            Reservar cancha
          </v-btn>
          <v-btn
            to="/client/businesses"
            color="primary"
            size="large"
            variant="outlined"
            prepend-icon="mdi-stadium-variant"
          >
            Ver negocios
          </v-btn>
        </div>
      </div>
    </section>

    <!-- Beneficios -->
    <section class="client-home-perks">
      <article class="client-home-perk">
        <div class="client-home-perk-icon">
          <span class="mdi mdi-clock-fast" />
        </div>
        <div>
          <h3>Reserva en minutos</h3>
          <p>Elige fecha, hora y cancha en una sola pantalla.</p>
        </div>
      </article>
      <article class="client-home-perk">
        <div class="client-home-perk-icon">
          <span class="mdi mdi-shield-check-outline" />
        </div>
        <div>
          <h3>Negocios verificados</h3>
          <p>Solo canchas activas con horarios y servicios reales.</p>
        </div>
      </article>
      <article class="client-home-perk">
        <div class="client-home-perk-icon">
          <span class="mdi mdi-bank-transfer" />
        </div>
        <div>
          <h3>Paga por transferencia</h3>
          <p>Sube el comprobante y el negocio confirma tu reserva.</p>
        </div>
      </article>
    </section>

    <!-- Próxima reserva destacada -->
    <AppSection v-if="nextBooking" title="Tu próxima reserva">
      <template #action><NuxtLink to="/client/bookings" class="client-home-section-link">Ver todas</NuxtLink></template>
      <NuxtLink :to="`/client/bookings/${nextBooking.id}`" class="client-home-next">
        <div class="client-home-next-thumb">
          <img
            v-if="nextBookingCover"
            :src="nextBookingCover"
            :alt="nextBooking.court?.name ?? 'Cancha'"
          />
          <AppMediaPlaceholder v-else compact />
        </div>
        <div class="client-home-next-body">
          <h3>{{ nextBooking.court?.name ?? 'Cancha' }}</h3>
          <p>{{ nextBooking.court?.business?.name ?? 'Negocio deportivo' }}</p>
          <div class="client-home-next-rows">
            <span><span class="mdi mdi-calendar-blank-outline" /> {{ fmtDate(nextBooking.date) }}</span>
            <span><span class="mdi mdi-clock-outline" /> {{ nextBooking.startTime?.slice(0,5) }}–{{ nextBooking.endTime?.slice(0,5) }}</span>
          </div>
        </div>
        <div class="client-home-next-side">
          <BookingStatusChip :status="nextBooking.status" />
          <span class="client-home-next-caret mdi mdi-chevron-right" />
        </div>
      </NuxtLink>
    </AppSection>

    <!-- Reservas recientes (modo lista compacta) -->
    <AppSection v-if="myBookings.length" title="Reservas recientes">
      <template #action><NuxtLink to="/client/bookings" class="client-home-section-link">Ver todas</NuxtLink></template>
      <ul class="client-home-recent">
        <li v-for="booking in myBookings" :key="booking.id">
          <NuxtLink :to="`/client/bookings/${booking.id}`" class="client-home-recent-row">
            <div class="client-home-recent-thumb">
              <img v-if="recentCover(booking)" :src="recentCover(booking)!" :alt="booking.court?.name ?? 'Cancha'" />
              <AppMediaPlaceholder v-else compact />
            </div>
            <div class="client-home-recent-text">
              <span class="client-home-recent-name">{{ booking.court?.name ?? 'Cancha' }}</span>
              <span class="client-home-recent-when">
                {{ fmtDate(booking.date) }} · {{ booking.startTime?.slice(0,5) }}–{{ booking.endTime?.slice(0,5) }}
              </span>
            </div>
            <BookingStatusChip :status="booking.status" />
          </NuxtLink>
        </li>
      </ul>
    </AppSection>

    <section v-else class="client-home-section">
      <div class="client-home-empty">
        <div class="client-home-empty-icon">
          <span class="mdi mdi-soccer-field" />
        </div>
        <h3>Aún no tienes reservas</h3>
        <p>Explora las canchas disponibles y reserva tu primer partido.</p>
        <v-btn to="/client/courts" color="primary" size="large" prepend-icon="mdi-soccer" class="mt-3">
          Reservar cancha
        </v-btn>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
/**
 * DashboardClient — experiencia marketplace de inicio para el rol cliente.
 * Extraído de dashboard/index.vue (Fase 4). Carga sus propios datos.
 */
const authStore = useAuthStore()
const { apiList } = useApi()

const fmtDate = (v: unknown) => formatDate(v, { weekday: 'short', day: 'numeric', month: 'short' })

const myBookings = ref<any[]>([])

// Próxima reserva: la más cercana (hoy o futura) pendiente o confirmada.
const nextBooking = computed(() => {
  const today = new Date().toISOString().split('T')[0]
  return [...myBookings.value]
    .filter((b) => b.date >= today && (b.status === 'pending' || b.status === 'confirmed'))
    .sort((a, b) => a.date.localeCompare(b.date))[0] ?? null
})

const nextBookingCover = computed(() => safeCover(nextBooking.value?.court?.images?.[0]))
const recentCover = (booking: any) => safeCover(booking?.court?.images?.[0]) || ''

onMounted(async () => {
  try {
    const bookings = await apiList<any>('/bookings/my-bookings')
    myBookings.value = bookings.slice(0, 6)
  } catch (e) {
    console.error('Dashboard load error', e)
  }
})
</script>

<style scoped>
/* ═══ CLIENT HOME (marketplace) ═══ */
.client-home-hero {
  position: relative;
  overflow: hidden;
  border-radius: 24px;
  padding: 40px 36px;
  margin-bottom: 36px;
  background:
    radial-gradient(circle at 85% 20%, rgba(47, 161, 138, 0.16), transparent 50%),
    radial-gradient(circle at 10% 90%, rgba(31, 122, 103, 0.10), transparent 55%),
    linear-gradient(135deg, #15211f 0%, #0e1418 100%);
  border: 1px solid var(--border-soft);
}
.client-home-hero-bg { position: absolute; inset: 0; pointer-events: none; }
.client-home-hero-blob {
  position: absolute;
  border-radius: 50%;
  filter: blur(60px);
}
.client-home-hero-blob-1 {
  width: 260px; height: 260px;
  background: rgba(47, 161, 138, 0.16);
  top: -60px; right: -60px;
}
.client-home-hero-blob-2 {
  width: 200px; height: 200px;
  background: rgba(31, 122, 103, 0.10);
  bottom: -40px; left: -40px;
}
.client-home-hero-content { position: relative; max-width: 720px; }
.client-home-hero-greet {
  display: inline-block;
  font-size: .82rem;
  font-weight: 700;
  color: var(--green-primary);
  background: var(--green-soft);
  padding: 5px 14px;
  border-radius: 100px;
  margin-bottom: 14px;
}
.client-home-hero-title {
  font-family: 'Sora', 'Manrope', sans-serif;
  font-weight: 800;
  letter-spacing: -0.02em;
  font-size: clamp(1.7rem, 3.6vw, 2.5rem);
  line-height: 1.15;
  color: var(--text-primary);
  margin-bottom: 12px;
}
.client-home-hero-accent { color: var(--green-primary); }
.client-home-hero-sub {
  font-size: 1rem;
  color: var(--text-muted);
  margin-bottom: 22px;
  max-width: 540px;
}
.client-home-hero-actions { display: flex; gap: 10px; flex-wrap: wrap; }
.client-home-hero-cta { font-weight: 800 !important; }

/* Beneficios */
.client-home-perks {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 14px;
  margin-bottom: 36px;
}
.client-home-perk {
  display: flex;
  gap: 14px;
  padding: 18px;
  background: var(--bg-card);
  border: 1px solid var(--border-soft);
  border-radius: 16px;
  box-shadow: var(--shadow-sm);
  transition: transform var(--transition), box-shadow var(--transition);
}
.client-home-perk:hover { transform: translateY(-2px); box-shadow: var(--shadow-md); }
.client-home-perk-icon {
  width: 44px; height: 44px;
  flex-shrink: 0;
  display: grid; place-items: center;
  border-radius: 12px;
  background: var(--green-soft);
  color: var(--green-primary);
  font-size: 1.4rem;
}
.client-home-perk h3 {
  font-size: .98rem;
  font-weight: 800;
  color: var(--text-primary);
  margin-bottom: 4px;
}
.client-home-perk p {
  font-size: .85rem;
  color: var(--text-muted);
  line-height: 1.4;
}

/* Secciones */
.client-home-section { margin-bottom: 36px; }
.client-home-section-link {
  font-size: .85rem;
  font-weight: 700;
  color: var(--green-primary);
  text-decoration: none;
}
.client-home-section-link:hover { color: var(--green-dark); }

/* Próxima reserva */
.client-home-next {
  display: flex;
  gap: 16px;
  padding: 18px;
  background: linear-gradient(135deg, rgba(47, 161, 138, 0.08), var(--bg-card));
  border: 1px solid rgba(47, 161, 138, 0.22);
  border-radius: 18px;
  box-shadow: var(--shadow-sm);
  text-decoration: none;
  transition: transform var(--transition), box-shadow var(--transition);
}
.client-home-next:hover { transform: translateY(-2px); box-shadow: var(--shadow-md); }
.client-home-next-thumb {
  width: 96px; height: 96px;
  flex-shrink: 0;
  border-radius: 14px;
  overflow: hidden;
  display: grid; place-items: center;
  background: linear-gradient(135deg, #182230, #0f141a);
  color: rgba(31, 122, 103, 0.55);
}
.client-home-next-thumb img { width: 100%; height: 100%; object-fit: cover; }
.client-home-next-thumb .mdi { font-size: 2.4rem; }
.client-home-next-body { flex: 1; min-width: 0; }
.client-home-next-body h3 {
  font-size: 1.1rem;
  font-weight: 800;
  color: var(--text-primary);
  line-height: 1.2;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.client-home-next-body p {
  font-size: .85rem;
  color: var(--text-muted);
  margin-top: 4px;
}
.client-home-next-rows {
  margin-top: 10px;
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}
.client-home-next-rows span {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: .85rem;
  color: var(--text-muted);
}
.client-home-next-rows .mdi { color: var(--green-primary); font-size: 1rem; }
.client-home-next-side {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  justify-content: space-between;
  gap: 8px;
}
.client-home-next-caret { color: var(--text-faint); font-size: 1.6rem; }

/* Recientes — lista compacta */
.client-home-recent { list-style: none; padding: 0; display: flex; flex-direction: column; gap: 8px; }
.client-home-recent-row {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 14px;
  background: var(--bg-card);
  border: 1px solid var(--border-soft);
  border-radius: 14px;
  text-decoration: none;
  transition: border-color var(--transition), box-shadow var(--transition), transform var(--transition);
}
.client-home-recent-row:hover {
  border-color: var(--border-strong);
  box-shadow: var(--shadow-sm);
  transform: translateY(-1px);
}
.client-home-recent-thumb {
  width: 44px; height: 44px;
  border-radius: 10px;
  overflow: hidden;
  background: var(--green-soft);
  display: grid; place-items: center;
  color: var(--green-primary);
  flex-shrink: 0;
}
.client-home-recent-thumb img { width: 100%; height: 100%; object-fit: cover; }
.client-home-recent-thumb .mdi { font-size: 1.2rem; }
.client-home-recent-text { flex: 1; min-width: 0; display: flex; flex-direction: column; }
.client-home-recent-name {
  font-size: .92rem;
  font-weight: 700;
  color: var(--text-primary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.client-home-recent-when { font-size: .78rem; color: var(--text-muted); }

/* Empty state */
.client-home-empty {
  text-align: center;
  padding: 48px 24px;
  background: var(--bg-card);
  border: 1px solid var(--border-soft);
  border-radius: 18px;
}
.client-home-empty-icon {
  width: 72px; height: 72px;
  margin: 0 auto 14px;
  display: grid; place-items: center;
  border-radius: 50%;
  background: var(--green-soft);
  color: var(--green-primary);
  font-size: 2rem;
}
.client-home-empty h3 { font-size: 1.1rem; font-weight: 800; color: var(--text-primary); margin-bottom: 4px; }
.client-home-empty p { color: var(--text-muted); font-size: .9rem; }

@media (max-width: 760px) {
  .client-home-hero { padding: 28px 20px; }
  .client-home-perks { grid-template-columns: 1fr; }
  .client-home-hero-actions .v-btn { flex: 1; }
  .client-home-next { flex-direction: column; }
  .client-home-next-thumb { width: 100%; height: 140px; }
  .client-home-next-side { flex-direction: row; align-items: center; justify-content: space-between; }
}
</style>
