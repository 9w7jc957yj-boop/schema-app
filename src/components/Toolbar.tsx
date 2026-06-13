import type { ReactNode } from 'react'
import type { ScheduleMode } from '../types'
import type { GridView } from '../utils/week'
import './Toolbar.css'

interface ToolbarProps {
  mode: ScheduleMode
  onChangeMode: (mode: ScheduleMode) => void
  /** Vy för grundschemat (vecka/månad). */
  grundView: GridView
  onChangeGrundView: (view: GridView) => void
  /** Antal celler i liveschemat som avviker från grundschemat. */
  deviationCount: number
  /** Återställ liveschemat till grundschemat. */
  onResetLive: () => void
  /** Fyll ut grundschemat utifrån bemanningsgrad. */
  onFillGrundschema: () => void
  /** Växel mellan layoutvarianter. */
  variantSwitcher: ReactNode
}

const MODES: { value: ScheduleMode; label: string }[] = [
  { value: 'grundschema', label: 'Grundschema' },
  { value: 'liveschema', label: 'Liveschema' },
]

const VIEWS: { value: GridView; label: string }[] = [
  { value: 'vecka', label: 'Vecka' },
  { value: 'manad', label: 'Månad' },
]

/**
 * Toppmeny. Centralt sitter växeln mellan Grundschema och Liveschema.
 * Övriga knappar (Filter, Skapa ny, Ta bort, Ändra namn, Rulla ut) är
 * visuella stubbar i detta steg.
 */
export default function Toolbar({
  mode,
  onChangeMode,
  grundView,
  onChangeGrundView,
  deviationCount,
  onResetLive,
  onFillGrundschema,
  variantSwitcher,
}: ToolbarProps) {
  const isLive = mode === 'liveschema'

  return (
    <div className="toolbar">
      <div className="toolbar__group">
        {variantSwitcher}
        <button className="tb-btn" type="button" title="Filtrera (kommer senare)">
          <span className="tb-btn__icon">⛃</span>
          Filter
        </button>
      </div>

      <div className="toolbar__group toolbar__group--center">
        <div className="mode-switch" role="tablist" aria-label="Välj schema">
          <span
            className="mode-switch__thumb"
            data-mode={mode}
            aria-hidden="true"
          />
          {MODES.map((m) => (
            <button
              key={m.value}
              type="button"
              role="tab"
              aria-selected={mode === m.value}
              className={`mode-switch__option ${mode === m.value ? 'is-active' : ''}`}
              onClick={() => onChangeMode(m.value)}
            >
              {m.label}
            </button>
          ))}
        </div>

        {!isLive && (
          <div className="view-switch" role="group" aria-label="Vecka eller månad">
            {VIEWS.map((v) => (
              <button
                key={v.value}
                type="button"
                aria-pressed={grundView === v.value}
                className={`view-switch__option ${grundView === v.value ? 'is-active' : ''}`}
                onClick={() => onChangeGrundView(v.value)}
              >
                {v.label}
              </button>
            ))}
          </div>
        )}
      </div>

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
        {isLive && (
          <button
            className="tb-btn"
            type="button"
            onClick={onResetLive}
            disabled={deviationCount === 0}
            title="Återställ liveschemat till grundschemat"
          >
            ↺ Återställ till grund
          </button>
        )}
        <button className="tb-btn tb-btn--primary" type="button" title="Skapa nytt schema (kommer senare)">
          + Skapa ny
        </button>
        <button className="tb-btn" type="button" title="Ta bort schema (kommer senare)">
          Ta bort
        </button>
        <button className="tb-btn" type="button" title="Byt namn (kommer senare)">
          Ändra namn
        </button>
        <button className="tb-btn tb-btn--accent" type="button" title="Rulla ut schema (kommer senare)">
          Rulla ut
        </button>
      </div>
    </div>
  )
}
