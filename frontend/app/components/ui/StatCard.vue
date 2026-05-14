<template>
  <div class="stat-card">
    <div class="stat-card-icon" :style="accentStyle">
      <v-icon :icon="icon" size="22" />
    </div>
    <div class="stat-card-info">
      <p class="stat-card-value">{{ value }}</p>
      <p class="stat-card-label">{{ label }}</p>
    </div>
  </div>
</template>

<script setup lang="ts">
/**
 * Tarjeta de métrica del dashboard — limpia y clara, estilo marketplace.
 */
const props = withDefaults(
  defineProps<{
    label: string
    value: string | number
    icon: string
    /** Color de acento: primary | success | warning | info | error */
    accent?: string
  }>(),
  { accent: 'primary' },
)

const ACCENT: Record<string, { bg: string; fg: string }> = {
  primary: { bg: 'rgba(47, 161, 138, 0.14)', fg: '#4ade80' },
  success: { bg: 'rgba(47, 161, 138, 0.14)', fg: '#4ade80' },
  warning: { bg: 'rgba(47,161,138,0.14)', fg: '#6ee7b7' },
  info: { bg: 'rgba(59,130,246,0.14)', fg: '#60a5fa' },
  error: { bg: 'rgba(239,68,68,0.14)', fg: '#f87171' },
}

const accentStyle = computed(() => {
  const a = ACCENT[props.accent] ?? ACCENT.primary
  return { background: a.bg, color: a.fg }
})
</script>

<style scoped>
.stat-card {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 20px;
  background: var(--bg-card);
  border: 1px solid var(--border-soft);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-sm);
  height: 100%;
  transition: box-shadow var(--transition), transform var(--transition);
}
.stat-card:hover {
  box-shadow: var(--shadow-md);
  transform: translateY(-2px);
}
.stat-card-icon {
  width: 48px;
  height: 48px;
  flex-shrink: 0;
  border-radius: var(--radius-md);
  display: flex;
  align-items: center;
  justify-content: center;
}
.stat-card-value {
  font-family: 'Sora', 'Manrope', sans-serif;
  font-size: 1.7rem;
  font-weight: 800;
  color: var(--text-primary);
  line-height: 1.1;
}
.stat-card-label {
  font-size: 0.8rem;
  font-weight: 500;
  color: var(--text-muted);
  margin-top: 2px;
}
</style>
