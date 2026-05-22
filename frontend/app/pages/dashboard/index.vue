<template>
  <div>
    <!-- Inicio según rol. Cada dashboard vive en su propio componente
         (Fase 4): carga sus datos y trae su propio CSS. -->
    <DashboardAdmin v-if="authStore.isAdmin" />
    <DashboardBusiness v-else-if="authStore.isBusiness" />
    <DashboardClient v-else />
  </div>
</template>

<script setup lang="ts">
definePageMeta({ middleware: 'auth' })

const authStore = useAuthStore()

// El cliente usa el layout marketplace; admin/business usan el de gestión.
authStore.hydrate()
setPageLayout(authStore.isAdmin || authStore.isBusiness ? 'dashboard' : 'client')
</script>
