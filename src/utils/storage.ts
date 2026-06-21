import type { DayActivity, Schedule, ScheduleMode, ShiftTemplate } from '../types'

const STORAGE_KEYS: Record<ScheduleMode, string> = {
  grundschema: 'schema-app:grundschema:v2',
  liveschema: 'schema-app:liveschema:v2',
}

const ACTIVITIES_KEY = 'schema-app:activities:v1'
const TEMPLATES_KEY = 'schema-app:templates:v2'

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

/** Läser brukarnas insatser från localStorage, eller null om inget finns. */
export function loadActivities(): DayActivity[] | null {
  try {
    const raw = localStorage.getItem(ACTIVITIES_KEY)
    if (!raw) return null
    return JSON.parse(raw) as DayActivity[]
  } catch {
    return null
  }
}

/** Sparar brukarnas insatser till localStorage. */
export function saveActivities(activities: DayActivity[]): void {
  try {
    localStorage.setItem(ACTIVITIES_KEY, JSON.stringify(activities))
  } catch {
    // ignorera
  }
}

/** Läser sparade passmallar från localStorage, eller null om inget finns. */
export function loadTemplates(): ShiftTemplate[] | null {
  try {
    const raw = localStorage.getItem(TEMPLATES_KEY)
    if (!raw) return null
    return JSON.parse(raw) as ShiftTemplate[]
  } catch {
    return null
  }
}

/** Sparar passmallar till localStorage. */
export function saveTemplates(templates: ShiftTemplate[]): void {
  try {
    localStorage.setItem(TEMPLATES_KEY, JSON.stringify(templates))
  } catch {
    // ignorera
  }
}

/** Genererar ett enkelt unikt id utan externa beroenden. */
export function makeId(prefix = 'id'): string {
  return `${prefix}-${Math.random().toString(36).slice(2, 9)}`
}
