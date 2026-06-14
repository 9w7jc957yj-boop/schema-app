import type { ShiftTemplate } from '../types'
import { shiftDurationMinutes, formatMinutesAsHHMM } from '../utils/time'
import { writeDragPayload } from '../utils/dnd'
import './ShiftBlock.css'

interface ShiftBlockProps {
  template: ShiftTemplate
  /** 'palette' = drag-källa för nytt pass, 'cell' = utlagt pass i rutnätet. */
  variant: 'palette' | 'cell'
  /** Endast för cell-varianten: id på det utlagda passet (för flytt/borttag). */
  shiftId?: string
  onRemove?: () => void
}

/**
 * En pass-ruta. I paletten visas etiketten på en färgad ruta (drag-källa).
 * I en cell visas passet som ett ljust chip med passfärgen som vänsterkant,
 * tid och passnamn – i samma stil som brukarschemats insats-chips.
 */
export default function ShiftBlock({ template, variant, shiftId, onRemove }: ShiftBlockProps) {
  const isCell = variant === 'cell'
  const durationLabel = formatMinutesAsHHMM(shiftDurationMinutes(template))
  // Etiketter som redan är en tid (t.ex. "06:00–14:45") visas inte dubbelt.
  const labelIsTime = /^\d/.test(template.label)

  const handleDragStart = (e: React.DragEvent) => {
    if (variant === 'palette') {
      writeDragPayload(e, { kind: 'template', templateId: template.id })
    } else if (shiftId) {
      writeDragPayload(e, { kind: 'move', shiftId, templateId: template.id })
    }
  }

  const handleContextMenu = (e: React.MouseEvent) => {
    if (isCell && onRemove) {
      e.preventDefault()
      onRemove()
    }
  }

  return (
    <div
      className={`shift-block shift-block--${variant}`}
      style={{ borderLeftColor: template.color }}
      draggable
      onDragStart={handleDragStart}
      onContextMenu={handleContextMenu}
      title={`${template.label} · ${template.startTime}–${template.endTime} · ${durationLabel}`}
    >
      {variant === 'palette' ? (
        <div className="shift-block__palette-body">
          <span className="shift-block__label">{template.label}</span>
          <span className="shift-block__duration">
            {labelIsTime ? durationLabel : `${template.startTime}–${template.endTime}`}
          </span>
        </div>
      ) : (
        <div className="shift-block__cell-body">
          <div className="shift-block__chip-time">
            {template.startTime}–{template.endTime}
            {template.crossesMidnight && <span className="shift-block__nextday">+1</span>}
          </div>
          {!labelIsTime && <div className="shift-block__chip-label">{template.label}</div>}
        </div>
      )}

      {isCell && onRemove && (
        <button
          className="shift-block__remove"
          type="button"
          onClick={(e) => {
            e.stopPropagation()
            onRemove()
          }}
          title="Ta bort pass"
          aria-label="Ta bort pass"
        >
          ✕
        </button>
      )}
    </div>
  )
}
