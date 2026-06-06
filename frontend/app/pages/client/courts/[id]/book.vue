<template>
  <section class="pay-page">
    <div class="pay-steps" aria-label="Pasos de la reserva">
      <div class="pay-step is-done"><span>✓</span><small>Cancha</small></div>
      <div class="pay-step is-active"><span>2</span><small>Pago</small></div>
      <div class="pay-step"><span>3</span><small>Confirmación</small></div>
    </div>

    <div v-if="courtLoading" class="d-flex justify-center py-16"><v-progress-circular indeterminate color="primary" size="48" /></div>
    <v-alert v-else-if="courtError" type="error" variant="tonal" rounded="lg" class="mb-6">{{ courtError }}</v-alert>

    <div v-else class="pay-grid">
      <div class="pay-main">
        <!-- (a) Resumen de la reserva — visible arriba en móvil; en desktop sigue en el aside lateral. -->
        <section class="pay-summary-mobile" v-if="court" aria-labelledby="pay-summary-title">
          <div class="pay-summary-head">
            <div class="pay-summary-media">
              <img v-if="cleanCover" :src="cleanCover" :alt="court.name" />
              <AppMediaPlaceholder v-else dense class="pay-summary-ph" />
            </div>
            <div class="pay-summary-body">
              <h2 id="pay-summary-title" class="pay-summary-name">{{ court.name }}</h2>
              <p class="pay-summary-place">
                <span class="mdi mdi-map-marker-outline" />
                {{ court.business?.address ?? 'Bogotá' }}
              </p>
              <div class="pay-summary-meta">
                <span><span class="mdi mdi-calendar-blank-outline" /> {{ route.query.date }}</span>
                <span><span class="mdi mdi-clock-outline" /> {{ route.query.startTime }} – {{ route.query.endTime }}</span>
              </div>
            </div>
          </div>
          <div class="pay-summary-total">
            <span>Total a pagar · {{ durationHours }} hora{{ durationHours === 1 ? '' : 's' }}</span>
            <strong>{{ formatCurrency(totalToPay) }}</strong>
          </div>
        </section>

        <!-- (b) Datos para transferir -->
        <v-card class="pay-card mb-4">
          <v-card-text class="pa-6">
            <h2 class="pay-title">
              <v-icon icon="mdi-bank-outline" color="primary" />
              Datos para transferir
            </h2>
            <p class="pay-sub">Realiza la transferencia con estos datos y sube tu comprobante abajo.</p>
            <div class="pay-table">
              <div><span>Banco</span><strong>Banco Premium Sports</strong></div>
              <div><span>Tipo de Cuenta</span><strong>Cuenta Corriente</strong></div>
              <div><span>Número de Cuenta</span><strong>1234-5678-9012</strong></div>
              <div><span>RUT / ID</span><strong>76.543.210-K</strong></div>
              <div><span>Titular</span><strong>TuCancha Sports Ltda.</strong></div>
            </div>
            <div class="pay-alert">
              <span class="mdi mdi-timer-sand" />
              Tu reserva queda pendiente mientras se valida el pago. El propietario tiene <strong>30 minutos</strong> para confirmar.
            </div>
          </v-card-text>
        </v-card>

        <!-- (c) Subir comprobante -->
        <v-card class="pay-card">
          <v-card-text class="pa-6">
            <h2 class="pay-title">
              <v-icon icon="mdi-file-upload-outline" color="primary" />
              Subir comprobante
            </h2>
            <p class="pay-sub">Acepta imágenes (JPG, PNG) o PDF.</p>
            <v-form ref="formRef" @submit.prevent="submitBooking">
              <BookingPaymentUpload v-model="form.paymentProof" class="mb-4" @upload-state="onUploadStateChange" />

              <v-radio-group v-model="form.paymentMethod" :rules="[rules.required]" class="mb-2" @update:model-value="onPaymentMethodChange">
                <v-radio value="transferencia" label="Transferencia bancaria" />
                <v-radio value="nequi" label="Nequi" />
              </v-radio-group>

              <v-textarea v-model="form.notes" label="Notas adicionales" placeholder="Opcional" rows="2" class="mb-3" />

              <v-alert v-if="slotConflictError" type="warning" variant="tonal" rounded="lg" class="mb-3">
                Ese horario ya no está disponible. Elige otro horario.
                <template #append><v-btn color="warning" variant="flat" size="small" @click="goBackToCourt">Elegir horario</v-btn></template>
              </v-alert>

              <v-alert v-if="genericError" type="error" variant="tonal" rounded="lg" class="mb-3">{{ genericError }}</v-alert>

              <!-- Bloque de confianza destacado, justo antes del CTA. -->
              <aside class="pay-trust-card" aria-label="Garantías de tu reserva">
                <h3 class="pay-trust-title">
                  <span class="mdi mdi-shield-check-outline" />
                  Tu reserva está protegida
                </h3>
                <ul class="pay-trust-list">
                  <li>
                    <span class="mdi mdi-check-circle" />
                    Tu comprobante será revisado por el negocio.
                  </li>
                  <li>
                    <span class="mdi mdi-check-circle" />
                    La reserva queda pendiente mientras se valida el pago.
                  </li>
                  <li>
                    <span class="mdi mdi-check-circle" />
                    Si el pago no es aprobado, el horario se libera automáticamente.
                  </li>
                  <li>
                    <span class="mdi mdi-check-circle" />
                    Conserva tu comprobante hasta la confirmación.
                  </li>
                </ul>
              </aside>

              <v-btn type="submit" color="primary" block size="large" data-testid="submit-booking" :loading="flowState === 'submitting'" :disabled="!canSubmit">
                Enviar comprobante
              </v-btn>
              <p class="pay-trust">
                <span class="mdi mdi-lock-outline" />
                Tu comprobante se envía de forma segura al negocio.
              </p>
            </v-form>
          </v-card-text>
        </v-card>

        <!-- (d) Qué pasa después -->
        <v-card class="pay-card pay-next mt-4">
          <v-card-text class="pa-6">
            <h2 class="pay-title">
              <v-icon icon="mdi-information-outline" color="primary" />
              ¿Qué pasa después?
            </h2>
            <ol class="pay-next-list">
              <li>
                <span class="pay-next-step">1</span>
                <span><strong>Revisión del comprobante.</strong> Tu comprobante será revisado por el negocio.</span>
              </li>
              <li>
                <span class="pay-next-step">2</span>
                <span><strong>Reserva pendiente.</strong> La reserva queda pendiente hasta la confirmación del pago.</span>
              </li>
              <li>
                <span class="pay-next-step">3</span>
                <span><strong>Si el pago no es aprobado,</strong> el horario será liberado y podrás intentar de nuevo.</span>
              </li>
            </ol>
          </v-card-text>
        </v-card>
      </div>

      <!-- Aside lateral (desktop). En móvil queda oculto porque el resumen está arriba. -->
      <aside class="pay-side" v-if="court" aria-hidden="false">
        <div class="pay-side-media">
          <img v-if="cleanCover" :src="cleanCover" :alt="court.name" />
          <AppMediaPlaceholder v-else label="Imagen de cancha" class="pay-side-ph" />
        </div>
        <div class="pay-side-body">
          <h3>{{ court.name }}</h3>
          <p><span class="mdi mdi-map-marker-outline" /> {{ court.business?.address ?? 'Bogotá' }}</p>
          <div class="pay-chip">{{ court.type === 'football_7' ? 'Fútbol 7' : 'Cancha' }}</div>

          <div class="pay-side-row"><span>Fecha</span><strong>{{ route.query.date }}</strong></div>
          <div class="pay-side-row"><span>Hora</span><strong>{{ route.query.startTime }} - {{ route.query.endTime }}</strong></div>

          <div class="pay-side-total">
            <div><span>Precio por hora</span><strong>{{ formatCurrency(pricePerHour) }}</strong></div>
            <div><span>{{ durationHours }} hora{{ durationHours === 1 ? '' : 's' }}</span><strong>{{ formatCurrency(subtotal) }}</strong></div>
            <div><span>Cargos de gestión</span><strong>{{ formatCurrency(MANAGEMENT_FEE) }}</strong></div>
            <hr>
            <div class="is-total"><span>Total a pagar</span><strong>{{ formatCurrency(totalToPay) }}</strong></div>
          </div>
        </div>
      </aside>
    </div>

    <v-dialog v-model="successDialog" max-width="420" persistent>
      <v-card rounded="xl" class="success-dialog-card text-center overflow-hidden" data-testid="booking-success">
        <div class="success-header pa-8 pb-6">
          <div class="success-icon-wrapper mb-4">
            <span class="success-sparkle s1">✦</span>
            <span class="success-sparkle s2">•</span>
            <span class="success-sparkle s3">✦</span>
            <span class="success-sparkle s4">•</span>
            <v-icon size="64" color="success" class="success-check-icon">mdi-check-circle</v-icon>
          </div>
          <h2 class="text-h5 font-weight-bold text-white mb-2">¡Reserva Enviada!</h2>
          <p class="text-body-1 text-white" style="opacity: 0.9">Tu reserva está pendiente de confirmación.</p>
          <v-btn
            variant="outlined"
            block
            size="large"
            prepend-icon="mdi-eye"
            class="success-btn mt-6"
            data-testid="view-booking"
            @click="goToBookingDetail"
          >
            Ver mi reserva
          </v-btn>
        </div>
      </v-card>
    </v-dialog>
  </section>
