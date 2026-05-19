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
/* Badge de estado unificado del design system.
   Usa los tokens `--accent-*-soft` para fondos y un color sólido para texto/icono. */
.status-badge {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  font-size: 0.74rem;
  font-weight: 800;
  padding: 5px 11px;
  border-radius: var(--radius-pill);
  white-space: nowrap;
  line-height: 1;
  border: 1px solid transparent;
}
.status-badge .mdi { font-size: 0.95rem; }

.is-pending {
  background: var(--accent-warning-soft);
  color: var(--accent-warning);
  border-color: rgba(245, 158, 11, 0.28);
}
.is-confirmed {
  background: var(--green-soft);
  color: var(--green-bright);
  border-color: rgba(52, 198, 146, 0.30);
}
.is-completed {
  background: var(--accent-info-soft);
  color: #93c5fd;
  border-color: rgba(59, 130, 246, 0.28);
}
.is-rejected,
.is-cancelled {
  background: var(--accent-error-soft);
  color: #fca5a5;
  border-color: rgba(239, 68, 68, 0.28);
}
.is-no_show {
  background: var(--accent-neutral-soft);
  color: #cbd5e1;
  border-color: rgba(148, 163, 184, 0.24);
}
.is-expired {
  background: rgba(100, 116, 139, 0.18);
  color: #94a3b8;
  border-color: rgba(100, 116, 139, 0.28);
}
</style>
