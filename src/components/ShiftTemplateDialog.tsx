import { useEffect, useState } from 'react'
import type { ShiftTemplate } from '../types'
import { VERKSAMHETER } from '../types'
import { parseTimeToMinutes } from '../utils/time'
import { makeId } from '../utils/storage'
import './ActivityDialog.css'

interface ShiftTemplateDialogProps {
  onSave: (template: ShiftTemplate) => void
  onClose: () => void
}

/** Färgpalett (iOS systemfärger) för nya passmallar. */
const TEMPLATE_COLORS = [
  '#0A84FF', '#30B0C7', '#32ADE6', '#34C759', '#30D158',
  '#A2845E', '#FF9F0A', '#FF9500', '#FF375F', '#8E8E93',
  '#AF52DE', '#FF2D55', '#5E5CE6', '#BF5AF2', '#5856D6',
]

/** Modal för att skapa en ny passmall (namn, tid och färg). */
export default function ShiftTemplateDialog({ onSave, onClose }: ShiftTemplateDialogProps) {
  const [label, setLabel] = useState('')
  const [startTime, setStartTime] = useState('07:00')
  const [endTime, setEndTime] = useState('16:00')
  const [color, setColor] = useState(TEMPLATE_COLORS[0])
  // Verksamheter som får använda mallen – alla förvalda.
  const [verksamhetIds, setVerksamhetIds] = useState<string[]>(VERKSAMHETER.map((v) => v.id))

  const toggleVerksamhet = (id: string) =>
    setVerksamhetIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    )

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  const canSave = Boolean(label.trim()) && verksamhetIds.length > 0

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!canSave) return
    const crossesMidnight = parseTimeToMinutes(endTime) <= parseTimeToMinutes(startTime)
    onSave({
      id: makeId('tpl'),
      label: label.trim(),
      startTime,
      endTime,
      color,
      crossesMidnight,
      verksamhetIds,
    })
  }

  return (
    <div className="adlg-root" role="dialog" aria-modal="true" aria-label="Skapa passmall">
      <div className="adlg-scrim" onClick={onClose} />
      <form className="adlg" onSubmit={submit}>
        <header className="adlg__head">
          <div>
            <div className="adlg__eyebrow">Grundschema · Passmall</div>
            <h2 className="adlg__title">Ny passmall</h2>
          </div>
          <button className="adlg__close" type="button" onClick={onClose} aria-label="Stäng">✕</button>
        </header>

        <div className="adlg__body">
          <label className="adlg-field">
            <span>Namn</span>
            <input
              autoFocus
              type="text"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder="t.ex. Tidig, Kväll, Natt"
            />
          </label>

          <div className="adlg-row">
            <label className="adlg-field">
              <span>Start</span>
              <input type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} />
            </label>
            <label className="adlg-field">
              <span>Slut</span>
              <input type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} />
            </label>
          </div>

          <label className="adlg-field">
            <span>Verksamheter som kan använda mallen</span>
            <div className="adlg-checks">
              {VERKSAMHETER.map((v) => (
                <label key={v.id} className="adlg-checkpill">
                  <input
                    type="checkbox"
                    checked={verksamhetIds.includes(v.id)}
                    onChange={() => toggleVerksamhet(v.id)}
                  />
                  <span>{v.name}</span>
                </label>
              ))}
            </div>
          </label>

          <label className="adlg-field">
            <span>Färg</span>
            <div className="adlg-swatches">
              {TEMPLATE_COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  className={`adlg-swatch ${color === c ? 'is-active' : ''}`}
                  style={{ background: c, color: c }}
                  onClick={() => setColor(c)}
                  aria-label={`Färg ${c}`}
                  aria-pressed={color === c}
                />
              ))}
            </div>
          </label>
        </div>

        <footer className="adlg__foot">
          <div className="adlg__foot-right">
            <button className="adlg-btn" type="button" onClick={onClose}>Avbryt</button>
            <button className="adlg-btn adlg-btn--primary" type="submit" disabled={!canSave}>
              Skapa
            </button>
          </div>
        </footer>
      </form>
    </div>
  )
}
