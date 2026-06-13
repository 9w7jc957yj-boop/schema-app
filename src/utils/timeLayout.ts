import type { ScheduledShift, ShiftTemplate } from '../types'
import { parseTimeToMinutes } from './time'
import { addDaysISO } from './week'

/**
 * Ett tidssegment att rita i tidsrutnätet för en viss dag. Pass som korsar
 * midnatt delas upp: före midnatt visas på passets datum, delen efter midnatt
 * visas på nästa dag (continued).
 */
export interface DaySegment {
  shift: ScheduledShift
  template: ShiftTemplate
  startMin: number
  endMin: number
  /** True för delen efter midnatt (kommer från gårdagens nattpass). */
  continued: boolean
  /** True om passet fortsätter förbi midnatt (segmentet kapas vid 24:00). */
  continues: boolean
  /** Kolumnindex vid överlapp samt antal kolumner i överlappsgruppen. */
  col: number
  cols: number
}

interface MutableSegment extends DaySegment {
  _col: number
}

/**
 * Tilldelar kolumner till överlappande segment (kalender-stil): segment som
 * krockar i tid läggs sida vid sida. Varje överlappskluster delar bredd lika.
 */
function assignColumns(segments: MutableSegment[]): void {
  segments.sort((a, b) => a.startMin - b.startMin || a.endMin - b.endMin)

  let cluster: MutableSegment[] = []
  let clusterEnd = -1
  const colEnds: number[] = []

  const flush = () => {
    const cols = Math.max(...cluster.map((s) => s._col)) + 1
    cluster.forEach((s) => (s.cols = cols))
    cluster = []
    colEnds.length = 0
  }

  for (const seg of segments) {
    if (cluster.length && seg.startMin >= clusterEnd) flush()

    let placed = false
    for (let i = 0; i < colEnds.length; i++) {
      if (colEnds[i] <= seg.startMin) {
        seg._col = i
        colEnds[i] = seg.endMin
        placed = true
        break
      }
    }
    if (!placed) {
      seg._col = colEnds.length
      colEnds.push(seg.endMin)
    }

    cluster.push(seg)
    clusterEnd = Math.max(clusterEnd, seg.endMin)
  }
  if (cluster.length) flush()

  segments.forEach((s) => (s.col = s._col))
}

/**
 * Returnerar alla segment som ska ritas i kolumnen för `dayDate`, inklusive
 * efter-midnatt-delar från gårdagens nattpass, med kolumnlayout beräknad.
 */
export function layoutDaySegments(
  dayDate: string,
  shifts: ScheduledShift[],
  templatesById: Map<string, ShiftTemplate>,
): DaySegment[] {
  const prev = addDaysISO(dayDate, -1)
  const segments: MutableSegment[] = []

  for (const shift of shifts) {
    const template = templatesById.get(shift.templateId)
    if (!template) continue

    if (shift.date === dayDate) {
      const startMin = parseTimeToMinutes(template.startTime)
      const endMin = template.crossesMidnight ? 1440 : parseTimeToMinutes(template.endTime)
      segments.push({
        shift, template, startMin, endMin,
        continued: false, continues: template.crossesMidnight,
        col: 0, cols: 1, _col: 0,
      })
    } else if (shift.date === prev && template.crossesMidnight) {
      segments.push({
        shift, template, startMin: 0, endMin: parseTimeToMinutes(template.endTime),
        continued: true, continues: false,
        col: 0, cols: 1, _col: 0,
      })
    }
  }

  assignColumns(segments)
  return segments
}
