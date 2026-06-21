import type { ReactNode } from 'react'
import type { ScheduleMode } from '../types'
import './Toolbar.css'

interface ToolbarProps {
  mode: ScheduleMode
  /** Fyll ut grundschemat utifrån bemanningsgrad. */
  onFillGrundschema: () => void
  /** Verksamhetsväljaren (delas med brukarvyn för identisk placering). */
  verksamhetSelect: ReactNode
  /** Växel mellan personal- och brukarschema. */
  kindSwitch: ReactNode
}

/**
 * Toppmeny. Verksamhetsväljaren sitter till vänster, växeln mellan
 * personal- och brukarschema centrerad i mitten, och åtgärdsknappar till
 * höger.
 */
export default function Toolbar({
  mode,
  onFillGrundschema,
  verksamhetSelect,
  kindSwitch,
}: ToolbarProps) {
  const isLive = mode === 'liveschema'

  return (
    <div className="toolbar">
      <div className="toolbar__group">{verksamhetSelect}</div>

      <div className="toolbar__group toolbar__group--center">{kindSwitch}</div>

      <div className="toolbar__group toolbar__group--end">
        {!isLive && (
          <button
            className="tb-btn tb-btn--magic"
            type="button"
            onClick={onFillGrundschema}
            title="Fyll ut grundschemat utifrån bemanningsgrad"
          >
            ✨ Fyll ut
          </button>
        )}
        <button className="tb-btn tb-btn--accent" type="button" title="Rulla ut schema (kommer senare)">
          Rulla ut
        </button>
      </div>
    </div>
  )
}
