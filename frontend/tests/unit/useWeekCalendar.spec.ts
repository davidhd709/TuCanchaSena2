/**
 * TEST UNITARIO — helpers puros de useWeekCalendar (Fase 3)
 * ========================================================
 * El composable extrae la lógica del calendario semanal de business/bookings.vue.
 * Aquí testeamos sus funciones PURAS (sin contexto de componente), que es donde
 * vive la lógica con riesgo: cálculo de lunes, días de la semana, asignación de
 * carriles a reservas solapadas y estilo de los bloques.
 *
 * Import relativo: el alias `~` no se resuelve en esta config de Vitest.
 */
import {
  assignLanes,
  buildWeekDays,
  computeBlockStyle,
  getMonday,
} from '../../app/composables/useWeekCalendar'

describe('getMonday', () => {
  it('devuelve el lunes de una fecha entre semana (miércoles)', () => {
    const monday = getMonday(new Date(2025, 0, 8)) // mié 8 ene 2025
    expect(monday.getFullYear()).toBe(2025)
    expect(monday.getMonth()).toBe(0)
    expect(monday.getDate()).toBe(6) // lun 6 ene
  })

  it('para un domingo devuelve el lunes anterior (no el siguiente)', () => {
    const monday = getMonday(new Date(2025, 0, 5)) // dom 5 ene 2025
    expect(monday.getMonth()).toBe(11) // dic
    expect(monday.getDate()).toBe(30) // lun 30 dic 2024
  })

  it('normaliza la hora a medianoche', () => {
    const monday = getMonday(new Date(2025, 0, 8, 15, 30, 45))
    expect(monday.getHours()).toBe(0)
    expect(monday.getMinutes()).toBe(0)
    expect(monday.getSeconds()).toBe(0)
  })
})

describe('buildWeekDays', () => {
  it('genera 7 días consecutivos desde el lunes dado', () => {
    const days = buildWeekDays(new Date(2025, 0, 6), new Date(2025, 0, 8))
    expect(days).toHaveLength(7)
    expect(days[0]!.dayNum).toBe(6)
    expect(days[6]!.dayNum).toBe(12)
  })

  it('marca isToday solo en el día correcto', () => {
    const days = buildWeekDays(new Date(2025, 0, 6), new Date(2025, 0, 8))
    expect(days[2]!.isToday).toBe(true) // mié 8
    expect(days[0]!.isToday).toBe(false)
    expect(days.filter((d) => d.isToday)).toHaveLength(1)
  })
})

describe('assignLanes', () => {
  it('lista vacía → []', () => {
    expect(assignLanes([])).toEqual([])
  })

  it('reservas no solapadas comparten un solo carril', () => {
    const out = assignLanes([
      { id: 'a', startTime: '10:00', endTime: '11:00' },
      { id: 'b', startTime: '11:00', endTime: '12:00' },
    ])
    expect(out.every((b) => b._lane === 0)).toBe(true)
    expect(out.every((b) => b._totalLanes === 1)).toBe(true)
  })

  it('reservas solapadas se reparten en carriles distintos', () => {
    const out = assignLanes([
      { id: 'a', startTime: '10:00', endTime: '12:00' },
      { id: 'b', startTime: '11:00', endTime: '13:00' },
    ])
    expect(out.map((b) => b._lane).sort()).toEqual([0, 1])
    expect(out.every((b) => b._totalLanes === 2)).toBe(true)
  })

  it('no muta los objetos originales', () => {
    const original = [{ id: 'a', startTime: '10:00', endTime: '11:00' }] as any[]
    assignLanes(original)
    expect(original[0]._lane).toBeUndefined()
  })
})

describe('computeBlockStyle', () => {
  it('posiciona un bloque de 06:00–07:00 en el tope de la grilla', () => {
    const style = computeBlockStyle(
      { startTime: '06:00', endTime: '07:00', _lane: 0, _totalLanes: 1 },
      6,
      64,
    )
    expect(style.position).toBe('absolute')
    expect(style.top).toBe('0px')
    expect(style.height).toBe('61px') // 64 - 3
    expect(style.width).toBe('calc(100% - 4px)')
    expect(style.zIndex).toBe('1')
  })

  it('aplica una altura mínima de 22px para reservas muy cortas', () => {
    const style = computeBlockStyle(
      { startTime: '06:00', endTime: '06:10', _lane: 0, _totalLanes: 1 },
      6,
      64,
    )
    expect(style.height).toBe('22px')
  })

  it('reparte el ancho entre carriles', () => {
    const style = computeBlockStyle(
      { startTime: '08:00', endTime: '09:00', _lane: 1, _totalLanes: 2 },
      6,
      64,
    )
    expect(style.left).toBe('calc(50% + 2px)')
    expect(style.width).toBe('calc(50% - 4px)')
  })
})
