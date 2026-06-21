import type { Schedule, ScheduledShift } from '../types'
import { makeId } from '../utils/storage'

/**
 * Förifyllning av schemat. För att matrisen alltid ska se realistisk ut
 * oavsett vilket datum appen öppnas, byggs passen relativt mot veckans
 * sju datum (index 0 = måndag ... 6 = söndag).
 *
 * Varje rad nedan är [medarbetarIndex, dagIndex, passmallId].
 */
const SEED: Array<[number, number, string]> = [
  // Anna (100 %) – dagspass mån–fre
  [0, 0, 'tpl-dag'],
  [0, 1, 'tpl-dag'],
  [0, 2, 'tpl-dag'],
  [0, 3, 'tpl-dag'],
  [0, 4, 'tpl-dag'],

  // Johan (75 %) – kvällspass, ledig torsdag
  [1, 0, 'tpl-kvall'],
  [1, 1, 'tpl-kvall'],
  [1, 2, 'tpl-kvall'],
  [1, 4, 'tpl-kvall'],

  // Sara (100 %) – jour och helg
  [2, 0, 'tpl-jour'],
  [2, 1, 'tpl-morgon'],
  [2, 2, 'tpl-morgon'],
  [2, 5, 'tpl-helg'],
  [2, 6, 'tpl-helg'],

  // Mehmet (50 %) – några morgonpass
  [3, 1, 'tpl-morgon'],
  [3, 3, 'tpl-morgon'],

  // Elin (80 %) – morgon + dag
  [4, 0, 'tpl-morgon'],
  [4, 1, 'tpl-morgon'],
  [4, 2, 'tpl-dag'],
  [4, 3, 'tpl-dag'],

  // David (100 %) – kvällar + helg
  [5, 1, 'tpl-kvall'],
  [5, 2, 'tpl-kvall'],
  [5, 3, 'tpl-kvall'],
  [5, 5, 'tpl-helg'],

  // Fatima (75 %) – jour och helg
  [6, 0, 'tpl-jour'],
  [6, 3, 'tpl-jour'],
  [6, 5, 'tpl-helg'],
]

/** Veckodagsindex (måndag = 0 ... söndag = 6) för en "YYYY-MM-DD"-sträng. */
function weekdayIndex(date: string): number {
  return (new Date(date).getDay() + 6) % 7
}

/**
 * Bygger grundschemat genom att upprepa veckomönstret (SEED) över alla angivna
 * datum. Varje datum får de pass som matchar dess veckodag, så att schemat fylls
 * lika för varje vecka oavsett om perioden är en vecka eller en hel månad.
 */
export function buildSeedSchedule(dates: string[], employeeIds: string[]): Schedule {
  const shifts: ScheduledShift[] = []
  for (const date of dates) {
    const wd = weekdayIndex(date)
    for (const [empIdx, dayIdx, templateId] of SEED) {
      if (dayIdx === wd && employeeIds[empIdx]) {
        shifts.push({ id: makeId('shift'), employeeId: employeeIds[empIdx], date, templateId })
      }
    }
  }

  return {
    id: 'schedule-grundschema',
    name: 'Grundschema',
    shifts,
  }
}

/**
 * Skapar ett liveschema utifrån grundschemat. Liveschemat ärver grundbemanningen
 * men får egna pass-id:n så att det kan justeras självständigt (t.ex. vid sjukdom)
 * utan att grundschemat påverkas.
 */
export function deriveLiveSchedule(base: Schedule): Schedule {
  return {
    id: 'schedule-liveschema',
    name: 'Liveschema',
    shifts: base.shifts.map((s) => ({ ...s, id: makeId('shift') })),
  }
}
