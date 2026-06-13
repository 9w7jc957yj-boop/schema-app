import { useEffect, useState } from 'react'
import { isoToDate } from '../utils/week'

interface MiniCalendarProps {
  /** Datum i fokus (markeras tydligt). */
  focusedDate: string
  /** Dagens datum (markeras med ring). */
  today: string
  /** Datum som ingår i den visade perioden (markeras som intervall). */
  periodDates: Set<string>
  onPickDate: (iso: string) => void
}

const MONTH_NAMES = [
  'Januari', 'Februari', 'Mars', 'April', 'Maj', 'Juni',
  'Juli', 'Augusti', 'September', 'Oktober', 'November', 'December',
]
const WD = ['M', 'T', 'O', 'T', 'F', 'L', 'S']

function iso(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

/** Liten månadskalender i sidofältet – navigerbar och klickbar. */
export default function MiniCalendar({ focusedDate, today, periodDates, onPickDate }: MiniCalendarProps) {
  const [cursor, setCursor] = useState(() => {
    const d = isoToDate(focusedDate)
    return new Date(d.getFullYear(), d.getMonth(), 1)
  })

  // Följ med när fokus byter månad.
  useEffect(() => {
    const d = isoToDate(focusedDate)
    setCursor(new Date(d.getFullYear(), d.getMonth(), 1))
  }, [focusedDate])

  const year = cursor.getFullYear()
  const month = cursor.getMonth()
  const firstWeekday = (new Date(year, month, 1).getDay() + 6) % 7 // mån=0
  const start = new Date(year, month, 1 - firstWeekday)

  const cells: Date[] = []
  for (let i = 0; i < 42; i++) {
    cells.push(new Date(start.getFullYear(), start.getMonth(), start.getDate() + i))
  }

  const shift = (delta: number) => setCursor(new Date(year, month + delta, 1))

  return (
    <div className="mini-cal">
      <div className="mini-cal__head">
        <button className="mini-cal__nav" type="button" onClick={() => shift(-1)} aria-label="Föregående månad">
          ‹
        </button>
        <span className="mini-cal__title">
          {MONTH_NAMES[month]} {year}
        </span>
        <button className="mini-cal__nav" type="button" onClick={() => shift(1)} aria-label="Nästa månad">
          ›
        </button>
      </div>

      <div className="mini-cal__grid">
        {WD.map((w, i) => (
          <div key={`wd-${i}`} className="mini-cal__wd">
            {w}
          </div>
        ))}
        {cells.map((d) => {
          const ds = iso(d)
          const inMonth = d.getMonth() === month
          const isToday = ds === today
          const isFocused = ds === focusedDate
          const inPeriod = periodDates.has(ds)
          return (
            <button
              key={ds}
              type="button"
              onClick={() => onPickDate(ds)}
              className={[
                'mini-cal__day',
                inMonth ? '' : 'is-out',
                inPeriod ? 'is-period' : '',
                isFocused ? 'is-focused' : '',
                isToday ? 'is-today' : '',
              ].join(' ')}
            >
              {d.getDate()}
            </button>
          )
        })}
      </div>
    </div>
  )
}
