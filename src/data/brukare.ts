import type { Brukare } from '../types'

/** Brukare/boende som personalen stöttar. Index används av aktivitets-seeden. */
export const brukare: Brukare[] = [
  { id: 'bru-1', name: 'Bertil Nilsson', unit: 'Avd 3', note: 'Trivs med fasta rutiner och promenader.' },
  { id: 'bru-2', name: 'Emma Andersson', unit: 'Avd 3', note: 'Tycker om att handla och fika i stan.' },
  { id: 'bru-3', name: 'Sven Persson', unit: 'Avd 7', note: 'Rullstol – behöver stöd vid förflyttning.' },
  { id: 'bru-4', name: 'Aisha Ali', unit: 'Avd 7', note: 'Lär sig laga mat och vill träna mer.' },
  { id: 'bru-5', name: 'Karin Lund', unit: 'Avd 3', note: 'Diabetes – medicin på fasta tider.' },
  { id: 'bru-6', name: 'Olof Ek', unit: 'Avd 7', note: 'Gillar musik och utflykter.' },
]
