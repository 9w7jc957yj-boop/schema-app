import { useState } from 'react'
import type { ScheduledShift, ShiftTemplate } from '../types'
import ShiftBlock from './ShiftBlock'
import { readDragPayload, type DragPayload } from '../utils/dnd'
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
}: ShiftCellProps) {
  const [isOver, setIsOver] = useState(false)

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
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
      } ${isWeekStart ? 'cell--weekstart' : ''}`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
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
