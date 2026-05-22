<template>
  <!--
    AppConfirmDialog — modal de confirmación estándar del design system.
    Construido sobre AppModalShell (conserva el selector `.v-dialog`).

    Uso:
      <AppConfirmDialog
        v-model="deleteDialog"
        title="Eliminar cancha"
        subtitle="Esta acción no se puede deshacer."
        icon="mdi-soccer-field"
        confirm-text="Eliminar"
        :loading="actionLoading"
        @confirm="deleteCourt"
      >
        <p class="text-body-2 text-medium-emphasis">
          Vas a eliminar <strong>{{ selectedCourt?.name }}</strong>.
        </p>
      </AppConfirmDialog>

    - El botón "cancelar" cierra el modal (emite update:modelValue=false).
    - El botón de confirmar emite `confirm`; el padre mantiene el control del
      cierre (normalmente lo cierra en el `finally` de su acción async).
    - El cuerpo del mensaje va en el slot por defecto (permite <strong> y varios
      párrafos sin riesgo de v-html).
  -->
  <AppModalShell
    :model-value="modelValue"
    :title="title"
    :subtitle="subtitle"
    :width="width"
    :test-id="testId"
    @update:model-value="(v) => emit('update:modelValue', v)"
  >
    <template v-if="tag" #tag>{{ tag }}</template>
    <template #body>
      <div class="text-center py-2">
        <v-icon size="48" :color="iconColor" class="mb-3">{{ icon }}</v-icon>
        <slot />
      </div>
    </template>
    <template #footer>
      <v-btn variant="text" @click="emit('update:modelValue', false)">{{ cancelText }}</v-btn>
      <v-btn :color="confirmColor" variant="flat" :loading="loading" @click="emit('confirm')">
        {{ confirmText }}
      </v-btn>
    </template>
  </AppModalShell>
</template>

<script setup lang="ts">
withDefaults(
  defineProps<{
    modelValue: boolean
    title: string
    subtitle?: string
    /** Chip a la izquierda del título. Vacío = sin chip. */
    tag?: string
    icon?: string
    iconColor?: string
    confirmText?: string
    confirmColor?: string
    cancelText?: string
    loading?: boolean
    width?: number | string
    /** data-testid opcional reenviado a AppModalShell. */
    testId?: string
  }>(),
  {
    subtitle: '',
    tag: 'Atención',
    icon: 'mdi-alert-circle-outline',
    iconColor: 'error',
    confirmText: 'Confirmar',
    confirmColor: 'error',
    cancelText: 'Cancelar',
    loading: false,
    width: 420,
    testId: undefined,
  },
)

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void
  (e: 'confirm'): void
}>()
</script>
