import type { ShiftTemplate } from '../types'

/**
 * Passpaletten. Färgerna är hämtade ur iOS systemfärgpalett för att ge
 * ett rent, igenkännbart Cupertino-utseende. Pass som korsar midnatt har
 * `crossesMidnight: true` och kan visas tvådelat via `segments`.
 */
export const shiftTemplates: ShiftTemplate[] = [
  { id: 'tpl-tidig', label: 'Tidig', startTime: '05:30', endTime: '13:30', color: '#0A84FF', crossesMidnight: false },
  { id: 'tpl-dag-0600', label: '06:00–14:45', startTime: '06:00', endTime: '14:45', color: '#30B0C7', crossesMidnight: false },
  { id: 'tpl-dag-0700', label: '07:00–16:00', startTime: '07:00', endTime: '16:00', color: '#32ADE6', crossesMidnight: false },
  { id: 'tpl-dag-0800', label: '08:00–16:30', startTime: '08:00', endTime: '16:30', color: '#34C759', crossesMidnight: false },
  { id: 'tpl-mellan', label: 'Mellan', startTime: '09:30', endTime: '18:00', color: '#30D158', crossesMidnight: false },
  { id: 'tpl-kort', label: 'Kortpass', startTime: '10:00', endTime: '14:00', color: '#A2845E', crossesMidnight: false },
  { id: 'tpl-kvall-1330', label: '13:30–22:00', startTime: '13:30', endTime: '22:00', color: '#FF9F0A', crossesMidnight: false },
  { id: 'tpl-kvall-1400', label: '14:00–22:45', startTime: '14:00', endTime: '22:45', color: '#FF9500', crossesMidnight: false },
  { id: 'tpl-jourdag', label: 'Jourdag', startTime: '08:00', endTime: '20:00', color: '#FF375F', crossesMidnight: false },
  { id: 'tpl-admin', label: 'Administration', startTime: '08:00', endTime: '16:00', color: '#8E8E93', crossesMidnight: false },
  { id: 'tpl-utbildning', label: 'Utbildning', startTime: '09:00', endTime: '15:00', color: '#AF52DE', crossesMidnight: false },
  { id: 'tpl-helgdag', label: 'Helgdag', startTime: '07:00', endTime: '19:00', color: '#FF2D55', crossesMidnight: false },
  {
    id: 'tpl-helgnatt', label: 'Helgnatt', startTime: '19:00', endTime: '07:00', color: '#5E5CE6', crossesMidnight: true,
    segments: [{ start: '19:00', end: '24:00' }, { start: '00:00', end: '07:00' }],
  },
  {
    id: 'tpl-journatt', label: 'Journatt', startTime: '20:00', endTime: '08:00', color: '#BF5AF2', crossesMidnight: true,
    segments: [{ start: '20:00', end: '24:00' }, { start: '00:00', end: '08:00' }],
  },
  {
    id: 'tpl-natt', label: 'Nattpass', startTime: '21:45', endTime: '07:15', color: '#5856D6', crossesMidnight: true,
    segments: [{ start: '21:45', end: '24:00' }, { start: '00:00', end: '07:15' }],
  },
]
