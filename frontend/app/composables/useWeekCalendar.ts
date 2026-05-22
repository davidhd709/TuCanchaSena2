import { ref, computed, onMounted, onUnmounted, nextTick, unref, type Ref } from 'vue'

/**
 * useWeekCalendar — lógica del calendario semanal de reservas.
 * ===========================================================
 * Extraído de `business/bookings.vue` (Fase 3) para reducir esa página y
 * aislar la lógica de grilla/lanes/semana. El comportamiento es idéntico al
 * original; solo cambió de ubicación.
 *
 * Las funciones puras (`getMonday`, `buildWeekDays`, `assignLanes`,
 * `computeBlockStyle`) se exportan por separado para poder testearlas sin
 * un contexto de componente.
 */

export const CAL_HOUR_HEIGHT = 64 // px por hora en la grilla
export const CAL_START_HOUR = 6 // 06:00
export const CAL_END_HOUR = 23 // 23:00 (exclusiva — última línea a las 23:00)

export interface WeekDay {
  iso: string
  dayName: string
  dayNum: number
  monthShort: string
  isToday: boolean
}

/** Lunes (a medianoche local) de la semana que contiene `d`. */
export function getMonday(d: Date): Date {
  const date = new Date(d)
  const day = date.getDay()
  date.setDate(date.getDate() - (day === 0 ? 6 : day - 1))
  date.setHours(0, 0, 0, 0)
  return date
}

/** Los 7 días desde `weekStart`, marcando cuál es hoy. */
export function buildWeekDays(weekStart: Date, today: Date = new Date()): WeekDay[] {
  const t = new Date(today)
  t.setHours(0, 0, 0, 0)
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(weekStart)
    d.setDate(d.getDate() + i)
    return {
      iso: d.toISOString().split('T')[0] ?? '',
      dayName: d.toLocaleDateString('es-CO', { weekday: 'short' }),
      dayNum: d.getDate(),
      monthShort: d.toLocaleDateString('es-CO', { month: 'short' }),
      isToday: d.getTime() === t.getTime(),
    }
  })
}

/**
 * Asigna carriles (lanes) a reservas solapadas de un mismo día.
 * Devuelve una copia ordenada con `_lane` y `_totalLanes` por reserva.
 */
export function assignLanes(dayBookings: any[]): any[] {
  if (!dayBookings.length) return []

  const sorted = dayBookings
    .map((b) => ({ ...b }))
    .sort((a, b) => a.startTime.localeCompare(b.startTime))

  const laneEnds: string[] = []

  for (const b of sorted) {
    let placed = false
    for (let i = 0; i < laneEnds.length; i++) {
      if ((laneEnds[i] ?? '') <= b.startTime) {
        laneEnds[i] = b.endTime
        b._lane = i
        placed = true
        break
      }
    }
    if (!placed) {
      b._lane = laneEnds.length
      laneEnds.push(b.endTime)
    }
  }

  const total = laneEnds.length
  for (const b of sorted) b._totalLanes = total

  return sorted
}

const toMin = (t: string): number => {
  const parts = t.split(':').map(Number)
  return (parts[0] ?? 0) * 60 + (parts[1] ?? 0)
}

/** Estilo absoluto (top/height/left/width) de un bloque de reserva. */
export function computeBlockStyle(
  b: any,
  startHour: number = CAL_START_HOUR,
  hourHeight: number = CAL_HOUR_HEIGHT,
): Record<string, string> {
  const startMin = toMin(b.startTime)
  const endMin = toMin(b.endTime)
  const gridStartMin = startHour * 60

  const top = ((startMin - gridStartMin) * hourHeight) / 60
  const height = Math.max(((endMin - startMin) * hourHeight) / 60 - 3, 22)
  const lane = b._lane ?? 0
  const total = b._totalLanes ?? 1

  return {
    position: 'absolute',
    top: `${top}px`,
    height: `${height}px`,
    left: `calc(${(lane / total) * 100}% + 2px)`,
    width: `calc(${100 / total}% - 4px)`,
    zIndex: '1',
  }
}

/**
 * Composable reactivo: estado de la semana, navegación, dimensiones de grilla,
 * indicador de hora actual y auto-scroll. Recibe las reservas a mostrar (ref o
 * getter) y devuelve todo lo que el componente del calendario necesita.
 */
export function useWeekCalendar(bookings: Ref<any[]> | (() => any[])) {
  const getBookings = (): any[] =>
    (typeof bookings === 'function' ? bookings() : unref(bookings)) ?? []

  const weekStart = ref(getMonday(new Date()))
  const calBodyRef = ref<HTMLElement | null>(null)
  const currentTime = ref(new Date())
  let timer: ReturnType<typeof setInterval> | undefined

  const prevWeek = () => {
    const d = new Date(weekStart.value)
    d.setDate(d.getDate() - 7)
    weekStart.value = d
  }
  const nextWeek = () => {
    const d = new Date(weekStart.value)
    d.setDate(d.getDate() + 7)
    weekStart.value = d
  }
  const goToToday = () => {
    weekStart.value = getMonday(new Date())
  }

  const weekDays = computed(() => buildWeekDays(weekStart.value))

  const weekRangeLabel = computed(() => {
    const first = weekDays.value[0]
    const last = weekDays.value[6]
    if (!first || !last) return ''
    const f = new Date(first.iso + 'T00:00:00')
    const l = new Date(last.iso + 'T00:00:00')
    const fStr = f.toLocaleDateString('es-CO', { day: 'numeric', month: 'long' })
    const lStr = l.toLocaleDateString('es-CO', { day: 'numeric', month: 'long', year: 'numeric' })
    return `${fStr} – ${lStr}`
  })

  const gridHours = computed(() =>
    Array.from({ length: CAL_END_HOUR - CAL_START_HOUR + 1 }, (_, i) => CAL_START_HOUR + i),
  )
  const totalCalHeight = computed(() => (CAL_END_HOUR - CAL_START_HOUR) * CAL_HOUR_HEIGHT)

  const currentTimeTop = computed(() => {
    const h = currentTime.value.getHours()
    const m = currentTime.value.getMinutes()
    if (h < CAL_START_HOUR || h >= CAL_END_HOUR) return null
    return ((h * 60 + m - CAL_START_HOUR * 60) * CAL_HOUR_HEIGHT) / 60
  })

  const laidOutBookings = (iso: string): any[] =>
    assignLanes(getBookings().filter((b) => b.date === iso))

  const bookingBlockStyle = (b: any): Record<string, string> => computeBlockStyle(b)

  onMounted(async () => {
    // Tick para mover el indicador de "hora actual".
    timer = setInterval(() => {
      currentTime.value = new Date()
    }, 60_000)

    // Scroll inicial a ~1h antes de la hora actual.
    await nextTick()
    if (calBodyRef.value) {
      const now = new Date()
      const scrollToHour = Math.max(0, now.getHours() - 1)
      calBodyRef.value.scrollTop = (scrollToHour - CAL_START_HOUR) * CAL_HOUR_HEIGHT
    }
  })

  onUnmounted(() => {
    if (timer) clearInterval(timer)
  })

  return {
    weekStart,
    calBodyRef,
    weekDays,
    weekRangeLabel,
    gridHours,
    totalCalHeight,
    currentTimeTop,
    prevWeek,
    nextWeek,
    goToToday,
    laidOutBookings,
    bookingBlockStyle,
    START_HOUR: CAL_START_HOUR,
    HOUR_HEIGHT: CAL_HOUR_HEIGHT,
  }
}
