import type { ActivityCategory, DayActivity } from '../types'
import { makeId } from '../utils/storage'

/**
 * Veckomönster för brukarnas insatser:
 * [brukareIndex, veckodag (0=mån), start, titel, kategori, ansvarigEmpIndex, plats?, anteckning?]
 *
 * Brukare-index: 0 Bertil · 1 Emma · 2 Sven · 3 Aisha · 4 Karin · 5 Olof · 6 Nils · 7 Maja
 * Medarbetar-index: 0 Anna · 1 Johan · 2 Sara · 3 Mehmet · 4 Elin · 5 David · 6 Fatima
 */
type Seed = [number, number, string, string, ActivityCategory, number, string?, string?]

const ACT_SEED: Seed[] = [
  // Måndag
  [4, 0, '08:00', 'Medicin – morgon', 'medicin', 0, undefined, 'Insulin före frukost'],
  [0, 0, '10:00', 'Promenad i parken', 'aktivitet', 1],
  [2, 0, '13:00', 'Sjukgymnastik', 'hygien', 4, 'Träningsrummet'],
  [0, 0, '16:00', 'Handla mat på ICA', 'inkop', 0, 'ICA Nära'],
  [6, 0, '09:00', 'Simträning', 'aktivitet', 4, 'Badhuset'],
  [7, 0, '14:00', 'Måla akvarell', 'aktivitet', 0],
  // Tisdag
  [4, 1, '08:00', 'Medicin – morgon', 'medicin', 0],
  [5, 1, '10:30', 'Musikstund', 'aktivitet', 4],
  [1, 1, '13:00', 'Till stan och handla kläder', 'utflykt', 1, 'Centrum'],
  [2, 1, '17:00', 'Laga middag tillsammans', 'maltid', 5, 'Köket'],
  [7, 1, '10:00', 'Besök på djurparken', 'utflykt', 1, 'Parken'],
  // Onsdag
  [4, 2, '08:00', 'Medicin – morgon', 'medicin', 0],
  [0, 2, '10:00', 'Simhall', 'utflykt', 1, 'Badhuset'],
  [3, 2, '11:00', 'Matlagningskurs', 'aktivitet', 4, 'Köket'],
  [1, 2, '15:00', 'Fika på café', 'aktivitet', 0, 'Café Hörnan'],
  [6, 2, '13:00', 'Biltidningar på biblioteket', 'aktivitet', 5, 'Biblioteket'],
  // Torsdag
  [4, 3, '08:00', 'Medicin – morgon', 'medicin', 0],
  [3, 3, '09:00', 'Träning på gym', 'aktivitet', 4, 'Gymmet'],
  [5, 3, '14:00', 'Utflykt till museet', 'utflykt', 5, 'Stadsmuseet'],
  [0, 3, '16:30', 'Storhandla inför helgen', 'inkop', 1, 'Stormarknad'],
  [6, 3, '15:00', 'Simhall', 'utflykt', 4, 'Badhuset'],
  // Fredag
  [4, 4, '08:00', 'Medicin – morgon', 'medicin', 0],
  [1, 4, '11:00', 'Städa rummet', 'stad', 0],
  [2, 4, '13:00', 'Bowling', 'utflykt', 5, 'Bowlinghallen'],
  [5, 4, '15:00', 'Baka kakor', 'maltid', 4, 'Köket'],
  [7, 4, '13:00', 'Måla i ateljén', 'aktivitet', 0],
  // Lördag
  [4, 5, '08:00', 'Medicin – morgon', 'medicin', 2],
  [0, 5, '11:00', 'Lugn promenad', 'aktivitet', 2],
  [3, 5, '14:00', 'Bio', 'utflykt', 5, 'Filmstaden'],
  [7, 5, '11:00', 'Fika med familjen', 'ovrigt', 2],
  // Söndag
  [4, 6, '08:00', 'Medicin – morgon', 'medicin', 2],
  [1, 6, '13:00', 'Videosamtal med familjen', 'ovrigt', 5],
  [5, 6, '16:00', 'Söndagsmiddag', 'maltid', 2, 'Matsalen'],
  [6, 6, '14:00', 'Fotbollsmatch på TV', 'aktivitet', 2],
]

/** Veckodagsindex (måndag = 0 ... söndag = 6) för en "YYYY-MM-DD"-sträng. */
function weekdayIndex(iso: string): number {
  const [y, m, d] = iso.split('-').map(Number)
  return (new Date(y, m - 1, d).getDay() + 6) % 7
}

/** Bygger insatser för alla angivna datum genom att upprepa veckomönstret. */
export function buildActivities(
  dates: string[],
  brukareIds: string[],
  employeeIds: string[],
): DayActivity[] {
  const out: DayActivity[] = []
  for (const date of dates) {
    const wd = weekdayIndex(date)
    for (const [bi, dayIdx, startTime, title, category, ri, location, note] of ACT_SEED) {
      if (dayIdx !== wd || !brukareIds[bi]) continue
      out.push({
        id: makeId('act'),
        brukareId: brukareIds[bi],
        date,
        startTime,
        title,
        category,
        responsibleEmployeeId: employeeIds[ri],
        location,
        note,
      })
    }
  }
  return out
}

/** Visuell metadata per insatskategori (ikon + färg). */
export const CATEGORY_META: Record<ActivityCategory, { label: string; icon: string; color: string }> = {
  inkop: { label: 'Inköp', icon: '🛒', color: '#34c759' },
  aktivitet: { label: 'Aktivitet', icon: '🎯', color: '#0a84ff' },
  utflykt: { label: 'Utflykt', icon: '🚌', color: '#ff9500' },
  hygien: { label: 'Omvårdnad', icon: '🫧', color: '#30b0c7' },
  medicin: { label: 'Medicin', icon: '💊', color: '#ff3b30' },
  maltid: { label: 'Måltid', icon: '🍽️', color: '#ff9f0a' },
  stad: { label: 'Städ', icon: '🧹', color: '#a2845e' },
  ovrigt: { label: 'Övrigt', icon: '📌', color: '#8e8e93' },
}
