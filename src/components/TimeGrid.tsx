import { useEffect, useRef } from 'react'
import type { Employee, ScheduledShift, ShiftTemplate } from '../types'
import type { DayColumn } from '../utils/week'
import { layoutDaySegments } from '../utils/timeLayout'
import { readableTextColor } from '../utils/color'
import { writeDragPayload, readDragPayload, type DragPayload } from '../utils/dnd'

const HOURS = Array.from({ length: 24 }, (_, i) => i)

interface TimeGridProps {
  days: DayColumn[]
  shifts: ScheduledShift[]
  templatesById: Map<string, ShiftTemplate>
  employeesById: Map<string, Employee>
  today: string
  /** Pixlar per timme (styrs av zoomen). */
  hourHeight?: number
  deviationCellKeys?: Set<string>
  conflictShiftIds: Set<string>
  /** Klick på dagrubrik öppnar dagdrawern (sätts endast i liveläget). */
  onDayClick?: (date: string) => void
  onDropPayload: (payload: DragPayload, date: string) => void
  onRemoveShift: (shiftId: string) => void
}

function initials(emp: Employee | undefined): string {
  if (!emp) return '?'
  return `${emp.firstName[0] ?? ''}${emp.lastName[0] ?? ''}`.toUpperCase()
}

function fmt(min: number): string {
  const h = Math.floor(min / 60)
  const m = min % 60
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
}

/** Tidsrutnät: klockslag lodrätt, dagar vågrätt, pass som placerade block. */
export default function TimeGrid({
  days,
  shifts,
  templatesById,
  employeesById,
  today,
  hourHeight = 46,
  deviationCellKeys,
  conflictShiftIds,
  onDayClick,
  onDropPayload,
  onRemoveShift,
}: TimeGridProps) {
  const scrollRef = useRef<HTMLDivElement>(null)

  // Scrolla till morgonen vid första visning (och när zoomen ändras).
  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = 6 * hourHeight
  }, [hourHeight])

  const cols = `64px repeat(${days.length}, minmax(0, 1fr))`
  const canvasHeight = 24 * hourHeight

  return (
    <div className="tg">
      <div className="tg__header" style={{ gridTemplateColumns: cols }}>
        <div className="tg__corner" />
        {days.map((d) => (
          <div
            key={d.date}
            className={`tg__dayhead ${d.isWeekend ? 'is-weekend' : ''} ${d.date === today ? 'is-today' : ''} ${onDayClick ? 'is-clickable' : ''}`}
            onClick={onDayClick ? () => onDayClick(d.date) : undefined}
            title={onDayClick ? 'Visa dagens insatser' : undefined}
          >
            <span className="tg__dayhead-wd">{d.weekdayLabel}</span>
            <span className="tg__dayhead-num">{d.dateLabel}</span>
            {onDayClick && <span className="tg__dayhead-more">Insatser ›</span>}
          </div>
        ))}
      </div>

      <div className="tg__scroll" ref={scrollRef}>
        <div className="tg__canvas" style={{ gridTemplateColumns: cols, height: canvasHeight }}>
          <div className="tg__gutter">
            {HOURS.map((h) => (
              <div key={h} className="tg__hour" style={{ height: hourHeight }}>
                <span>{h.toString().padStart(2, '0')}:00</span>
              </div>
            ))}
          </div>

          {days.map((day) => {
            const segments = layoutDaySegments(day.date, shifts, templatesById)
            return (
              <div
                key={day.date}
                className={`tg__col ${day.isWeekend ? 'is-weekend' : ''}`}
                style={{ backgroundSize: `100% ${hourHeight}px` }}
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
                {segments.map((seg) => {
                  const emp = employeesById.get(seg.shift.employeeId)
                  const top = (seg.startMin / 60) * hourHeight
                  const height = Math.max(((seg.endMin - seg.startMin) / 60) * hourHeight, 16)
                  const widthPct = 100 / seg.cols
                  const bg = seg.template.color
                  const isDeviation = deviationCellKeys?.has(`${seg.shift.employeeId}|${seg.shift.date}`)
                  const isConflict = conflictShiftIds.has(seg.shift.id)
                  return (
                    <div
                      key={`${seg.shift.id}-${seg.continued ? 'c' : 'm'}`}
                      className={`tg-shift ${isDeviation ? 'is-deviation' : ''} ${isConflict ? 'is-conflict' : ''}`}
                      style={{
                        top,
                        height,
                        left: `calc(${seg.col * widthPct}% + 2px)`,
                        width: `calc(${widthPct}% - 4px)`,
                        background: bg,
                        color: readableTextColor(bg),
                      }}
                      draggable
                      onDragStart={(e) =>
                        writeDragPayload(e, {
                          kind: 'move',
                          shiftId: seg.shift.id,
                          templateId: seg.template.id,
                        })
                      }
                      onContextMenu={(e) => {
                        e.preventDefault()
                        onRemoveShift(seg.shift.id)
                      }}
                      title={`${emp ? `${emp.firstName} ${emp.lastName}` : ''} · ${seg.template.label} · ${seg.template.startTime}–${seg.template.endTime}`}
                    >
                      <div className="tg-shift__row">
                        <span className="tg-shift__emp">{initials(emp)}</span>
                        {seg.continued && <span className="tg-shift__edge">↳</span>}
                        {seg.continues && <span className="tg-shift__edge">→</span>}
                      </div>
                      <div className="tg-shift__time">
                        {fmt(seg.startMin)}–{seg.continues ? '24:00' : fmt(seg.endMin)}
                      </div>
                      <button
                        className="tg-shift__remove"
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation()
                          onRemoveShift(seg.shift.id)
                        }}
                        title="Ta bort pass"
                        aria-label="Ta bort pass"
                      >
                        ✕
                      </button>
                    </div>
                  )
                })}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
