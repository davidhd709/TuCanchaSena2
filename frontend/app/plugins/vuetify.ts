import 'vuetify/styles'
import { createVuetify } from 'vuetify'
import { md3 } from 'vuetify/blueprints'

const tucancha = {
  dark: true,
  colors: {
    primary: '#58d68d',
    secondary: '#2fa18a',
    accent: '#2fbf78',
    error: '#ef4444',
    warning: '#22c55e',
    info: '#0ea5e9',
    success: '#2fa18a',
    background: '#0f1318',
    surface: '#171c23',
    'surface-bright': '#1b212a',
    'surface-light': '#1f2630',
    'surface-variant': '#242d39',
    'on-surface-variant': '#9eb4a8',
    'on-background': '#ecfff2',
    'on-surface': '#ecfff2',
    'primary-darken-1': '#2fa18a',
  },
  variables: {
    'border-color': '#2fa18a',
    'border-opacity': 0.22,
    'high-emphasis-opacity': 0.95,
    'medium-emphasis-opacity': 0.76,
  },
}

export default defineNuxtPlugin((app) => {
  const vuetify = createVuetify({
    blueprint: md3,
    theme: {
      defaultTheme: 'tucancha',
      themes: { tucancha },
    },
    defaults: {
      VCard: { rounded: 'xl', flat: true, color: 'surface' },
      VBtn: { rounded: 'lg', flat: true, class: 'text-none font-weight-bold' },
      VTextField: { variant: 'outlined', density: 'comfortable', color: 'primary', rounded: 'lg' },
      VSelect: { variant: 'outlined', density: 'comfortable', color: 'primary', rounded: 'lg' },
      VAutocomplete: { variant: 'outlined', density: 'comfortable', color: 'primary', rounded: 'lg' },
      VCombobox: { variant: 'outlined', density: 'comfortable', color: 'primary', rounded: 'lg' },
      VTextarea: { variant: 'outlined', density: 'comfortable', color: 'primary', rounded: 'lg' },
      VFileInput: { variant: 'outlined', density: 'comfortable', color: 'primary', rounded: 'lg' },
      VChip: { rounded: 'lg' },
      VAlert: { rounded: 'lg', variant: 'tonal' },
      VDialog: { rounded: 'xl' },
      VList: { rounded: 'lg' },
      VAppBar: { flat: true },
      VDataTable: { hover: true },
    },
  })
  app.vueApp.use(vuetify)
})
