<template>
  <div class="login-card">
    <!-- ─── Login Card ──────────────────────────────────── -->

    <!-- Header -->
    <div class="card-header">
      <h1 class="card-title">Bienvenido de vuelta</h1>
      <p class="card-subtitle">Inicia sesión para reservar tu cancha</p>
    </div>

    <!-- Error alert -->
    <div v-if="errorMsg" class="error-alert">
      <span class="mdi mdi-alert-circle-outline"></span>
      {{ errorMsg }}
      <button class="alert-close" @click="errorMsg = ''" aria-label="Cerrar">
        <span class="mdi mdi-close"></span>
      </button>
    </div>

    <!-- Form -->
    <v-form ref="formRef" @submit.prevent="handleLogin" class="auth-form">

      <!-- Email -->
      <div class="field-group">
        <label class="field-label" for="login-email">Correo electrónico</label>
        <v-text-field
          id="login-email"
          v-model="form.email"
          type="email"
          placeholder="tu@correo.com"
          :rules="[rules.required, rules.email]"
          prepend-inner-icon="mdi-email-outline"
          variant="outlined"
          density="comfortable"
          hide-details="auto"
          class="auth-input"
        />
      </div>

      <!-- Password -->
      <div class="field-group">
        <label class="field-label" for="login-password">Contraseña</label>
        <v-text-field
          id="login-password"
          v-model="form.password"
          :type="showPassword ? 'text' : 'password'"
          placeholder="••••••••"
          :rules="[rules.required]"
          prepend-inner-icon="mdi-lock-outline"
          :append-inner-icon="showPassword ? 'mdi-eye-off-outline' : 'mdi-eye-outline'"
          @click:append-inner="showPassword = !showPassword"
          variant="outlined"
          density="comfortable"
          hide-details="auto"
          class="auth-input"
        />
      </div>

      <!-- Forgot password link -->
      <div class="forgot-row">
        <a href="#" class="forgot-link">¿Olvidaste tu contraseña?</a>
      </div>

      <!-- Submit -->
      <button
        type="submit"
        class="submit-btn"
        :disabled="loading"
        id="login-submit"
        data-testid="login-submit"
      >
        <span v-if="!loading">
          <span class="mdi mdi-login"></span>&nbsp;Iniciar Sesión
        </span>
        <span v-else class="loading-spinner">
          <span class="mdi mdi-loading mdi-spin"></span>&nbsp;Verificando...
        </span>
      </button>
    </v-form>

    <!-- Divider -->
    <div class="divider">
      <span class="divider-line"></span>
      <span class="divider-text">¿No tienes cuenta?</span>
      <span class="divider-line"></span>
    </div>

    <!-- Register link -->
    <NuxtLink
      :to="{ path: '/auth/register', query: { redirect: route.query.redirect } }"
      class="register-link"
      id="go-register"
    >
      Crear cuenta gratis
    </NuxtLink>

  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: 'auth' })

const authStore = useAuthStore()
const router = useRouter()
const route = useRoute()

const formRef = ref()
const loading = ref(false)
const errorMsg = ref('')
const showPassword = ref(false)

const form = reactive({
  email: '',
  password: '',
})

const rules = {
  required: (v: string) => !!v || 'Este campo es requerido',
  email: (v: string) => /.+@.+\..+/.test(v) || 'Email inválido',
}

const handleLogin = async () => {
  const { valid } = await formRef.value.validate()
  if (!valid) return

  loading.value = true
  errorMsg.value = ''

  try {
    await authStore.login(form.email, form.password)
    // Vuelve al destino guardado (ej. la cancha que el usuario quería reservar).
    router.push(safeRedirectPath(route.query.redirect))
  } catch (err: any) {
    errorMsg.value = err?.data?.message || 'Credenciales inválidas'
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  authStore.hydrate()
  if (authStore.isAuthenticated) {
    router.push(safeRedirectPath(route.query.redirect))
    return
  }

  // Verificar si viene por sesión expirada
  if (route.query.reason === 'session_expired') {
    const toast = useToast()
    toast.warning('Tu sesión expiró. Por favor inicia sesión nuevamente.')
  }
})
</script>

