<template>
  <div>
    <h1 class="text-h5 font-weight-bold mb-6">Mi Perfil</h1>

    <v-row>
      <!-- Avatar & role card -->
      <v-col cols="12" md="4">
        <v-card rounded="lg" class="text-center pa-6 mb-4">
          <v-avatar color="primary" variant="tonal" size="96" class="mb-4">
            <span class="text-h4 font-weight-bold">{{ initials }}</span>
          </v-avatar>
          <h2 class="text-subtitle-1 font-weight-bold">{{ authStore.fullName }}</h2>
          <p class="text-body-2 text-medium-emphasis mb-3">{{ authStore.user?.email }}</p>
          <v-chip :color="roleColor" variant="tonal">
            <v-icon start>{{ roleIcon }}</v-icon>
            {{ authStore.roleLabel }}
          </v-chip>
        </v-card>

        <v-card rounded="lg" class="pa-4">
          <v-list density="compact" class="pa-0">
            <v-list-item prepend-icon="mdi-phone" :title="authStore.user?.phone || 'Sin teléfono'" />
            <v-list-item
              prepend-icon="mdi-shield-check"
              :title="authStore.user?.isActive ? 'Cuenta activa' : 'Cuenta inactiva'"
              :subtitle="authStore.user?.isActive ? '' : 'Tu cuenta está desactivada'"
            />
          </v-list>
        </v-card>
      </v-col>

      <!-- Edit profile -->
      <v-col cols="12" md="8">
        <v-card rounded="lg">
          <v-card-title class="text-subtitle-1 font-weight-bold pa-5 pb-3">
            Editar Información
          </v-card-title>
          <v-card-text class="px-5 pb-5">
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

            <v-form ref="formRef" @submit.prevent="saveProfile">
              <v-row>
                <v-col cols="6">
                  <v-text-field v-model="form.firstName" label="Nombre" :rules="[r.required]" />
                </v-col>
                <v-col cols="6">
                  <v-text-field v-model="form.lastName" label="Apellido" :rules="[r.required]" />
                </v-col>
              </v-row>
              <v-text-field v-model="form.phone" label="Teléfono" prepend-inner-icon="mdi-phone" class="mb-2" />
              <v-btn type="submit" color="primary" :loading="loading">Guardar Cambios</v-btn>
            </v-form>
          </v-card-text>
        </v-card>

        <!-- Change Password -->
        <v-card rounded="lg" class="mt-4">
          <v-card-title class="text-subtitle-1 font-weight-bold pa-5 pb-3">
            Cambiar Contraseña
          </v-card-title>
          <v-card-text class="px-5 pb-5">
            <v-form ref="passwordFormRef" @submit.prevent="changePassword">
              <v-text-field
                v-model="passwordForm.newPassword"
                label="Nueva contraseña"
                :type="showPwd ? 'text' : 'password'"
                :append-inner-icon="showPwd ? 'mdi-eye-off' : 'mdi-eye'"
                @click:append-inner="showPwd = !showPwd"
                :rules="[r.required, r.minLength]"
                class="mb-2"
              />
              <v-text-field
                v-model="passwordForm.confirm"
                label="Confirmar contraseña"
                :type="showPwd ? 'text' : 'password'"
                :rules="[r.required, r.passwordMatch]"
                class="mb-4"
              />
              <v-btn type="submit" variant="tonal" color="primary" :loading="pwdLoading">
                Actualizar Contraseña
              </v-btn>
            </v-form>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: 'dashboard', middleware: 'auth' })

const authStore = useAuthStore()
const { apiFetch } = useApi()

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
  return `${authStore.user.firstName[0]}${authStore.user.lastName[0]}`.toUpperCase()
})

const roleColor = computed(() => {
  const map: Record<string, string> = { admin: 'error', bussines: 'primary', client: 'success' }
  return map[authStore.user?.role ?? ''] ?? 'default'
})

const roleIcon = computed(() => {
  const map: Record<string, string> = {
    admin: 'mdi-shield-crown',
    bussines: 'mdi-store',
    client: 'mdi-account',
  }
  return map[authStore.user?.role ?? ''] ?? 'mdi-account'
})

const r = {
  required: (v: string) => !!v || 'Requerido',
  minLength: (v: string) => v.length >= 6 || 'Mínimo 6 caracteres',
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
