import type { ShiftTemplate } from '../types'
import ShiftBlock from './ShiftBlock'
import './ShiftPalette.css'

interface ShiftPaletteProps {
  templates: ShiftTemplate[]
}

/**
 * Paletten med alla passmallar. Varje ruta är en drag-källa: dra den till
 * en cell i rutnätet för att lägga ut passet.
 */
export default function ShiftPalette({ templates }: ShiftPaletteProps) {
  return (
    <section className="palette">
      <div className="palette__header">
        <h2 className="palette__title">Passmallar</h2>
        <span className="palette__hint">Dra ett pass till en cell i schemat</span>
      </div>
      <div className="palette__grid">
        {templates.map((t) => (
          <ShiftBlock key={t.id} template={t} variant="palette" />
        ))}
      </div>
    </section>
  )
}
