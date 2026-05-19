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
              <img v-if="court.images?.[0]" :src="court.images[0]" :alt="court.name" />
              <div v-else class="pay-summary-ph"><span class="mdi mdi-soccer-field" /></div>
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
            <span>Total a pagar</span>
            <strong>${{ Number(pricePerHour + 5000).toLocaleString('es-CO') }}</strong>
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

              <v-btn type="submit" color="primary" block size="large" :loading="flowState === 'submitting'" :disabled="!canSubmit">
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
          <img v-if="court.images?.[0]" :src="court.images[0]" :alt="court.name" />
          <div v-else class="pay-side-ph"><span class="mdi mdi-soccer-field" /></div>
        </div>
        <div class="pay-side-body">
          <h3>{{ court.name }}</h3>
          <p><span class="mdi mdi-map-marker-outline" /> {{ court.business?.address ?? 'Bogotá' }}</p>
          <div class="pay-chip">{{ court.type === 'football_7' ? 'Fútbol 7' : 'Cancha' }}</div>

          <div class="pay-side-row"><span>Fecha</span><strong>{{ route.query.date }}</strong></div>
          <div class="pay-side-row"><span>Hora</span><strong>{{ route.query.startTime }} - {{ route.query.endTime }}</strong></div>

          <div class="pay-side-total">
            <div><span>Precio por hora</span><strong>${{ Number(pricePerHour).toLocaleString('es-CO') }}</strong></div>
            <div><span>Cargos de gestión</span><strong>$5.000</strong></div>
            <hr>
            <div class="is-total"><span>Total a pagar</span><strong>${{ Number(pricePerHour + 5000).toLocaleString('es-CO') }}</strong></div>
          </div>
        </div>
      </aside>
    </div>

    <v-dialog v-model="successDialog" max-width="420" persistent>
      <v-card rounded="xl" class="text-center overflow-hidden">
        <div class="success-header pa-8 pb-6">
          <v-icon size="80" color="white" class="mb-4">mdi-check-circle</v-icon>
          <h2 class="text-h6 font-weight-bold text-white mb-1">¡Reserva Enviada!</h2>
          <p class="text-body-2 text-white" style="opacity: 0.9">Tu reserva está pendiente de confirmación.</p>
        </div>
        <v-card-text class="pa-6">
          <v-btn color="success" variant="flat" block size="large" prepend-icon="mdi-eye" @click="goToBookingDetail">Ver mi reserva</v-btn>
        </v-card-text>
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

