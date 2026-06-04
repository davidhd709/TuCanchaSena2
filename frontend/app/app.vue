<template>
  <NuxtLayout>
    <NuxtPage :transition="{ name: 'page', mode: 'out-in' }" />
  </NuxtLayout>

  <!-- ── Toast global (gestionado por useToast) ── -->
  <v-snackbar
    v-model="toast.state.show"
    :color="toast.state.color"
    :timeout="toast.state.timeout"
    location="bottom right"
    rounded="lg"
    elevation="4"
  >
    <span class="text-body-2 font-weight-medium">{{ toast.state.message }}</span>
    <template #actions>
      <v-btn variant="text" size="small" @click="toast.state.show = false">
        Cerrar
      </v-btn>
    </template>
  </v-snackbar>
</template>

<script setup lang="ts">
const toast = useToast()
useMouseGlow()
</script>
