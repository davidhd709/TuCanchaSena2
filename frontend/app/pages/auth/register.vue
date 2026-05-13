<template>
  <!-- ─── Register Card ─────────────────────────────── -->
  <div class="login-card register-card">

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
          <div class="field-wrap">
            <span class="field-icon mdi mdi-account-outline"></span>
            <v-text-field
              v-model="form.firstName"
              placeholder="Juan"
              :rules="[rules.required]"
              variant="plain" density="compact" hide-details="auto"
              class="styled-input"
            />
          </div>
        </div>
        <div class="field-group">
          <label class="field-label">Apellido</label>
          <div class="field-wrap">
            <v-text-field
              v-model="form.lastName"
              placeholder="Pérez"
              :rules="[rules.required]"
              variant="plain" density="compact" hide-details="auto"
              class="styled-input no-icon"
            />
          </div>
        </div>
      </div>

      <!-- Email -->
      <div class="field-group">
        <label class="field-label">Correo electrónico</label>
        <div class="field-wrap">
          <span class="field-icon mdi mdi-email-outline"></span>
          <v-text-field
            v-model="form.email"
            type="email"
            placeholder="tu@correo.com"
            :rules="[rules.required, rules.email]"
            variant="plain" density="compact" hide-details="auto"
            class="styled-input"
          />
        </div>
      </div>

      <!-- Teléfono -->
      <div class="field-group">
        <label class="field-label">Teléfono <span class="optional">(opcional)</span></label>
        <div class="field-wrap">
          <span class="field-icon mdi mdi-phone-outline"></span>
          <v-text-field
            v-model="form.phone"
            placeholder="+57 300 000 0000"
            variant="plain" density="compact" hide-details="auto"
            class="styled-input"
          />
        </div>
      </div>

      <!-- Tipo de cuenta -->
      <div class="field-group">
        <label class="field-label">Tipo de cuenta</label>
        <div class="field-wrap">
          <span class="field-icon mdi mdi-account-key-outline"></span>
          <v-select
            v-model="form.role"
            :items="roleOptions"
            :rules="[rules.required]"
            variant="plain" density="compact" hide-details="auto"
            class="styled-input"
          />
        </div>
      </div>

      <!-- Contraseña -->
      <div class="field-group">
        <label class="field-label">Contraseña</label>
        <div class="field-wrap">
          <span class="field-icon mdi mdi-lock-outline"></span>
          <v-text-field
            v-model="form.password"
            :type="showPassword ? 'text' : 'password'"
            placeholder="Mínimo 6 caracteres"
            :rules="[rules.required, rules.minLength]"
            variant="plain" density="compact" hide-details="auto"
            class="styled-input"
          />
          <button type="button" class="eye-btn" @click="showPassword = !showPassword">
            <span :class="`mdi ${showPassword ? 'mdi-eye-off-outline' : 'mdi-eye-outline'}`"></span>
          </button>
        </div>
      </div>

      <!-- Confirmar contraseña -->
      <div class="field-group">
        <label class="field-label">Confirmar contraseña</label>
        <div class="field-wrap">
          <span class="field-icon mdi mdi-lock-check-outline"></span>
          <v-text-field
            v-model="form.confirmPassword"
            :type="showPassword ? 'text' : 'password'"
            placeholder="Repite tu contraseña"
            :rules="[rules.required, rules.passwordMatch]"
            variant="plain" density="compact" hide-details="auto"
            class="styled-input"
          />
        </div>
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

    <NuxtLink to="/auth/login" class="register-link" id="go-login">
      Iniciar sesión
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
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
  role: 'client',
  password: '',
  confirmPassword: '',
})

const roleOptions = [
  { title: 'Cliente', value: 'client' },
  { title: 'Propietario de Negocio', value: 'bussines' },
]

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
      role: form.role,
      password: form.password,
    })
    router.push('/dashboard')
  } catch (err: any) {
    errorMsg.value = err?.data?.message || 'Error al registrarse'
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
/* ─── Shared card styles (same as login) ────────────── */
.login-card {
  width: 100%;
  background: rgba(15, 20, 32, 0.85);
  backdrop-filter: blur(24px);
  -webkit-backdrop-filter: blur(24px);
  border: 1px solid rgba(255, 255, 255, 0.07);
  border-radius: 22px;
  padding: 32px 32px 24px;
  box-shadow: 0 8px 48px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(34,197,94,0.06);
  font-family: 'Poppins', sans-serif;
}

.card-header { margin-bottom: 24px; text-align: center; }
.card-title { font-size: 1.45rem; font-weight: 700; color: #f1f5f9; margin-bottom: 4px; letter-spacing: -0.3px; }
.card-subtitle { font-size: 0.85rem; color: #64748b; }

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

.field-icon { position: absolute; left: 12px; font-size: 1rem; color: #475569; pointer-events: none; z-index: 2; transition: color 0.25s; }
.field-wrap:focus-within .field-icon { color: #22c55e; }

.styled-input { flex: 1; padding-left: 40px !important; }
.no-icon { padding-left: 12px !important; }

:deep(.v-field__input) { font-family: 'Poppins', sans-serif !important; font-size: 0.88rem !important; color: #e2e8f0 !important; padding: 9px 0 !important; min-height: unset !important; }
:deep(.v-field__input::placeholder) { color: #475569 !important; }
:deep(.v-field) { background: transparent !important; box-shadow: none !important; }
:deep(.v-field__outline) { display: none !important; }
:deep(.v-messages) { font-family: 'Poppins', sans-serif !important; font-size: 0.73rem !important; color: #f87171 !important; min-height: 14px; }
:deep(.v-select__selection-text) { font-family: 'Poppins', sans-serif !important; color: #e2e8f0 !important; font-size: 0.88rem !important; }

.eye-btn { position: absolute; right: 12px; background: none; border: none; color: #475569; cursor: pointer; font-size: 1rem; display: flex; align-items: center; padding: 4px; transition: color 0.2s; z-index: 2; }
.eye-btn:hover { color: #22c55e; }

.submit-btn {
  width: 100%;
  padding: 13px;
  background: linear-gradient(135deg, #22c55e, #15803d);
  color: #fff;
  font-family: 'Poppins', sans-serif;
  font-size: 0.92rem;
  font-weight: 600;
  border: none;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.25s;
  box-shadow: 0 4px 20px rgba(34,197,94,0.3);
  margin-top: 4px;
}
.submit-btn:hover:not(:disabled) { transform: translateY(-2px); box-shadow: 0 8px 28px rgba(34,197,94,0.45); filter: brightness(1.08); }
.submit-btn:disabled { opacity: 0.65; cursor: not-allowed; }
.loading-spinner { display: flex; align-items: center; justify-content: center; gap: 6px; }

.divider { display: flex; align-items: center; gap: 12px; margin: 18px 0 14px; }
.divider-line { flex: 1; height: 1px; background: rgba(255,255,255,0.07); }
.divider-text { font-size: 0.76rem; color: #475569; white-space: nowrap; }

.register-link {
  display: block;
  text-align: center;
  padding: 11px;
  border: 1.5px solid rgba(34,197,94,0.3);
  border-radius: 12px;
  color: #22c55e;
  font-size: 0.87rem;
  font-weight: 600;
  text-decoration: none;
  transition: all 0.25s;
}
.register-link:hover { background: rgba(34,197,94,0.07); border-color: #22c55e; transform: translateY(-1px); }

@media (max-width: 520px) {
  .login-card { padding: 24px 18px 20px; }
  .field-row { grid-template-columns: 1fr; }
}
</style>
