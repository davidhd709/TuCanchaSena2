<template>
  <div class="error-state d-flex flex-column align-center justify-center py-10 text-center">
    <v-icon
      icon="mdi-alert-circle-outline"
      size="72"
      color="error"
      class="mb-4"
      style="opacity: 0.55"
      aria-hidden="true"
    />
    <h3 class="text-subtitle-1 font-weight-bold mb-1">Algo salió mal</h3>
    <p class="text-body-2 text-medium-emphasis mb-4" style="max-width:320px">
      {{ message }}
    </p>
    <v-btn
      variant="tonal"
      color="error"
      prepend-icon="mdi-refresh"
      @click="emit('retry')"
    >
      Reintentar
    </v-btn>
  </div>
</template>

<script setup lang="ts">
withDefaults(
  defineProps<{
    message?: string
  }>(),
  {
    message: 'No pudimos cargar la información. Verifica tu conexión e intenta de nuevo.',
  },
)

const emit = defineEmits<{
  (e: 'retry'): void
}>()
</script>