</template>

<script setup lang="ts">
definePageMeta({ layout: 'client', middleware: 'auth' })

type FlowState = 'idle' | 'submitting' | 'submitted'
const route = useRoute()
const router = useRouter()
const courtsStore = useCourtsStore()
const bookingsStore = useBookingsStore()
const courtId = computed(() => route.params.id as string)

onMounted(async () => {
  if (!route.query.date || !route.query.startTime || !route.query.endTime) {
    router.replace(`/client/courts/${courtId.value}`)
    return
  }
  await loadCourt()
})

const court = computed(() => courtsStore.currentCourt)
const courtLoading = ref(false)
const courtError = ref('')
const loadCourt = async () => {
  courtLoading.value = true
  courtError.value = ''
  try { await courtsStore.fetchCourt(courtId.value) }
  catch { courtError.value = 'No se pudo cargar la cancha.' }
  finally { courtLoading.value = false }
}

// Horas reservadas = duración del span (endTime − startTime). El backend cobra
// `hours × pricePerHour` (ver bookings.service), así que replicamos esa fórmula
// para que el total mostrado coincida con el cobro real cuando se eligen varias horas.
const durationHours = computed(() => {
  const s = route.query.startTime as string | undefined
  const e = route.query.endTime as string | undefined
  if (!s || !e) return 1
  const [sh, sm] = s.split(':').map(Number)
  const [eh, em] = e.split(':').map(Number)
  const h = ((eh ?? 0) * 60 + (em ?? 0) - (sh ?? 0) * 60 - (sm ?? 0)) / 60
  return h > 0 ? h : 1
})

