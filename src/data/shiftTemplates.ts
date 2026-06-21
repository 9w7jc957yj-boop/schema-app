import type { ShiftTemplate } from '../types'

/**
 * Passpaletten. Fem grundmallar som visas direkt. Färgerna är hämtade ur
 * iOS systemfärgpalett för ett rent Cupertino-utseende. Fler mallar kan
 * skapas i grundschemat.
 */
export const shiftTemplates: ShiftTemplate[] = [
  { id: 'tpl-morgon', label: 'Morgonpass', startTime: '06:00', endTime: '14:00', color: '#0A84FF', crossesMidnight: false },
  { id: 'tpl-dag', label: 'Dagspass', startTime: '08:00', endTime: '16:30', color: '#34C759', crossesMidnight: false },
  { id: 'tpl-kvall', label: 'Kvällspass', startTime: '14:00', endTime: '22:00', color: '#FF9500', crossesMidnight: false },
  { id: 'tpl-jour', label: 'Jourpass', startTime: '08:00', endTime: '20:00', color: '#FF375F', crossesMidnight: false },
  { id: 'tpl-helg', label: 'Helgpass', startTime: '09:00', endTime: '18:00', color: '#AF52DE', crossesMidnight: false },
]
