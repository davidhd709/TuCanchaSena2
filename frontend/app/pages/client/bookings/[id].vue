<template>
  <div>
    <!-- Botón volver -->
    <v-btn
      to="/client/bookings"
      variant="text"
      prepend-icon="mdi-arrow-left"
      class="mb-4 px-0"
    >
      Mis Reservas
    </v-btn>

    <!-- Loading -->
    <div v-if="loading" class="d-flex justify-center py-16">
      <v-progress-circular indeterminate color="primary" size="48" />
    </div>

    <!-- Error -->
    <v-alert
      v-else-if="error"
      type="error"
      variant="tonal"
      rounded="lg"
    >
      {{ error }}
      <template #append>
        <v-btn variant="text" @click="loadBooking">Reintentar</v-btn>
      </template>
    </v-alert>

    <template v-else-if="booking">
      <!-- Hero status -->
      <v-card rounded="xl" class="mb-6 overflow-hidden">
        <div class="status-hero pa-6 d-flex align-center gap-4" :class="heroClass">
          <v-icon size="52" color="white">{{ heroIcon }}</v-icon>
          <div>
            <h1 class="text-h5 font-weight-bold text-white mb-1">{{ heroTitle }}</h1>
            <p class="text-body-2 text-white" style="opacity: 0.9">{{ heroSubtitle }}</p>
          </div>
          <v-spacer />
          <BookingStatusChip :status="booking.status" size="large" />
        </div>
      </v-card>

      <v-row>
        <!-- Detalle principal -->
        <v-col cols="12" md="7">
          <v-card rounded="lg" class="mb-4">
            <v-card-title class="pa-5 pb-3 text-subtitle-1 font-weight-bold">
              <v-icon class="mr-2" color="primary">mdi-soccer-field</v-icon>
              Datos de la reserva
            </v-card-title>
            <v-divider />
            <v-card-text class="pa-5">
              <v-list density="comfortable" class="pa-0">
                <v-list-item class="px-0">
                  <template #prepend>
                    <v-avatar color="primary" variant="tonal" rounded="lg" size="36" class="mr-3">
                      <v-icon size="18">mdi-soccer-field</v-icon>
                    </v-avatar>
                  </template>
                  <v-list-item-title class="font-weight-medium">
                    {{ booking.court?.name ?? 'Cancha' }}
                  </v-list-item-title>
                  <v-list-item-subtitle>{{ booking.court?.business?.name }}</v-list-item-subtitle>
                </v-list-item>

                <v-divider class="my-2" />

                <v-list-item class="px-0">
                  <template #prepend>
                    <v-avatar color="primary" variant="tonal" rounded="lg" size="36" class="mr-3">
                      <v-icon size="18">mdi-calendar</v-icon>
                    </v-avatar>
                  </template>
                  <v-list-item-title class="font-weight-medium">{{ formattedDate }}</v-list-item-title>
                  <v-list-item-subtitle>Fecha de la reserva</v-list-item-subtitle>
                </v-list-item>

                <v-divider class="my-2" />

                <v-list-item class="px-0">
                  <template #prepend>
                    <v-avatar color="primary" variant="tonal" rounded="lg" size="36" class="mr-3">
                      <v-icon size="18">mdi-clock-outline</v-icon>
                    </v-avatar>
                  </template>
                  <v-list-item-title class="font-weight-medium">
                    {{ booking.startTime?.slice(0, 5) }} – {{ booking.endTime?.slice(0, 5) }}
                  </v-list-item-title>
                  <v-list-item-subtitle>Horario · {{ durationLabel }}</v-list-item-subtitle>
                </v-list-item>

                <v-divider class="my-2" />

                <v-list-item class="px-0">
                  <template #prepend>
                    <v-avatar color="primary" variant="tonal" rounded="lg" size="36" class="mr-3">
                      <v-icon size="18">mdi-cash</v-icon>
                    </v-avatar>
                  </template>
                  <v-list-item-title class="font-weight-medium">
                    {{ booking.paymentMethod === 'nequi' ? 'Nequi' : 'Transferencia Bancaria' }}
                  </v-list-item-title>
                  <v-list-item-subtitle>Método de pago</v-list-item-subtitle>
                </v-list-item>

                <template v-if="booking.notes">
                  <v-divider class="my-2" />
                  <v-list-item class="px-0">
                    <template #prepend>
                      <v-avatar color="primary" variant="tonal" rounded="lg" size="36" class="mr-3">
                        <v-icon size="18">mdi-note-text-outline</v-icon>
                      </v-avatar>
                    </template>
                    <v-list-item-title class="font-weight-medium">{{ booking.notes }}</v-list-item-title>
                    <v-list-item-subtitle>Notas</v-list-item-subtitle>
                  </v-list-item>
                </template>
              </v-list>
            </v-card-text>
          </v-card>

          <!-- Motivo de rechazo -->
          <v-alert
            v-if="booking.status === 'rejected' && booking.rejectionReason"
            type="error"
            variant="tonal"
            rounded="lg"
            class="mb-4"
            border="start"
          >
            <div class="font-weight-bold mb-1">Motivo del rechazo</div>
            <div class="text-body-2">{{ booking.rejectionReason }}</div>
          </v-alert>

          <!-- Comprobante -->
          <v-card v-if="booking.paymentProofUrl" rounded="lg" class="mb-4">
            <v-card-title class="pa-5 pb-3 text-subtitle-1 font-weight-bold">
              <v-icon class="mr-2" color="primary">mdi-image</v-icon>
              Comprobante de Pago
            </v-card-title>
            <v-divider />
            <v-card-text class="pa-5">
              <v-img
                v-if="!isPdfProof"
                :src="booking.paymentProofUrl"
                max-height="280"
                cover
                rounded="lg"
                class="mb-3"
              />
              <v-btn
                :href="booking.paymentProofUrl"
                target="_blank"
                color="primary"
                variant="outlined"
                block
                prepend-icon="mdi-open-in-new"
              >
                {{ isPdfProof ? 'Abrir PDF' : 'Ver en tamaño completo' }}
              </v-btn>
            </v-card-text>
          </v-card>
        </v-col>

        <!-- Panel lateral -->
        <v-col cols="12" md="5">
          <!-- Total pagado -->
          <v-card rounded="lg" color="primary" variant="tonal" class="mb-4">
            <v-card-text class="pa-5 text-center">
              <div class="text-caption text-medium-emphasis font-weight-bold text-uppercase mb-1">
                Total reserva
              </div>
              <div class="text-h4 font-weight-bold text-primary mb-1">
                ${{ Number(booking.totalPrice ?? 0).toLocaleString('es-CO') }}
              </div>
              <div class="text-caption text-medium-emphasis">COP</div>
            </v-card-text>
          </v-card>

          <!-- Metadatos -->
          <v-card rounded="lg" class="mb-4">
            <v-card-text class="pa-5">
              <div class="text-caption text-medium-emphasis font-weight-bold text-uppercase mb-3">
                Información de la reserva
              </div>
              <div class="d-flex justify-space-between text-body-2 mb-2">
                <span class="text-medium-emphasis">ID</span>
                <span class="font-weight-medium text-caption" style="font-family: monospace">
                  {{ booking.id.slice(-8).toUpperCase() }}
                </span>
              </div>
              <div class="d-flex justify-space-between text-body-2 mb-2">
                <span class="text-medium-emphasis">Creada</span>
                <span class="font-weight-medium">{{ createdAtLabel }}</span>
              </div>
              <div class="d-flex justify-space-between text-body-2">
                <span class="text-medium-emphasis">Estado</span>
                <BookingStatusChip :status="booking.status" />
              </div>
            </v-card-text>
          </v-card>

          <!-- Acción cancelar (solo si pending) -->
          <v-card v-if="booking.status === 'pending'" rounded="lg" variant="outlined" class="mb-4">
            <v-card-text class="pa-5">
              <div class="text-caption text-medium-emphasis mb-3">
                Puedes cancelar esta reserva mientras está pendiente.
              </div>
              <v-btn
                color="error"
                variant="tonal"
                block
                prepend-icon="mdi-calendar-remove"
                :loading="cancelling"
                @click="cancelDialog = true"
              >
                Cancelar reserva
              </v-btn>
            </v-card-text>
          </v-card>

          <!-- Nueva reserva -->
          <v-btn
            to="/client/courts"
            color="primary"
            variant="outlined"
            block
            prepend-icon="mdi-plus"
          >
            Hacer otra reserva
          </v-btn>
        </v-col>
      </v-row>
    </template>

    <!-- Dialog confirmar cancelación -->
    <v-dialog v-model="cancelDialog" max-width="420">
      <v-card rounded="xl">
        <v-card-text class="pa-6 text-center">
          <v-icon size="56" color="error" class="mb-4">mdi-calendar-remove</v-icon>
          <h3 class="text-subtitle-1 font-weight-bold mb-2">¿Cancelar esta reserva?</h3>
          <p class="text-body-2 text-medium-emphasis mb-2">
            Estás a punto de cancelar tu reserva en
            <strong>{{ booking?.court?.name }}</strong>
            el <strong>{{ formattedDate }}</strong>.
          </p>
          <p class="text-caption text-error">Esta acción no se puede deshacer.</p>
        </v-card-text>
        <v-card-actions class="pa-4 pt-0">
          <v-spacer />
          <v-btn variant="text" @click="cancelDialog = false">Volver</v-btn>
          <v-btn color="error" variant="flat" :loading="cancelling" @click="confirmCancel">
            Sí, cancelar
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Snackbar -->
    <v-snackbar v-model="snackbar.show" :color="snackbar.color" rounded="lg" timeout="4000">
      {{ snackbar.text }}
    </v-snackbar>
  </div>
