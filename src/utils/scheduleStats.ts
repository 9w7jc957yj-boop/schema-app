import type { Employee, ScheduledShift, ShiftTemplate } from '../types'
import { parseTimeToMinutes, shiftDurationMinutes } from './time'

export interface ScheduleStats {
  /** Antal pass inom den visade perioden. */
  assignedCount: number
  /** Antal celler (medarbetare + dag) där samma person har överlappande pass. */
  conflictCount: number
  /** Pass-id:n som ingår i en krock (för att markera blocken). */
  conflictShiftIds: Set<string>
  /** Schemalagd andel av avtalade timmar i procent (kan överstiga 100). */
  coverage: number
}

/** Tidsintervall [start, slut] i minuter (nattpass kapas vid 24:00 inom dygnet). */
function interval(template: ShiftTemplate): [number, number] {
  const start = parseTimeToMinutes(template.startTime)
  return [start, template.crossesMidnight ? 1440 : parseTimeToMinutes(template.endTime)]
}

/**
 * Sammanställer nyckeltal för en uppsättning pass inom de visade datumen:
 * antal pass, krockar (dubbelbokad personal) och täckningsgrad mot avtal.
 */
export function computeStats(
  employees: Employee[],
  shifts: ScheduledShift[],
  templatesById: Map<string, ShiftTemplate>,
  dates: string[],
): ScheduleStats {
  const visible = new Set(dates)
  const inPeriod = shifts.filter((s) => visible.has(s.date))

  // Krockar: gruppera per medarbetare + dag och leta överlappande intervall.
  const conflictShiftIds = new Set<string>()
  const byCell = new Map<string, ScheduledShift[]>()
  for (const s of inPeriod) {
    const key = `${s.employeeId}|${s.date}`
    const list = byCell.get(key)
    if (list) list.push(s)
    else byCell.set(key, [s])
  }

  let conflictCount = 0
  for (const list of byCell.values()) {
    if (list.length < 2) continue
    const items = list
      .map((s) => ({ s, iv: templatesById.get(s.templateId) }))
      .filter((x) => x.iv)
      .map((x) => ({ s: x.s, iv: interval(x.iv!) }))
      .sort((a, b) => a.iv[0] - b.iv[0])

    let cellHasConflict = false
    for (let i = 1; i < items.length; i++) {
      if (items[i].iv[0] < items[i - 1].iv[1]) {
        conflictShiftIds.add(items[i].s.id)
        conflictShiftIds.add(items[i - 1].s.id)
        cellHasConflict = true
      }
    }
    if (cellHasConflict) conflictCount++
  }

  // Täckning: schemalagda minuter / avtalade minuter för perioden.
  const multiplier = dates.length / 7
  let scheduled = 0
  for (const s of inPeriod) {
    const t = templatesById.get(s.templateId)
    if (t) scheduled += shiftDurationMinutes(t)
  }
  const contract = employees.reduce((sum, e) => sum + e.weeklyContractHours * 60 * multiplier, 0)
  const coverage = contract > 0 ? Math.round((scheduled / contract) * 100) : 0

  return { assignedCount: inPeriod.length, conflictCount, conflictShiftIds, coverage }
}