const pricePerHour = computed(() => route.query.pricePerHour ? Number(route.query.pricePerHour) : Number(court.value?.pricePerHour ?? 0))
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
  margin-bottom: 16px;
}
.pay-step {
  display: flex; flex-direction: column; align-items: center; gap: 6px;
}
.pay-step span {
  width: 46px; height: 46px; border-radius: 999px;
  display: grid; place-items: center;
  background: #252b33; color: #a5afb9; font-weight: 800;
}
.pay-step small { color: #b0bac5; font-size: 1rem; }
.pay-step.is-active span,
.pay-step.is-done span { background: #69de8e; color: #0c1d14; }
.pay-step.is-active small,
.pay-step.is-done small { color: #6fe58f; font-weight: 700; }

.pay-grid {
  display: grid;
  grid-template-columns: 1.25fr .9fr;
  gap: 16px;
}
.pay-card {
  border: 1px solid rgba(255,255,255,.08);
  border-radius: 22px !important;
  background: #1a2027 !important;
}
.pay-title {
  display: flex; align-items: center; gap: 8px;
  margin-bottom: 8px;
  font-size: clamp(1.15rem, 1.4vw, 1.7rem);
  color: #e8edf3;
}
.pay-sub {
  color: #9aa3ae;
  font-size: .9rem;
  margin-bottom: 14px;
}
.pay-trust {
  margin-top: 10px;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: .78rem;
  color: #8a96a3;
}
.pay-trust .mdi { color: #6ee7b7; font-size: 1rem; }

/* Resumen móvil compacto al tope (visible solo en móvil — ver media query). */
.pay-summary-mobile {
  display: none;
  background: linear-gradient(160deg, rgba(47, 161, 138, 0.12), rgba(26, 32, 39, 0.95));
  border: 1px solid rgba(47, 161, 138, 0.25);
  border-radius: 18px;
  overflow: hidden;
  margin-bottom: 14px;
}
.pay-summary-head { display: flex; gap: 12px; padding: 12px; }
.pay-summary-media {
  width: 88px; height: 88px; flex-shrink: 0;
  border-radius: 12px; overflow: hidden;
}
.pay-summary-media img,
.pay-summary-ph { width: 100%; height: 100%; object-fit: cover; }
.pay-summary-ph {
  display: grid; place-items: center;
  background: linear-gradient(140deg, #1e2b35, #0f141c);
  color: rgba(110, 231, 183, .55);
}
.pay-summary-body { flex: 1; min-width: 0; }
.pay-summary-name {
  font-size: 1rem; font-weight: 800; color: #e8edf3;
  line-height: 1.2;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.pay-summary-place {
  font-size: .78rem; color: #a6b0bc; margin-top: 2px;
  overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
}
.pay-summary-place .mdi { color: #6ee7b7; vertical-align: -1px; }
.pay-summary-meta {
  display: flex; flex-wrap: wrap; gap: 8px 14px;
  margin-top: 8px; font-size: .8rem; color: #c8ced6;
}
.pay-summary-meta .mdi { color: #6ee7b7; vertical-align: -1px; margin-right: 2px; }
.pay-summary-total {
  display: flex; align-items: center; justify-content: space-between;
  padding: 10px 14px;
  background: rgba(15, 20, 26, 0.6);
  border-top: 1px solid rgba(47, 161, 138, 0.25);
}
.pay-summary-total span { color: #adbac6; font-size: .85rem; }
.pay-summary-total strong { color: #63de8b; font-size: 1.15rem; font-weight: 800; }
.pay-table {
  border-radius: 16px;
  border: 1px solid rgba(255,255,255,.06);
  overflow: hidden;
}
.pay-table > div {
  display: flex;
  justify-content: space-between;
  gap: 8px;
  padding: 12px 14px;
  border-bottom: 1px solid rgba(255,255,255,.06);
}
.pay-table > div:last-child { border-bottom: none; }
.pay-table span { color: #aeb8c2; }
.pay-table strong { color: #e7edf2; }

.pay-alert {
  margin-top: 14px;
  border: 1px solid rgba(209, 145, 74, 0.3);
  border-radius: 14px;
  background: rgba(130, 94, 43, 0.15);
  color: #d8cab4;
  padding: 12px;
  display: flex;
  align-items: flex-start;
  gap: 8px;
}
.pay-alert .mdi { font-size: 1.1rem; color: #f0c27a; margin-top: 1px; }

/* (d) ¿Qué pasa después? */
.pay-next .pay-title { margin-bottom: 12px; }
.pay-next-list {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.pay-next-list li {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  color: #c8ced6;
  font-size: .9rem;
  line-height: 1.5;
}
.pay-next-list strong { color: #e7edf3; font-weight: 700; }
.pay-next-step {
  flex-shrink: 0;
  width: 26px; height: 26px;
  border-radius: 50%;
  display: grid; place-items: center;
  background: rgba(47, 161, 138, 0.18);
  color: #6ee7b7;
  font-weight: 800;
  font-size: .82rem;
}

.pay-side {
  border: 1px solid rgba(255,255,255,.08);
  border-radius: 22px;
  overflow: hidden;
  background: #1a2027;
  height: fit-content;
}
.pay-side-media { height: 210px; }
.pay-side-media img,
.pay-side-ph { width: 100%; height: 100%; object-fit: cover; }
.pay-side-ph { display: grid; place-items: center; background: linear-gradient(140deg,#1e2b35,#0f141c); }
.pay-side-body { padding: 16px; }
.pay-side-body h3 { color: #e8edf2; font-size: 1.7rem; font-size: clamp(1.15rem,1.5vw,1.7rem); }
.pay-side-body p { color: #b7c0c8; margin-top: 4px; }
.pay-chip {
  display: inline-block;
  margin-top: 10px;
  border-radius: 999px;
  padding: 5px 12px;
  background: rgba(91, 206, 127, 0.16);
  color: #72e899;
  font-weight: 700;
}
.pay-side-row {
  margin-top: 12px;
  display: flex;
  justify-content: space-between;
  color: #a6b0bc;
}
.pay-side-row strong { color: #e7edf2; }

.pay-side-total {
  margin-top: 14px;
  border-radius: 16px;
  background: #0f141a;
  padding: 14px;
}
.pay-side-total > div {
  display: flex;
  justify-content: space-between;
  margin-bottom: 8px;
  color: #adbac6;
}
.pay-side-total hr { border: none; border-top: 1px solid rgba(255,255,255,.08); margin: 8px 0; }
.pay-side-total .is-total strong { color: #63de8b; font-size: 2rem; font-size: clamp(1.3rem,1.6vw,2rem); }

.success-header { background: linear-gradient(135deg, rgb(var(--v-theme-success)), rgb(var(--v-theme-primary))); }

@media (max-width: 980px) {
  .pay-grid { grid-template-columns: 1fr; }
  /* En móvil mostramos el resumen compacto arriba y ocultamos el aside lateral
     para evitar duplicar la información al final de la página. */
  .pay-summary-mobile { display: block; }
  .pay-side { display: none; }
  .pay-steps { margin-bottom: 10px; }
  .pay-step span { width: 36px; height: 36px; font-size: .9rem; }
  .pay-step small { font-size: .82rem; }
}
</style>
