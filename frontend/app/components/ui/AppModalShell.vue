<template>
  <!--
    AppModalShell — modal estándar del design system.

    Uso:
      <AppModalShell v-model="open" title="Editar cancha" subtitle="..."
                     :width="640" :loading="saving">
        <template #body>
          ... formulario / contenido ...
        </template>
        <template #footer>
          <v-btn variant="text" @click="open = false">Cancelar</v-btn>
          <v-btn color="primary" :loading="saving" @click="onSave">Guardar</v-btn>
        </template>
      </AppModalShell>

    Provee:
      - Header con título/subtítulo + botón de cerrar (icono).
      - Body scrolleable (`max-height: 70vh` por defecto).
      - Footer sticky (no se mueve al hacer scroll del body).
      - Slot `tag` opcional para mostrar un chip a la izquierda del título.
      - ESC y click fuera cierran (compartido con v-dialog).
      - Mantiene el selector `.v-dialog` (los E2E que filtran por dialog siguen valiendo).
  -->
  <v-dialog
    :model-value="modelValue"
    :max-width="width"
    :persistent="persistent"
    :scrollable="scrollable"
    :aria-labelledby="titleId"
    @update:model-value="(v) => emit('update:modelValue', v)"
  >
    <v-card class="app-modal" rounded="lg">
      <header class="app-modal-head">
        <div class="app-modal-head-text">
          <span v-if="$slots.tag" class="app-modal-tag"><slot name="tag" /></span>
          <h2 :id="titleId" class="app-modal-title">{{ title }}</h2>
          <p v-if="subtitle" class="app-modal-sub">{{ subtitle }}</p>
        </div>
        <button
          v-if="closable"
          type="button"
          class="app-modal-close"
          aria-label="Cerrar"
          @click="emit('update:modelValue', false)"
        >
          <span class="mdi mdi-close" />
        </button>
      </header>

      <section class="app-modal-body">
        <slot name="body" />
        <slot />
      </section>

      <footer v-if="$slots.footer" class="app-modal-foot">
        <slot name="footer" />
      </footer>
    </v-card>
  </v-dialog>
</template>

<script setup lang="ts">
const props = withDefaults(
  defineProps<{
    modelValue: boolean
    title: string
    subtitle?: string
    /** Ancho máximo del modal en píxeles. */
    width?: number | string
    /** Bloquea cierre al hacer click fuera o ESC. */
    persistent?: boolean
    /** Habilita scroll interno del body. */
    scrollable?: boolean
    /** Muestra el botón X del header (por default sí). */
    closable?: boolean
  }>(),
  {
    subtitle: '',
    width: 560,
    persistent: false,
    scrollable: true,
    closable: true,
  },
)
const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void
}>()

const titleId = computed(() => `app-modal-title-${Math.random().toString(36).slice(2, 9)}`)
</script>

<style scoped>
.app-modal {
  display: flex;
  flex-direction: column;
  max-height: 86vh;
  overflow: hidden;
  background: var(--bg-card) !important;
  border: 1px solid var(--border-soft) !important;
  box-shadow: var(--shadow-lg) !important;
}

/* Header */
.app-modal-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  padding: 20px 24px 16px;
  border-bottom: 1px solid var(--border-soft);
  flex-shrink: 0;
}
.app-modal-head-text { min-width: 0; }
.app-modal-tag {
  display: inline-block;
  font-size: .68rem;
  font-weight: 800;
  letter-spacing: 0.10em;
  text-transform: uppercase;
  color: var(--green-bright);
  background: var(--green-soft);
  padding: 3px 9px;
  border-radius: var(--radius-pill);
  margin-bottom: 8px;
}
.app-modal-title {
  font-family: 'Manrope', sans-serif;
  font-size: 1.15rem;
  font-weight: 800;
  line-height: 1.25;
  color: var(--text-primary);
}
.app-modal-sub {
  margin-top: 4px;
  font-size: .85rem;
  color: var(--text-muted);
  line-height: 1.45;
}
.app-modal-close {
  flex-shrink: 0;
  width: 36px;
  height: 36px;
  display: grid;
  place-items: center;
  border-radius: var(--radius-pill);
  border: 1px solid var(--border-medium);
  background: var(--bg-elev);
  color: var(--text-muted);
  cursor: pointer;
  transition: color var(--transition-fast), border-color var(--transition-fast), background var(--transition-fast);
}
.app-modal-close:hover {
  color: var(--text-primary);
  border-color: var(--text-muted);
  background: var(--bg-card);
}
.app-modal-close .mdi { font-size: 1.2rem; }

/* Body con scroll interno y scrollbar fino. */
.app-modal-body {
  padding: 18px 24px;
  overflow-y: auto;
  flex: 1 1 auto;
  color: var(--text-secondary);
  scrollbar-width: thin;
}
.app-modal-body::-webkit-scrollbar { width: 8px; }
.app-modal-body::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.12);
  border-radius: 999px;
}
.app-modal-body::-webkit-scrollbar-thumb:hover { background: rgba(255, 255, 255, 0.2); }
/* La primera/última sección no necesitan su borde superior dentro del modal. */
.app-modal-body :deep(.app-form-section:first-child) { margin-top: 0; }
.app-modal-body :deep(.app-form-section:last-child) { margin-bottom: 0; }

/* Footer sticky con buttons alineados a la derecha por default */
.app-modal-foot {
  display: flex;
  justify-content: flex-end;
  align-items: center;
  gap: 10px;
  padding: 14px 24px;
  border-top: 1px solid var(--border-soft);
  background: var(--bg-card);
  flex-shrink: 0;
}

@media (max-width: 600px) {
  .app-modal-head { padding: 16px 18px 14px; }
  .app-modal-body { padding: 14px 18px; }
  .app-modal-foot { padding: 12px 18px; flex-direction: column-reverse; align-items: stretch; }
  .app-modal-foot > * { width: 100%; }
}
</style>
