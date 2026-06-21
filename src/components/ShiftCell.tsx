import { useState } from 'react'
import type { ScheduledShift, ShiftTemplate } from '../types'
import ShiftBlock from './ShiftBlock'
import { readDragPayload, dragKindType, type DragPayload } from '../utils/dnd'
import './ShiftCell.css'

interface ShiftCellProps {
  employeeId: string
  date: string
  isWeekend: boolean
  /** True för måndagar – ritar veckoavgränsare i månadsvyn. */
  isWeekStart?: boolean
  /** True om cellen avviker från grundschemat (markeras i liveläget). */
  isDeviation?: boolean
  shifts: ScheduledShift[]
  templatesById: Map<string, ShiftTemplate>
  onDropPayload: (payload: DragPayload, employeeId: string, date: string) => void
  onRemoveShift: (shiftId: string) => void
  /** Klick på en tom cell (endast liveschema) – öppnar dialog för tillfälligt pass. */
  onEmptyClick?: (employeeId: string, date: string) => void
}

/**
 * En cell i rutnätet (medarbetare × dag). Tar emot släppta pass och kan
 * innehålla flera staplade pass.
 */
export default function ShiftCell({
  employeeId,
  date,
  isWeekend,
  isWeekStart = false,
  isDeviation = false,
  shifts,
  templatesById,
  onDropPayload,
  onRemoveShift,
  onEmptyClick,
}: ShiftCellProps) {
  const [isOver, setIsOver] = useState(false)
  const isEmpty = shifts.length === 0
  const canAdd = Boolean(onEmptyClick) && isEmpty

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    // dropEffect måste vara förenligt med effectAllowed ('copyMove'), annars
    // blockerar webbläsaren släppet. Palett→cell = copy, flytt = move.
    e.dataTransfer.dropEffect = e.dataTransfer.types.includes(dragKindType('template'))
      ? 'copy'
      : 'move'
    if (!isOver) setIsOver(true)
  }

  const handleDragLeave = () => setIsOver(false)

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsOver(false)
    const payload = readDragPayload(e)
    if (payload) onDropPayload(payload, employeeId, date)
  }

  return (
    <td
      className={`cell ${isWeekend ? 'cell--weekend' : ''} ${isOver ? 'cell--over' : ''} ${
        isDeviation ? 'cell--deviation' : ''
      } ${isWeekStart ? 'cell--weekstart' : ''} ${canAdd ? 'cell--addable' : ''}`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onClick={canAdd ? () => onEmptyClick!(employeeId, date) : undefined}
      title={canAdd ? 'Lägg till tillfälligt pass' : undefined}
    >
      {canAdd && <span className="cell__add" aria-hidden="true">+</span>}
      <div className="cell__stack">
        {shifts.map((shift) => {
          const template = templatesById.get(shift.templateId)
          if (!template) return null
          return (
            <ShiftBlock
              key={shift.id}
              template={template}
              variant="cell"
              shiftId={shift.id}
              onRemove={() => onRemoveShift(shift.id)}
            />
          )
        })}
      </div>
    </td>
  )
}
