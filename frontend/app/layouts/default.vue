<template>
  <v-app>
    <v-main class="default-main">
      <slot />
    </v-main>
  </v-app>
</template>

<style scoped>
.default-main > * {
  animation: tc-fade-up .42s cubic-bezier(.22, 1, .36, 1) both;
}
</style>
