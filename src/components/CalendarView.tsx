import { useEffect, useMemo, useState, type ReactNode, type CSSProperties } from 'react'
import type { Employee, ScheduledShift, ShiftTemplate, ScheduleMode } from '../types'
import {
  startOfWeek, buildWeek, buildMonth, buildDay,
  formatWeekRange, formatMonthLabel, formatDayLabel, isoToDate,
} from '../utils/week'
import { computeStats } from '../utils/scheduleStats'
import type { DragPayload } from '../utils/dnd'
import ShiftPalette from './ShiftPalette'
import MiniCalendar from './MiniCalendar'
import TimeGrid from './TimeGrid'
import MonthOverview from './MonthOverview'
import './CalendarView.css'

type CalView = 'dag' | 'vecka' | 'manad'

const ZOOM_KEY = 'schema-app:cal-zoom'
const BASE_HOUR = 42
const ZOOM_MIN = 0.4
const ZOOM_MAX = 1.8
const ZOOM_STEP = 0.1

interface CalendarViewProps {
  employees: Employee[]
  templates: ShiftTemplate[]
  templatesById: Map<string, ShiftTemplate>
  today: string
  mode: ScheduleMode
  onChangeMode: (mode: ScheduleMode) => void
  shifts: ScheduledShift[]
  deviationCellKeys?: Set<string>
  deviationCount: number
  onAdd: (employeeId: string, date: string, templateId: string) => void
  onMove: (shiftId: string, employeeId: string, date: string) => void
  onRemove: (shiftId: string) => void
  onFillForDates: (dates: string[], periodLabel: string) => void
  onResetLive: () => void
  onRefresh: () => void
  /** Klick på en dag öppnar dagdrawern (sätts endast i liveläget). */
  onDayClick?: (date: string) => void
  variantSwitcher: ReactNode
}