</template>

<script setup lang="ts">
/**
 * /client/bookings/[id].vue — Detalle de una reserva individual
 *
 * Es el destino de la redirección tras crear una reserva exitosa en book.vue.
 * Muestra todos los datos de la reserva con su estado actual (principalmente 'pending'
 * justo después de crearla).
 */
definePageMeta({ layout: 'dashboard', middleware: 'auth' })

const route = useRoute()
const router = useRouter()
const { apiFetch } = useApi()
const toast = useToast()

const bookingId = computed(() => route.params.id as string)

// —— Estado ——
const booking = ref<any>(null)
const loading = ref(false)
const error = ref('')
const cancelling = ref(false)
const cancelDialog = ref(false)
const snackbar = reactive({ show: false, text: '', color: 'success' })

// —— Cargar reserva ——
const loadBooking = async () => {
  loading.value = true
  error.value = ''
  try {
    booking.value = await apiFetch<any>(`/bookings/${bookingId.value}`)
  } catch (e: any) {
    const status = e?.status ?? e?.data?.statusCode
    if (status === 403 || status === 404) {
      error.value = 'Esta reserva no existe o no tienes permiso para verla.'
    } else {
      error.value = 'No se pudo cargar la reserva. Intenta de nuevo.'
    }
  } finally {
    loading.value = false
  }
}

