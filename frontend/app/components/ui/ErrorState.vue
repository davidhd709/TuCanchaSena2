<template>
  <div class="error-state">
    <div class="error-state-icon">
      <v-icon icon="mdi-alert-circle-outline" size="32" color="error" aria-hidden="true" />
    </div>
    <h3 class="brand-heading error-state-title">Algo salió mal</h3>
    <p class="error-state-desc">{{ message }}</p>
    <v-btn
      color="primary"
      variant="flat"
      prepend-icon="mdi-refresh"
      class="mt-5"
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

<style scoped>
.error-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  padding: 64px 24px;
  border: 1px solid rgba(239, 68, 68, 0.22);
  border-radius: var(--radius-lg);
  background: linear-gradient(180deg, rgba(37, 24, 27, 0.56), rgba(24, 18, 21, 0.56));
}
.error-state-icon {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  background: rgba(239, 68, 68, 0.12);
  border: 1px solid rgba(239, 68, 68, 0.22);
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 18px;
}
.error-state-title {
  font-size: 1.1rem;
  margin-bottom: 6px;
}
.error-state-desc {
  font-size: 0.88rem;
  color: var(--text-muted);
  max-width: 360px;
  line-height: 1.6;
}
:deep(.v-btn) {
  font-weight: 700;
  letter-spacing: 0.01em;
}
</style>
