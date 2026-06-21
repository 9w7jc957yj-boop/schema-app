import { useEffect, useState } from 'react'
import './ActivityDialog.css'

interface TempShiftDialogProps {
  /** Rubriktext, t.ex. "Anna Lindqvist · mån 15/6". */
  contextLabel: string
  onSave: (startTime: string, endTime: string) => void
  onClose: () => void
}

/** Minimal modal för ett tillfälligt pass i liveschemat – endast tid. */
export default function TempShiftDialog({ contextLabel, onSave, onClose }: TempShiftDialogProps) {
  const [startTime, setStartTime] = useState('08:00')
  const [endTime, setEndTime] = useState('16:00')

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    onSave(startTime, endTime)
  }

  return (
    <div className="adlg-root" role="dialog" aria-modal="true" aria-label="Tillfälligt pass">
      <div className="adlg-scrim" onClick={onClose} />
      <form className="adlg adlg--narrow" onSubmit={submit}>
        <header className="adlg__head">
          <div>
            <div className="adlg__eyebrow">{contextLabel}</div>
            <h2 className="adlg__title">Tillfälligt pass</h2>
          </div>
          <button className="adlg__close" type="button" onClick={onClose} aria-label="Stäng">✕</button>
        </header>

        <div className="adlg__body">
          <div className="adlg-row">
            <label className="adlg-field">
              <span>Start</span>
              <input autoFocus type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} />
            </label>
            <label className="adlg-field">
              <span>Slut</span>
              <input type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} />
            </label>
          </div>
        </div>

        <footer className="adlg__foot">
          <div className="adlg__foot-right">
            <button className="adlg-btn" type="button" onClick={onClose}>Avbryt</button>
            <button className="adlg-btn adlg-btn--primary" type="submit">Lägg till</button>
          </div>
        </footer>
      </form>
    </div>
  )
}
