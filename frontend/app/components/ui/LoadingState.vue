<template>
  <v-row>
    <v-col
      v-for="n in count"
      :key="n"
      :cols="cols"
      :sm="sm"
      :lg="lg"
    >
      <v-skeleton-loader
        :type="type"
        rounded="lg"
      />
    </v-col>
  </v-row>
</template>

<script setup lang="ts">
withDefaults(
  defineProps<{
    /** Número de esqueletos a mostrar */
    count?: number
    /** Columnas en xs */
    cols?: number | string
    /** Columnas en sm */
    sm?: number | string
    /** Columnas en lg */
    lg?: number | string
    /** Tipo de skeleton de Vuetify */
    type?: string
  }>(),
  {
    count: 3,
    cols: 12,
    sm: 6,
    lg: 4,
    type: 'card',
  },
)
</script>
