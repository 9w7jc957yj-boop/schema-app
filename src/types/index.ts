// Domänmodell för schemaläggningen.
// Alla typer är medvetet enkla — prototypen håller datan i minnet + localStorage.

/** En medarbetare som kan tilldelas pass. */
export interface Employee {
  id: string
  firstName: string
  lastName: string
  /** Enhet/avdelning, t.ex. "Avd 3" eller "Akuten". */
  unit: string
  /** Anställningsgrad i procent, t.ex. 75. */
  employmentRate: number
  /** Avtalade timmar per vecka, härleds från graden (100 % = 40 h). */
  weeklyContractHours: number
}

/** Ett tidssegment uttryckt i klockslag, t.ex. för nattpass som visas tvådelat. */
export interface TimeSegment {
  start: string // "HH:MM"
  end: string // "HH:MM"
}

/** En passmall i paletten — själva "stämpeln" som dras ut i schemat. */
export interface ShiftTemplate {
  id: string
  /** Etikett, t.ex. "06:00-14:45" eller "Jourdag". */
  label: string
  startTime: string // "HH:MM"
  endTime: string // "HH:MM"
  /** Bakgrundsfärg som hex, t.ex. "#0A84FF". */
  color: string
  /** True om passet sträcker sig förbi midnatt. */
  crossesMidnight: boolean
  /** Frivillig tvådelad visning för nattpass (före/efter midnatt). */
  segments?: TimeSegment[]
}

/** Ett konkret pass utlagt på en medarbetare en viss dag. */
export interface ScheduledShift {
  id: string
  employeeId: string
  date: string // "YYYY-MM-DD"
  templateId: string
}

/** Ett namngivet schema som samlar alla utlagda pass. */
export interface Schedule {
  id: string
  name: string
  shifts: ScheduledShift[]
}

/**
 * Vilket schema som visas/redigeras.
 * - `grundschema`: grundbemanningen, läggs vanligtvis per månad. Grunden för planeringen.
 * - `liveschema`: den aktiva veckan, justeras löpande (t.ex. vid sjukdom).
 */
export type ScheduleMode = 'grundschema' | 'liveschema'

/** En brukare/boende som personalen ger stöd. */
export interface Brukare {
  id: string
  name: string
  /** Boende/enhet personen tillhör. */
  unit: string
  /** Kort om personen och stödbehov. */
  note?: string
  /** Intressen/rutiner, kort lista som visas i brukarschemat. */
  interests?: string
}

/** Typ av insats – styr ikon och färg i dagvyn. */
export type ActivityCategory =
  | 'inkop'
  | 'aktivitet'
  | 'utflykt'
  | 'hygien'
  | 'medicin'
  | 'maltid'
  | 'stad'
  | 'ovrigt'

/** En planerad insats för en brukare en viss dag (t.ex. "handla kl 16:00"). */
export interface DayActivity {
  id: string
  brukareId: string
  date: string // "YYYY-MM-DD"
  startTime: string // "HH:MM"
  endTime?: string
  /** Vad som ska göras, t.ex. "Handla mat på ICA". */
  title: string
  category: ActivityCategory
  /** Medarbetare som ansvarar för insatsen. */
  responsibleEmployeeId?: string
  location?: string
  note?: string
}
