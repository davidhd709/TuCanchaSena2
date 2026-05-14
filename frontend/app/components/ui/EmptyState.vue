<template>
  <div class="empty-state d-flex flex-column align-center justify-center py-10 text-center">
    <v-icon
      :icon="icon"
      size="72"
      :color="iconColor"
      class="mb-4"
      style="opacity: 0.35"
      aria-hidden="true"
    />
    <h3 class="text-subtitle-1 font-weight-bold mb-1">{{ title }}</h3>
    <p v-if="description" class="text-body-2 text-medium-emphasis mb-4" style="max-width:320px">
      {{ description }}
    </p>
    <!-- Acción opcional: pasa un botón o link como slot -->
    <slot name="action" />
  </div>
</template>

<script setup lang="ts">
withDefaults(
  defineProps<{
    /** Icono MDI. Ej: 'mdi-inbox-outline' */
    icon?: string
    iconColor?: string
    title: string
    description?: string
  }>(),
  {
    icon: 'mdi-inbox-outline',
    iconColor: 'primary',
    description: '',
  },
)
</script>
