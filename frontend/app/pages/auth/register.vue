<template>
  <div class="login-card register-card">
    <!-- ─── Register Card ─────────────────────────────── -->

    <!-- Header -->
    <div class="card-header">
      <h1 class="card-title">Crea tu cuenta</h1>
      <p class="card-subtitle">Únete y empieza a reservar canchas hoy</p>
    </div>

    <!-- Error alert -->
    <div v-if="errorMsg" class="error-alert">
      <span class="mdi mdi-alert-circle-outline"></span>
      {{ errorMsg }}
      <button class="alert-close" @click="errorMsg = ''">
        <span class="mdi mdi-close"></span>
      </button>
    </div>

    <v-form ref="formRef" @submit.prevent="handleRegister" class="auth-form">

      <!-- Nombre / Apellido -->
      <div class="field-row">
        <div class="field-group">
          <label class="field-label">Nombre</label>
          <v-text-field
            v-model="form.firstName"
            placeholder="Juan"
            :rules="[rules.required]"
            prepend-inner-icon="mdi-account-outline"
            variant="outlined"
            density="comfortable"
            hide-details="auto"
            class="auth-input"
          />
        </div>
        <div class="field-group">
          <label class="field-label">Apellido</label>
          <v-text-field
            v-model="form.lastName"
            placeholder="Pérez"
            :rules="[rules.required]"
            prepend-inner-icon="mdi-account-outline"
            variant="outlined"
            density="comfortable"
            hide-details="auto"
            class="auth-input"
          />
        </div>
      </div>

      <!-- Email -->
      <div class="field-group">
        <label class="field-label">Correo electrónico</label>
        <v-text-field
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

      <!-- Teléfono -->
      <div class="field-group">
        <label class="field-label">Teléfono <span class="optional">(opcional)</span></label>
        <v-text-field
          v-model="form.phone"
          placeholder="+57 300 000 0000"
          prepend-inner-icon="mdi-phone-outline"
          variant="outlined"
          density="comfortable"
          hide-details="auto"
          class="auth-input"
        />
      </div>

      <!-- Contraseña -->
      <div class="field-group">
        <label class="field-label">Contraseña</label>
        <v-text-field
          v-model="form.password"
          :type="showPassword ? 'text' : 'password'"
          placeholder="Mínimo 6 caracteres"
          :rules="[rules.required, rules.minLength]"
          prepend-inner-icon="mdi-lock-outline"
          :append-inner-icon="showPassword ? 'mdi-eye-off-outline' : 'mdi-eye-outline'"
          @click:append-inner="showPassword = !showPassword"
          variant="outlined"
          density="comfortable"
          hide-details="auto"
          class="auth-input"
        />
      </div>

      <!-- Confirmar contraseña -->
      <div class="field-group">
        <label class="field-label">Confirmar contraseña</label>
        <v-text-field
          v-model="form.confirmPassword"
          :type="showPassword ? 'text' : 'password'"
          placeholder="Repite tu contraseña"
          :rules="[rules.required, rules.passwordMatch]"
          prepend-inner-icon="mdi-lock-check-outline"
          :append-inner-icon="showPassword ? 'mdi-eye-off-outline' : 'mdi-eye-outline'"
          @click:append-inner="showPassword = !showPassword"
          variant="outlined"
          density="comfortable"
          hide-details="auto"
          class="auth-input"
        />
      </div>

      <!-- Submit -->
      <button type="submit" class="submit-btn" :disabled="loading" id="register-submit">
        <span v-if="!loading">
          <span class="mdi mdi-account-plus-outline"></span>&nbsp;Registrarse
        </span>
        <span v-else class="loading-spinner">
          <span class="mdi mdi-loading mdi-spin"></span>&nbsp;Creando cuenta...
        </span>
      </button>
    </v-form>

    <!-- Divider -->
    <div class="divider">
      <span class="divider-line"></span>
      <span class="divider-text">¿Ya tienes cuenta?</span>
      <span class="divider-line"></span>
    </div>

    <NuxtLink
      :to="{ path: '/auth/login', query: { redirect: route.query.redirect } }"
      class="register-link"
      id="go-login"
    >
      Iniciar sesión
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
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
  password: '',
  confirmPassword: '',
})

const rules = {
  required: (v: string) => !!v || 'Este campo es requerido',
  email: (v: string) => /.+@.+\..+/.test(v) || 'Email inválido',
  minLength: (v: string) => v.length >= 6 || 'Mínimo 6 caracteres',
  passwordMatch: (v: string) => v === form.password || 'Las contraseñas no coinciden',
}

const handleRegister = async () => {
  const { valid } = await formRef.value.validate()
  if (!valid) return

  loading.value = true
  errorMsg.value = ''

  try {
    await authStore.register({
      firstName: form.firstName,
      lastName: form.lastName,
      email: form.email,
      phone: form.phone || undefined,
      password: form.password,
    })
    router.push(safeRedirectPath(route.query.redirect))
  } catch (err: any) {
    errorMsg.value = err?.data?.message || 'Error al registrarse'
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  authStore.hydrate()
  if (authStore.isAuthenticated) {
    router.push(safeRedirectPath(route.query.redirect))
  }
})
</script>

