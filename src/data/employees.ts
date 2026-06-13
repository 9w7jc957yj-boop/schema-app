import type { Employee } from '../types'
import { FULL_TIME_WEEKLY_HOURS } from '../utils/time'

/** Avtalade timmar från anställningsgrad (100 % = 40 h). */
function contractHours(rate: number): number {
  return Math.round((rate / 100) * FULL_TIME_WEEKLY_HOURS)
}

export const employees: Employee[] = [
  { id: 'emp-1', firstName: 'Anna', lastName: 'Lindqvist', unit: 'Avd 3', employmentRate: 100, weeklyContractHours: contractHours(100) },
  { id: 'emp-2', firstName: 'Johan', lastName: 'Berg', unit: 'Avd 3', employmentRate: 75, weeklyContractHours: contractHours(75) },
  { id: 'emp-3', firstName: 'Sara', lastName: 'Nyström', unit: 'Akuten', employmentRate: 100, weeklyContractHours: contractHours(100) },
  { id: 'emp-4', firstName: 'Mehmet', lastName: 'Yılmaz', unit: 'Akuten', employmentRate: 50, weeklyContractHours: contractHours(50) },
  { id: 'emp-5', firstName: 'Elin', lastName: 'Karlsson', unit: 'Avd 7', employmentRate: 80, weeklyContractHours: contractHours(80) },
  { id: 'emp-6', firstName: 'David', lastName: 'Andersson', unit: 'Avd 7', employmentRate: 100, weeklyContractHours: contractHours(100) },
  { id: 'emp-7', firstName: 'Fatima', lastName: 'Haddad', unit: 'Natt', employmentRate: 75, weeklyContractHours: contractHours(75) },
]
