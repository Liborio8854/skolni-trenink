/**
 * Spusť: node src/data/nasobilkaMastery.test.js
 */
import {
  mergeMasteryEntries,
  MASTERY_STATES,
  MASTERY_CONFIG,
  masteryDistractors,
  allMultiplicationProducts,
  allMasteryPairs,
  generateMasteryRound,
  applyMasteryAnswer,
  emptyEntry,
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

// Časový limit mastery kola
assert(MASTERY_CONFIG.timeLimit === 6, `timeLimit expected 6, got ${MASTERY_CONFIG.timeLimit}`)
assert(MASTERY_CONFIG.flashMs === 3000, 'flash stays 3 s')
assert(MASTERY_CONFIG.fixMinDays === 3, `fixMinDays expected 3, got ${MASTERY_CONFIG.fixMinDays}`)

// Zafixování: 3 blesky v řadě + 3 různé dny + obě pořadí
{
  const today = localDateKey()
  const dayBefore = (() => {
    const d = new Date()
    d.setDate(d.getDate() - 1)
    return localDateKey(d)
  })()
  const twoBefore = (() => {
    const d = new Date()
    d.setDate(d.getDate() - 2)
    return localDateKey(d)
  })()

  // Jen 2 dny → zůstane umim i při sérii 3 a obou pořadích
  let e = {
    ...emptyEntry('7×8'),
    stav: MASTERY_STATES.UMIM,
    serie: 2,
    blesk_dny: [dayBefore],
    blesk_ab: true,
    blesk_ba: true,
  }
  let r = applyMasteryAnswer(e, { correct: true, ms: 1000, shownA: 7, shownB: 8 })
  assert(r.entry.serie === 3, 'serie 3')
  assert(r.entry.blesk_dny.length === 2, `expected 2 days, got ${r.entry.blesk_dny.length}`)
  assert(r.entry.stav === MASTERY_STATES.UMIM, '2 days must not fix')
  assert(r.newlyFixed === false, 'newlyFixed false with 2 days')

  // 3 dny → zafixováno
  e = {
    ...emptyEntry('7×8'),
    stav: MASTERY_STATES.UMIM,
    serie: 2,
    blesk_dny: [twoBefore, dayBefore],
    blesk_ab: true,
    blesk_ba: true,
  }
  r = applyMasteryAnswer(e, { correct: true, ms: 1000, shownA: 8, shownB: 7 })
  assert(r.entry.blesk_dny.includes(today), 'today recorded')
  assert(r.entry.blesk_dny.length >= 3, `expected ≥3 days, got ${r.entry.blesk_dny.length}`)
  assert(r.entry.stav === MASTERY_STATES.ZAFIXOVANO, '3 days should fix')
  assert(r.newlyFixed === true, 'newlyFixed true')
}

// Distraktory jsou vždy výsledky násobilky (tabulka 2–9)
{
  const table = allMultiplicationProducts()
  for (const { a, b } of allMasteryPairs()) {
    for (let trial = 0; trial < 8; trial++) {
      const opts = masteryDistractors(a, b)
      const correct = a * b
      assert(opts.length === 4, `${a}×${b}: expected 4 options, got ${opts.length}`)
      assert(new Set(opts).size === 4, `${a}×${b}: options not unique ${opts}`)
      assert(opts.every(v => v > 0), `${a}×${b}: non-positive ${opts}`)
      assert(opts.includes(correct), `${a}×${b}: missing correct ${correct}`)
      for (const v of opts) {
        assert(table.has(v), `${a}×${b}: ${v} is not a 2–9 multiplication product`)
      }
    }
  }

  // 6×9 má mezi kandidáty záměnu 7×8 (=56)
  {
    let saw56 = false
    for (let i = 0; i < 40; i++) {
      if (masteryDistractors(6, 9).includes(56)) { saw56 = true; break }
    }
    assert(saw56, '6×9 should sometimes offer 7×8=56 as distractor')
  }

  const qs = generateMasteryRound({})
  assert(qs.every(q => q.timeLimit === 6), 'round questions use 6 s limit')
  for (const q of qs) {
    const nums = q.options.map(Number)
    assert(nums.every(n => table.has(n)), `round opts not table products: ${nums}`)
  }
}

if (fails.length) {
  console.error('FAIL:\n' + fails.join('\n'))
  process.exit(1)
}
console.log('ALL PASS')
