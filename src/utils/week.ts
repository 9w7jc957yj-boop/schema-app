/** Hjälpfunktioner för att jobba med en vecka eller en månad. */

export interface DayColumn {
  date: string // "YYYY-MM-DD"
  /** Kort veckodagsnamn, t.ex. "Mån". */
  weekdayLabel: string
  /** Datumetikett, t.ex. "9/6" (vecka) eller "9" (månad). */
  dateLabel: string
  /** True för lördag/söndag. */
  isWeekend: boolean
  /** True för måndagar – används för veckoavgränsare i månadsvyn. */
  isWeekStart: boolean
}

/** Vad rutnätet visar: en vecka eller en hel månad. */
export type GridView = 'vecka' | 'manad'

const WEEKDAY_LABELS = ['Mån', 'Tis', 'Ons', 'Tor', 'Fre', 'Lör', 'Sön']

const MONTHS = [
  'januari', 'februari', 'mars', 'april', 'maj', 'juni',
  'juli', 'augusti', 'september', 'oktober', 'november', 'december',
]

function toISODate(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

/** Veckodagsindex med måndag = 0 ... söndag = 6. */
function weekdayIndex(d: Date): number {
  return (d.getDay() + 6) % 7
}

/** Tolkar "YYYY-MM-DD" som ett lokalt datum (undviker UTC-skift). */
export function isoToDate(iso: string): Date {
  const [y, m, d] = iso.split('-').map(Number)
  return new Date(y, m - 1, d)
}

/** Lägger till n dagar på en "YYYY-MM-DD"-sträng och returnerar en ny sträng. */
export function addDaysISO(iso: string, n: number): string {
  const d = isoToDate(iso)
  d.setDate(d.getDate() + n)
  return toISODate(d)
}

/** Bygger en enda dagkolumn för `ref`. */
export function buildDay(ref: Date): DayColumn[] {
  const wd = weekdayIndex(ref)
  return [
    {
      date: toISODate(ref),
      weekdayLabel: WEEKDAY_LABELS[wd],
      dateLabel: `${ref.getDate()}/${ref.getMonth() + 1}`,
      isWeekend: wd >= 5,
      isWeekStart: wd === 0,
    },
  ]
}

/** Snyggt format för en enskild dag, t.ex. "Måndag 8 juni 2026". */
export function formatDayLabel(iso: string): string {
  const d = isoToDate(iso)
  const full = ['Måndag', 'Tisdag', 'Onsdag', 'Torsdag', 'Fredag', 'Lördag', 'Söndag']
  return `${full[weekdayIndex(d)]} ${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`
}

/** Returnerar måndagen i veckan som innehåller `ref`. */
export function startOfWeek(ref: Date): Date {
  const d = new Date(ref)
  d.setHours(0, 0, 0, 0)
  d.setDate(d.getDate() - weekdayIndex(d))
  return d
}

/** Bygger sju dagkolumner (mån–sön) utifrån en startdag (måndag). */
export function buildWeek(monday: Date): DayColumn[] {
  const cols: DayColumn[] = []
  for (let i = 0; i < 7; i++) {
    const d = new Date(monday)
    d.setDate(monday.getDate() + i)
    cols.push({
      date: toISODate(d),
      weekdayLabel: WEEKDAY_LABELS[i],
      dateLabel: `${d.getDate()}/${d.getMonth() + 1}`,
      isWeekend: i >= 5,
      isWeekStart: i === 0,
    })
  }
  return cols
}

/** Bygger en kolumn per dag i månaden som innehåller `ref`. */
export function buildMonth(ref: Date): DayColumn[] {
  const year = ref.getFullYear()
  const month = ref.getMonth()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const cols: DayColumn[] = []
  for (let day = 1; day <= daysInMonth; day++) {
    const d = new Date(year, month, day)
    const wd = weekdayIndex(d)
    cols.push({
      date: toISODate(d),
      weekdayLabel: WEEKDAY_LABELS[wd],
      dateLabel: String(day),
      isWeekend: wd >= 5,
      isWeekStart: wd === 0,
    })
  }
  return cols
}

/** Snyggt format för veckans intervall, t.ex. "9–15 juni 2026". */
export function formatWeekRange(days: DayColumn[]): string {
  if (days.length === 0) return ''
  const first = new Date(days[0].date)
  const last = new Date(days[days.length - 1].date)
  const sameMonth = first.getMonth() === last.getMonth()
  if (sameMonth) {
    return `${first.getDate()}–${last.getDate()} ${MONTHS[last.getMonth()]} ${last.getFullYear()}`
  }
  return `${first.getDate()} ${MONTHS[first.getMonth()]} – ${last.getDate()} ${MONTHS[last.getMonth()]} ${last.getFullYear()}`
}

/** Månadsetikett med stor begynnelsebokstav, t.ex. "Juni 2026". */
export function formatMonthLabel(days: DayColumn[]): string {
  if (days.length === 0) return ''
  const d = new Date(days[0].date)
  const name = MONTHS[d.getMonth()]
  return `${name.charAt(0).toUpperCase()}${name.slice(1)} ${d.getFullYear()}`
}