const subtotal = computed(() => {
  if (route.query.totalPrice) return Number(route.query.totalPrice)
  const basePrice = route.query.pricePerHour ? Number(route.query.pricePerHour) : Number(court.value?.pricePerHour ?? 0)
  return basePrice * durationHours.value
})

const pricePerHour = computed(() => {
  if (route.query.totalPrice) return subtotal.value / durationHours.value
  return route.query.pricePerHour ? Number(route.query.pricePerHour) : Number(court.value?.pricePerHour ?? 0)
})

const MANAGEMENT_FEE = 5000
const totalToPay = computed(() => subtotal.value + MANAGEMENT_FEE)

const cleanCover = computed(() => safeCover(court.value?.images?.[0]))
const formRef = ref()
const flowState = ref<FlowState>('idle')
const uploadState = ref<'idle' | 'uploading' | 'uploaded' | 'error'>('idle')
const slotConflictError = ref(false)
const genericError = ref('')
const createdBookingId = ref<string | null>(null)
const successDialog = ref(false)

const form = reactive({ paymentMethod: 'transferencia', paymentProof: null as File | null, notes: '' })
const rules = { required: (v: any) => (!!v) || 'Requerido' }

const canSubmit = computed(() => flowState.value === 'idle' && !!form.paymentMethod && uploadState.value === 'uploaded')
const onPaymentMethodChange = () => { genericError.value = ''; slotConflictError.value = false }
const onUploadStateChange = (state: 'idle' | 'uploading' | 'uploaded' | 'error') => { uploadState.value = state }
const goBackToCourt = () => router.push({ path: `/client/courts/${courtId.value}`, query: { date: route.query.date as string } })
const goToBookingDetail = () => createdBookingId.value ? router.push(`/client/bookings/${createdBookingId.value}`) : router.push('/client/bookings')

