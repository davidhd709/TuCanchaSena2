<template>
  <div>
    <!-- Botón volver -->
    <v-btn
      :to="`/client/courts/${courtId}`"
      variant="text"
      prepend-icon="mdi-arrow-left"
      class="mb-4 px-0"
    >
      Volver a la cancha
    </v-btn>

    <h1 class="text-h5 font-weight-bold mb-1">Confirmar Reserva</h1>
    <p class="text-body-2 text-medium-emphasis mb-6">
      Completa los datos para reservar tu cancha
    </p>

    <!-- Loading inicial -->
    <div v-if="courtLoading" class="d-flex justify-center py-16">
      <v-progress-circular indeterminate color="primary" size="48" />
    </div>

    <!-- Error al cargar cancha -->
    <v-alert
      v-else-if="courtError"
      type="error"
      variant="tonal"
      rounded="lg"
      class="mb-6"
    >
      {{ courtError }}
      <template #append>
        <v-btn variant="text" @click="loadCourt">Reintentar</v-btn>
      </template>
    </v-alert>

    <v-row v-else>
      <!-- Resumen lateral -->
      <v-col cols="12" md="4" order-md="2">
        <BookingConfirmation
          :court="court"
          :date="(route.query.date as string) ?? ''"
          :start-time="(route.query.startTime as string) ?? ''"
          :end-time="(route.query.endTime as string) ?? ''"
          :price-per-hour="pricePerHour"
          class="mb-4"
        />

        <!-- Indicador de estado del flujo -->
        <v-card rounded="lg" variant="outlined" class="mb-4">
          <v-card-text class="pa-4">
            <div class="text-caption text-medium-emphasis font-weight-bold mb-3 text-uppercase tracking-wider">
              Estado de tu reserva
            </div>
            <div class="d-flex flex-column gap-2">
              <div class="d-flex align-center gap-2">
                <v-icon
                  size="16"
                  :color="flowStep >= 1 ? 'success' : 'grey'"
                >{{ flowStep >= 1 ? 'mdi-check-circle' : 'mdi-circle-outline' }}</v-icon>
                <span class="text-body-2" :class="flowStep >= 1 ? 'text-success' : 'text-medium-emphasis'">
                  Horario seleccionado
                </span>
              </div>
              <div class="d-flex align-center gap-2">
                <v-icon
                  size="16"
                  :color="flowStep >= 2 ? 'success' : 'grey'"
                >{{ flowStep >= 2 ? 'mdi-check-circle' : 'mdi-circle-outline' }}</v-icon>
                <span class="text-body-2" :class="flowStep >= 2 ? 'text-success' : 'text-medium-emphasis'">
                  Método de pago
                </span>
              </div>
              <div class="d-flex align-center gap-2">
                <v-icon
                  size="16"
                  :color="flowStep >= 3 ? 'success' : 'grey'"
                >{{ flowStep >= 3 ? 'mdi-check-circle' : 'mdi-circle-outline' }}</v-icon>
                <span class="text-body-2" :class="flowStep >= 3 ? 'text-success' : 'text-medium-emphasis'">
                  Comprobante cargado
                </span>
              </div>
              <div class="d-flex align-center gap-2">
                <v-icon
                  size="16"
                  :color="flowState === 'submitted' ? 'success' : 'grey'"
                >{{ flowState === 'submitted' ? 'mdi-check-circle' : 'mdi-circle-outline' }}</v-icon>
                <span class="text-body-2" :class="flowState === 'submitted' ? 'text-success' : 'text-medium-emphasis'">
                  Enviada
                </span>
              </div>
            </div>
          </v-card-text>
        </v-card>
      </v-col>

      <!-- Formulario principal -->
      <v-col cols="12" md="8" order-md="1">
        <v-card rounded="lg">
          <v-card-text class="pa-5">
            <v-form ref="formRef" @submit.prevent="submitBooking">

              <!-- PASO 1: Método de pago -->
              <h3 class="text-subtitle-2 font-weight-bold mb-3">
                <v-icon size="16" class="mr-1" color="primary">mdi-credit-card-outline</v-icon>
                Método de Pago
              </h3>
              <v-radio-group
                v-model="form.paymentMethod"
                :rules="[rules.required]"
                class="mb-5"
                @update:model-value="onPaymentMethodChange"
              >
                <v-radio value="nequi" class="mb-2 radio-option rounded-lg pa-2">
                  <template #label>
                    <div class="d-flex align-center gap-3">
                      <v-avatar color="pink-lighten-5" size="36" rounded="lg">
                        <v-icon color="pink">mdi-cellphone</v-icon>
                      </v-avatar>
                      <div>
                        <div class="text-body-2 font-weight-medium">Nequi</div>
                        <div class="text-caption text-medium-emphasis">Pago por aplicación móvil</div>
                      </div>
                    </div>
                  </template>
                </v-radio>
                <v-radio value="transferencia" class="radio-option rounded-lg pa-2">
                  <template #label>
                    <div class="d-flex align-center gap-3">
                      <v-avatar color="blue-lighten-5" size="36" rounded="lg">
                        <v-icon color="blue">mdi-bank-transfer</v-icon>
                      </v-avatar>
                      <div>
                        <div class="text-body-2 font-weight-medium">Transferencia Bancaria</div>
                        <div class="text-caption text-medium-emphasis">Transferencia a cuenta bancaria</div>
                      </div>
                    </div>
                  </template>
                </v-radio>
              </v-radio-group>

              <!-- PASO 2: Comprobante de pago -->
              <BookingPaymentUpload
                v-model="form.paymentProof"
                class="mb-5"
                @upload-state="onUploadStateChange"
              />

              <!-- PASO 3: Notas opcionales -->
              <h3 class="text-subtitle-2 font-weight-bold mb-2">
                <v-icon size="16" class="mr-1" color="primary">mdi-note-text-outline</v-icon>
                Notas adicionales
                <v-chip size="x-small" variant="tonal" class="ml-2">Opcional</v-chip>
              </h3>
              <v-textarea
                v-model="form.notes"
                label="¿Alguna indicación especial?"
                placeholder="Ej: somos 10 jugadores, necesitamos petos..."
                rows="2"
                variant="outlined"
                class="mb-5"
              />

              <!-- Error 409 (slot tomado) — mensaje destacado -->
              <v-alert
                v-if="slotConflictError"
                type="warning"
                variant="tonal"
                rounded="lg"
                class="mb-4"
                border="start"
                closable
                @click:close="slotConflictError = false"
              >
                <div class="font-weight-bold mb-1">¡Horario no disponible!</div>
                <div class="text-body-2">
                  Este horario fue reservado por otra persona mientras completabas el formulario.
                  Por favor, vuelve a la cancha y selecciona otro horario.
                </div>
                <template #append>
                  <v-btn
                    color="warning"
                    variant="flat"
                    size="small"
                    class="mt-2"
                    @click="goBackToCourt"
                  >
                    Elegir otro horario
                  </v-btn>
                </template>
              </v-alert>

              <!-- Error genérico -->
              <v-alert
                v-if="genericError"
                type="error"
                variant="tonal"
                rounded="lg"
                class="mb-4"
                closable
                @click:close="genericError = ''"
              >
                {{ genericError }}
              </v-alert>

              <!-- Botón submit -->
              <v-btn
                type="submit"
                color="primary"
                block
                size="large"
                :loading="flowState === 'submitting'"
                :disabled="!canSubmit"
                prepend-icon="mdi-calendar-check"
              >
                <span v-if="flowState === 'submitting'">Enviando reserva...</span>
                <span v-else>Confirmar Reserva</span>
              </v-btn>

              <p class="text-caption text-medium-emphasis text-center mt-3">
                <v-icon size="12">mdi-information-outline</v-icon>
                Tu reserva quedará en estado <strong>pendiente</strong> hasta que el negocio verifique el comprobante.
              </p>

            </v-form>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <!-- Dialog éxito -->
    <v-dialog v-model="successDialog" max-width="420" persistent>
      <v-card rounded="xl" class="text-center overflow-hidden">
        <div class="success-header pa-8 pb-6">
          <v-icon size="80" color="white" class="mb-4">mdi-check-circle</v-icon>
          <h2 class="text-h6 font-weight-bold text-white mb-1">¡Reserva Enviada!</h2>
          <p class="text-body-2 text-white" style="opacity: 0.9">
            Tu reserva está pendiente de confirmación.
          </p>
        </div>
        <v-card-text class="pa-6">
          <p class="text-body-2 text-medium-emphasis mb-6">
            El negocio verificará tu comprobante de pago y te notificará la confirmación.
          </p>
          <v-btn
            color="success"
            variant="flat"
            block
            size="large"
            prepend-icon="mdi-eye"
            @click="goToBookingDetail"
          >
            Ver mi reserva
          </v-btn>
        </v-card-text>
      </v-card>
    </v-dialog>
  </div>
