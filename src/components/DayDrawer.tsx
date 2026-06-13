import { useEffect, useMemo, useState } from 'react'
import type { Brukare, DayActivity, Employee, ShiftTemplate } from '../types'
import { CATEGORY_META } from '../data/activities'
import { formatDayLabel } from '../utils/week'
import './DayDrawer.css'

interface StaffOnDuty {
  employee: Employee
  template: ShiftTemplate
}

interface DayDrawerProps {
  date: string
  brukareById: Map<string, Brukare>
  activities: DayActivity[]
  employeesById: Map<string, Employee>
  staffOnDuty: StaffOnDuty[]
  onClose: () => void
}

function initials(name: string): string {
  return name
    .split(' ')
    .map((p) => p[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()
}

/**
 * Dagdrawer: glider in från höger och beskriver dagens insatser per brukare –
 * vad som ska göras, när och av vem. Förslagsvy (insatserna är mockade).
 */
export default function DayDrawer({
  date,
  brukareById,
  activities,
  employeesById,
  staffOnDuty,
  onClose,
}: DayDrawerProps) {
  const [done, setDone] = useState<Set<string>>(new Set())

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  // Gruppera insatser per brukare och sortera på starttid.
  const groups = useMemo(() => {
    const byBrukare = new Map<string, DayActivity[]>()
    for (const a of activities) {
      const list = byBrukare.get(a.brukareId)
      if (list) list.push(a)
      else byBrukare.set(a.brukareId, [a])
    }
    return [...byBrukare.entries()]
      .map(([brukareId, list]) => ({
        brukare: brukareById.get(brukareId),
        activities: list.slice().sort((x, y) => x.startTime.localeCompare(y.startTime)),
      }))
      .filter((g) => g.brukare)
      .sort((a, b) => a.activities[0].startTime.localeCompare(b.activities[0].startTime))
  }, [activities, brukareById])

  const doneCount = activities.filter((a) => done.has(a.id)).length

  const toggle = (id: string) =>
    setDone((prev) => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })

  return (
    <div className="drawer-root" role="dialog" aria-modal="true" aria-label="Dagens insatser">
      <div className="drawer-scrim" onClick={onClose} />
      <aside className="drawer">
        <header className="drawer__head">
          <div>
            <div className="drawer__eyebrow">Dagens insatser</div>
            <h2 className="drawer__title">{formatDayLabel(date)}</h2>
          </div>
          <button className="drawer__close" type="button" onClick={onClose} aria-label="Stäng">
            ✕
          </button>
        </header>

        <div className="drawer__summary">
          <span className="drawer__stat">
            <strong>{groups.length}</strong> brukare
          </span>
          <span className="drawer__stat">
            <strong>{activities.length}</strong> insatser
          </span>
          <span className="drawer__stat">
            <strong>{doneCount}</strong> klara
          </span>
        </div>

        {staffOnDuty.length > 0 && (
          <div className="drawer__duty">
            <span className="drawer__duty-label">På pass idag</span>
            <div className="drawer__duty-list">
              {staffOnDuty.map(({ employee, template }) => (
                <span key={employee.id} className="duty-chip" title={`${employee.firstName} ${employee.lastName}`}>
                  <span className="duty-chip__dot" style={{ background: template.color }} />
                  {employee.firstName} {employee.lastName[0]}.
                  <span className="duty-chip__time">{template.startTime}–{template.endTime}</span>
                </span>
              ))}
            </div>
          </div>
        )}

        <div className="drawer__body">
          {groups.length === 0 ? (
            <div className="drawer__empty">
              <span className="drawer__empty-icon">🗓️</span>
              Inga planerade insatser denna dag.
            </div>
          ) : (
            groups.map((group) => {
              const b = group.brukare!
              return (
                <section key={b.id} className="bru-card">
                  <div className="bru-card__head">
                    <span className="bru-card__avatar">{initials(b.name)}</span>
                    <div className="bru-card__id">
                      <div className="bru-card__name">{b.name}</div>
                      <div className="bru-card__unit">{b.unit}</div>
                    </div>
                    <span className="bru-card__count">{group.activities.length} insatser</span>
                  </div>
                  {b.note && <p className="bru-card__note">{b.note}</p>}

                  <ul className="act-list">
                    {group.activities.map((a) => {
                      const meta = CATEGORY_META[a.category]
                      const resp = a.responsibleEmployeeId
                        ? employeesById.get(a.responsibleEmployeeId)
                        : undefined
                      const isDone = done.has(a.id)
                      return (
                        <li key={a.id} className={`act ${isDone ? 'is-done' : ''}`}>
                          <button
                            className="act__check"
                            type="button"
                            onClick={() => toggle(a.id)}
                            aria-pressed={isDone}
                            aria-label={isDone ? 'Markera ej klar' : 'Markera klar'}
                          >
                            {isDone ? '✓' : ''}
                          </button>
                          <span className="act__time">{a.startTime}</span>
                          <span className="act__icon" style={{ background: `${meta.color}1f`, color: meta.color }}>
                            {meta.icon}
                          </span>
                          <div className="act__body">
                            <div className="act__title">{a.title}</div>
                            <div className="act__meta">
                              {resp && (
                                <span className="act__resp">
                                  {resp.firstName} {resp.lastName[0]}.
                                </span>
                              )}
                              {a.location && <span className="act__loc">📍 {a.location}</span>}
                            </div>
                            {a.note && <div className="act__hint">{a.note}</div>}
                          </div>
                        </li>
                      )
                    })}
                  </ul>
                </section>
              )
            })
          )}
        </div>

        <footer className="drawer__foot">
          <button className="drawer__add" type="button" title="Lägg till insats (kommer senare)">
            + Lägg till insats
          </button>
        </footer>
      </aside>
    </div>
  )
}