const submitBooking = async () => {
  const { valid } = await formRef.value.validate()
  if (!valid || !canSubmit.value) return
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
    flowState.value = 'idle'
    const status = e?.status ?? e?.response?.status ?? e?.data?.statusCode
    if (status === 409) slotConflictError.value = true
    else genericError.value = e?.data?.message ?? bookingsStore.error ?? 'Error al enviar la reserva.'
  }
}
</script>

<style scoped>
.pay-steps {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 10px;
  margin-bottom: 20px;
}
.pay-step { display: flex; flex-direction: column; align-items: center; gap: 6px; }
.pay-step span {
  width: 44px; height: 44px; border-radius: 999px;
  display: grid; place-items: center;
  background: var(--bg-subtle); color: var(--text-muted); font-weight: 800;
}
.pay-step small { color: var(--text-muted); font-size: .85rem; font-weight: 600; }
.pay-step.is-active span,
.pay-step.is-done span {
  background: linear-gradient(135deg, var(--green-bright), var(--green-primary));
  color: #04170f;
}
.pay-step.is-active small,
.pay-step.is-done small { color: var(--green-primary); font-weight: 800; }

.pay-grid {
  display: grid;
  grid-template-columns: 1.25fr .9fr;
  gap: 24px;
}
.pay-card {
  border: 1px solid var(--border-soft) !important;
  border-radius: 18px !important;
  background: var(--bg-card) !important;
  box-shadow: var(--shadow-sm) !important;
  margin-bottom: 16px;
}
.pay-card .v-card-text,
.pay-card > .pa-6 {
  padding: 28px 24px !important;
}
.pay-title {
  display: flex; align-items: center; gap: 8px;
  margin-bottom: 6px;
  font-family: 'Manrope', sans-serif;
  font-size: clamp(1.05rem, 1.4vw, 1.35rem);
  font-weight: 800;
  color: var(--text-primary);
}
.pay-sub {
  color: var(--text-muted);
  font-size: .9rem;
  margin-bottom: 16px;
}
.pay-trust {
  margin-top: 10px;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: .78rem;
  color: var(--text-muted);
}
.pay-trust .mdi { color: var(--green-primary); font-size: 1rem; }

/* Card de confianza prominente antes del CTA (dark premium). */
.pay-trust-card {
  margin: 0 0 16px;
  padding: 16px;
  border-radius: var(--radius-md);
  background: linear-gradient(135deg, rgba(52, 198, 146, 0.10), var(--bg-elev));
  border: 1px solid rgba(52, 198, 146, 0.28);
}
.pay-trust-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: .98rem;
  font-weight: 800;
  color: var(--text-primary);
  margin: 0 0 10px;
}
.pay-trust-title .mdi { color: var(--green-primary); font-size: 1.3rem; }
.pay-trust-list { list-style: none; padding: 0; margin: 0; display: flex; flex-direction: column; gap: 8px; }
.pay-trust-list li {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  color: var(--text-secondary);
  font-size: .88rem;
  line-height: 1.45;
}
.pay-trust-list .mdi {
  flex-shrink: 0;
  color: var(--green-bright);
  font-size: 1.1rem;
  margin-top: 1px;
}