<style scoped>
/* ─── Card shell ────────────────────────────────────── */
.login-card {
  width: 100%;
  background: var(--bg-card);
  backdrop-filter: blur(24px);
  -webkit-backdrop-filter: blur(24px);
  border: 1px solid var(--border-medium);
  border-radius: var(--radius-xl);
  padding: 36px 32px 28px;
  box-shadow: var(--shadow-lg);
  font-family: 'Manrope', sans-serif;
  animation: cardAppear 0.5s cubic-bezier(.22, 1, .36, 1) both;
  animation-delay: 0.1s;
}

/* ─── Header ────────────────────────────────────────── */
.card-header {
  margin-bottom: 24px;
  text-align: center;
}
.card-title {
  font-size: 1.55rem;
  font-weight: 800;
  color: var(--text-primary);
  margin-bottom: 6px;
  letter-spacing: -0.4px;
  line-height: 1.2;
}
.card-subtitle {
  font-size: 0.84rem;
  color: #64748b;
  opacity: 0.85;
}

/* ─── Error alert ───────────────────────────────────── */
.error-alert {
  display: flex;
  align-items: center;
  gap: 8px;
  background: rgba(239,68,68,0.12);
  border: 1px solid rgba(239,68,68,0.25);
  border-radius: 10px;
  color: #fca5a5;
  font-size: 0.83rem;
  padding: 10px 14px;
  margin-bottom: 20px;
}
.alert-close {
  margin-left: auto;
  background: none;
  border: none;
  color: #fca5a5;
  cursor: pointer;
  font-size: 1rem;
  display: flex;
  align-items: center;
  opacity: 0.7;
  transition: opacity 0.2s;
}
.alert-close:hover { opacity: 1; }

/* ─── Form ──────────────────────────────────────────── */
.auth-form {
  display: flex;
  flex-direction: column;
  gap: 18px;
}

