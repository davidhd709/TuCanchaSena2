<template>
  <NuxtLink :to="`/client/bookings/${booking.id}`" class="booking-card">
    <div class="booking-card-thumb">
      <img
        v-if="cover && !imgError"
        :src="cover"
        :alt="booking.court?.name ?? 'Cancha'"
        @error="imgError = true"
      />
      <div v-else class="booking-card-ph">
        <span class="mdi mdi-soccer-field" />
      </div>
    </div>

    <div class="booking-card-info">
      <div class="booking-card-head">
        <h3 class="booking-card-name">{{ booking.court?.name ?? 'Cancha' }}</h3>
        <BookingStatusChip :status="booking.status" />
      </div>
      <p class="booking-card-place">
        <span class="mdi mdi-map-marker-outline" />
        {{ booking.court?.business?.name ?? 'Negocio deportivo' }}
      </p>

      <div class="booking-card-rows">
        <span class="booking-card-row">
          <span class="mdi mdi-calendar-blank-outline" />
          {{ formattedDate }}
        </span>
        <span class="booking-card-row">
          <span class="mdi mdi-clock-outline" />
          {{ booking.startTime?.slice(0,5) }} – {{ booking.endTime?.slice(0,5) }}
        </span>
        <span class="booking-card-row booking-card-price">
          <span class="mdi mdi-cash-multiple" />
          ${{ amount }}
        </span>
      </div>

      <p v-if="booking.cancellationReason" class="booking-card-reason">
        <span class="mdi mdi-information-outline" />
        {{ booking.cancellationReason }}
      </p>

      <div class="booking-card-actions">
        <v-btn
          v-if="booking.status === 'pending'"
          color="error"
          variant="text"
          size="small"
          @click.stop.prevent="emit('cancel', booking)"
        >
          Cancelar
        </v-btn>
        <span class="booking-card-chevron mdi mdi-chevron-right" />
      </div>
    </div>
  </NuxtLink>
</template>

<script setup lang="ts">
const props = defineProps<{ booking: any }>()
const emit = defineEmits<{ (e: 'cancel', booking: any): void }>()

const cover = computed(() => safeCover(props.booking.court?.images?.[0]))
const imgError = ref(false)

const toLocalDate = (value: unknown): Date | null => {
  if (!value) return null
  if (value instanceof Date) return Number.isNaN(value.getTime()) ? null : value
  if (typeof value !== 'string') return null
  const ymd = /^(\d{4})-(\d{2})-(\d{2})/.exec(value)
  if (ymd) {
    const d = new Date(Number(ymd[1]), Number(ymd[2]) - 1, Number(ymd[3]))
    return Number.isNaN(d.getTime()) ? null : d
  }
  const d = new Date(value)
  return Number.isNaN(d.getTime()) ? null : d
}

const formattedDate = computed(() => {
  const d = toLocalDate(props.booking.date)
  if (!d) return 'Fecha no disponible'
  return d.toLocaleDateString('es-CO', { weekday: 'short', day: '2-digit', month: 'short' })
})
const amount = computed(() => Number(props.booking.totalPrice ?? 0).toLocaleString('es-CO'))
</script>

<style scoped>
.booking-card {
  display: flex;
  gap: 14px;
  padding: 14px;
  background: var(--bg-card);
  border: 1px solid var(--border-soft);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-sm);
  text-decoration: none;
  color: var(--text-primary);
  transition: transform var(--transition), box-shadow var(--transition), border-color var(--transition);
}
.booking-card:hover {
  transform: translateY(-2px);
  border-color: var(--border-medium);
  box-shadow: var(--shadow-md);
}

.booking-card-thumb {
  flex-shrink: 0;
  width: 110px;
  aspect-ratio: 1 / 1;
  border-radius: var(--radius-md);
  overflow: hidden;
  background: var(--bg-subtle);
}
.booking-card-thumb img,
.booking-card-ph {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.booking-card-ph {
  display: flex;
  align-items: center;
  justify-content: center;
  background:
    radial-gradient(circle at 30% 25%, rgba(52, 198, 146, 0.16), transparent 55%),
    linear-gradient(135deg, #182230 0%, #0f141a 100%);
}
.booking-card-ph .mdi { font-size: 2.2rem; color: rgba(52, 198, 146, 0.55); }

.booking-card-info {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
}
.booking-card-head {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 8px;
}
.booking-card-name {
  font-size: 1rem;
  font-weight: 800;
  color: var(--text-primary);
  line-height: 1.2;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.booking-card-place {
  font-size: .8rem;
  color: var(--text-muted);
  margin-top: 4px;
  display: inline-flex;
  align-items: center;
  gap: 4px;
}
.booking-card-place .mdi { color: var(--green-bright); font-size: 1rem; }

.booking-card-rows {
  margin-top: 8px;
  display: flex;
  flex-wrap: wrap;
  gap: 4px 14px;
}
.booking-card-row {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: .82rem;
  color: var(--text-muted);
}
.booking-card-row .mdi { color: var(--green-bright); font-size: 1rem; }
.booking-card-price { color: var(--text-primary); font-weight: 800; }

.booking-card-reason {
  margin-top: 8px;
  padding: 6px 10px;
  border-radius: var(--radius-sm);
  background: var(--accent-error-soft);
  color: #fca5a5;
  font-size: .78rem;
  display: inline-flex;
  align-items: flex-start;
  gap: 6px;
  border: 1px solid rgba(239, 68, 68, 0.22);
}
.booking-card-reason .mdi { font-size: 1rem; margin-top: 1px; }

.booking-card-actions {
  margin-top: auto;
  padding-top: 10px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}
.booking-card-chevron { color: var(--text-faint); font-size: 1.4rem; margin-left: auto; }

@media (max-width: 600px) {
  .booking-card { padding: 12px; gap: 12px; }
  .booking-card-thumb { width: 84px; }
  .booking-card-name { font-size: .95rem; }
  .booking-card-rows { gap: 4px 10px; }
}
</style>
