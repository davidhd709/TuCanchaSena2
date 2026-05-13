/**
 * useToast — composable global para snackbars Vuetify.
 * El estado es compartido a nivel de módulo, por lo que cualquier
 * componente o plugin puede lanzar un toast sin pasar refs.
 */

const _state = reactive({
  show: false,
  message: '',
  color: 'error' as 'success' | 'error' | 'info' | 'warning',
  timeout: 4000,
})

export const useToast = () => {
  function show(
    message: string,
    color: 'success' | 'error' | 'info' | 'warning' = 'error',
    timeout = 4000,
  ) {
    _state.message = message
    _state.color = color
    _state.timeout = timeout
    _state.show = true
  }

  return {
    /** Estado reactivo — se enlaza directamente en el template de app.vue */
    state: _state,
    success: (msg: string) => show(msg, 'success'),
    error:   (msg: string) => show(msg, 'error'),
    info:    (msg: string) => show(msg, 'info'),
    warning: (msg: string) => show(msg, 'warning'),
  }
}
