import type { Employee, ScheduledShift, ShiftTemplate } from '../types'
import type { DayColumn } from '../utils/week'
import type { DragPayload } from '../utils/dnd'
import ShiftCell from './ShiftCell'
import { formatMinutesAsHHMM } from '../utils/time'

interface EmployeeRowProps {
  employee: Employee
  days: DayColumn[]
  /** Pass för denna medarbetare grupperade per datum. */
  shiftsByDate: Map<string, ScheduledShift[]>
  templatesById: Map<string, ShiftTemplate>
  /** Schemalagda minuter för medarbetaren under visad period. */
  periodMinutes: number
  /** Skalfaktor för avtalade timmar (periodens längd / en vecka). */
  contractMultiplier: number
  deviationCellKeys?: Set<string>
  onDropPayload: (payload: DragPayload, employeeId: string, date: string) => void
  onRemoveShift: (shiftId: string) => void
}

/** En rad i matrisen: medarbetarinfo + dagceller + periodtotal. */
export default function EmployeeRow({
  employee,
  days,
  shiftsByDate,
  templatesById,
  periodMinutes,
  contractMultiplier,
  deviationCellKeys,
  onDropPayload,
  onRemoveShift,
}: EmployeeRowProps) {
  // Avtalade minuter skalas efter periodens längd (40 h/vecka).
  const contractMinutes = Math.round(employee.weeklyContractHours * 60 * contractMultiplier)
  const diff = periodMinutes - contractMinutes
  const tolerance = 30 * contractMultiplier

  // Färgmarkering: grön nära/över avtal, röd klart under, neutral inom marginal.
  let statusClass = 'is-neutral'
  if (diff > tolerance) statusClass = 'is-over'
  else if (diff < -tolerance) statusClass = 'is-under'

  return (
    <tr className="emp-row">
      <th className="emp-cell" scope="row">
        <div className="emp-cell__name">
          {employee.firstName} {employee.lastName}
        </div>
        <div className="emp-cell__meta">
          {employee.unit} · {employee.employmentRate}%
        </div>
      </th>

      {days.map((day) => (
        <ShiftCell
          key={day.date}
          employeeId={employee.id}
          date={day.date}
          isWeekend={day.isWeekend}
          isWeekStart={day.isWeekStart}
          isDeviation={deviationCellKeys?.has(`${employee.id}|${day.date}`) ?? false}
          shifts={shiftsByDate.get(day.date) ?? []}
          templatesById={templatesById}
          onDropPayload={onDropPayload}
          onRemoveShift={onRemoveShift}
        />
      ))}

      <td className={`total-cell ${statusClass}`}>
        <div className="total-cell__value">
          {formatMinutesAsHHMM(periodMinutes)} <span className="total-cell__sep">/</span>{' '}
          {formatMinutesAsHHMM(contractMinutes)}
        </div>
        <div className="total-cell__diff">
          {diff === 0 ? '±0:00' : `${diff > 0 ? '+' : ''}${formatMinutesAsHHMM(diff)}`}
        </div>
      </td>
    </tr>
  )
}
