<template>
  <div>
    <PageHeader tag="Cuenta" title="Mi Perfil" subtitle="Gestiona tu información personal y de seguridad" />

    <!-- Alertas globales -->
    <v-alert
      v-if="successMsg"
      type="success"
      variant="tonal"
      class="mb-4"
      closable
      @click:close="successMsg = ''"
    >
      {{ successMsg }}
    </v-alert>
    <v-alert
      v-if="errorMsg"
      type="error"
      variant="tonal"
      class="mb-4"
      closable
      @click:close="errorMsg = ''"
    >
      {{ errorMsg }}
    </v-alert>

    <div class="profile-shell">
      <!-- ── Columna izquierda: resumen del usuario ───────────────────────── -->
      <aside class="profile-summary-card">
        <div class="profile-avatar">{{ initials }}</div>
        <h2 class="profile-name">{{ authStore.fullName }}</h2>
        <p class="profile-email">{{ authStore.user?.email }}</p>
        <span class="profile-role-badge" :class="`is-${authStore.user?.role}`">
          <span class="mdi" :class="roleIcon" />
          {{ authStore.roleLabel }}
        </span>

        <div class="profile-summary-rows">
          <div class="profile-summary-row">
            <span class="mdi mdi-phone-outline" />
            <span>{{ authStore.user?.phone || 'Sin teléfono' }}</span>
          </div>
          <div class="profile-summary-row">
            <span class="mdi" :class="authStore.user?.isActive ? 'mdi-shield-check-outline' : 'mdi-shield-off-outline'" />
            <span>{{ authStore.user?.isActive ? 'Cuenta activa' : 'Cuenta inactiva' }}</span>
          </div>
        </div>
      </aside>

      <!-- ── Columna derecha: formularios ─────────────────────────────────── -->
      <div class="profile-main">
        <!-- Información personal -->
        <section class="profile-form-card">
          <div class="form-section-header">
            <h3 class="form-section-title"><span class="mdi mdi-account-outline" /> Información personal</h3>
            <p class="form-section-sub">Actualiza tus datos básicos de contacto.</p>
          </div>

          <v-form ref="formRef" @submit.prevent="saveProfile">
            <div class="app-form-grid cols-2">
              <v-text-field
                v-model="form.firstName"
                label="Nombre"
                placeholder="Tu nombre"
                :rules="[r.required]"
              />
              <v-text-field
                v-model="form.lastName"
                label="Apellido"
                placeholder="Tu apellido"
                :rules="[r.required]"
              />
            </div>
            <v-text-field
              v-model="form.phone"
              label="Teléfono"
              placeholder="Ej: 300 123 4567"
              prepend-inner-icon="mdi-phone-outline"
            />
            <div class="form-actions">
              <v-btn type="submit" color="primary" variant="flat" :loading="loading" class="form-actions-btn">
                Guardar cambios
              </v-btn>
            </div>
          </v-form>
        </section>

        <!-- Seguridad -->
        <section class="profile-form-card">
          <div class="form-section-header">
            <h3 class="form-section-title"><span class="mdi mdi-lock-outline" /> Seguridad</h3>
            <p class="form-section-sub">Cambia tu contraseña de acceso.</p>
          </div>

          <v-form ref="passwordFormRef" @submit.prevent="changePassword">
            <div class="app-form-grid cols-2">
              <v-text-field
                v-model="passwordForm.newPassword"
                label="Nueva contraseña"
                placeholder="••••••••"
                :type="showPwd ? 'text' : 'password'"
                :append-inner-icon="showPwd ? 'mdi-eye-off-outline' : 'mdi-eye-outline'"
                :rules="[r.required, r.minLength]"
                @click:append-inner="showPwd = !showPwd"
              />
              <v-text-field
                v-model="passwordForm.confirm"
                label="Confirmar contraseña"
                placeholder="••••••••"
                :type="showPwd ? 'text' : 'password'"
                :rules="[r.required, r.passwordMatch]"
              />
            </div>
            <p class="form-microcopy">
              <span class="mdi mdi-information-outline" />
              Usa una contraseña segura de mínimo 8 caracteres.
            </p>
            <div class="form-actions">
              <v-btn type="submit" color="primary" variant="tonal" :loading="pwdLoading" class="form-actions-btn">
                Actualizar contraseña
              </v-btn>
            </div>
          </v-form>
        </section>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ middleware: 'auth' })

const authStore = useAuthStore()
const { apiFetch } = useApi()

// El perfil adopta el layout según el rol (marketplace para cliente, gestión para admin/business).
authStore.hydrate()
setPageLayout(authStore.isAdmin || authStore.isBusiness ? 'dashboard' : 'client')

const formRef = ref()
const passwordFormRef = ref()
const loading = ref(false)
const pwdLoading = ref(false)
const successMsg = ref('')
const errorMsg = ref('')
const showPwd = ref(false)

const form = reactive({
  firstName: authStore.user?.firstName ?? '',
  lastName: authStore.user?.lastName ?? '',
  phone: authStore.user?.phone ?? '',
})

const passwordForm = reactive({
  newPassword: '',
  confirm: '',
})

const initials = computed(() => {
  if (!authStore.user) return '?'
  return `${authStore.user.firstName?.[0] ?? ''}${authStore.user.lastName?.[0] ?? ''}`.toUpperCase()
})