/* Resumen móvil compacto al tope (visible solo en móvil — ver media query). */
.pay-summary-mobile {
  display: none;
  background: var(--bg-card);
  border: 1px solid var(--border-soft);
  border-radius: 16px;
  box-shadow: var(--shadow-sm);
  overflow: hidden;
  margin-bottom: 16px;
}
.pay-summary-head { display: flex; gap: 12px; padding: 12px; }
.pay-summary-media {
  width: 88px; height: 88px; flex-shrink: 0;
  border-radius: 12px; overflow: hidden;
}
.pay-summary-media img { width: 100%; height: 100%; object-fit: cover; }
/* Contenedor del placeholder; el visual lo provee AppMediaPlaceholder. */
.pay-summary-ph { width: 100%; height: 100%; }
.pay-summary-body { flex: 1; min-width: 0; }
.pay-summary-name {
  font-size: 1rem; font-weight: 800; color: var(--text-primary);
  line-height: 1.2;
  overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
}
.pay-summary-place {
  font-size: .78rem; color: var(--text-muted); margin-top: 2px;
  overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
}
.pay-summary-place .mdi { color: var(--green-primary); vertical-align: -1px; }
.pay-summary-meta {
  display: flex; flex-wrap: wrap; gap: 8px 14px;
  margin-top: 8px; font-size: .8rem; color: var(--text-muted);
}
.pay-summary-meta .mdi { color: var(--green-primary); vertical-align: -1px; margin-right: 2px; }
.pay-summary-total {
  display: flex; align-items: center; justify-content: space-between;
  padding: 12px 14px;
  background: var(--green-soft);
  border-top: 1px solid var(--border-soft);
}
.pay-summary-total span { color: var(--text-muted); font-size: .85rem; }
.pay-summary-total strong { color: var(--green-bright); font-size: 1.2rem; font-weight: 800; }

.pay-table {
  border-radius: 12px;
  border: 1px solid var(--border-soft);
  overflow: hidden;
  background: var(--bg-subtle);
}
.pay-table > div {
  display: flex;
  justify-content: space-between;
  gap: 8px;
  padding: 11px 14px;
  border-bottom: 1px solid var(--border-soft);
}
.pay-table > div:last-child { border-bottom: none; }
.pay-table span { color: var(--text-muted); font-size: .88rem; }
.pay-table strong { color: var(--text-primary); font-size: .9rem; }

