/**
 * Spusť: node src/data/nasobilkaMastery.test.js
 */
import {
  mergeMasteryEntries,
  MASTERY_STATES,
} from './nasobilkaMastery.js'

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

if (fails.length) {
  console.error('FAIL:\n' + fails.join('\n'))
  process.exit(1)
}
console.log('ALL PASS')