/** Variant B: kalenderlayout med tidsrutnät, sidofält och statusrad. */
export default function CalendarView({
  employees,
  templates,
  templatesById,
  today,
  mode,
  onChangeMode,
  shifts,
  deviationCellKeys,
  deviationCount,
  onAdd,
  onMove,
  onRemove,
  onFillForDates,
  onResetLive,
  onRefresh,
  onDayClick,
  variantSwitcher,
}: CalendarViewProps) {
  const [calView, setCalView] = useState<CalView>('vecka')
  const [focusedDate, setFocusedDate] = useState<string>(today)
  const [unitFilter, setUnitFilter] = useState<string>('all')
  const [employeeFilter, setEmployeeFilter] = useState<string>('all')

  // Zoom för kalenderns täthet (sparas mellan sessioner).
  const [zoom, setZoom] = useState<number>(() => {
    try {
      const raw = Number(localStorage.getItem(ZOOM_KEY))
      return raw >= ZOOM_MIN && raw <= ZOOM_MAX ? raw : 1
    } catch {
      return 1
    }
  })
  useEffect(() => {
    try {
      localStorage.setItem(ZOOM_KEY, String(zoom))
    } catch {
      // ignorera
    }
  }, [zoom])
  const clampZoom = (z: number) => Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, Math.round(z * 10) / 10))
  const setZoomClamped = (z: number) => setZoom(clampZoom(z))
  // Funktionell uppdatering så att upprepade klick ackumuleras korrekt.
  const stepZoom = (dir: -1 | 1) => setZoom((prev) => clampZoom(prev + dir * ZOOM_STEP))
  const hourHeight = Math.round(BASE_HOUR * zoom)

  const isLive = mode === 'liveschema'

  // Visad period utifrån vald vy och fokusdatum.
  const days = useMemo(() => {
    const d = isoToDate(focusedDate)
    if (calView === 'dag') return buildDay(d)
    if (calView === 'manad') return buildMonth(d)
    return buildWeek(startOfWeek(d))
  }, [calView, focusedDate])

  const periodDates = useMemo(() => new Set(days.map((d) => d.date)), [days])

  // Enheter och medarbetarurval för filtren.
  const units = useMemo(() => [...new Set(employees.map((e) => e.unit))], [employees])
  const employeesInUnit = useMemo(
    () => (unitFilter === 'all' ? employees : employees.filter((e) => e.unit === unitFilter)),
    [employees, unitFilter],
  )
  const visibleEmployees = useMemo(
    () => employeesInUnit.filter((e) => employeeFilter === 'all' || e.id === employeeFilter),
    [employeesInUnit, employeeFilter],
  )
  const visibleIds = useMemo(() => new Set(visibleEmployees.map((e) => e.id)), [visibleEmployees])
  const employeesById = useMemo(() => new Map(employees.map((e) => [e.id, e])), [employees])

  const filteredShifts = useMemo(
    () => shifts.filter((s) => visibleIds.has(s.employeeId)),
    [shifts, visibleIds],
  )

  const stats = useMemo(
    () => computeStats(visibleEmployees, filteredShifts, templatesById, [...periodDates]),
    [visibleEmployees, filteredShifts, templatesById, periodDates],
  )

  // En specifik medarbetare måste vara vald för att kunna lägga nya pass.
  const targetEmployee = employeeFilter !== 'all' ? employeesById.get(employeeFilter) : undefined

  const periodLabel =
    calView === 'dag' ? formatDayLabel(focusedDate)
    : calView === 'manad' ? formatMonthLabel(days)
    : formatWeekRange(days)

  // --- Navigering ---------------------------------------------------------
  const goPrev = () => setFocusedDate((d) => shiftFocus(d, calView, -1))
  const goNext = () => setFocusedDate((d) => shiftFocus(d, calView, 1))

  // --- Släpp av pass ------------------------------------------------------
  const handleDrop = (payload: DragPayload, date: string) => {
    if (payload.kind === 'move') {
      const shift = shifts.find((s) => s.id === payload.shiftId)
      if (shift) onMove(payload.shiftId, shift.employeeId, date)
    } else if (targetEmployee) {
      onAdd(targetEmployee.id, date, payload.templateId)
    }
  }

  const handleFill = () => {
    const label = calView === 'dag' ? formatDayLabel(focusedDate).toLowerCase()
      : calView === 'manad' ? formatMonthLabel(days).toLowerCase()
      : 'veckan'
    onFillForDates([...periodDates], label)
  }

  const drillIntoDay = (iso: string) => {
    setFocusedDate(iso)
    setCalView('dag')
  }

  return (
    <div className="cal" style={{ '--cal-zoom': zoom } as CSSProperties}>
      {/* ---------------- Sidofält ---------------- */}
      <aside className="cal__sidebar">
        <div className="cal-side__header">
          <div className="cal-side__range">{periodLabel}</div>
          <span className={`cal-status cal-status--${mode}`}>{isLive ? 'Live' : 'Grund'}</span>
        </div>

        <MiniCalendar
          focusedDate={focusedDate}
          today={today}
          periodDates={periodDates}
          onPickDate={setFocusedDate}
        />

        <div className="cal-side__section">
          <div className="cal-side__label">Zoom</div>
          <div className="cal-zoom">
            <button
              className="cal-zoom__btn"
              type="button"
              onClick={() => stepZoom(-1)}
              disabled={zoom <= ZOOM_MIN}
              aria-label="Zooma ut"
            >
              −
            </button>
            <input
              className="cal-zoom__slider"
              type="range"
              min={ZOOM_MIN}
              max={ZOOM_MAX}
              step={ZOOM_STEP}
              value={zoom}
              onChange={(e) => setZoomClamped(Number(e.target.value))}
              aria-label="Zoomnivå"
            />
            <button
              className="cal-zoom__btn"
              type="button"
              onClick={() => stepZoom(1)}
              disabled={zoom >= ZOOM_MAX}
              aria-label="Zooma in"
            >
              +
            </button>
            <span className="cal-zoom__value">{Math.round(zoom * 100)}%</span>
          </div>
        </div>

        <div className="cal-side__section">
          <div className="cal-side__label">Filter</div>
          <label className="cal-filter">
            <span>Enhet</span>
            <select
              value={unitFilter}
              onChange={(e) => {
                setUnitFilter(e.target.value)
                setEmployeeFilter('all')
              }}
            >
              <option value="all">Alla enheter</option>
              {units.map((u) => (
                <option key={u} value={u}>{u}</option>
              ))}
            </select>
          </label>
          <label className="cal-filter">
            <span>Medarbetare</span>
            <select value={employeeFilter} onChange={(e) => setEmployeeFilter(e.target.value)}>
              <option value="all">Alla medarbetare</option>
              {employeesInUnit.map((e) => (
                <option key={e.id} value={e.id}>{e.firstName} {e.lastName}</option>
              ))}
            </select>
          </label>
        </div>

        <div className="cal-side__section">
          <div className="cal-side__label">Lägg pass</div>
          <p className="cal-side__hint">
            {targetEmployee
              ? `Drar du en passmall läggs den på ${targetEmployee.firstName}.`
              : 'Välj en medarbetare ovan för att kunna dra ut nya pass.'}
          </p>
        </div>
      </aside>

      {/* ---------------- Huvudyta ---------------- */}
      <div className="cal__main">
        <div className="cal-top">
          <div className="cal-top__row">
            <div className="cal-nav">
              <button className="cal-nav__btn" type="button" onClick={goPrev} aria-label="Föregående">‹</button>
              <button className="cal-nav__today" type="button" onClick={() => setFocusedDate(today)}>Idag</button>
              <button className="cal-nav__btn" type="button" onClick={goNext} aria-label="Nästa">›</button>
            </div>
            <div className="cal-top__title">{periodLabel}</div>
            <div className="cal-top__right">
              <button className="tb-btn" type="button" onClick={onRefresh} title="Läs om från lagring">⟳ Uppdatera</button>
              <span className="cal-visible">{stats.assignedCount} pass</span>
              {variantSwitcher}
            </div>
          </div>

          <div className="cal-top__row">
            <div className="mode-switch" role="tablist" aria-label="Välj schema">
              <span className="mode-switch__thumb" data-mode={mode} aria-hidden="true" />
              <button
                type="button" role="tab" aria-selected={!isLive}
                className={`mode-switch__option ${!isLive ? 'is-active' : ''}`}
                onClick={() => onChangeMode('grundschema')}
              >Grundschema</button>
              <button
                type="button" role="tab" aria-selected={isLive}
                className={`mode-switch__option ${isLive ? 'is-active' : ''}`}
                onClick={() => onChangeMode('liveschema')}
              >Liveschema</button>
            </div>

            <div className="view-switch" role="group" aria-label="Dag, vecka eller månad">
              {(['dag', 'vecka', 'manad'] as CalView[]).map((v) => (
                <button
                  key={v}
                  type="button"
                  aria-pressed={calView === v}
                  className={`view-switch__option ${calView === v ? 'is-active' : ''}`}
                  onClick={() => setCalView(v)}
                >
                  {v === 'dag' ? 'Dag' : v === 'vecka' ? 'Vecka' : 'Månad'}
                </button>
              ))}
            </div>

            <div className="cal-top__actions">
              {!isLive && (
                <button className="tb-btn tb-btn--magic" type="button" onClick={handleFill}>✨ Fyll ut</button>
              )}
              {isLive && (
                <button
                  className="tb-btn" type="button" onClick={onResetLive} disabled={deviationCount === 0}
                  title="Återställ liveschemat till grundschemat"
                >↺ Återställ</button>
              )}
            </div>
          </div>

          <div className="cal-stats">
            <span className={`cal-stats__pill ${stats.conflictCount > 0 ? 'is-alert' : 'is-ok'}`}>
              {stats.conflictCount > 0 ? '⚠ Krockar' : '✓ Inga krockar'}
            </span>
            <span className="cal-stats__item">{stats.assignedCount} pass</span>
            <span className={`cal-stats__item ${stats.conflictCount > 0 ? 'is-red' : ''}`}>
              {stats.conflictCount} krock{stats.conflictCount === 1 ? '' : 'ar'}
            </span>
            <span className="cal-stats__item">{stats.coverage}% täckning</span>
            {isLive && deviationCount > 0 && (
              <span className="cal-stats__item is-amber">{deviationCount} avvikelser</span>
            )}
          </div>
        </div>

        <ShiftPalette templates={templates} />

        <div className="cal-canvas">
          {calView === 'manad' ? (
            <MonthOverview
              days={days}
              shifts={filteredShifts}
              templatesById={templatesById}
              employeesById={employeesById}
              today={today}
              onPickDate={onDayClick ?? drillIntoDay}
              onDropPayload={handleDrop}
              onRemoveShift={onRemove}
            />
          ) : (
            <TimeGrid
              days={days}
              shifts={filteredShifts}
              templatesById={templatesById}
              employeesById={employeesById}
              today={today}
              hourHeight={hourHeight}
              deviationCellKeys={isLive ? deviationCellKeys : undefined}
              conflictShiftIds={stats.conflictShiftIds}
              onDayClick={onDayClick}
              onDropPayload={handleDrop}
              onRemoveShift={onRemove}
            />
          )}
        </div>
      </div>
    </div>
  )
}

/** Flyttar fokusdatumet en dag/vecka/månad framåt eller bakåt. */
function shiftFocus(iso: string, view: CalView, dir: 1 | -1): string {
  const d = isoToDate(iso)
  if (view === 'dag') d.setDate(d.getDate() + dir)
  else if (view === 'vecka') d.setDate(d.getDate() + 7 * dir)
  else d.setMonth(d.getMonth() + dir)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}
