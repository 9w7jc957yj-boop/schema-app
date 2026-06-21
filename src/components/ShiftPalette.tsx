import { useState } from 'react'
import type { ShiftTemplate } from '../types'
import ShiftBlock from './ShiftBlock'
import ShiftTemplateDialog from './ShiftTemplateDialog'
import './ShiftPalette.css'

interface ShiftPaletteProps {
  templates: ShiftTemplate[]
  /** Om satt visas en "Skapa passmall"-knapp (endast i grundschemat). */
  onCreate?: (template: ShiftTemplate) => void
}

/**
 * Paletten med passmallar. Varje ruta är en drag-källa: dra den till en cell
 * i rutnätet för att lägga ut passet. Alla mallar visas direkt. I grundschemat
 * kan nya passmallar skapas via knappen uppe till höger.
 */
export default function ShiftPalette({ templates, onCreate }: ShiftPaletteProps) {
  const [showDialog, setShowDialog] = useState(false)

  return (
    <section className="palette">
      <div className="palette__header">
        <h2 className="palette__title">Passmallar</h2>
        <span className="palette__hint">Dra ett pass till en cell i schemat</span>
        {onCreate && (
          <button
            className="palette__create"
            type="button"
            onClick={() => setShowDialog(true)}
          >
            + Skapa passmall
          </button>
        )}
      </div>
      <div className="palette__grid">
        {templates.map((t) => (
          <ShiftBlock key={t.id} template={t} variant="palette" />
        ))}
      </div>

      {showDialog && onCreate && (
        <ShiftTemplateDialog
          onSave={(template) => {
            onCreate(template)
            setShowDialog(false)
          }}
          onClose={() => setShowDialog(false)}
        />
      )}
    </section>
  )
}
