<template>
  <section class="pay-page">
    <div class="pay-steps">
      <div class="pay-step is-done"><span>✓</span><small>Cancha</small></div>
      <div class="pay-step is-active"><span>2</span><small>Pago</small></div>
      <div class="pay-step"><span>3</span><small>Confirmación</small></div>
    </div>

    <div v-if="courtLoading" class="d-flex justify-center py-16"><v-progress-circular indeterminate color="primary" size="48" /></div>
    <v-alert v-else-if="courtError" type="error" variant="tonal" rounded="lg" class="mb-6">{{ courtError }}</v-alert>

    <div v-else class="pay-grid">
      <div>
        <v-card class="pay-card mb-4">
          <v-card-text class="pa-6">
            <h2 class="pay-title"><v-icon icon="mdi-bank-outline" color="primary" /> Instrucciones de Transferencia</h2>
            <div class="pay-table">
              <div><span>Banco</span><strong>Banco Premium Sports</strong></div>
              <div><span>Tipo de Cuenta</span><strong>Cuenta Corriente</strong></div>
              <div><span>Número de Cuenta</span><strong>1234-5678-9012</strong></div>
              <div><span>RUT / ID</span><strong>76.543.210-K</strong></div>
              <div><span>Titular</span><strong>TuCancha Sports Ltda.</strong></div>
            </div>
            <div class="pay-alert">Tu reserva quedará pendiente mientras se valida el pago. El propietario tiene <strong>30 minutos</strong> para confirmarla.</div>
          </v-card-text>
        </v-card>

        <v-card class="pay-card">
          <v-card-text class="pa-6">
            <h2 class="pay-title"><v-icon icon="mdi-file-upload-outline" color="primary" /> Comprobante de Pago</h2>
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

              <v-btn type="submit" color="primary" block size="large" :loading="flowState === 'submitting'" :disabled="!canSubmit">Enviar Comprobante</v-btn>
            </v-form>
          </v-card-text>
        </v-card>
      </div>

      <aside class="pay-side" v-if="court">
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
  margin-bottom: 14px;
  font-size: clamp(1.2rem, 1.5vw, 1.9rem);
  color: #e8edf3;
}
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
}
</style>
