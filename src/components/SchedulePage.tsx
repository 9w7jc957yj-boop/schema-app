import { useEffect, useMemo, useState } from 'react'
import type { Schedule, ScheduledShift, ScheduleMode } from '../types'
import type { GridView } from '../utils/week'
import type { DragPayload } from '../utils/dnd'
import { employees } from '../data/employees'
import { shiftTemplates } from '../data/shiftTemplates'
import { brukare } from '../data/brukare'
import { buildActivities } from '../data/activities'
import { buildSeedSchedule, deriveLiveSchedule } from '../data/seedSchedule'
import { loadSchedule, saveSchedule, makeId } from '../utils/storage'
import { startOfWeek, buildWeek, buildMonth, formatWeekRange, formatMonthLabel } from '../utils/week'
import { computeDeviations } from '../utils/deviations'
import { suggestPeriodShifts } from '../utils/autofill'
import Toolbar from './Toolbar'
import ShiftPalette from './ShiftPalette'
import ScheduleGrid from './ScheduleGrid'
import DayDrawer from './DayDrawer'
import './SchedulePage.css'

/** Toppnivåvy som äger schemats tillstånd och kopplar ihop delarna. */
export default function SchedulePage() {
  // Veckan och månaden beräknas en gång kring dagens datum.
  const weekDays = useMemo(() => buildWeek(startOfWeek(new Date())), [])
  const monthDays = useMemo(() => buildMonth(new Date()), [])
  const templatesById = useMemo(
    () => new Map(shiftTemplates.map((t) => [t.id, t])),
    [],
  )
  const employeesById = useMemo(() => new Map(employees.map((e) => [e.id, e])), [])
  const brukareById = useMemo(() => new Map(brukare.map((b) => [b.id, b])), [])

  // Datum att seeda: hela månaden + aktuell vecka (veckan kan spilla över månadsskiftet).
  const seedDates = useMemo(() => {
    const set = new Set([...monthDays.map((d) => d.date), ...weekDays.map((d) => d.date)])
    return [...set]
  }, [monthDays, weekDays])

  // Brukarnas insatser (mockade) för perioden – visas i dagdrawern.
  const activities = useMemo(
    () => buildActivities(seedDates, brukare.map((b) => b.id), employees.map((e) => e.id)),
    [seedDates],
  )

  // Grundschemat: grundbemanningen. Seedas om inget finns sparat.
  const [grundschema, setGrundschema] = useState<Schedule>(() => {
    const stored = loadSchedule('grundschema')
    if (stored) return stored
    return buildSeedSchedule(seedDates, employees.map((e) => e.id))
  })

  // Liveschemat: ärver grundbemanningen vid första start, justeras sedan fritt.
  const [liveschema, setLiveschema] = useState<Schedule>(() => {
    const stored = loadSchedule('liveschema')
    if (stored) return stored
    return deriveLiveSchedule(grundschema)
  })

  const [mode, setMode] = useState<ScheduleMode>('liveschema')
  // Vy för grundschemat (vecka/månad). Liveschemat visas alltid per vecka.
  const [grundView, setGrundView] = useState<GridView>('manad')

  // Dagdrawer: vald dag (endast i liveschemat) som visar dagens insatser.
  const [drawerDate, setDrawerDate] = useState<string | null>(null)
  const drawerData = useMemo(() => {
    if (!drawerDate) return null
    const acts = activities.filter((a) => a.date === drawerDate)
    const onDuty = liveschema.shifts
      .filter((s) => s.date === drawerDate)
      .map((s) => ({ employee: employeesById.get(s.employeeId), template: templatesById.get(s.templateId) }))
      .filter((x): x is { employee: NonNullable<typeof x.employee>; template: NonNullable<typeof x.template> } =>
        Boolean(x.employee && x.template),
      )
      .sort((a, b) => a.template.startTime.localeCompare(b.template.startTime))
    return { acts, onDuty }
  }, [drawerDate, activities, liveschema, employeesById, templatesById])

  // Aktivt schema + dess setter beroende på läge.
  const active = mode === 'grundschema' ? grundschema : liveschema
  const setActive = mode === 'grundschema' ? setGrundschema : setLiveschema

  // Visad period: grundschemat kan visas per månad, annars vecka.
  const showMonth = mode === 'grundschema' && grundView === 'manad'
  const days = showMonth ? monthDays : weekDays
  const view: GridView = showMonth ? 'manad' : 'vecka'
  const contractMultiplier = days.length / 7
  const totalHeaderLabel = showMonth ? 'Månad / Avtal' : 'Vecka / Avtal'

  // Persistens per läge.
  useEffect(() => saveSchedule('grundschema', grundschema), [grundschema])
  useEffect(() => saveSchedule('liveschema', liveschema), [liveschema])

  // Avvikelser: var liveschemat skiljer sig från grundbemanningen.
  const deviations = useMemo(
    () => computeDeviations(grundschema, liveschema),
    [grundschema, liveschema],
  )

  // --- Mutationer på det aktiva schemat ----------------------------------

  const addShift = (employeeId: string, date: string, templateId: string) => {
    setActive((prev) => ({
      ...prev,
      shifts: [
        ...prev.shifts,
        { id: makeId('shift'), employeeId, date, templateId } satisfies ScheduledShift,
      ],
    }))
  }

  const moveShift = (shiftId: string, employeeId: string, date: string) => {
    setActive((prev) => ({
      ...prev,
      shifts: prev.shifts.map((s) =>
        s.id === shiftId ? { ...s, employeeId, date } : s,
      ),
    }))
  }

  const removeShift = (shiftId: string) => {
    setActive((prev) => ({
      ...prev,
      shifts: prev.shifts.filter((s) => s.id !== shiftId),
    }))
  }

  const handleDropPayload = (payload: DragPayload, employeeId: string, date: string) => {
    if (payload.kind === 'template') {
      addShift(employeeId, date, payload.templateId)
    } else {
      moveShift(payload.shiftId, employeeId, date)
    }
  }

  /**
   * Fyller ut grundschemat för givna datum utifrån bemanningsgrad.
   * Ersätter befintliga pass i perioden med ett genererat förslag.
   */
  const fillForDates = (dates: string[], periodLabel: string) => {
    if (
      !window.confirm(
        `Fyll ut grundschemat för ${periodLabel} utifrån bemanningsgrad? Befintliga pass i perioden ersätts av ett förslag.`,
      )
    ) {
      return
    }
    const visible = new Set(dates)
    const suggested = suggestPeriodShifts(employees, templatesById, dates).map((s) => ({
      ...s,
      id: makeId('shift'),
    }))
    setGrundschema((prev) => ({
      ...prev,
      // Behåll pass utanför perioden, ersätt pass inom perioden med förslaget.
      shifts: [...prev.shifts.filter((s) => !visible.has(s.date)), ...suggested],
    }))
  }

  const fillGrundschema = () =>
    fillForDates(days.map((d) => d.date), showMonth ? formatMonthLabel(days).toLowerCase() : 'veckan')

  /** Återställer liveschemat till grundschemat (kastar veckans justeringar). */
  const resetLiveToBase = () => {
    if (
      deviations.count > 0 &&
      !window.confirm(
        `Återställ liveschemat till grundschemat? ${deviations.count} avvikelse(r) i veckan tas bort.`,
      )
    ) {
      return
    }
    setLiveschema(deriveLiveSchedule(grundschema))
  }

  const isLive = mode === 'liveschema'

  // Dagklick öppnar drawern – endast i liveschemat.
  const openDay = isLive ? (date: string) => setDrawerDate(date) : undefined

  const drawer =
    drawerData && drawerDate ? (
      <DayDrawer
        date={drawerDate}
        brukareById={brukareById}
        activities={drawerData.acts}
        employeesById={employeesById}
        staffOnDuty={drawerData.onDuty}
        onClose={() => setDrawerDate(null)}
      />
    ) : null

  return (
    <>
    <div className={`schedule-page mode-${mode}`}>
      <Toolbar
        mode={mode}
        onChangeMode={setMode}
        grundView={grundView}
        onChangeGrundView={setGrundView}
        deviationCount={deviations.count}
        onResetLive={resetLiveToBase}
        onFillGrundschema={fillGrundschema}
      />

      <header className="schedule-page__header">
        <div>
          <h1 className="schedule-page__title">
            {isLive ? 'Liveschema' : 'Grundschema'}
            <span className={`mode-pill mode-pill--${mode}`}>
              {isLive ? 'Live' : 'Grund'}
            </span>
          </h1>
          <p className="schedule-page__subtitle">
            {isLive
              ? 'Veckans aktiva schema – justera vid sjukdom eller ändringar'
              : 'Grundbemanning – mallen som liveschemat utgår från'}
            {' · '}
            {showMonth ? formatMonthLabel(days) : formatWeekRange(days)}
          </p>
        </div>
        <div className="schedule-page__badges">
          {isLive && (
            <div
              className={`dev-chip ${deviations.count > 0 ? 'is-active' : ''}`}
              title="Antal celler som skiljer sig från grundschemat"
            >
              {deviations.count > 0
                ? `${deviations.count} avvikelse${deviations.count === 1 ? '' : 'r'}`
                : 'Följer grundschemat'}
            </div>
          )}
          <div className="schedule-page__weekbadge">
            {showMonth ? formatMonthLabel(days) : `v.${getWeekNumber(days[0].date)}`}
          </div>
        </div>
      </header>

      <ShiftPalette templates={shiftTemplates} />

      <ScheduleGrid
        employees={employees}
        days={days}
        shifts={active.shifts}
        templatesById={templatesById}
        view={view}
        contractMultiplier={contractMultiplier}
        totalHeaderLabel={totalHeaderLabel}
        deviationCellKeys={isLive ? deviations.cellKeys : undefined}
        onDayClick={openDay}
        onDropPayload={handleDropPayload}
        onRemoveShift={removeShift}
      />
    </div>
    {drawer}
    </>
  )
}

/** ISO-veckonummer för en "YYYY-MM-DD"-sträng. */
function getWeekNumber(isoDate: string): number {
  const d = new Date(isoDate)
  const target = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()))
  const dayNr = (target.getUTCDay() + 6) % 7
  target.setUTCDate(target.getUTCDate() - dayNr + 3)
  const firstThursday = new Date(Date.UTC(target.getUTCFullYear(), 0, 4))
  const firstDayNr = (firstThursday.getUTCDay() + 6) % 7
  firstThursday.setUTCDate(firstThursday.getUTCDate() - firstDayNr + 3)
  return 1 + Math.round((target.getTime() - firstThursday.getTime()) / (7 * 24 * 3600 * 1000))
}