</template>

<script setup lang="ts">
/**
 * book.vue — Página de confirmación de reserva (Paquete 4 MVP-1)
 *
 * Máquina de estados del flujo:
 *   idle → (usuario completa form) → submitting → submitted
 *
 * El uploadState del comprobante es gestionado por BookingPaymentUpload:
 *   idle → uploading → uploaded | error
 *
 * Manejo de errores:
 *   - 409 (slot tomado): mensaje claro + botón para volver a elegir horario
 *   - otros: mensaje genérico con los datos del formulario preservados
 */

definePageMeta({ layout: 'dashboard', middleware: 'auth' })

type FlowState = 'idle' | 'submitting' | 'submitted'

const route = useRoute()
const router = useRouter()
const courtsStore = useCourtsStore()
const bookingsStore = useBookingsStore()

// —— Parámetros de ruta ——
const courtId = computed(() => route.params.courtId as string)

// Guard: si no vienen los query params esenciales, redirigir a la cancha
onMounted(async () => {
  if (!route.query.date || !route.query.startTime || !route.query.endTime) {
    router.replace(`/client/courts/${courtId.value}`)
    return
  }
  await loadCourt()
})

// —— Estado de la cancha ——
const court = computed(() => courtsStore.currentCourt)
const courtLoading = ref(false)
const courtError = ref('')