const roleIcon = computed(() => {
  const map: Record<string, string> = {
    admin: 'mdi-shield-crown-outline',
    business: 'mdi-store-outline',
    client: 'mdi-account-outline',
  }
  return map[authStore.user?.role ?? ''] ?? 'mdi-account-outline'
})

const r = {
  required: (v: string) => !!v || 'Requerido',
  minLength: (v: string) => v.length >= 8 || 'Mínimo 8 caracteres',
  passwordMatch: (v: string) => v === passwordForm.newPassword || 'Las contraseñas no coinciden',
}

const saveProfile = async () => {
  const { valid } = await formRef.value.validate()
  if (!valid) return
  loading.value = true
  errorMsg.value = ''
  try {
    const updated = await apiFetch<any>(`/users/${authStore.user!.id}`, {
      method: 'PATCH',
      body: { firstName: form.firstName, lastName: form.lastName, phone: form.phone },
    })
    authStore.user = { ...authStore.user!, ...updated }
    authStore._persist()
    successMsg.value = 'Perfil actualizado correctamente'
  } catch (e: any) {
    errorMsg.value = e?.data?.message || 'Error al actualizar'
  } finally {
    loading.value = false
  }
}

const changePassword = async () => {
  const { valid } = await passwordFormRef.value.validate()
  if (!valid) return
  pwdLoading.value = true
  errorMsg.value = ''
  try {
    await apiFetch(`/users/${authStore.user!.id}`, {
      method: 'PATCH',
      body: { password: passwordForm.newPassword },
    })
    successMsg.value = 'Contraseña actualizada correctamente'
    passwordForm.newPassword = ''
    passwordForm.confirm = ''
  } catch (e: any) {
    errorMsg.value = e?.data?.message || 'Error al cambiar contraseña'
  } finally {
    pwdLoading.value = false
  }
}
</script>

<style scoped>
.profile-shell {
  display: grid;
  grid-template-columns: 320px 1fr;
  gap: 20px;
  align-items: start;
  max-width: 1080px;
}

/* ── Resumen del usuario ──────────────────────────────────────────────── */
.profile-summary-card {
  position: sticky;
  top: 88px;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  padding: 28px 22px;
  background: var(--bg-card);
  border: 1px solid var(--border-soft);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-sm);
}
.profile-avatar {
  width: 88px;
  height: 88px;
  border-radius: 50%;
  display: grid;
  place-items: center;
  font-family: 'Sora', 'Manrope', sans-serif;
  font-size: 1.9rem;
  font-weight: 800;
  color: #04170f;
  background: linear-gradient(135deg, var(--green-bright), var(--green-primary));
  box-shadow: var(--shadow-glow);
  margin-bottom: 14px;
}
.profile-name {
  font-family: 'Manrope', sans-serif;
  font-size: 1.15rem;
  font-weight: 800;
  color: var(--text-primary);
  line-height: 1.2;
}
.profile-email {
  font-size: 0.85rem;
  color: var(--text-muted);
  margin-top: 4px;
  word-break: break-word;
}
.profile-role-badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  margin-top: 14px;
  padding: 6px 14px;
  border-radius: var(--radius-pill);
  font-size: 0.78rem;
  font-weight: 800;
  border: 1px solid transparent;
}
.profile-role-badge .mdi { font-size: 1rem; }
.profile-role-badge.is-client {
  background: var(--green-soft);
  color: var(--green-bright);
  border-color: rgba(52, 198, 146, 0.3);
}
.profile-role-badge.is-business {
  background: var(--accent-info-soft);
  color: #93c5fd;
  border-color: rgba(59, 130, 246, 0.3);
}
.profile-role-badge.is-admin {
  background: var(--accent-error-soft);
  color: #fca5a5;
  border-color: rgba(239, 68, 68, 0.3);
}

.profile-summary-rows {
  width: 100%;
  margin-top: 20px;
  padding-top: 18px;
  border-top: 1px solid var(--border-soft);
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.profile-summary-row {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 0.88rem;
  color: var(--text-secondary);
}
.profile-summary-row .mdi { font-size: 1.15rem; color: var(--green-bright); flex-shrink: 0; }

/* ── Formularios ──────────────────────────────────────────────────────── */
.profile-main {
  display: flex;
  flex-direction: column;
  gap: 20px;
}
.profile-form-card {
  background: var(--bg-card);
  border: 1px solid var(--border-soft);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-sm);
  padding: 24px;
}
.form-section-header { margin-bottom: 18px; }
.form-section-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-family: 'Manrope', sans-serif;
  font-size: 1.05rem;
  font-weight: 800;
  color: var(--text-primary);
}
.form-section-title .mdi { color: var(--green-bright); font-size: 1.25rem; }
.form-section-sub {
  margin-top: 4px;
  font-size: 0.86rem;
  color: var(--text-muted);
}

.form-microcopy {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 0.8rem;
  color: var(--text-muted);
  margin: -2px 0 14px;
}
.form-microcopy .mdi { color: var(--green-bright); font-size: 1rem; }

.form-actions {
  display: flex;
  justify-content: flex-end;
  margin-top: 6px;
}

@media (max-width: 880px) {
  .profile-shell {
    grid-template-columns: 1fr;
    gap: 16px;
  }
  .profile-summary-card { position: static; }
  .form-actions { justify-content: stretch; }
  .form-actions-btn { width: 100%; }
}
</style>
