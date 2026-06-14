import { useMemo, useState } from 'react'
import type { Brukare, DayActivity, Employee } from '../types'
import type { DayColumn } from '../utils/week'
import { CATEGORY_META } from '../data/activities'
import { formatDayLabel } from '../utils/week'
import ActivityDialog, { type ActivityDraft } from './ActivityDialog'
import './BrukareSchedule.css'

interface BrukareScheduleProps {
  brukare: Brukare[]
  days: DayColumn[]
  activities: DayActivity[]
  employees: Employee[]
  employeesById: Map<string, Employee>
  onAddOrUpdate: (activity: ActivityDraft, repeatWeek: boolean) => void
  onRemove: (id: string) => void
}

function empInitial(emp: Employee | undefined): string {
  return emp ? `${emp.firstName[0]}${emp.lastName[0]}`.toUpperCase() : ''
}

/** Brukarschema: matris av brukare × dagar med aktiviteter/insatser per cell. */
export default function BrukareSchedule({
  brukare,
  days,
  activities,
  employees,
  employeesById,
  onAddOrUpdate,
  onRemove,
}: BrukareScheduleProps) {
  const [draft, setDraft] = useState<ActivityDraft | null>(null)

  // Aggregera per cell (brukare|datum), per dag och per brukare.
  const agg = useMemo(() => {
    const byCell = new Map<string, DayActivity[]>()
    const perDay = new Map<string, number>()
    const perBrukare = new Map<string, number>()
    for (const d of days) perDay.set(d.date, 0)
    const visible = new Set(days.map((d) => d.date))

    for (const a of activities) {
      if (!visible.has(a.date)) continue
      const key = `${a.brukareId}|${a.date}`
      const list = byCell.get(key)
      if (list) list.push(a)
      else byCell.set(key, [a])
      perDay.set(a.date, (perDay.get(a.date) ?? 0) + 1)
      perBrukare.set(a.brukareId, (perBrukare.get(a.brukareId) ?? 0) + 1)
    }
    for (const list of byCell.values()) list.sort((x, y) => x.startTime.localeCompare(y.startTime))
    const total = [...perDay.values()].reduce((s, n) => s + n, 0)
    return { byCell, perDay, perBrukare, total }
  }, [activities, days])

  const openAdd = (brukareId: string, date: string) =>
    setDraft({ brukareId, date, startTime: '10:00', title: '', category: 'aktivitet' })

  const openEdit = (a: DayActivity) => setDraft({ ...a })

  const handleSave = (activity: ActivityDraft, repeatWeek: boolean) => {
    onAddOrUpdate(activity, repeatWeek)
    setDraft(null)
  }

  return (
    <div className="bru-grid-scroll">
      <table className="bru-grid">
        <thead>
          <tr>
            <th className="bg-corner" scope="col">Brukare</th>
            {days.map((d) => (
              <th key={d.date} scope="col" className={`bg-dayhead ${d.isWeekend ? 'is-weekend' : ''}`}>
                <span className="bg-dayhead__wd">{d.weekdayLabel}</span>
                <span className="bg-dayhead__date">{d.dateLabel}</span>
              </th>
            ))}
            <th className="bg-totalhead" scope="col">Insatser</th>
          </tr>
        </thead>

        <tbody>
          {brukare.map((b) => (
            <tr key={b.id} className="bg-row">
              <th className="bg-namecell" scope="row">
                <div className="bg-namecell__name">{b.name}</div>
                <div className="bg-namecell__unit">{b.unit}</div>
                {b.interests && <div className="bg-namecell__interests">♥ {b.interests}</div>}
              </th>

              {days.map((d) => {
                const list = agg.byCell.get(`${b.id}|${d.date}`) ?? []
                return (
                  <td
                    key={d.date}
                    className={`bg-cell ${d.isWeekend ? 'is-weekend' : ''}`}
                    onClick={() => openAdd(b.id, d.date)}
                    title="Klicka för att lägga till insats"
                  >
                    <div className="bg-cell__stack">
                      {list.map((a) => {
                        const meta = CATEGORY_META[a.category]
                        const resp = a.responsibleEmployeeId ? employeesById.get(a.responsibleEmployeeId) : undefined
                        return (
                          <div
                            key={a.id}
                            className="act-chip"
                            style={{ borderLeftColor: meta.color }}
                            onClick={(e) => { e.stopPropagation(); openEdit(a) }}
                            title={`${a.startTime}${a.endTime ? `–${a.endTime}` : ''} · ${a.title}${resp ? ` · ${resp.firstName}` : ''}`}
                          >
                            <div className="act-chip__top">
                              <span className="act-chip__time">{a.startTime}</span>
                              <span className="act-chip__icon">{meta.icon}</span>
                              {resp && <span className="act-chip__resp">{empInitial(resp)}</span>}
                              <button
                                className="act-chip__remove"
                                type="button"
                                onClick={(e) => { e.stopPropagation(); onRemove(a.id) }}
                                aria-label="Ta bort insats"
                              >
                                ✕
                              </button>
                            </div>
                            <div className="act-chip__title">{a.title}</div>
                          </div>
                        )
                      })}
                      <span className="bg-cell__add">+</span>
                    </div>
                  </td>
                )
              })}

              <td className="bg-total">{agg.perBrukare.get(b.id) ?? 0}</td>
            </tr>
          ))}
        </tbody>

        <tfoot>
          <tr className="bg-totals">
            <th className="bg-totals__label" scope="row">Totalt</th>
            {days.map((d) => (
              <td key={d.date} className={`bg-totals__cell ${d.isWeekend ? 'is-weekend' : ''}`}>
                {agg.perDay.get(d.date) || '–'}
              </td>
            ))}
            <td className="bg-totals__grand">{agg.total}</td>
          </tr>
        </tfoot>
      </table>

      {draft && (
        <ActivityDialog
          draft={draft}
          brukareName={brukare.find((b) => b.id === draft.brukareId)?.name ?? ''}
          dateLabel={formatDayLabel(draft.date)}
          employees={employees}
          onSave={handleSave}
          onRemove={draft.id ? () => { onRemove(draft.id!); setDraft(null) } : undefined}
          onClose={() => setDraft(null)}
        />
      )}
    </div>
  )
}
