/**
 * commonRules — Reglas de validación reutilizables para formularios (Vuetify).
 */
export const commonRules = {
  required: (v: any) => !!v || 'Este campo es obligatorio',
  email: (v: string) => {
    const pattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return pattern.test(v) || 'Ingresa un correo electrónico válido'
  },
  min: (len: number) => (v: string) => (v && v.length >= len) || `Mínimo ${len} caracteres`,
  phone: (v: string) => {
    if (!v) return true // Opcional
    const pattern = /^\+?[\d\s-]{7,15}$/
    return pattern.test(v) || 'Número de teléfono inválido'
  },
  match: (target: string, msg: string = 'Las contraseñas no coinciden') => (v: string) => v === target || msg
}