onMounted(loadBooking)

// —— Computed visuales ——

const formattedDate = computed(() => {
  if (!booking.value?.date) return ''
  const [y, m, d] = booking.value.date.split('-').map(Number)
  return new Date(y, m - 1, d).toLocaleDateString('es-CO', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
})

const durationLabel = computed(() => {
  if (!booking.value) return ''
  const [sh, sm] = (booking.value.startTime as string).split(':').map(Number)
  const [eh, em] = (booking.value.endTime as string).split(':').map(Number)
  const hours = Math.max(1, (eh * 60 + em - sh * 60 - sm) / 60)
  return hours === 1 ? '1 hora' : `${hours} horas`
})

const createdAtLabel = computed(() => {
  if (!booking.value?.createdAt) return ''
  return new Date(booking.value.createdAt).toLocaleDateString('es-CO', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
})

const isPdfProof = computed(() =>
  booking.value?.paymentProofUrl?.toLowerCase().endsWith('.pdf'),
)

// Hero dinámico según status
type StatusConfig = { heroClass: string; heroIcon: string; heroTitle: string; heroSubtitle: string }

const statusConfigs: Record<string, StatusConfig> = {
  pending: {
    heroClass: 'hero-pending',
    heroIcon: 'mdi-clock-outline',
    heroTitle: '¡Reserva enviada!',
    heroSubtitle: 'Estamos verificando tu comprobante de pago.',
  },
  confirmed: {
    heroClass: 'hero-confirmed',
    heroIcon: 'mdi-check-circle-outline',
    heroTitle: '¡Reserva confirmada!',
    heroSubtitle: 'Tu cancha está reservada. ¡Que disfrutes el partido!',
  },
  rejected: {
    heroClass: 'hero-rejected',
    heroIcon: 'mdi-close-circle-outline',
    heroTitle: 'Reserva rechazada',
    heroSubtitle: 'El negocio rechazó tu reserva. Revisa el motivo.',
  },
  cancelled: {
    heroClass: 'hero-cancelled',
    heroIcon: 'mdi-cancel',
    heroTitle: 'Reserva cancelada',
    heroSubtitle: 'Esta reserva fue cancelada.',
  },
  completed: {
    heroClass: 'hero-confirmed',
    heroIcon: 'mdi-trophy-outline',
    heroTitle: '¡Partido completado!',
    heroSubtitle: 'Esperamos que hayas disfrutado la cancha.',
  },
}

const currentStatusConfig = computed(
  () => statusConfigs[booking.value?.status] ?? statusConfigs.pending,
)
const heroClass = computed(() => currentStatusConfig.value.heroClass)
const heroIcon = computed(() => currentStatusConfig.value.heroIcon)
const heroTitle = computed(() => currentStatusConfig.value.heroTitle)
const heroSubtitle = computed(() => currentStatusConfig.value.heroSubtitle)

// —— Cancelar ——
const confirmCancel = async () => {
  cancelling.value = true
  try {
    await apiFetch(`/bookings/${bookingId.value}`, { method: 'DELETE' })
    booking.value = { ...booking.value, status: 'cancelled' }
    cancelDialog.value = false
    toast.success('Reserva cancelada correctamente.')
    snackbar.text = 'Reserva cancelada.'
    snackbar.color = 'success'
    snackbar.show = true
  } catch (e: any) {
    snackbar.text = e?.data?.message ?? 'Error al cancelar. Intenta de nuevo.'
    snackbar.color = 'error'
    snackbar.show = true
  } finally {
    cancelling.value = false
    cancelDialog.value = false
  }
}
</script>

<style scoped>
.status-hero {
  min-height: 100px;
}
.hero-pending {
  background: linear-gradient(135deg, #f59e0b, #d97706);
}
.hero-confirmed {
  background: linear-gradient(135deg, #10b981, #059669);
}
.hero-rejected {
  background: linear-gradient(135deg, #ef4444, #dc2626);
}
.hero-cancelled {
  background: linear-gradient(135deg, #6b7280, #4b5563);
}
</style>