<style scoped>
/* ─── Shared card styles (same as login) ────────────── */
.login-card {
  width: 100%;
  background: var(--bg-card);
  backdrop-filter: blur(24px);
  -webkit-backdrop-filter: blur(24px);
  border: 1px solid var(--border-medium);
  border-radius: var(--radius-xl);
  padding: 32px 32px 24px;
  box-shadow: var(--shadow-lg);
  font-family: 'Manrope', sans-serif;
  animation: cardAppear 0.5s cubic-bezier(.22, 1, .36, 1) both;
  animation-delay: 0.1s;
}

.card-header { margin-bottom: 20px; text-align: center; }
.card-title { font-size: 1.45rem; font-weight: 800; color: var(--text-primary); margin-bottom: 6px; letter-spacing: -0.4px; line-height: 1.2; }
.card-subtitle { font-size: 0.84rem; color: #64748b; opacity: 0.85; }

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
  margin-bottom: 16px;
}
.alert-close { margin-left: auto; background: none; border: none; color: #fca5a5; cursor: pointer; font-size: 1rem; display: flex; align-items: center; opacity: 0.7; }
.alert-close:hover { opacity: 1; }

.auth-form { display: flex; flex-direction: column; gap: 14px; }

/* Two-column name row */
.field-row { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }

.field-group { display: flex; flex-direction: column; gap: 5px; }
.field-label { font-size: 0.75rem; font-weight: 600; color: #94a3b8; letter-spacing: 0.4px; text-transform: uppercase; }
.optional { font-weight: 400; color: #475569; text-transform: none; letter-spacing: 0; }

.auth-input { margin-bottom: 0 !important; }
:deep(.auth-input .v-field__input) { font-family: 'Manrope', sans-serif !important; font-size: 0.88rem !important; color: var(--text-primary) !important; min-height: 44px !important; }
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
:deep(.auth-input .v-field__outline) {
  display: none !important;
}
:deep(.auth-input .v-field__prepend-inner .v-icon),
:deep(.auth-input .v-field__append-inner .v-icon) { color: #64748b !important; }
:deep(.auth-input .v-field--focused .v-field__prepend-inner .v-icon),
:deep(.auth-input .v-field--focused .v-field__append-inner .v-icon) { color: var(--green-bright) !important; }
:deep(.auth-input .v-messages) { font-family: 'Manrope', sans-serif !important; font-size: 0.73rem !important; color: #f87171 !important; min-height: 14px; }
:deep(.auth-input .v-select__selection-text) { font-family: 'Manrope', sans-serif !important; color: var(--text-primary) !important; font-size: 0.88rem !important; }

.submit-btn {
  width: 100%;
  padding: 14px;
  background: linear-gradient(135deg, var(--green-bright), var(--green-dark));
  color: #fff;
  font-family: 'Manrope', sans-serif;
  font-size: 0.92rem;
  font-weight: 700;
  border: none;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.25s cubic-bezier(.22, 1, .36, 1);
  box-shadow: 0 4px 20px rgba(47,161,138,0.3);
  margin-top: 6px;
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
.submit-btn:hover:not(:disabled) { transform: translateY(-2px); box-shadow: 0 8px 28px rgba(47,161,138,0.45); filter: brightness(1.08); }
.submit-btn:disabled { opacity: 0.65; cursor: not-allowed; }

@keyframes shineHover {
  0% { left: -100%; }
  100% { left: 200%; }
}

.loading-spinner { display: flex; align-items: center; justify-content: center; gap: 6px; }

.divider { display: flex; align-items: center; gap: 12px; margin: 18px 0 14px; }
.divider-line { flex: 1; height: 1px; background: rgba(255,255,255,0.07); }
.divider-text { font-size: 0.76rem; color: #475569; white-space: nowrap; }

.register-link {
  display: block;
  text-align: center;
  padding: 11px;
  border: 1.5px solid rgba(47,161,138,0.3);
  border-radius: 12px;
  color: var(--green-bright);
  font-size: 0.87rem;
  font-weight: 600;
  text-decoration: none;
  transition: all 0.25s;
}
.register-link:hover { background: rgba(47,161,138,0.12); border-color: var(--green-bright); transform: translateY(-1px); }

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

@keyframes cardAppear {
  from { opacity: 0; transform: translateY(16px) scale(0.98); }
  to   { opacity: 1; transform: translateY(0) scale(1); }
}

@media (max-width: 520px) {
  .login-card {
    padding: 22px 16px 18px;
    border-radius: 18px;
    border-color: rgba(255,255,255,0.06);
  }
  .card-header {
    margin-bottom: 16px;
  }
  .card-title {
    font-size: 1.25rem;
  }
  .card-subtitle {
    font-size: 0.78rem;
  }
  .auth-form {
    gap: 10px;
  }
  .field-row {
    grid-template-columns: 1fr;
    gap: 10px;
  }
  .field-label {
    font-size: 0.7rem;
  }
  .field-group {
    gap: 4px;
  }
  :deep(.auth-input .v-field__input) {
    min-height: 40px !important;
    font-size: 0.85rem !important;
  }
  .submit-btn {
    padding: 13px;
    font-size: 0.88rem;
    min-height: 46px;
    margin-top: 4px;
  }
  .divider {
    margin: 12px 0 10px;
  }
  .register-link {
    padding: 10px;
    font-size: 0.84rem;
  }
}

@media (max-width: 380px) {
  .login-card {
    padding: 18px 12px 14px;
  }
  .card-title {
    font-size: 1.15rem;
  }
  .auth-form {
    gap: 8px;
  }
  .submit-btn {
    min-height: 44px;
  }
}
</style>
