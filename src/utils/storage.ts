import type { Schedule, ScheduleMode } from '../types'

const STORAGE_KEYS: Record<ScheduleMode, string> = {
  grundschema: 'schema-app:grundschema:v1',
  liveschema: 'schema-app:liveschema:v1',
}

/** Läser sparat schema för ett läge från localStorage, eller null om inget finns. */
export function loadSchedule(mode: ScheduleMode): Schedule | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS[mode])
    if (!raw) return null
    return JSON.parse(raw) as Schedule
  } catch {
    return null
  }
}

/** Sparar schemat för ett läge till localStorage. Tyst felhantering — prototyp. */
export function saveSchedule(mode: ScheduleMode, schedule: Schedule): void {
  try {
    localStorage.setItem(STORAGE_KEYS[mode], JSON.stringify(schedule))
  } catch {
    // Ignorera (t.ex. privat läge / full kvot).
  }
}

/** Genererar ett enkelt unikt id utan externa beroenden. */
export function makeId(prefix = 'id'): string {
  return `${prefix}-${Math.random().toString(36).slice(2, 9)}`
}
