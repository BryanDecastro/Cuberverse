/**
 * Official WCA world records for every event, copied by hand from the WCA
 * records page (link below). Update `RECORDS_CHECKED` whenever they are
 * refreshed. The History page reads the 3x3 entry from here too.
 */
export const WCA_URL = 'https://www.worldcubeassociation.org'
export const WCA_RECORDS_URL = `${WCA_URL}/results/records`
export const RECORDS_CHECKED = '2026-11-22'

export type EventId =
  | '333' | '222' | '444' | '555' | '666' | '777'
  | '333bf' | '333fm' | '333oh' | 'clock' | 'minx' | 'pyram'
  | 'skewb' | 'sq1' | '444bf' | '555bf' | '333mbf'

/** All 17 official events, in the WCA's own order. */
export const EVENT_IDS: EventId[] = [
  '333', '222', '444', '555', '666', '777', '333bf', '333fm', '333oh',
  'clock', 'minx', 'pyram', 'skewb', 'sq1', '444bf', '555bf', '333mbf',
]

export type RecordEntry = { result: string; holders: string[] }
export type EventRecords = {
  single: RecordEntry
  /** Average of 5, or mean of 3 for the long events; none for Multi-Blind. */
  average?: RecordEntry & { kind: 'average' | 'mean' }
}

export const WORLD_RECORDS: Record<EventId, EventRecords> = {
  '333': { single: { result: '2.51', holders: ['Xuanyi Geng (耿暄一)'] }, average: { result: '3.51', holders: ['Yiheng Wang (王艺衡)'], kind: 'average' } },
  '222': { single: { result: '0.39', holders: ['Ziyu Ye (叶梓渝)'] }, average: { result: '0.86', holders: ['Sujan Feist', 'Teodor Zajder'], kind: 'average' } },
  '444': { single: { result: '15.18', holders: ['Tymon Kolasiński'] }, average: { result: '18.56', holders: ['Tymon Kolasiński'], kind: 'average' } },
  '555': { single: { result: '29.49', holders: ['Tymon Kolasiński'] }, average: { result: '33.19', holders: ['Timofei Tarasenko'], kind: 'average' } },
  '666': { single: { result: '57.69', holders: ['Max Park'] }, average: { result: '1:01.76', holders: ['Timofei Tarasenko'], kind: 'mean' } },
  '777': { single: { result: '1:27.47', holders: ['Timofei Tarasenko'] }, average: { result: '1:35.93', holders: ['Timofei Tarasenko'], kind: 'mean' } },
  '333bf': { single: { result: '11.56', holders: ['Tommy Cherry'] }, average: { result: '13.97', holders: ['Tommy Cherry'], kind: 'mean' } },
  '333fm': {
    single: { result: '16', holders: ['Sebastiano Tronto', 'Aedan Bryant', 'Levi Gibson', 'Jacob Sherwen Brown', 'Riccardo Raciti'] },
    average: { result: '19.00', holders: ['Brian Johnson'], kind: 'mean' },
  },
  '333oh': { single: { result: '5.62', holders: ['Patrick Ponce'] }, average: { result: '6.99', holders: ['Zhen Chen (陈震)'], kind: 'average' } },
  clock: { single: { result: '1.53', holders: ['Lachlan Gibson'] }, average: { result: '2.14', holders: ['Lachlan Gibson'], kind: 'average' } },
  minx: { single: { result: '21.04', holders: ['Ziyu Wu (吴子钰)'] }, average: { result: '23.40', holders: ['Timofei Tarasenko'], kind: 'average' } },
  pyram: { single: { result: '0.70', holders: ['Clem Tucker'] }, average: { result: '1.14', holders: ['Lingkun Jiang (姜凌坤)'], kind: 'average' } },
  skewb: { single: { result: '0.73', holders: ['Vojtěch Grohmann'] }, average: { result: '1.37', holders: ['Ignacy Samselski'], kind: 'average' } },
  sq1: { single: { result: '2.85', holders: ['Brian Johnson'] }, average: { result: '4.63', holders: ['Sameer Aggarwal'], kind: 'average' } },
  '444bf': { single: { result: '51.96', holders: ['Stanley Chapel'] }, average: { result: '59.39', holders: ['Stanley Chapel'], kind: 'mean' } },
  '555bf': { single: { result: '1:58.59', holders: ['Stanley Chapel'] }, average: { result: '2:27.63', holders: ['Stanley Chapel'], kind: 'mean' } },
  '333mbf': { single: { result: '63/65 58:23', holders: ['Graham Siggins'] } },
}

/** People featured in "Legends". Every claim in the copy was checked against their WCA profile. */
export const LEGENDS = [
  { id: 'feliks', name: 'Feliks Zemdegs', wcaId: '2009ZEMD01', country: 'AU' },
  { id: 'max', name: 'Max Park', wcaId: '2012PARK03', country: 'US' },
  { id: 'yiheng', name: 'Yiheng Wang (王艺衡)', wcaId: '2019WANY36', country: 'CN' },
  { id: 'tymon', name: 'Tymon Kolasiński', wcaId: '2016KOLA02', country: 'PL' },
] as const

export const personUrl = (wcaId: string) => `${WCA_URL}/persons/${wcaId}`