.pay-alert {
  margin-top: 14px;
  border: 1px solid rgba(245, 158, 11, 0.32);
  border-radius: var(--radius-md);
  background: var(--accent-warning-soft);
  color: #f5d28a;
  padding: 12px;
  display: flex;
  align-items: flex-start;
  gap: 8px;
  font-size: .86rem;
}
.pay-alert .mdi { font-size: 1.1rem; color: var(--accent-warning); margin-top: 1px; }
.pay-alert strong { color: #ffd99a; }

/* (d) ¿Qué pasa después? */
.pay-next .pay-title { margin-bottom: 12px; }
.pay-next-list { list-style: none; padding: 0; margin: 0; display: flex; flex-direction: column; gap: 12px; }
.pay-next-list li {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  color: var(--text-primary);
  font-size: .9rem;
  line-height: 1.5;
}
.pay-next-list strong { color: var(--text-primary); font-weight: 800; }
.pay-next-step {
  flex-shrink: 0;
  width: 26px; height: 26px;
  border-radius: 50%;
  display: grid; place-items: center;
  background: var(--green-soft);
  color: var(--green-primary);
  font-weight: 800;
  font-size: .82rem;
}

.pay-side {
  border: 1px solid var(--border-soft);
  border-radius: 18px;
  overflow: hidden;
  background: var(--bg-card);
  box-shadow: var(--shadow-sm);
  height: fit-content;
  position: sticky;
  top: 88px;
}
.pay-side-media { height: 200px; }
.pay-side-media img { width: 100%; height: 100%; object-fit: cover; }
/* Contenedor del placeholder; el visual lo provee AppMediaPlaceholder. */
.pay-side-ph { width: 100%; height: 100%; }
.pay-side-body { padding: 18px; }
.pay-side-body h3 { color: var(--text-primary); font-size: 1.15rem; font-weight: 800; line-height: 1.25; }
.pay-side-body p { color: var(--text-muted); margin-top: 4px; font-size: .85rem; }
.pay-chip {
  display: inline-block;
  margin-top: 10px;
  border-radius: var(--radius-pill);
  padding: 4px 12px;
  background: var(--green-soft);
  color: var(--green-bright);
  font-size: .78rem;
  font-weight: 700;
}
.pay-side-row {
  margin-top: 12px;
  display: flex;
  justify-content: space-between;
  color: var(--text-muted);
  font-size: .88rem;
}
.pay-side-row strong { color: var(--text-primary); font-weight: 700; }

.pay-side-total {
  margin-top: 14px;
  border-radius: 12px;
  background: var(--bg-subtle);
  padding: 14px;
}
.pay-side-total > div {
  display: flex;
  justify-content: space-between;
  margin-bottom: 8px;
  color: var(--text-muted);
  font-size: .85rem;
}
.pay-side-total hr { border: none; border-top: 1px solid var(--border-soft); margin: 10px 0; }
.pay-side-total .is-total strong {
  color: var(--green-primary);
  font-size: clamp(1.2rem, 1.6vw, 1.6rem);
  font-weight: 800;
}

.success-header {
  background: linear-gradient(135deg, var(--green-bright), var(--green-primary));
  padding: 48px 32px 40px !important;
}
.success-dialog-card {
  background: transparent !important;
  box-shadow: none !important;
}
.success-icon-wrapper {
  position: relative;
  width: 96px;
  height: 96px;
  margin: 0 auto;
  display: flex;
  align-items: center;
  justify-content: center;
}
.success-check-icon {
  background: rgba(255,255,255,0.95);
  border-radius: 50%;
  padding: 12px;
  box-shadow: 0 4px 24px rgba(0,0,0,0.12);
}
.success-sparkle {
  position: absolute;
  color: rgba(255,255,255,0.8);
  font-size: 1.1rem;
  font-weight: 900;
}
.success-sparkle.s1 { top: -4px; left: 4px; font-size: 1.3rem; }
.success-sparkle.s2 { top: 8px; right: 0; font-size: 0.6rem; }
.success-sparkle.s3 { bottom: 0; right: 4px; font-size: 1rem; }
.success-sparkle.s4 { bottom: 8px; left: 0; font-size: 0.55rem; }
.success-btn {
  border-color: rgba(255,255,255,0.6) !important;
  color: white !important;
  border-radius: 50px !important;
}

@media (max-width: 980px) {
  .pay-grid { grid-template-columns: 1fr; }
  .pay-summary-mobile { display: block; }
  .pay-side { display: none; }
  .pay-steps { margin-bottom: 10px; }
  .pay-step span { width: 36px; height: 36px; font-size: .85rem; }
  .pay-step small { font-size: .75rem; }
}

.booking-upload-preview {
  width: 100%;
  aspect-ratio: 16/9;
  object-fit: cover;
  border-radius: var(--radius-md);
  display: block;
}
.upload-file-info {
  margin-top: 12px;
  font-size: .85rem;
  color: var(--text-muted);
  text-align: center;
}
.upload-actions {
  display: flex;
  justify-content: center;
  gap: 12px;
  margin-top: 14px;
}
.upload-actions .v-btn {
  min-width: 110px !important;
  font-size: .88rem !important;
}

.pay-next {
  margin-top: 8px;
}

/* Botones con más padding interno */
.v-btn {
  padding-left: 20px !important;
  padding-right: 20px !important;
  letter-spacing: 0.01em;
}

/* Empty state — margen superior */
.empty-state {
  padding-top: 32px;
  padding-bottom: 32px;
}
</style>
