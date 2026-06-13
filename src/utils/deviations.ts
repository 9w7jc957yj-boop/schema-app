import type { Schedule } from '../types'

export interface DeviationInfo {
  /** Nycklar "employeeId|date" för celler där liveschemat skiljer sig från grundschemat. */
  cellKeys: Set<string>
  /** Antal avvikande celler. */
  count: number
}

function cellKey(employeeId: string, date: string): string {
  return `${employeeId}|${date}`
}

/** Bygger en karta cellnyckel → sorterad lista av passmall-id:n. */
function shiftsByCell(schedule: Schedule): Map<string, string[]> {
  const map = new Map<string, string[]>()
  for (const s of schedule.shifts) {
    const key = cellKey(s.employeeId, s.date)
    const list = map.get(key)
    if (list) list.push(s.templateId)
    else map.set(key, [s.templateId])
  }
  for (const list of map.values()) list.sort()
  return map
}

/**
 * Jämför liveschemat mot grundschemat och returnerar vilka celler som avviker.
 * En cell avviker om uppsättningen pass (passmallar) skiljer sig — dvs. ett pass
 * har lagts till, tagits bort eller bytts ut jämfört med grundbemanningen.
 */
export function computeDeviations(base: Schedule, live: Schedule): DeviationInfo {
  const baseCells = shiftsByCell(base)
  const liveCells = shiftsByCell(live)
  const allKeys = new Set<string>([...baseCells.keys(), ...liveCells.keys()])
  const cellKeys = new Set<string>()

  for (const key of allKeys) {
    const a = (baseCells.get(key) ?? []).join(',')
    const b = (liveCells.get(key) ?? []).join(',')
    if (a !== b) cellKeys.add(key)
  }

  return { cellKeys, count: cellKeys.size }
}
