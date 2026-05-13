<template>
  <!-- ─── Login Card ──────────────────────────────────── -->
  <div class="login-card">

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
        <div class="field-wrap">
          <span class="field-icon mdi mdi-email-outline"></span>
          <v-text-field
            id="login-email"
            v-model="form.email"
            type="email"
            placeholder="tu@correo.com"
            :rules="[rules.required, rules.email]"
            variant="plain"
            density="compact"
            hide-details="auto"
            class="styled-input"
          />
        </div>
      </div>

      <!-- Password -->
      <div class="field-group">
        <label class="field-label" for="login-password">Contraseña</label>
        <div class="field-wrap">
          <span class="field-icon mdi mdi-lock-outline"></span>
          <v-text-field
            id="login-password"
            v-model="form.password"
            :type="showPassword ? 'text' : 'password'"
            placeholder="••••••••"
            :rules="[rules.required]"
            variant="plain"
            density="compact"
            hide-details="auto"
            class="styled-input"
          />
          <button
            type="button"
            class="eye-btn"
            @click="showPassword = !showPassword"
            :aria-label="showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'"
          >
            <span :class="`mdi ${showPassword ? 'mdi-eye-off-outline' : 'mdi-eye-outline'}`"></span>
          </button>
        </div>
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
    <NuxtLink to="/auth/register" class="register-link" id="go-register">
      Crear cuenta gratis
    </NuxtLink>

  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: 'auth' })

const authStore = useAuthStore()
const router = useRouter()

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
    router.push('/dashboard')
  } catch (err: any) {
    errorMsg.value = err?.data?.message || 'Credenciales inválidas'
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  authStore.hydrate()
  if (authStore.isAuthenticated) {
    router.push('/dashboard')
  }
})
</script>

<style scoped>
/* ─── Card shell ────────────────────────────────────── */
.login-card {
  width: 100%;
  background: rgba(15, 20, 32, 0.85);
  backdrop-filter: blur(24px);
  -webkit-backdrop-filter: blur(24px);
  border: 1px solid rgba(255, 255, 255, 0.07);
  border-radius: 22px;
  padding: 36px 32px 28px;
  box-shadow: 0 8px 48px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(34,197,94,0.06);
  font-family: 'Poppins', sans-serif;
}

/* ─── Header ────────────────────────────────────────── */
.card-header {
  margin-bottom: 28px;
  text-align: center;
}
.card-title {
  font-size: 1.5rem;
  font-weight: 700;
  color: #f1f5f9;
  margin-bottom: 4px;
  letter-spacing: -0.3px;
}
.card-subtitle {
  font-size: 0.85rem;
  color: #64748b;
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

.field-wrap {
  position: relative;
  display: flex;
  align-items: center;
  background: rgba(255,255,255,0.04);
  border: 1.5px solid rgba(255,255,255,0.09);
  border-radius: 12px;
  transition: border-color 0.25s, box-shadow 0.25s;
}
.field-wrap:focus-within {
  border-color: #22c55e;
  box-shadow: 0 0 0 3px rgba(34,197,94,0.12);
}

.field-icon {
  position: absolute;
  left: 14px;
  font-size: 1.1rem;
  color: #475569;
  pointer-events: none;
  z-index: 2;
  transition: color 0.25s;
}
.field-wrap:focus-within .field-icon { color: #22c55e; }

.styled-input {
  flex: 1;
  padding-left: 44px !important;
}
/* Override Vuetify input internals */
:deep(.v-field__input) {
  font-family: 'Poppins', sans-serif !important;
  font-size: 0.9rem !important;
  color: #e2e8f0 !important;
  padding: 10px 0 !important;
  min-height: unset !important;
}
:deep(.v-field__input::placeholder) { color: #475569 !important; }
:deep(.v-field) { background: transparent !important; box-shadow: none !important; }
:deep(.v-field__outline) { display: none !important; }
:deep(.v-messages) {
  font-family: 'Poppins', sans-serif !important;
  font-size: 0.75rem !important;
  color: #f87171 !important;
  min-height: 16px;
}

.eye-btn {
  position: absolute;
  right: 12px;
  background: none;
  border: none;
  color: #475569;
  cursor: pointer;
  font-size: 1.1rem;
  display: flex;
  align-items: center;
  padding: 4px;
  transition: color 0.2s;
  z-index: 2;
}
.eye-btn:hover { color: #22c55e; }

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
.forgot-link:hover { color: #22c55e; }

/* ─── Submit button ─────────────────────────────────── */
.submit-btn {
  width: 100%;
  padding: 14px;
  background: linear-gradient(135deg, #22c55e, #15803d);
  color: #fff;
  font-family: 'Poppins', sans-serif;
  font-size: 0.95rem;
  font-weight: 600;
  border: none;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.25s;
  letter-spacing: 0.3px;
  box-shadow: 0 4px 20px rgba(34,197,94,0.3);
  margin-top: 4px;
}
.submit-btn:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 8px 28px rgba(34,197,94,0.45);
  filter: brightness(1.08);
}
.submit-btn:disabled {
  opacity: 0.65;
  cursor: not-allowed;
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
  border: 1.5px solid rgba(34,197,94,0.3);
  border-radius: 12px;
  color: #22c55e;
  font-size: 0.88rem;
  font-weight: 600;
  text-decoration: none;
  transition: all 0.25s;
}
.register-link:hover {
  background: rgba(34,197,94,0.07);
  border-color: #22c55e;
  transform: translateY(-1px);
}

/* ─── Responsive ────────────────────────────────────── */
@media (max-width: 520px) {
  .login-card { padding: 28px 20px 22px; }
}
</style>