.field-group {
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.field-label {
  font-size: 0.78rem;
  font-weight: 600;
  color: #94a3b8;
  letter-spacing: 0.4px;
  text-transform: uppercase;
}

.auth-input {
  margin-bottom: 0 !important;
}

/* Override Vuetify input internals */
:deep(.auth-input .v-field__input) {
  font-family: 'Manrope', sans-serif !important;
  font-size: 0.9rem !important;
  color: var(--text-primary) !important;
  min-height: 44px !important;
}
/* Forzar reset del input interno (evita doble borde de Tailwind u otros frameworks) */
:deep(.auth-input input),
:deep(.auth-input input:focus),
:deep(.auth-input input:active) {
  outline: none !important;
  box-shadow: none !important;
  border: none !important;
  --tw-ring-shadow: 0 0 transparent !important;
}
:deep(.auth-input .v-field__input::placeholder) { color: #64748b !important; opacity: 1 !important; }
:deep(.auth-input .v-field) {
  background: linear-gradient(180deg, rgba(28, 35, 45, .72), rgba(22, 27, 35, .72)) !important;
  border: 1px solid rgba(47, 161, 138, 0.3) !important;
  border-radius: 10px !important;
  box-shadow: none !important;
  outline: none !important;
  transition: border-color 0.25s ease, box-shadow 0.25s ease, background 0.25s ease !important;
}
:deep(.auth-input .v-field--focused) {
  border-color: var(--green-bright) !important;
  box-shadow: 0 0 0 3px rgba(47, 161, 138, 0.15) !important;
  background: linear-gradient(180deg, rgba(32, 40, 52, .82), rgba(26, 32, 42, .82)) !important;
}
:deep(.auth-input .v-field:hover:not(.v-field--focused)) {
  border-color: rgba(47, 161, 138, 0.6) !important;
}
/* Ocultamos el outline duplicado nativo de Vuetify */
:deep(.auth-input .v-field__outline) {
  display: none !important;
}
:deep(.auth-input .v-field__prepend-inner .v-icon),
:deep(.auth-input .v-field__append-inner .v-icon) {
  color: #64748b !important;
}
:deep(.auth-input .v-field--focused .v-field__prepend-inner .v-icon),
:deep(.auth-input .v-field--focused .v-field__append-inner .v-icon) {
  color: var(--green-bright) !important;
}
:deep(.auth-input .v-messages) {
  font-family: 'Manrope', sans-serif !important;
  font-size: 0.75rem !important;
  color: #f87171 !important;
  min-height: 16px;
}

/* ─── Forgot row ────────────────────────────────────── */
.forgot-row {
  display: flex;
  justify-content: flex-end;
  margin-top: -8px;
}
.forgot-link {
  font-size: 0.78rem;
  color: #94a3b8;
  text-decoration: none;
  transition: color 0.2s;
}
.forgot-link:hover { color: var(--green-bright); }

/* ─── Submit button ─────────────────────────────────── */
.submit-btn {
  width: 100%;
  padding: 15px;
  background: linear-gradient(135deg, var(--green-bright), var(--green-dark));
  color: #fff;
  font-family: 'Manrope', sans-serif;
  font-size: 0.95rem;
  font-weight: 700;
  border: none;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.25s cubic-bezier(.22, 1, .36, 1);
  letter-spacing: 0.3px;
  box-shadow: 0 4px 20px rgba(47,161,138,0.3);
  margin-top: 8px;
  position: relative;
  overflow: hidden;
  min-height: 50px;
  display: flex;
  align-items: center;
  justify-content: center;
}
.submit-btn::after {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 50%;
  height: 100%;
  background: linear-gradient(to right, transparent, rgba(255,255,255,0.4), transparent);
  transform: skewX(-25deg);
}
.submit-btn:hover:not(:disabled)::after {
  animation: shineHover 0.75s forwards;
}
.submit-btn:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 8px 28px rgba(47,161,138,0.45);
  filter: brightness(1.08);
}
.submit-btn:disabled {
  opacity: 0.65;
  cursor: not-allowed;
}

@keyframes shineHover {
  0% { left: -100%; }
  100% { left: 200%; }
}
.loading-spinner { display: flex; align-items: center; justify-content: center; gap: 6px; }

/* ─── Divider ───────────────────────────────────────── */
.divider {
  display: flex;
  align-items: center;
  gap: 12px;
  margin: 20px 0 16px;
}
.divider-line {
  flex: 1;
  height: 1px;
  background: rgba(255,255,255,0.07);
}
.divider-text {
  font-size: 0.78rem;
  color: #475569;
  white-space: nowrap;
}

/* ─── Register link ─────────────────────────────────── */
.register-link {
  display: block;
  text-align: center;
  padding: 12px;
  border: 1.5px solid rgba(47,161,138,0.3);
  border-radius: 12px;
  color: var(--green-bright);
  font-size: 0.88rem;
  font-weight: 600;
  text-decoration: none;
  transition: all 0.25s;
}
.register-link:hover {
  background: rgba(47,161,138,0.12);
  border-color: var(--green-bright);
  transform: translateY(-1px);
}

.register-link {
  position: relative;
  overflow: hidden;
}
.register-link::after {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 50%;
  height: 100%;
  background: linear-gradient(to right, transparent, rgba(255,255,255,0.25), transparent);
  transform: skewX(-25deg);
}
.register-link:hover::after {
  animation: shineHover 0.75s forwards;
}

/* ─── Animations ───────────────────────────────────── */
@keyframes cardAppear {
  from { opacity: 0; transform: translateY(16px) scale(0.98); }
  to   { opacity: 1; transform: translateY(0) scale(1); }
}

/* ─── Responsive ────────────────────────────────────── */
@media (max-width: 520px) {
  .login-card {
    padding: 24px 18px 20px;
    border-radius: 18px;
    border-color: rgba(255,255,255,0.06);
  }
  .card-header {
    margin-bottom: 18px;
  }
  .card-title {
    font-size: 1.3rem;
  }
  .card-subtitle {
    font-size: 0.8rem;
  }
  .auth-form {
    gap: 14px;
  }
  .field-label {
    font-size: 0.72rem;
  }
  :deep(.auth-input .v-field__input) {
    min-height: 42px !important;
    font-size: 0.87rem !important;
  }
  .submit-btn {
    padding: 14px;
    font-size: 0.9rem;
    min-height: 48px;
    margin-top: 6px;
  }
  .forgot-link {
    font-size: 0.74rem;
  }
  .divider {
    margin: 14px 0 12px;
  }
  .register-link {
    padding: 11px;
    font-size: 0.84rem;
  }
}

@media (max-width: 380px) {
  .login-card {
    padding: 20px 14px 16px;
  }
  .card-title {
    font-size: 1.2rem;
  }
  .submit-btn {
    min-height: 46px;
  }
}
</style>
