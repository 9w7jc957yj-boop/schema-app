import type { Brukare } from '../types'

/** De 8 brukarna/boende som personalen stöttar. Index används av aktivitets-seeden. */
export const brukare: Brukare[] = [
  { id: 'bru-1', name: 'Bertil Nilsson', unit: 'Avd 3', note: 'Trivs med fasta rutiner.', interests: 'Promenader, korsord' },
  { id: 'bru-2', name: 'Emma Andersson', unit: 'Avd 3', note: 'Tycker om att handla och fika i stan.', interests: 'Shopping, fika, musik' },
  { id: 'bru-3', name: 'Sven Persson', unit: 'Avd 7', note: 'Rullstol – behöver stöd vid förflyttning.', interests: 'Fotboll på TV, sällskapsspel' },
  { id: 'bru-4', name: 'Aisha Ali', unit: 'Avd 7', note: 'Lär sig laga mat och vill träna mer.', interests: 'Matlagning, träning' },
  { id: 'bru-5', name: 'Karin Lund', unit: 'Avd 3', note: 'Diabetes – medicin på fasta tider.', interests: 'Stickning, trädgård' },
  { id: 'bru-6', name: 'Olof Ek', unit: 'Avd 7', note: 'Gillar musik och utflykter.', interests: 'Musik, utflykter' },
  { id: 'bru-7', name: 'Nils Berg', unit: 'Avd 7', note: 'Lugn, gillar vatten.', interests: 'Bilar, simning' },
  { id: 'bru-8', name: 'Maja Lind', unit: 'Avd 3', note: 'Kreativ, behöver tydlig struktur.', interests: 'Måleri, djur' },
]
