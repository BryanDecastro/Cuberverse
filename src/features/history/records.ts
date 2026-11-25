/**
 * The 3x3 records shown on the History page, derived from the single source of
 * truth in features/wca/records.ts (update them there).
 */
import { RECORDS_CHECKED, WCA_RECORDS_URL as ALL_RECORDS_URL, WORLD_RECORDS as ALL } from '@/features/wca/records'

export const WCA_RECORDS_URL = `${ALL_RECORDS_URL}?event_id=333`

export const WORLD_RECORDS = {
  checked: RECORDS_CHECKED,
  single: {
    time: ALL['333'].single.result,
    person: ALL['333'].single.holders[0],
    country: 'CN',
    competition: 'Guangzhou Grand Open 2026',
  },
  average: {
    time: ALL['333'].average!.result,
    person: ALL['333'].average!.holders[0],
    country: 'CN',
    competition: 'Hefei Cubing League 3x3 III 2026',
    solves: ['3.68', '(4.61)', '(3.39)', '3.41', '3.45'],
  },
} as const
