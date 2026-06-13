import type { ShiftTemplate, TimeSegment } from '../types'

/** Heltimmar per vecka vid 100 % anställning. */
export const FULL_TIME_WEEKLY_HOURS = 40

/** Konverterar "HH:MM" till antal minuter efter midnatt. */
export function parseTimeToMinutes(time: string): number {
  const [h, m] = time.split(':').map(Number)
  return h * 60 + m
}

/** Formaterar ett antal minuter till "H:MM" (timmar kan vara > 24). */
export function formatMinutesAsHHMM(totalMinutes: number): string {
  const sign = totalMinutes < 0 ? '-' : ''
  const abs = Math.abs(Math.round(totalMinutes))
  const h = Math.floor(abs / 60)
  const m = abs % 60
  return `${sign}${h}:${String(m).padStart(2, '0')}`
}

/**
 * Längden på ett pass i minuter. Hanterar passering över midnatt:
 * slutar passet "tidigare" än det börjar antas det sträcka sig till nästa dygn.
 */
export function shiftDurationMinutes(template: ShiftTemplate): number {
  const start = parseTimeToMinutes(template.startTime)
  const end = parseTimeToMinutes(template.endTime)
  const raw = end - start
  return raw <= 0 ? raw + 24 * 60 : raw
}

export function shiftDurationHours(template: ShiftTemplate): number {
  return shiftDurationMinutes(template) / 60
}

/**
 * Returnerar de tvådelade segmenten som ska visas för ett pass.
 * Använder mallens egna segments om de finns, annars härleds de för
 * pass som korsar midnatt (start→24:00 och 00:00→slut).
 */
export function displaySegments(template: ShiftTemplate): TimeSegment[] {
  if (template.segments && template.segments.length > 0) return template.segments
  if (template.crossesMidnight) {
    return [
      { start: template.startTime, end: '24:00' },
      { start: '00:00', end: template.endTime },
    ]
  }
  return [{ start: template.startTime, end: template.endTime }]
}
