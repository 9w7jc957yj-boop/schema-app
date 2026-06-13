import type { Employee, ShiftTemplate } from '../types'
import { shiftDurationMinutes } from './time'

/**
 * Automatisk ifyllning av grundschemat utifrån varje medarbetares
 * bemanningsgrad (avtalade timmar/vecka). Ger ett *förslag* – ett veckomönster
 * per medarbetare som sedan upprepas över hela den visade perioden.
 *
 * Strategi: greedy ifyllning mot veckomålet. Fulla dagpass läggs ut på
 * vardagar (roterande mallar för variation) och en kortare mall toppar upp
 * sista dagen så totalen hamnar nära avtalet. Nattenheten får nattpass.
 */

/** Mallar att rotera mellan för dag-/nattpersonal. */
const DAY_FULL = ['tpl-dag-0700', 'tpl-dag-0800', 'tpl-dag-0600', 'tpl-mellan', 'tpl-tidig']
const DAY_SHORT = ['tpl-utbildning', 'tpl-kort']
const NIGHT_FULL = ['tpl-natt', 'tpl-journatt']

/** Sluta toppa upp när mindre än så här återstår (2 h). */
const MIN_REMAINING = 120

/** Lägg ett helt pass om återstoden är minst så stor andel av passet, annars toppa upp. */
const FULL_FILL_RATIO = 0.75

interface Candidate {
  id: string
  minutes: number
}

/** Veckodagsindex (måndag = 0 ... söndag = 6) för en "YYYY-MM-DD"-sträng (lokal tid). */
function weekdayIndex(iso: string): number {
  const [y, m, d] = iso.split('-').map(Number)
  return (new Date(y, m - 1, d).getDay() + 6) % 7
}

function toCandidates(ids: string[], templatesById: Map<string, ShiftTemplate>): Candidate[] {
  return ids
    .map((id) => templatesById.get(id))
    .filter((t): t is ShiftTemplate => Boolean(t))
    .map((t) => ({ id: t.id, minutes: shiftDurationMinutes(t) }))
}

/** Närmaste mall (minsta skillnad mot återstående tid). */
function closest(remaining: number, cands: Candidate[]): Candidate {
  return cands.reduce((best, c) =>
    Math.abs(c.minutes - remaining) < Math.abs(best.minutes - remaining) ? c : best,
  )
}

/** Dagordning: vardagar (roterade per medarbetare) följt av helg. */
function dayOrderFor(employeeIndex: number): number[] {
  const weekdays = [0, 1, 2, 3, 4]
  const start = employeeIndex % weekdays.length
  const rotated = [...weekdays.slice(start), ...weekdays.slice(0, start)]
  return [...rotated, 5, 6]
}

/** Bygger veckoplan (dagindex → passmall-id) för en medarbetare. */
function buildEmployeePlan(
  targetMinutes: number,
  dayOrder: number[],
  full: Candidate[],
  short: Candidate[],
): Map<number, string> {
  const plan = new Map<number, string>()
  if (full.length === 0) return plan

  let remaining = targetMinutes
  let fullIdx = 0
  const topUp = short.length > 0 ? short : full

  for (const dayIdx of dayOrder) {
    if (remaining < MIN_REMAINING) break
    const candidate = full[fullIdx % full.length]
    // Lägg ett helt pass om återstoden är stor nog, annars toppa upp med kortare mall.
    if (remaining >= candidate.minutes * FULL_FILL_RATIO) {
      plan.set(dayIdx, candidate.id)
      remaining -= candidate.minutes
      fullIdx++
    } else {
      const t = closest(remaining, topUp)
      plan.set(dayIdx, t.id)
      remaining -= t.minutes
    }
  }
  return plan
}

/** Bygger en bemanningsplan (veckomönster) för alla medarbetare. */
export function buildStaffingPlan(
  employees: Employee[],
  templatesById: Map<string, ShiftTemplate>,
): Map<string, Map<number, string>> {
  const plan = new Map<string, Map<number, string>>()

  employees.forEach((emp, i) => {
    const isNight = emp.unit.toLowerCase().includes('natt')
    const full = toCandidates(isNight ? NIGHT_FULL : DAY_FULL, templatesById)
    const short = toCandidates(isNight ? [] : DAY_SHORT, templatesById)
    const targetMinutes = emp.weeklyContractHours * 60
    plan.set(emp.id, buildEmployeePlan(targetMinutes, dayOrderFor(i), full, short))
  })

  return plan
}

/**
 * Föreslår pass (utan id) för alla medarbetare över de angivna datumen, genom
 * att applicera veckomönstret på varje matchande veckodag.
 */
export function suggestPeriodShifts(
  employees: Employee[],
  templatesById: Map<string, ShiftTemplate>,
  dates: string[],
): { employeeId: string; date: string; templateId: string }[] {
  const plan = buildStaffingPlan(employees, templatesById)
  const out: { employeeId: string; date: string; templateId: string }[] = []

  for (const date of dates) {
    const wd = weekdayIndex(date)
    for (const emp of employees) {
      const templateId = plan.get(emp.id)?.get(wd)
      if (templateId) out.push({ employeeId: emp.id, date, templateId })
    }
  }
  return out
}
