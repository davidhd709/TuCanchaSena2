/**
 * TEST UNITARIO — Utilidades y Lógica Pura del Frontend
 * =====================================================
 * Testeamos funciones puras y lógica de negocio del frontend
 * que NO depende de Vue, Nuxt o APIs del navegador.
 *
 * Estas funciones son las más fáciles de testear porque son deterministas:
 * la misma entrada siempre produce la misma salida.
 *
 * En Vitest con globals: true, NO necesitamos importar describe/it/expect
 */

// ─────────────────────────────────────────────────────────────────
// FUNCIONES A TESTEAR
// Extraemos la lógica del servicio de bookings del frontend
// para validarla de forma aislada
// ─────────────────────────────────────────────────────────────────

/**
 * Formatea un precio en pesos colombianos
 * Ejemplo: 50000 → "$50.000"
 */
function formatPrice(amount: number): string {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0,
  }).format(amount)
}

/**
 * Calcula el precio total de una reserva
 * @param startTime - Hora de inicio en formato "HH:MM"
 * @param endTime   - Hora de fin en formato "HH:MM"
 * @param pricePerHour - Precio por hora
 */
function calculateBookingTotal(startTime: string, endTime: string, pricePerHour: number): number {
  const [startH, startM] = startTime.split(':').map(Number)
  const [endH, endM] = endTime.split(':').map(Number)
  const startMinutes = startH * 60 + startM
  const endMinutes = endH * 60 + endM
  const hours = (endMinutes - startMinutes) / 60
  return hours * pricePerHour
}

/**
 * Valida si una fecha es hoy o en el futuro (no pasada)
 * Los usuarios no deben poder reservar canchas en fechas pasadas.
 */
function isDateValid(dateStr: string): boolean {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const date = new Date(`${dateStr}T00:00:00`)
  return date >= today
}

/**
 * Devuelve el nombre del día de la semana en inglés a partir de una fecha
 * Necesario para buscar la disponibilidad de la cancha
 */
function getDayOfWeek(dateStr: string): string {
  const DAYS = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']
  const date = new Date(`${dateStr}T00:00:00`)
  return DAYS[date.getDay()]
}

/**
 * Valida el formato de un email
 */
function isValidEmail(email: string): boolean {
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return regex.test(email)
}

/**
 * Valida que una contraseña tenga al menos 8 caracteres,
 * una mayúscula, una minúscula y un número.
 */
function isValidPassword(password: string): boolean {
  return (
    password.length >= 8 &&
    /[A-Z]/.test(password) &&
    /[a-z]/.test(password) &&
    /[0-9]/.test(password)
  )
}

// ─────────────────────────────────────────────────────────────────
// TESTS
// ─────────────────────────────────────────────────────────────────

describe('calculateBookingTotal()', () => {
  it('calcula correctamente para 1 hora', () => {
    // 10:00 - 11:00 = 1 hora × $50.000 = $50.000
    expect(calculateBookingTotal('10:00', '11:00', 50000)).toBe(50000)
  })

  it('calcula correctamente para 2 horas', () => {
    // 14:00 - 16:00 = 2 horas × $50.000 = $100.000
    expect(calculateBookingTotal('14:00', '16:00', 50000)).toBe(100000)
  })

  it('calcula correctamente para media hora', () => {
    // 10:00 - 10:30 = 0.5 horas × $60.000 = $30.000
    expect(calculateBookingTotal('10:00', '10:30', 60000)).toBe(30000)
  })

  it('devuelve 0 si inicio y fin son iguales', () => {
    expect(calculateBookingTotal('10:00', '10:00', 50000)).toBe(0)
  })
})

describe('getDayOfWeek()', () => {
  it('identifica correctamente el lunes', () => {
    // 2025-01-06 es un lunes
    expect(getDayOfWeek('2025-01-06')).toBe('monday')
  })

  it('identifica correctamente el domingo', () => {
    // 2025-01-05 es un domingo
    expect(getDayOfWeek('2025-01-05')).toBe('sunday')
  })

  it('identifica correctamente el sábado', () => {
    // 2025-01-04 es un sábado
    expect(getDayOfWeek('2025-01-04')).toBe('saturday')
  })
})

describe('isDateValid()', () => {
  it('acepta una fecha futura', () => {
    // Creamos una fecha que sea mañana para que sea siempre válida
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    const dateStr = tomorrow.toISOString().split('T')[0]
    expect(isDateValid(dateStr)).toBe(true)
  })

  it('acepta la fecha de hoy', () => {
    const today = new Date().toISOString().split('T')[0]
    expect(isDateValid(today)).toBe(true)
  })

  it('rechaza una fecha pasada', () => {
    expect(isDateValid('2020-01-01')).toBe(false)
  })
})

describe('isValidEmail()', () => {
  it('acepta un email válido', () => {
    expect(isValidEmail('juan@tucancha.com')).toBe(true)
    expect(isValidEmail('user+tag@domain.co')).toBe(true)
  })

  it('rechaza emails inválidos', () => {
    expect(isValidEmail('no-arroba')).toBe(false)
    expect(isValidEmail('@sin-usuario.com')).toBe(false)
    expect(isValidEmail('sin-dominio@')).toBe(false)
    expect(isValidEmail('')).toBe(false)
  })
})

describe('isValidPassword()', () => {
  it('acepta contraseñas válidas', () => {
    expect(isValidPassword('Password1')).toBe(true)
    expect(isValidPassword('MiClave123')).toBe(true)
  })

  it('rechaza contraseñas sin mayúscula', () => {
    expect(isValidPassword('password1')).toBe(false)
  })

  it('rechaza contraseñas sin número', () => {
    expect(isValidPassword('Password')).toBe(false)
  })

  it('rechaza contraseñas cortas (menos de 8 caracteres)', () => {
    expect(isValidPassword('Pass1')).toBe(false)
  })
})

describe('formatPrice()', () => {
  it('formatea correctamente un precio en COP', () => {
    const formatted = formatPrice(50000)
    // Verificamos que incluya el valor sin importar el formato exacto de la moneda
    expect(formatted).toContain('50')
    expect(formatted.replace(/\D/g, '')).toContain('50000')
  })
})
