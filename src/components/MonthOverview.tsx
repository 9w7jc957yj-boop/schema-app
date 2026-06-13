import type { Employee, ScheduledShift, ShiftTemplate } from '../types'
import type { DayColumn } from '../utils/week'
import { isoToDate } from '../utils/week'
import { readableTextColor } from '../utils/color'
import { writeDragPayload, readDragPayload, type DragPayload } from '../utils/dnd'

interface MonthOverviewProps {
  days: DayColumn[]
  shifts: ScheduledShift[]
  templatesById: Map<string, ShiftTemplate>
  employeesById: Map<string, Employee>
  today: string
  onPickDate: (iso: string) => void
  onDropPayload: (payload: DragPayload, date: string) => void
  onRemoveShift: (shiftId: string) => void
}

const WD = ['Mån', 'Tis', 'Ons', 'Tor', 'Fre', 'Lör', 'Sön']

function initials(emp: Employee | undefined): string {
  if (!emp) return '?'
  return `${emp.firstName[0] ?? ''}${emp.lastName[0] ?? ''}`.toUpperCase()
}

/** Månadsöversikt: en cell per dag med pass som färgade chips. */
export default function MonthOverview({
  days,
  shifts,
  templatesById,
  employeesById,
  today,
  onPickDate,
  onDropPayload,
  onRemoveShift,
}: MonthOverviewProps) {
  // Gruppera pass per datum.
  const byDate = new Map<string, ScheduledShift[]>()
  for (const s of shifts) {
    const list = byDate.get(s.date)
    if (list) list.push(s)
    else byDate.set(s.date, [s])
  }

  // Inledande tomma celler så första dagen hamnar på rätt veckodag.
  const leading = days.length > 0 ? (isoToDate(days[0].date).getDay() + 6) % 7 : 0

  return (
    <div className="month-ov">
      <div className="month-ov__wd-row">
        {WD.map((w) => (
          <div key={w} className="month-ov__wd">
            {w}
          </div>
        ))}
      </div>
      <div className="month-ov__grid">
        {Array.from({ length: leading }).map((_, i) => (
          <div key={`lead-${i}`} className="month-ov__cell is-empty" />
        ))}
        {days.map((day) => {
          const list = (byDate.get(day.date) ?? []).slice().sort((a, b) => {
            const ta = templatesById.get(a.templateId)?.startTime ?? ''
            const tb = templatesById.get(b.templateId)?.startTime ?? ''
            return ta.localeCompare(tb)
          })
          const shown = list.slice(0, 4)
          const extra = list.length - shown.length
          return (
            <div
              key={day.date}
              className={`month-ov__cell ${day.isWeekend ? 'is-weekend' : ''} ${day.date === today ? 'is-today' : ''}`}
              onDragOver={(e) => {
                e.preventDefault()
                e.dataTransfer.dropEffect = 'move'
              }}
              onDrop={(e) => {
                e.preventDefault()
                const payload = readDragPayload(e)
                if (payload) onDropPayload(payload, day.date)
              }}
            >
              <button className="month-ov__date" type="button" onClick={() => onPickDate(day.date)}>
                {day.dateLabel}
              </button>
              <div className="month-ov__chips">
                {shown.map((s) => {
                  const t = templatesById.get(s.templateId)
                  if (!t) return null
                  const emp = employeesById.get(s.employeeId)
                  return (
                    <div
                      key={s.id}
                      className="month-ov__chip"
                      style={{ background: t.color, color: readableTextColor(t.color) }}
                      draggable
                      onDragStart={(e) =>
                        writeDragPayload(e, { kind: 'move', shiftId: s.id, templateId: t.id })
                      }
                      onContextMenu={(e) => {
                        e.preventDefault()
                        onRemoveShift(s.id)
                      }}
                      title={`${emp ? `${emp.firstName} ${emp.lastName}` : ''} · ${t.label} · ${t.startTime}–${t.endTime}`}
                    >
                      <span className="month-ov__chip-emp">{initials(emp)}</span>
                      <span className="month-ov__chip-time">{t.startTime}</span>
                    </div>
                  )
                })}
                {extra > 0 && <div className="month-ov__more">+{extra} fler</div>}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