const loadCourt = async () => {
  courtLoading.value = true
  courtError.value = ''
  try {
    await courtsStore.fetchCourt(courtId.value)
  } catch {
    courtError.value = 'No se pudo cargar la información de la cancha. Intenta de nuevo.'
  } finally {
    courtLoading.value = false
  }
}

// Precio por hora: puede venir del query param (slot especial) o de la cancha
const pricePerHour = computed(() => {
  if (route.query.pricePerHour) return Number(route.query.pricePerHour)
  return Number(court.value?.pricePerHour ?? 0)
})

// —— Estado del formulario ——
const formRef = ref()
const flowState = ref<FlowState>('idle')
const uploadState = ref<'idle' | 'uploading' | 'uploaded' | 'error'>('idle')
const slotConflictError = ref(false)
const genericError = ref('')
const createdBookingId = ref<string | null>(null)
const successDialog = ref(false)

const form = reactive({
  paymentMethod: '',
  paymentProof: null as File | null,
  notes: '',
})

// —— Computed ——

/** Pasos completados para el indicador lateral */
const flowStep = computed(() => {
  let step = 0
  if (route.query.startTime) step = 1
  if (form.paymentMethod) step = 2
  if (uploadState.value === 'uploaded') step = 3
  return step
})

/** El botón de submit solo está activo cuando todo está listo */
const canSubmit = computed(() =>
  flowState.value === 'idle' &&
  !!form.paymentMethod &&
  uploadState.value === 'uploaded',
)

// —— Handlers ——

const onPaymentMethodChange = () => {
  genericError.value = ''
  slotConflictError.value = false
}

const onUploadStateChange = (state: 'idle' | 'uploading' | 'uploaded' | 'error') => {
  uploadState.value = state
}

const goBackToCourt = () => {
  router.push({
    path: `/client/courts/${courtId.value}`,
    query: { date: route.query.date as string },
  })
}

const goToBookingDetail = () => {
  if (createdBookingId.value) {
    router.push(`/client/bookings/${createdBookingId.value}`)
  } else {
    router.push('/client/bookings')
  }
}

// —— Submit ——

const submitBooking = async () => {
  const { valid } = await formRef.value.validate()
  if (!valid) return
  if (!canSubmit.value) return

  flowState.value = 'submitting'
  genericError.value = ''
  slotConflictError.value = false

  try {
    const booking = await bookingsStore.createBooking({
      courtId: courtId.value,
      date: route.query.date as string,
      startTime: route.query.startTime as string,
      endTime: route.query.endTime as string,
      paymentMethod: form.paymentMethod,
      notes: form.notes || undefined,
      paymentProof: form.paymentProof,
    })

    flowState.value = 'submitted'
    createdBookingId.value = booking.id
    successDialog.value = true

  } catch (e: any) {
    flowState.value = 'idle' // volver a idle para permitir reintentar

    const status = e?.status ?? e?.response?.status ?? e?.data?.statusCode
    if (status === 409) {
      // Slot tomado por otro cliente
      slotConflictError.value = true
    } else {
      // Error genérico — preservar datos del formulario
      genericError.value =
        e?.data?.message ??
        bookingsStore.error ??
        'Ocurrió un error al enviar la reserva. Intenta de nuevo.'
    }
  }
}
</script>

<style scoped>
.radio-option {
  border: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
  transition: border-color 0.2s ease, background-color 0.2s ease;
  margin-bottom: 8px;
}
.radio-option:hover {
  border-color: rgba(var(--v-theme-primary), 0.5);
  background-color: rgba(var(--v-theme-primary), 0.03);
}

.success-header {
  background: linear-gradient(135deg, rgb(var(--v-theme-success)), rgb(var(--v-theme-primary)));
}

.tracking-wider {
  letter-spacing: 0.08em;
}
</style>
