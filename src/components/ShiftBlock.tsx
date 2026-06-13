import type { ShiftTemplate } from '../types'
import { displaySegments, shiftDurationMinutes, formatMinutesAsHHMM } from '../utils/time'
import { readableTextColor } from '../utils/color'
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
 * En färgad pass-ruta. I paletten visas etiketten; i en cell visas
 * tiden på två rader. Pass som korsar midnatt ritas tvådelat.
 */
export default function ShiftBlock({ template, variant, shiftId, onRemove }: ShiftBlockProps) {
  const textColor = readableTextColor(template.color)
  const segments = displaySegments(template)
  const durationLabel = formatMinutesAsHHMM(shiftDurationMinutes(template))

  const handleDragStart = (e: React.DragEvent) => {
    if (variant === 'palette') {
      writeDragPayload(e, { kind: 'template', templateId: template.id })
    } else if (shiftId) {
      writeDragPayload(e, { kind: 'move', shiftId, templateId: template.id })
    }
  }

  const handleContextMenu = (e: React.MouseEvent) => {
    if (variant === 'cell' && onRemove) {
      e.preventDefault()
      onRemove()
    }
  }

  return (
    <div
      className={`shift-block shift-block--${variant} ${template.crossesMidnight ? 'is-split' : ''}`}
      style={{ background: template.color, color: textColor }}
      draggable
      onDragStart={handleDragStart}
      onContextMenu={handleContextMenu}
      title={`${template.label} · ${durationLabel}`}
    >
      {variant === 'palette' ? (
        <div className="shift-block__palette-body">
          <span className="shift-block__label">{template.label}</span>
          <span className="shift-block__duration">{durationLabel}</span>
        </div>
      ) : (
        <div className="shift-block__cell-body">
          {template.crossesMidnight ? (
            <div className="shift-block__segments">
              {segments.map((seg, i) => (
                <div className="shift-block__segment" key={i}>
                  <span>{seg.start}</span>
                  <span>{seg.end}</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="shift-block__time">
              <span>{template.startTime}</span>
              <span>{template.endTime}</span>
            </div>
          )}
        </div>
      )}

      {variant === 'cell' && onRemove && (
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
