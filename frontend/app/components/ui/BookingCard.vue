<template>
  <article class="booking-card">
    <div class="booking-card-media">
      <img v-if="booking.court?.images?.[0]" :src="booking.court.images[0]" :alt="booking.court?.name ?? 'Cancha'" />
      <div v-else class="booking-card-ph"><span class="mdi mdi-soccer-field" /></div>
      <span class="booking-badge" :class="`is-${booking.status}`">{{ label }}</span>
    </div>

    <div class="booking-card-body">
      <h3 class="booking-card-name">{{ booking.court?.name ?? 'Cancha' }}</h3>
      <p class="booking-card-place"><span class="mdi mdi-map-marker-outline" /> {{ booking.court?.business?.name ?? 'Ubicación' }}</p>

      <div class="booking-info-row"><span><span class="mdi mdi-calendar-blank-outline" /> Fecha</span><strong>{{ formattedDate }}</strong></div>
      <div class="booking-info-row"><span><span class="mdi mdi-clock-outline" /> Horario</span><strong>{{ booking.startTime?.slice(0,5) }} - {{ booking.endTime?.slice(0,5) }}</strong></div>
      <div class="booking-info-row"><span><span class="mdi mdi-cash-multiple" /> Total</span><strong class="booking-price">${{ amount }}</strong></div>

      <p v-if="booking.cancellationReason" class="booking-reason">Motivo: {{ booking.cancellationReason }}</p>

      <div class="booking-actions">
        <v-btn
          v-if="booking.status === 'pending'"
          block
          color="primary"
          class="mb-2"
          @click.stop="emit('cancel', booking)"
        >
          Cancelar reserva
        </v-btn>
        <v-btn block variant="outlined" :to="`/client/bookings/${booking.id}`">Ver detalle</v-btn>
      </div>
    </div>
  </article>
</template>

<script setup lang="ts">
const props = defineProps<{ booking: any }>()
const emit = defineEmits<{ (e: 'cancel', booking: any): void }>()

const labels: Record<string, string> = {
  confirmed: 'Confirmada',
  pending: 'Pendiente',
  rejected: 'Rechazada',
  cancelled: 'Cancelada',
  completed: 'Completada',
}

const label = computed(() => labels[props.booking.status] ?? 'Reserva')
const formattedDate = computed(() => {
  const date = props.booking.date
  if (!date) return ''
  const [y, m, d] = date.split('-').map(Number)
  if (!y || !m || !d) return date
  return new Date(y, m - 1, d).toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' })
})
const amount = computed(() => Number(props.booking.totalPrice ?? 0).toLocaleString('es-CO'))
</script>

<style scoped>
.booking-card {
  border-radius: 16px;
  overflow: hidden;
  border: 1px solid rgba(255,255,255,.1);
  background: #191f27;
}
.booking-card-media { height: 174px; position: relative; }
.booking-card-media img,
.booking-card-ph { width: 100%; height: 100%; object-fit: cover; }
.booking-card-ph {
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(140deg, #1d2a34, #111722);
}
.booking-card-ph .mdi { font-size: 2.2rem; color: rgba(111, 230, 140, .45); }

.booking-badge {
  position: absolute;
  top: 12px;
  right: 12px;
  border-radius: 10px;
  padding: 5px 12px;
  font-size: .72rem;
  font-weight: 800;
  letter-spacing: .04em;
  text-transform: uppercase;
}
.booking-badge.is-confirmed,
.booking-badge.is-completed { background: rgba(15,129,63,.65); color: #d4ffe2; }
.booking-badge.is-pending { background: #c8f1fc; color: #173743; }
.booking-badge.is-rejected,
.booking-badge.is-cancelled { background: rgba(166, 11, 19, .86); color: #ffe0e2; }

.booking-card-body { padding: 16px; }
.booking-card-name { font-size: 1.98rem; font-size: clamp(1.25rem, 1.6vw, 1.98rem); font-weight: 700; color: #e8ecf2; }
.booking-card-place { margin-top: 4px; color: #b8c0ca; }
.booking-info-row {
  margin-top: 10px;
  display: flex;
  justify-content: space-between;
  color: #c8ced6;
  font-size: 1.3rem;
  font-size: clamp(.92rem, 1.1vw, 1.3rem);
}
.booking-info-row span { color: #9aa3ae; display: inline-flex; gap: 6px; }
.booking-info-row .mdi { color: #14b45f; }
.booking-price { color: #1cd36d; }

.booking-reason {
  margin-top: 12px;
  padding: 10px;
  border-radius: 10px;
  background: rgba(159, 38, 45, 0.28);
  border: 1px solid rgba(199, 53, 62, 0.3);
  color: #ffb9bf;
}
.booking-actions { margin-top: 14px; }
</style>
