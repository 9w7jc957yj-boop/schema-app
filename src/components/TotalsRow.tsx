import type { DayColumn } from '../utils/week'
import { formatMinutesAsHHMM } from '../utils/time'

interface TotalsRowProps {
  days: DayColumn[]
  /** Summerade minuter per datum (kolumnsumma). */
  minutesByDate: Map<string, number>
  /** Veckans totalsumma i minuter. */
  weekTotalMinutes: number
}

/** Nedersta raden: summa schemalagda timmar per dag + veckans total. */
export default function TotalsRow({ days, minutesByDate, weekTotalMinutes }: TotalsRowProps) {
  return (
    <tr className="totals-row">
      <th className="totals-row__label" scope="row">
        Total
      </th>
      {days.map((day) => {
        const minutes = minutesByDate.get(day.date) ?? 0
        return (
          <td
            key={day.date}
            className={`totals-row__cell ${day.isWeekend ? 'cell--weekend' : ''}`}
          >
            {minutes > 0 ? formatMinutesAsHHMM(minutes) : '–'}
          </td>
        )
      })}
      <td className="totals-row__grand">{formatMinutesAsHHMM(weekTotalMinutes)}</td>
    </tr>
  )
}
