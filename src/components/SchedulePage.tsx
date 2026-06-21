import { useEffect, useMemo, useState } from 'react'
import type { Schedule, ScheduledShift, ShiftTemplate } from '../types'
import { VERKSAMHETER } from '../types'
import type { GridView } from '../utils/week'
import type { DragPayload } from '../utils/dnd'
import { employees } from '../data/employees'
import { shiftTemplates } from '../data/shiftTemplates'
import { brukare } from '../data/brukare'
import { buildActivities } from '../data/activities'
import type { DayActivity } from '../types'
import { buildSeedSchedule } from '../data/seedSchedule'
import { loadSchedule, saveSchedule, loadActivities, saveActivities, loadTemplates, saveTemplates, makeId } from '../utils/storage'
import { startOfWeek, buildWeek, buildMonth, formatWeekRange, formatMonthLabel } from '../utils/week'
import { parseTimeToMinutes } from '../utils/time'
import { suggestPeriodShifts } from '../utils/autofill'
import Toolbar from './Toolbar'
import ShiftPalette from './ShiftPalette'
import ScheduleGrid from './ScheduleGrid'
import DayDrawer from './DayDrawer'
import BrukareSchedule from './BrukareSchedule'
import TempShiftDialog from './TempShiftDialog'
import ConfirmDialog from './ConfirmDialog'
import type { ActivityDraft } from './ActivityDialog'
import './SchedulePage.css'

type ScheduleKind = 'personal' | 'brukare'

