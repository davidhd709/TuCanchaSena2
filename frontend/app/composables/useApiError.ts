/**
 * useApiError — Mapea errores de $fetch a mensajes legibles en español.
 * 
 * Lógica:
 * 1. Preferir response._data?.message si existe.
 * 2. Si hay status code, mapear a mensaje estándar.
 * 3. Si no hay status (error de red), mensaje genérico de conexión.
 */
export const useApiError = (e: any): string => {
  const response = e?.response

  // 1. Mensaje personalizado del backend (preferente)
  if (response?._data?.message) {
    return response._data.message
  }

  // 2. Mapeo por status code
  if (response?.status) {
    const status = response.status
    if (status === 400) return 'Solicitud inválida.'
    if (status === 401) return 'Sesión expirada.'
    if (status === 403) return 'No tienes permisos para esta acción.'
    if (status === 404) return 'Recurso no encontrado.'
    if (status === 422) return 'Datos de validación incorrectos.'
    if (status >= 500)  return 'Error del servidor. Intenta de nuevo.'
  }

  // 3. Fallback (error de red o desconocido)
  return 'Error de conexión. Verifica tu red.'
}
