<template>
  <v-card rounded="lg" color="primary" variant="tonal">
    <v-card-text class="pa-5">
      <h3 class="text-subtitle-2 font-weight-bold mb-4 d-flex align-center gap-2">
        <v-icon size="18" color="primary">mdi-clipboard-check-outline</v-icon>
        Resumen de tu Reserva
      </h3>

      <v-list density="compact" class="bg-transparent pa-0">
        <!-- Cancha -->
        <v-list-item class="px-0 mb-1">
          <template #prepend>
            <v-icon size="18" color="primary" class="mr-2">mdi-soccer-field</v-icon>
          </template>
          <v-list-item-title class="text-body-2 font-weight-medium">
            {{ court?.name ?? 'Cancha' }}
          </v-list-item-title>
          <v-list-item-subtitle class="text-caption">
            {{ court?.business?.name }}
            <template v-if="court?.business?.city"> · {{ court.business.city }}</template>
          </v-list-item-subtitle>
        </v-list-item>

        <!-- Fecha -->
        <v-list-item class="px-0 mb-1">
          <template #prepend>
            <v-icon size="18" color="primary" class="mr-2">mdi-calendar</v-icon>
          </template>
          <v-list-item-title class="text-body-2">{{ formattedDate }}</v-list-item-title>
        </v-list-item>

        <!-- Hora -->
        <v-list-item class="px-0 mb-1">
          <template #prepend>
            <v-icon size="18" color="primary" class="mr-2">mdi-clock-outline</v-icon>
          </template>
          <v-list-item-title class="text-body-2">
            {{ startTime }} – {{ endTime }}
            <v-chip size="x-small" color="primary" variant="tonal" class="ml-2">
              {{ durationLabel }}
            </v-chip>
          </v-list-item-title>
        </v-list-item>

        <!-- Tipo de cancha -->
        <v-list-item v-if="court?.type" class="px-0">
          <template #prepend>
            <v-icon size="18" color="primary" class="mr-2">mdi-tag-outline</v-icon>
          </template>
          <v-list-item-title class="text-body-2">{{ courtTypeLabel(court.type) }}</v-list-item-title>
        </v-list-item>
      </v-list>

      <v-divider class="my-4" />

      <!-- Total -->
      <div class="d-flex justify-space-between align-center">
        <div>
          <div class="text-body-2 font-weight-medium">Total a pagar</div>
          <div class="text-caption text-medium-emphasis">
            ${{ pricePerHour.toLocaleString('es-CO') }}/hr × {{ durationHours }}h
          </div>
        </div>
        <div class="text-h5 font-weight-bold text-primary">
          ${{ totalPrice.toLocaleString('es-CO') }}
        </div>
      </div>
    </v-card-text>
  </v-card>
</template>

<script setup lang="ts">
/**
 * BookingConfirmation
 * Panel de resumen informativo de la reserva antes de confirmar.
 * Solo presentación — sin lógica de negocio ni peticiones API.
 *
 * Props:
 *   - court: datos de la cancha (name, business, type)
 *   - date: fecha en formato 'YYYY-MM-DD'
 *   - startTime: hora de inicio 'HH:mm'
 *   - endTime: hora de fin 'HH:mm'
 *   - pricePerHour: precio por hora (puede venir del slot o de la cancha)
 */

interface Court {
  id?: string
  name: string
  type?: string
  pricePerHour?: number
  business?: {
    id?: string
    name?: string
    city?: string
  }
}

const props = defineProps<{
  court?: Court | null
  date: string
  startTime: string
  endTime: string
  pricePerHour: number
}>()

const courtTypes: Record<string, string> = {
  football_5: 'Fútbol 5',
  football_7: 'Fútbol 7',
  football_8: 'Fútbol 8',
  football_11: 'Fútbol 11',
  futsal: 'Futsal',
  beach_soccer: 'Fútbol Playa',
  mini_football: 'Mini Fútbol',
}
const courtTypeLabel = (type: string) => courtTypes[type] ?? type

const formattedDate = computed(() => {
  if (!props.date) return ''
  const [y, m, d] = props.date.split('-').map(Number)
  const dateObj = new Date(y, m - 1, d)
  return dateObj.toLocaleDateString('es-CO', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
})

const durationHours = computed(() => {
  if (!props.startTime || !props.endTime) return 1
  const [sh, sm] = props.startTime.split(':').map(Number)
  const [eh, em] = props.endTime.split(':').map(Number)
  return Math.max(1, (eh * 60 + em - sh * 60 - sm) / 60)
})

const durationLabel = computed(() => {
  const h = durationHours.value
  return h === 1 ? '1 hora' : `${h} horas`
})

const totalPrice = computed(() => props.pricePerHour * durationHours.value)
</script>