/** Toppnivåvy som äger schemats tillstånd och kopplar ihop delarna. */
export default function SchedulePage() {
  // Veckan och månaden beräknas en gång kring dagens datum.
  const weekDays = useMemo(() => buildWeek(startOfWeek(new Date())), [])
  const monthDays = useMemo(() => buildMonth(new Date()), [])
  // Passmallar – seedas från standardmallarna, sparas sedan i localStorage.
  const [templates, setTemplates] = useState<ShiftTemplate[]>(() => loadTemplates() ?? shiftTemplates)
  useEffect(() => saveTemplates(templates), [templates])
  const templatesById = useMemo(
    () => new Map(templates.map((t) => [t.id, t])),
    [templates],
  )
  const employeesById = useMemo(() => new Map(employees.map((e) => [e.id, e])), [])
  const brukareById = useMemo(() => new Map(brukare.map((b) => [b.id, b])), [])

  // Datum att seeda: hela månaden + aktuell vecka (veckan kan spilla över månadsskiftet).
  const seedDates = useMemo(() => {
    const set = new Set([...monthDays.map((d) => d.date), ...weekDays.map((d) => d.date)])
    return [...set]
  }, [monthDays, weekDays])

  // Brukarnas insatser – seedas första gången, sparas sedan i localStorage.
  const [activities, setActivities] = useState<DayActivity[]>(() => {
    const stored = loadActivities()
    if (stored) return stored
    return buildActivities(seedDates, brukare.map((b) => b.id), employees.map((e) => e.id))
  })
  useEffect(() => saveActivities(activities), [activities])

  // Vilket schema som visas: personal eller brukare.
  const [scheduleKind, setScheduleKind] = useState<ScheduleKind>('personal')

  // Vald verksamhet att filtrera på (används framöver för att filtrera datan).
  const [verksamhetId, setVerksamhetId] = useState<string>(VERKSAMHETER[0].id)

  // Grundschemat: enda schemat. Seedas om inget finns sparat.
  const [grundschema, setGrundschema] = useState<Schedule>(() => {
    const stored = loadSchedule('grundschema')
    if (stored) return stored
    return buildSeedSchedule(seedDates, employees.map((e) => e.id))
  })

  // Vy för schemat (vecka/månad).
  const [grundView, setGrundView] = useState<GridView>('manad')

  // Lägga till pass: vald tom cell som öppnar tidsdialogen.
  const [tempCell, setTempCell] = useState<{ employeeId: string; date: string } | null>(null)

  // Pass som väntar på bekräftelse innan borttagning.
  const [pendingRemoveId, setPendingRemoveId] = useState<string | null>(null)

  // Dagdrawer: vald dag som visar dagens insatser.
  const [drawerDate, setDrawerDate] = useState<string | null>(null)
  const drawerData = useMemo(() => {
    if (!drawerDate) return null
    const acts = activities.filter((a) => a.date === drawerDate)
    const onDuty = grundschema.shifts
      .filter((s) => s.date === drawerDate)
      .map((s) => ({ employee: employeesById.get(s.employeeId), template: templatesById.get(s.templateId) }))
      .filter((x): x is { employee: NonNullable<typeof x.employee>; template: NonNullable<typeof x.template> } =>
        Boolean(x.employee && x.template),
      )
      .sort((a, b) => a.template.startTime.localeCompare(b.template.startTime))
    return { acts, onDuty }
  }, [drawerDate, activities, grundschema, employeesById, templatesById])

  // Visad period: månad eller vecka.
  const showMonth = grundView === 'manad'
  const days = showMonth ? monthDays : weekDays
  const view: GridView = showMonth ? 'manad' : 'vecka'
  const contractMultiplier = days.length / 7
  const totalHeaderLabel = showMonth ? 'Månad / Avtal' : 'Vecka / Avtal'

  // Persistens.
  useEffect(() => saveSchedule('grundschema', grundschema), [grundschema])

  // Lägger till en ny passmall i paletten.
  const createTemplate = (template: ShiftTemplate) =>
    setTemplates((prev) => [...prev, template])

  /**
   * Lägger till ett pass i en tom cell via tidsdialogen. Skapar (eller
   * återanvänder) en dold tidsmall och lägger ut ett pass på medarbetaren.
   */
  const addTemporaryShift = (employeeId: string, date: string, startTime: string, endTime: string) => {
    const crossesMidnight = parseTimeToMinutes(endTime) <= parseTimeToMinutes(startTime)
    const label = `${startTime}–${endTime}`
    let templateId = templates.find(
      (t) => t.temporary && t.startTime === startTime && t.endTime === endTime,
    )?.id
    if (!templateId) {
      const tpl: ShiftTemplate = {
        id: makeId('tpl-temp'),
        label,
        startTime,
        endTime,
        color: '#8E8E93',
        crossesMidnight,
        temporary: true,
      }
      templateId = tpl.id
      setTemplates((prev) => [...prev, tpl])
    }
    setGrundschema((prev) => ({
      ...prev,
      shifts: [...prev.shifts, { id: makeId('shift'), employeeId, date, templateId } as ScheduledShift],
    }))
    setTempCell(null)
  }

  // --- Mutationer på schemat ----------------------------------------------

  const addShift = (employeeId: string, date: string, templateId: string) => {
    setGrundschema((prev) => ({
      ...prev,
      shifts: [
        ...prev.shifts,
        { id: makeId('shift'), employeeId, date, templateId } satisfies ScheduledShift,
      ],
    }))
  }

  const moveShift = (shiftId: string, employeeId: string, date: string) => {
    setGrundschema((prev) => ({
      ...prev,
      shifts: prev.shifts.map((s) =>
        s.id === shiftId ? { ...s, employeeId, date } : s,
      ),
    }))
  }

  const removeShift = (shiftId: string) => {
    setGrundschema((prev) => ({
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

  // --- Brukarnas insatser -------------------------------------------------

  const addOrUpdateActivity = (a: ActivityDraft, repeatWeek: boolean) => {
    setActivities((prev) => {
      if (a.id) {
        return prev.map((x) => (x.id === a.id ? ({ ...a, id: a.id } as DayActivity) : x))
      }
      if (repeatWeek) {
        const created = weekDays.map((d) => ({ ...a, id: makeId('act'), date: d.date }) as DayActivity)
        return [...prev, ...created]
      }
      return [...prev, { ...a, id: makeId('act') } as DayActivity]
    })
  }

  const removeActivity = (id: string) =>
    setActivities((prev) => prev.filter((x) => x.id !== id))

  // Dagklick öppnar drawern.
  const openDay = (date: string) => setDrawerDate(date)

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

  // Rubrik för tidsdialogen, t.ex. "Anna Lindqvist · Mån 15/6".
  const tempCellLabel = (() => {
    if (!tempCell) return ''
    const emp = employeesById.get(tempCell.employeeId)
    const day = days.find((d) => d.date === tempCell.date)
    const name = emp ? `${emp.firstName} ${emp.lastName}` : ''
    const when = day ? `${day.weekdayLabel} ${day.dateLabel}` : ''
    return [name, when].filter(Boolean).join(' · ')
  })()

  const verksamhetSelect = (
    <label className="verksamhet-select" aria-label="Välj verksamhet">
      <span className="verksamhet-select__icon" aria-hidden="true">⛃</span>
      <select
        className="verksamhet-select__input"
        value={verksamhetId}
        onChange={(e) => setVerksamhetId(e.target.value)}
      >
        {VERKSAMHETER.map((v) => (
          <option key={v.id} value={v.id}>
            {v.name}
          </option>
        ))}
      </select>
      <span className="verksamhet-select__chevron" aria-hidden="true">⌄</span>
    </label>
  )

  const kindSwitch = (
    <div className="kind-switch" role="tablist" aria-label="Välj schema">
      {(['personal', 'brukare'] as ScheduleKind[]).map((k) => (
        <button
          key={k}
          type="button"
          role="tab"
          aria-selected={scheduleKind === k}
          className={`kind-switch__opt ${scheduleKind === k ? 'is-active' : ''}`}
          onClick={() => setScheduleKind(k)}
        >
          <span className="kind-switch__icon">{k === 'personal' ? '👤' : '🏠'}</span>
          {k === 'personal' ? 'Personal' : 'Brukare'}
        </button>
      ))}
    </div>
  )

  // ---- Brukarschema ----
  if (scheduleKind === 'brukare') {
    return (
      <div className="schedule-page">
        <div className="toolbar">
          <div className="toolbar__group">{verksamhetSelect}</div>
          <div className="toolbar__group toolbar__group--center">{kindSwitch}</div>
          <div className="toolbar__group toolbar__group--end">
            <span className="bru-hint">Klicka i en cell för att lägga till en insats</span>
          </div>
        </div>

        <header className="schedule-page__header">
          <div>
            <h1 className="schedule-page__title">Brukarschema</h1>
            <p className="schedule-page__subtitle">
              Brukarnas aktiviteter och dagliga insatser · {formatWeekRange(weekDays)}
            </p>
          </div>
          <div className="schedule-page__badges">
            <div className="schedule-page__weekbadge">{brukare.length} brukare</div>
          </div>
        </header>

        <BrukareSchedule
          brukare={brukare}
          days={weekDays}
          activities={activities}
          employees={employees}
          employeesById={employeesById}
          onAddOrUpdate={addOrUpdateActivity}
          onRemove={removeActivity}
        />
      </div>
    )
  }

  // ---- Personalschema ----
  return (
    <>
    <div className="schedule-page">
      <Toolbar
        onFillGrundschema={fillGrundschema}
        verksamhetSelect={verksamhetSelect}
        kindSwitch={kindSwitch}
      />

      <header className="schedule-page__header">
        <div>
          <h1 className="schedule-page__title">Grundschema</h1>
          <p className="schedule-page__subtitle">
            Grundbemanning · {showMonth ? formatMonthLabel(days) : formatWeekRange(days)}
          </p>
        </div>
        <div className="schedule-page__badges">
          <div className="view-switch" role="group" aria-label="Vecka eller månad">
            {([
              { value: 'vecka', label: 'Vecka' },
              { value: 'manad', label: 'Månad' },
            ] as const).map((v) => (
              <button
                key={v.value}
                type="button"
                aria-pressed={grundView === v.value}
                className={`view-switch__option ${grundView === v.value ? 'is-active' : ''}`}
                onClick={() => setGrundView(v.value)}
              >
                {v.label}
              </button>
            ))}
          </div>
          <div className="schedule-page__weekbadge">
            {showMonth ? formatMonthLabel(days) : `v.${getWeekNumber(days[0].date)}`}
          </div>
        </div>
      </header>

      <ShiftPalette
        templates={templates.filter(
          (t) =>
            !t.temporary &&
            (!t.verksamhetIds || t.verksamhetIds.length === 0 || t.verksamhetIds.includes(verksamhetId)),
        )}
        onCreate={createTemplate}
      />

      <ScheduleGrid
        employees={employees}
        days={days}
        shifts={grundschema.shifts}
        templatesById={templatesById}
        view={view}
        contractMultiplier={contractMultiplier}
        totalHeaderLabel={totalHeaderLabel}
        onDayClick={openDay}
        onDropPayload={handleDropPayload}
        onRemoveShift={setPendingRemoveId}
        onEmptyCellClick={(employeeId, date) => setTempCell({ employeeId, date })}
      />
    </div>
    {drawer}
    {tempCell && (
      <TempShiftDialog
        contextLabel={tempCellLabel}
        onSave={(start, end) => addTemporaryShift(tempCell.employeeId, tempCell.date, start, end)}
        onClose={() => setTempCell(null)}
      />
    )}
    {pendingRemoveId && (
      <ConfirmDialog
        message="Vill du ta bort det här passet?"
        confirmLabel="Ta bort pass"
        cancelLabel="Avbryt"
        danger
        onConfirm={() => {
          removeShift(pendingRemoveId)
          setPendingRemoveId(null)
        }}
        onCancel={() => setPendingRemoveId(null)}
      />
    )}
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
