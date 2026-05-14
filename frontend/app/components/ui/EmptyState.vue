<template>
  <div class="empty-state">
    <div class="empty-state-icon">
      <v-icon :icon="icon" size="32" color="primary" aria-hidden="true" />
    </div>
    <h3 class="brand-heading empty-state-title">{{ title }}</h3>
    <p v-if="description" class="empty-state-desc">{{ description }}</p>
    <div v-if="$slots.action" class="empty-state-action">
      <slot name="action" />
    </div>
  </div>
</template>

<script setup lang="ts">
withDefaults(
  defineProps<{
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

<style scoped>
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  padding: 64px 24px;
  border: 1px dashed rgba(47, 161, 138, 0.3);
  border-radius: var(--radius-lg);
  background: linear-gradient(180deg, rgba(23, 28, 35, 0.9), rgba(18, 22, 29, 0.9));
}
.empty-state-icon {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  background: var(--green-soft);
  border: 1px solid rgba(22, 163, 74, 0.16);
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 18px;
  transition: transform 0.24s ease, box-shadow 0.24s ease;
}
.empty-state:hover .empty-state-icon {
  transform: translateY(-2px) scale(1.03);
  box-shadow: 0 10px 24px rgba(47, 161, 138, 0.22);
}
.empty-state-title {
  font-size: 1.1rem;
  margin-bottom: 6px;
}
.empty-state-desc {
  font-size: 0.88rem;
  color: var(--text-muted);
  max-width: 360px;
  line-height: 1.6;
}
.empty-state-action { margin-top: 20px; }
</style>
