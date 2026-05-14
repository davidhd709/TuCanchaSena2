<template>
  <span class="status-badge" :class="`is-${status}`">
    <span class="mdi" :class="chipIcon" />
    {{ chipLabel }}
  </span>
</template>

<script setup lang="ts">
const props = defineProps<{ status: string }>()

const chipIcon = computed(() => {
  const map: Record<string, string> = {
    pending: 'mdi-clock-outline',
    confirmed: 'mdi-check-circle-outline',
    rejected: 'mdi-close-circle-outline',
    cancelled: 'mdi-close-circle-outline',
    completed: 'mdi-flag-checkered',
    no_show: 'mdi-account-off-outline',
    expired: 'mdi-timer-off-outline',
  }
  return map[props.status] ?? 'mdi-help-circle-outline'
})

const chipLabel = computed(() => {
  const map: Record<string, string> = {
    pending: 'Pendiente',
    confirmed: 'Confirmada',
    rejected: 'Rechazada',
    cancelled: 'Cancelada',
    completed: 'Completada',
    no_show: 'No Show',
    expired: 'Vencida',
  }
  return map[props.status] ?? props.status
})
</script>

<style scoped>
.status-badge {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  font-size: 0.74rem;
  font-weight: 700;
  padding: 5px 11px;
  border-radius: 100px;
  white-space: nowrap;
}
.status-badge .mdi { font-size: 0.9rem; }

.is-pending   { background: rgba(47, 161, 138, 0.18); color: #6ee7b7; }
.is-confirmed { background: rgba(47, 161, 138, 0.15);  color: #4ade80; }
.is-completed { background: rgba(59, 130, 246, 0.15); color: #60a5fa; }
.is-rejected,
.is-cancelled { background: rgba(239, 68, 68, 0.15);  color: #f87171; }
.is-no_show   { background: rgba(71, 85, 105, 0.2); color: #cbd5e1; }
.is-expired   { background: rgba(100, 116, 139, 0.18); color: #94a3b8; }
</style>
