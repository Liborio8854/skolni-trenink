/**
 * Spusť: node src/data/nasobilkaMastery.test.js
 */
import {
  mergeMasteryEntries,
  MASTERY_STATES,
} from './nasobilkaMastery.js'
import { localDateKey } from '../utils/date.js'

const fails = []
function assert(cond, msg) {
  if (!cond) fails.push(msg)
}

// Server = zafixovano (starší), lokálně = umim (novější) → výsledek umim
{
  const local = {
    '7×8': {
      priklad: '7×8',
      stav: MASTERY_STATES.UMIM,
      serie: 0,
      blesk_dny: ['2026-10-27', '2026-10-28'],
      blesk_ab: true,
      blesk_ba: true,
      aktualizovano: '2026-10-28T15:00:00.000Z',
    },
  }
  const remote = [{
    priklad: '7×8',
    stav: MASTERY_STATES.ZAFIXOVANO,
    serie: 3,
    blesk_dny: ['2026-10-27', '2026-10-28'],
    blesk_ab: true,
    blesk_ba: true,
    aktualizovano: '2026-10-28T12:00:00.000Z',
  }]
  const merged = mergeMasteryEntries(local, remote)
  assert(merged['7×8'].stav === MASTERY_STATES.UMIM, `expected umim, got ${merged['7×8'].stav}`)
  assert(merged['7×8'].aktualizovano === '2026-10-28T15:00:00.000Z', 'kept newer local timestamp')
}

// Opačně: novější remote zafixovano přepíše starší lokální umim
{
  const local = {
    '6×7': {
      priklad: '6×7',
      stav: MASTERY_STATES.UMIM,
      serie: 0,
      blesk_dny: [],
      blesk_ab: true,
      blesk_ba: false,
      aktualizovano: '2026-10-27T10:00:00.000Z',
    },
  }
  const remote = [{
    priklad: '6×7',
    stav: MASTERY_STATES.ZAFIXOVANO,
    serie: 3,
    blesk_dny: ['2026-10-26', '2026-10-27'],
    blesk_ab: true,
    blesk_ba: true,
    aktualizovano: '2026-10-28T09:00:00.000Z',
  }]
  const merged = mergeMasteryEntries(local, remote)
  assert(merged['6×7'].stav === MASTERY_STATES.ZAFIXOVANO, `expected zafixovano, got ${merged['6×7'].stav}`)
}

// Europe/Prague: po půlnoci v Praze je UTC ještě předchozí den
{
  // 2026-10-28 00:30 CET = 2026-10-27 23:30 UTC
  const pragueMorning = new Date('2026-10-27T23:30:00.000Z')
  assert(localDateKey(pragueMorning) === '2026-10-28', `Prague morning expected 2026-10-28, got ${localDateKey(pragueMorning)}`)
  assert(pragueMorning.toISOString().slice(0, 10) === '2026-10-27', 'UTC slice is previous day (bug we avoid)')

  // 2026-07-15 00:30 CEST = 2026-07-14 22:30 UTC
  const summerMorning = new Date('2026-07-14T22:30:00.000Z')
  assert(localDateKey(summerMorning) === '2026-07-15', `Summer morning expected 2026-07-15, got ${localDateKey(summerMorning)}`)
  assert(summerMorning.toISOString().slice(0, 10) === '2026-07-14', 'UTC slice wrong in summer too')
}

if (fails.length) {
  console.error('FAIL:\n' + fails.join('\n'))
  process.exit(1)
}
console.log('ALL PASS')
