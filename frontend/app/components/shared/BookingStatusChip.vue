<template>
  <v-chip :color="chipColor" size="small" variant="tonal" class="font-weight-medium">
    <v-icon start size="14">{{ chipIcon }}</v-icon>
    {{ chipLabel }}
  </v-chip>
</template>

<script setup lang="ts">
const props = defineProps<{ status: string }>()

const chipColor = computed(() => {
  const map: Record<string, string> = {
    pending: 'warning',
    confirmed: 'success',
    cancelled: 'error',
    completed: 'info',
    no_show: 'secondary',
  }
  return map[props.status] ?? 'default'
})

const chipIcon = computed(() => {
  const map: Record<string, string> = {
    pending: 'mdi-clock-outline',
    confirmed: 'mdi-check-circle',
    cancelled: 'mdi-close-circle',
    completed: 'mdi-flag-checkered',
    no_show: 'mdi-account-off',
  }
  return map[props.status] ?? 'mdi-help-circle'
})

const chipLabel = computed(() => {
  const map: Record<string, string> = {
    pending: 'Pendiente',
    confirmed: 'Confirmada',
    cancelled: 'Cancelada',
    completed: 'Completada',
    no_show: 'No Show',
  }
  return map[props.status] ?? props.status
})
</script>
