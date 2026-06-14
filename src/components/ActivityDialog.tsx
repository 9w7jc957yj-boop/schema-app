import { useEffect, useState } from 'react'
import type { ActivityCategory, DayActivity, Employee } from '../types'
import { CATEGORY_META } from '../data/activities'
import './ActivityDialog.css'

/** Insats utan id (nytt) eller med id (redigering). */
export type ActivityDraft = Omit<DayActivity, 'id'> & { id?: string }

interface ActivityDialogProps {
  draft: ActivityDraft
  brukareName: string
  dateLabel: string
  employees: Employee[]
  onSave: (activity: ActivityDraft, repeatWeek: boolean) => void
  onRemove?: () => void
  onClose: () => void
}

const CATEGORIES = Object.keys(CATEGORY_META) as ActivityCategory[]

/** Modal för att lägga till eller redigera en insats/aktivitet för en brukare. */
export default function ActivityDialog({
  draft,
  brukareName,
  dateLabel,
  employees,
  onSave,
  onRemove,
  onClose,
}: ActivityDialogProps) {
  const isEdit = Boolean(draft.id)
  const [title, setTitle] = useState(draft.title)
  const [startTime, setStartTime] = useState(draft.startTime)
  const [endTime, setEndTime] = useState(draft.endTime ?? '')
  const [category, setCategory] = useState<ActivityCategory>(draft.category)
  const [responsible, setResponsible] = useState(draft.responsibleEmployeeId ?? '')
  const [location, setLocation] = useState(draft.location ?? '')
  const [note, setNote] = useState(draft.note ?? '')
  const [repeatWeek, setRepeatWeek] = useState(false)

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim()) return
    onSave(
      {
        id: draft.id,
        brukareId: draft.brukareId,
        date: draft.date,
        startTime,
        endTime: endTime || undefined,
        title: title.trim(),
        category,
        responsibleEmployeeId: responsible || undefined,
        location: location.trim() || undefined,
        note: note.trim() || undefined,
      },
      repeatWeek,
    )
  }

  return (
    <div className="adlg-root" role="dialog" aria-modal="true" aria-label={isEdit ? 'Redigera insats' : 'Lägg till insats'}>
      <div className="adlg-scrim" onClick={onClose} />
      <form className="adlg" onSubmit={submit}>
        <header className="adlg__head">
          <div>
            <div className="adlg__eyebrow">{brukareName} · {dateLabel}</div>
            <h2 className="adlg__title">{isEdit ? 'Redigera insats' : 'Ny insats'}</h2>
          </div>
          <button className="adlg__close" type="button" onClick={onClose} aria-label="Stäng">✕</button>
        </header>

        <div className="adlg__body">
          <label className="adlg-field">
            <span>Vad ska göras</span>
            <input
              autoFocus
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="t.ex. Handla mat, Promenad, Medicin"
            />
          </label>

          <div className="adlg-row">
            <label className="adlg-field">
              <span>Start</span>
              <input type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} />
            </label>
            <label className="adlg-field">
              <span>Slut (valfritt)</span>
              <input type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} />
            </label>
          </div>

          <label className="adlg-field">
            <span>Kategori</span>
            <div className="adlg-cats">
              {CATEGORIES.map((c) => {
                const m = CATEGORY_META[c]
                return (
                  <button
                    key={c}
                    type="button"
                    className={`adlg-cat ${category === c ? 'is-active' : ''}`}
                    style={category === c ? { background: m.color, color: '#fff', borderColor: m.color } : undefined}
                    onClick={() => setCategory(c)}
                  >
                    <span>{m.icon}</span> {m.label}
                  </button>
                )
              })}
            </div>
          </label>

          <div className="adlg-row">
            <label className="adlg-field">
              <span>Ansvarig personal</span>
              <select value={responsible} onChange={(e) => setResponsible(e.target.value)}>
                <option value="">– Ingen –</option>
                {employees.map((e) => (
                  <option key={e.id} value={e.id}>{e.firstName} {e.lastName}</option>
                ))}
              </select>
            </label>
            <label className="adlg-field">
              <span>Plats (valfritt)</span>
              <input type="text" value={location} onChange={(e) => setLocation(e.target.value)} placeholder="t.ex. Köket" />
            </label>
          </div>

          <label className="adlg-field">
            <span>Anteckning (valfritt)</span>
            <input type="text" value={note} onChange={(e) => setNote(e.target.value)} placeholder="t.ex. Insulin före frukost" />
          </label>

          {!isEdit && (
            <label className="adlg-check">
              <input type="checkbox" checked={repeatWeek} onChange={(e) => setRepeatWeek(e.target.checked)} />
              <span>Daglig insats – upprepa måndag–söndag denna vecka</span>
            </label>
          )}
        </div>

        <footer className="adlg__foot">
          {isEdit && onRemove && (
            <button className="adlg-btn adlg-btn--danger" type="button" onClick={onRemove}>
              Ta bort
            </button>
          )}
          <div className="adlg__foot-right">
            <button className="adlg-btn" type="button" onClick={onClose}>Avbryt</button>
            <button className="adlg-btn adlg-btn--primary" type="submit" disabled={!title.trim()}>
              {isEdit ? 'Spara' : 'Lägg till'}
            </button>
          </div>
        </footer>
      </form>
    </div>
  )
}
