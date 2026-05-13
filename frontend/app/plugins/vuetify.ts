import 'vuetify/styles'
import { createVuetify } from 'vuetify'
import { md3 } from 'vuetify/blueprints'

export default defineNuxtPlugin((app) => {
  const vuetify = createVuetify({
    blueprint: md3,
    theme: {
      defaultTheme: 'light',
      themes: {
        light: {
          colors: {
            primary: '#1867C0',
            secondary: '#5CBBF6',
            accent: '#00BCD4',
            error: '#FF5252',
            warning: '#FB8C00',
            info: '#2196F3',
            success: '#4CAF50',
            background: '#F5F7FA',
            surface: '#FFFFFF',
          },
        },
      },
    },
    defaults: {
      VBtn: { rounded: 'lg' },
      VCard: { rounded: 'lg' },
      VTextField: { variant: 'outlined', density: 'comfortable' },
      VSelect: { variant: 'outlined', density: 'comfortable' },
      VTextarea: { variant: 'outlined', density: 'comfortable' },
    },
  })
  app.vueApp.use(vuetify)
})
