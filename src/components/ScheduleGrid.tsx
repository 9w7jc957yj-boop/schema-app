import { useMemo } from 'react'
import type { Employee, ScheduledShift, ShiftTemplate } from '../types'
import type { DayColumn, GridView } from '../utils/week'
import type { DragPayload } from '../utils/dnd'
import { shiftDurationMinutes } from '../utils/time'
import EmployeeRow from './EmployeeRow'
import TotalsRow from './TotalsRow'
import './ScheduleGrid.css'

interface ScheduleGridProps {
  employees: Employee[]
  days: DayColumn[]
  shifts: ScheduledShift[]
  templatesById: Map<string, ShiftTemplate>
  /** Vecka eller månad – styr kompakt layout och kolumnbredd. */
  view: GridView
  /** Skalfaktor för avtalade timmar (periodens längd / en vecka). */
  contractMultiplier: number
  /** Etikett för totalkolumnen, t.ex. "Vecka / Avtal" eller "Månad / Avtal". */
  totalHeaderLabel: string
  /** Celler ("employeeId|date") som avviker från grundschemat (endast liveläge). */
  deviationCellKeys?: Set<string>
  /** Klick på dagrubrik (öppnar dagdrawern). Sätts endast i liveläget. */
  onDayClick?: (date: string) => void
  onDropPayload: (payload: DragPayload, employeeId: string, date: string) => void
  onRemoveShift: (shiftId: string) => void
  /** Klick på tom cell (endast liveschema) – för tillfälligt pass. */
  onEmptyCellClick?: (employeeId: string, date: string) => void
}

/** Själva matrisen: medarbetare (rader) × dagar (kolumner) med totalrad. */
export default function ScheduleGrid({
  employees,
  days,
  shifts,
  templatesById,
  view,
  contractMultiplier,
  totalHeaderLabel,
  deviationCellKeys,
  onDayClick,
  onDropPayload,
  onRemoveShift,
  onEmptyCellClick,
}: ScheduleGridProps) {
  // Aggregera alla summor en gång per render – endast pass inom visad period.
  const agg = useMemo(() => {
    const visibleDates = new Set(days.map((d) => d.date))
    // employeeId -> (date -> shifts[])
    const byEmployee = new Map<string, Map<string, ScheduledShift[]>>()
    const employeeMinutes = new Map<string, number>()
    const columnMinutes = new Map<string, number>()
    let grandTotal = 0

    for (const emp of employees) {
      byEmployee.set(emp.id, new Map())
      employeeMinutes.set(emp.id, 0)
    }
    for (const day of days) columnMinutes.set(day.date, 0)

    for (const shift of shifts) {
      if (!visibleDates.has(shift.date)) continue // utanför visad period
      const template = templatesById.get(shift.templateId)
      if (!template) continue
      const minutes = shiftDurationMinutes(template)

      const byDate = byEmployee.get(shift.employeeId)
      if (!byDate) continue // pass för medarbetare som inte visas
      const list = byDate.get(shift.date)
      if (list) list.push(shift)
      else byDate.set(shift.date, [shift])

      employeeMinutes.set(shift.employeeId, (employeeMinutes.get(shift.employeeId) ?? 0) + minutes)
      columnMinutes.set(shift.date, (columnMinutes.get(shift.date) ?? 0) + minutes)
      grandTotal += minutes
    }

    return { byEmployee, employeeMinutes, columnMinutes, grandTotal }
  }, [employees, days, shifts, templatesById])

  return (
    <div className="grid-scroll">
      <table className={`grid-table grid-table--${view}`}>
        <thead>
          <tr>
            <th className="grid-corner" scope="col">
              Medarbetare
            </th>
            {days.map((day) => (
              <th
                key={day.date}
                scope="col"
                className={`grid-dayhead ${day.isWeekend ? 'cell--weekend' : ''} ${
                  day.isWeekStart ? 'is-weekstart' : ''
                } ${onDayClick ? 'is-clickable' : ''}`}
                onClick={onDayClick ? () => onDayClick(day.date) : undefined}
                title={onDayClick ? 'Visa dagens insatser' : undefined}
              >
                <span className="grid-dayhead__weekday">{day.weekdayLabel}</span>
                <span className="grid-dayhead__date">{day.dateLabel}</span>
                {onDayClick && <span className="grid-dayhead__more">›</span>}
              </th>
            ))}
            <th className="grid-totalhead" scope="col">
              {totalHeaderLabel}
            </th>
          </tr>
        </thead>

        <tbody>
          {employees.map((emp) => (
            <EmployeeRow
              key={emp.id}
              employee={emp}
              days={days}
              shiftsByDate={agg.byEmployee.get(emp.id) ?? new Map()}
              templatesById={templatesById}
              periodMinutes={agg.employeeMinutes.get(emp.id) ?? 0}
              contractMultiplier={contractMultiplier}
              deviationCellKeys={deviationCellKeys}
              onDropPayload={onDropPayload}
              onRemoveShift={onRemoveShift}
              onEmptyCellClick={onEmptyCellClick}
            />
          ))}
        </tbody>

        <tfoot>
          <TotalsRow
            days={days}
            minutesByDate={agg.columnMinutes}
            weekTotalMinutes={agg.grandTotal}
          />
        </tfoot>
      </table>
    </div>
  )
}
