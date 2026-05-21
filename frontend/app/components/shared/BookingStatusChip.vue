<template>
  <span
    class="status-badge"
    :class="meta.badgeClass"
    :data-status="meta.value"
    data-testid="booking-status-chip"
  >
    <span class="mdi" :class="meta.icon" />
    {{ meta.label }}
  </span>
</template>

<script setup lang="ts">
// Catálogo único de estados (label, icono, color, clase CSS, final/pendiente).
// Ver app/utils/bookingStatus.ts. Mantiene las clases `status-badge is-<status>`
// y los labels exactos de los que dependen los E2E.
const props = defineProps<{ status: string }>()

const meta = computed(() => getBookingStatusMeta(props.status))
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
