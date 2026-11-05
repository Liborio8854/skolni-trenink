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
  generateBigCheckRound,
  shouldOfferBigCheck,
  shouldMarkBigCheckDone,
  isBigCheckFullyAnswered,
  creditDailyAfterBigCheck,
  evaluateBigCheck,
  applyMasteryAnswer,
  emptyEntry,
  ensureEntries,
  countGoalDays,
  getRewardProgress,
  fixedExampleWeight,
  daysSinceLastSeen,
  masterySelectionWeight,
  masteryEntryForUpsert,
  STALE_FIXED_PER_ROUND,
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
assert(MASTERY_CONFIG.requiredGoalDays === 15, `requiredGoalDays expected 15, got ${MASTERY_CONFIG.requiredGoalDays}`)

// Počet dní se splněným cílem (uspesna_kola >= 2)
{
  const rows = [
    { datum: '2026-10-01', uspesna_kola: 2 },
    { datum: '2026-10-02', uspesna_kola: 1 },
    { datum: '2026-10-03', uspesna_kola: 3 },
    { datum: '2026-10-04', uspesna_kola: 0 },
    { datum: '2026-10-05', uspesna_kola: 2 },
  ]
  assert(countGoalDays(rows) === 3, `countGoalDays expected 3, got ${countGoalDays(rows)}`)
  assert(countGoalDays([]) === 0, 'empty rows → 0')
  assert(countGoalDays(null) === 0, 'null → 0')
}

// Odměna: tři kombinace podmínek
{
  // Tabulka hotová, dny chybí
  const tableOnly = getRewardProgress({ fixed: 36, goalDays: 10 })
  assert(tableOnly.allFixed && !tableOnly.daysMet, 'table only: fixed yes, days no')
  assert(!tableOnly.rewardUnlocked, 'table only: reward locked')
  assert(tableOnly.celebrationKind === 'table', 'table only: table celebration')
  assert(tableOnly.daysRemaining === 5, `table only: remaining 5, got ${tableOnly.daysRemaining}`)
  assert(tableOnly.celebrationMessage.includes('5 dní'), 'table only: message mentions remaining days')

  // Dny splněné, tabulka ne — žádná oslava
  const daysOnly = getRewardProgress({ fixed: 20, goalDays: 15 })
  assert(!daysOnly.allFixed && daysOnly.daysMet, 'days only: days yes, fixed no')
  assert(!daysOnly.rewardUnlocked, 'days only: reward locked')
  assert(daysOnly.celebrationKind === null, 'days only: no celebration')
  assert(daysOnly.celebrationMessage === null, 'days only: no message')

  // Obojí splněno
  const both = getRewardProgress({ fixed: 36, goalDays: 15 })
  assert(both.rewardUnlocked, 'both: reward unlocked')
  assert(both.celebrationKind === 'reward', 'both: reward celebration')
  assert(both.celebrationMessage === MASTERY_CONFIG.completeMessage, 'both: reward message')
}

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

// aktualizovano se mění jen po odpovědi — ne při merge / ensure / upsert payloadu
{
  const oldTs = '2026-01-01T10:00:00.000Z'
  const newerTs = '2026-01-03T10:00:00.000Z'

  // ensureEntries doplní chybějící klíče s null, nepřepisuje existující čas
  {
    const ensured = ensureEntries({
      '2×2': {
        ...emptyEntry('2×2'),
        stav: MASTERY_STATES.ZAFIXOVANO,
        aktualizovano: oldTs,
      },
    })
    assert(ensured['2×2'].aktualizovano === oldTs, 'ensure keeps existing aktualizovano')
    assert(ensured['2×3'].aktualizovano === null, 'ensure fills missing with null, not now')
  }

  // merge: nedotčený klíč si nechá čas; cizí remote řádek neovlivní ostatní
  {
    const local = {
      '2×2': {
        ...emptyEntry('2×2'),
        stav: MASTERY_STATES.ZAFIXOVANO,
        serie: 3,
        blesk_ab: true,
        blesk_ba: true,
        aktualizovano: oldTs,
      },
      '3×3': {
        ...emptyEntry('3×3'),
        stav: MASTERY_STATES.UMIM,
        serie: 1,
        blesk_ab: true,
        aktualizovano: oldTs,
      },
    }
    const remote = [{
      priklad: '3×3',
      stav: MASTERY_STATES.UMIM,
      serie: 2,
      blesk_dny: ['2026-01-02'],
      blesk_ab: true,
      blesk_ba: false,
      aktualizovano: newerTs,
    }]
    const merged = mergeMasteryEntries(local, remote)
    assert(merged['2×2'].aktualizovano === oldTs, 'merge must not touch other keys’ aktualizovano')
    assert(merged['3×3'].aktualizovano === newerTs, 'merge takes newer remote for that key only')
    assert(merged['4×4'].aktualizovano === null, 'merge/ensure must not invent now for empty keys')
  }

  // Odpověď změní aktualizovano jen u daného entry objektu
  {
    const before = {
      ...emptyEntry('7×8'),
      stav: MASTERY_STATES.UMIM,
      serie: 1,
      blesk_ab: true,
      aktualizovano: oldTs,
    }
    const other = {
      ...emptyEntry('6×7'),
      stav: MASTERY_STATES.ZAFIXOVANO,
      aktualizovano: oldTs,
    }
    const { entry } = applyMasteryAnswer(before, {
      correct: true,
      ms: 1000,
      shownA: 7,
      shownB: 8,
    })
    assert(entry.aktualizovano !== oldTs, 'answer updates aktualizovano')
    assert(typeof entry.aktualizovano === 'string' && entry.aktualizovano.length > 0, 'answer sets ISO time')
    assert(other.aktualizovano === oldTs, 'other entry object untouched')
  }

  // Upsert payload: nikdy nedoplňuje now(); bez času → null (žádný zápis)
  {
    const answered = {
      priklad: '7×8',
      stav: MASTERY_STATES.UMIM,
      serie: 1,
      blesk_dny: ['2026-01-01'],
      blesk_ab: true,
      blesk_ba: false,
      aktualizovano: oldTs,
    }
    const payload = masteryEntryForUpsert(answered)
    assert(payload !== null, 'payload with aktualizovano is allowed')
    assert(payload.aktualizovano === oldTs, 'upsert payload keeps answer time, does not invent now')
    assert(masteryEntryForUpsert({ ...answered, aktualizovano: null }) === null, 'null aktualizovano → no upsert')
    assert(masteryEntryForUpsert({ ...answered, aktualizovano: undefined }) === null, 'missing aktualizovano → no upsert')
    assert(masteryEntryForUpsert({ stav: MASTERY_STATES.NEZNAMO }) === null, 'no priklad → no upsert')
  }
}

// Váhy zafixovaného podle dní od posledního zobrazení
{
  assert(fixedExampleWeight(0) === 0.5, '0 dní → 0.5')
  assert(fixedExampleWeight(1) === 0.5, '1 den → 0.5')
  assert(fixedExampleWeight(2) === 0.5, '2 dny → 0.5')
  assert(fixedExampleWeight(3) === 2, '3 dny → 2')
  assert(fixedExampleWeight(4) === 2, '4 dny → 2')
  assert(fixedExampleWeight(5) === 4, '5 dní → 4')
  assert(fixedExampleWeight(10) === 4, '10 dní → 4')
  assert(fixedExampleWeight(Number.POSITIVE_INFINITY) === 4, 'Infinity → 4')

  const now = new Date('2026-11-05T12:00:00.000Z')
  const daysAgoIso = (days) => {
    const d = new Date(now)
    d.setUTCDate(d.getUTCDate() - days)
    return d.toISOString()
  }

  assert(daysSinceLastSeen({ aktualizovano: daysAgoIso(0) }, now) === 0, 'seen today → 0')
  assert(daysSinceLastSeen({ aktualizovano: daysAgoIso(3) }, now) === 3, '3 days ago')
  assert(daysSinceLastSeen({ aktualizovano: daysAgoIso(5) }, now) === 5, '5 days ago')
  assert(daysSinceLastSeen({ aktualizovano: null }, now) === Number.POSITIVE_INFINITY, 'null → Infinity')
  assert(daysSinceLastSeen({}, now) === Number.POSITIVE_INFINITY, 'missing → Infinity')

  assert(
    masterySelectionWeight({ stav: MASTERY_STATES.ZAFIXOVANO, aktualizovano: daysAgoIso(1) }, now) === 0.5,
    'fresh fixed weight 0.5',
  )
  assert(
    masterySelectionWeight({ stav: MASTERY_STATES.ZAFIXOVANO, aktualizovano: daysAgoIso(4) }, now) === 2,
    'mid fixed weight 2',
  )
  assert(
    masterySelectionWeight({ stav: MASTERY_STATES.ZAFIXOVANO, aktualizovano: daysAgoIso(7) }, now) === 4,
    'stale fixed weight 4',
  )
  assert(
    masterySelectionWeight({ stav: MASTERY_STATES.NEZNAMO }, now) === 4,
    'neznamo stays 4',
  )
  assert(
    masterySelectionWeight({ stav: MASTERY_STATES.UCIM_SE }, now) === 3,
    'ucim_se stays 3',
  )
  assert(
    masterySelectionWeight({ stav: MASTERY_STATES.UMIM }, now) === 2,
    'umim stays 2',
  )
}

// Kolo: aspoň 2 zafixované neviděné 5+ dní (pokud existují)
{
  const now = new Date('2026-11-05T12:00:00.000Z')
  const daysAgoIso = (days) => {
    const d = new Date(now)
    d.setUTCDate(d.getUTCDate() - days)
    return d.toISOString()
  }
  const fixedEntry = (key, daysAgo) => ({
    ...emptyEntry(key),
    stav: MASTERY_STATES.ZAFIXOVANO,
    serie: 3,
    blesk_dny: ['2026-10-01', '2026-10-02', '2026-10-03'],
    blesk_ab: true,
    blesk_ba: true,
    aktualizovano: daysAgoIso(daysAgo),
  })

  const pairs = allMasteryPairs()
  assert(STALE_FIXED_PER_ROUND === 2, 'reserve 2 stale fixed')

  // 5 starých zafixovaných + zbytek čerstvých / neznámých → každé kolo ≥2 staré
  {
    const map = {}
    const staleKeys = []
    pairs.forEach((p, i) => {
      if (i < 5) {
        map[p.key] = fixedEntry(p.key, 6 + i)
        staleKeys.push(p.key)
      } else if (i < 10) {
        map[p.key] = fixedEntry(p.key, 1)
      }
    })
    for (let trial = 0; trial < 30; trial++) {
      const qs = generateMasteryRound(map, now)
      const keys = qs.map(q => q.masteryKey)
      const staleInRound = keys.filter(k => staleKeys.includes(k))
      assert(
        staleInRound.length >= 2,
        `trial ${trial}: expected ≥2 stale fixed, got ${staleInRound.length} (${staleInRound})`,
      )
      assert(new Set(keys).size === keys.length, `trial ${trial}: duplicate keys`)
      assert(qs.length === MASTERY_CONFIG.roundSize, `trial ${trial}: round size`)
    }
  }

  // Jen 1 starý → musí být v kole (pravidlo „pokud takové existují“)
  {
    const map = {}
    const onlyStale = pairs[0].key
    map[onlyStale] = fixedEntry(onlyStale, 8)
    for (let i = 1; i < 8; i++) {
      map[pairs[i].key] = fixedEntry(pairs[i].key, 0)
    }
    for (let trial = 0; trial < 20; trial++) {
      const qs = generateMasteryRound(map, now)
      assert(
        qs.some(q => q.masteryKey === onlyStale),
        `trial ${trial}: single stale fixed must appear`,
      )
    }
  }

  // Žádný starý zafixovaný → kolo běží bez chyby, žádná rezervace
  {
    const map = {}
    for (let i = 0; i < 6; i++) {
      map[pairs[i].key] = fixedEntry(pairs[i].key, 1)
    }
    const qs = generateMasteryRound(map, now)
    assert(qs.length === MASTERY_CONFIG.roundSize, 'no-stale round still size 10')
  }
}

// Velká kontrola: práh, jednorázovost, 36 unikátních, denní cíl
{
  assert(MASTERY_CONFIG.bigCheckThreshold === 32, 'default threshold 32')
  assert(MASTERY_CONFIG.bigCheckMaxErrors === 2, 'max 2 errors')
  assert(MASTERY_CONFIG.bigCheckCoins === 100, '+100 coins')
  assert(MASTERY_CONFIG.finalistBadgeName === 'Finalista', 'Finalista badge')

  // Spuštění na prahu
  assert(shouldOfferBigCheck({ fixed: 31, bigCheckDone: false }) === false, '31 fixed → no offer')
  assert(shouldOfferBigCheck({ fixed: 32, bigCheckDone: false }) === true, '32 fixed → offer')
  assert(shouldOfferBigCheck({ fixed: 36, bigCheckDone: false }) === true, '36 fixed → offer')

  // Jednorázovost
  assert(shouldOfferBigCheck({ fixed: 36, bigCheckDone: true }) === false, 'done → never again')
  assert(shouldOfferBigCheck({ fixed: 32, bigCheckDone: true }) === false, 'done at threshold → no')

  // 36 unikátních příkladů (všech 36 klíčů, každý jednou)
  {
    const qs = generateBigCheckRound({})
    assert(qs.length === MASTERY_CONFIG.totalExamples, `expected 36, got ${qs.length}`)
    const keys = qs.map(q => q.masteryKey)
    assert(new Set(keys).size === 36, 'all masteryKeys unique')
    const expected = new Set(allMasteryPairs().map(p => p.key))
    assert(keys.every(k => expected.has(k)), 'only valid pairs')
    assert(expected.size === keys.length && keys.every(k => expected.has(k)), 'covers all 36 pairs')
    assert(qs.every(q => q.bigCheck === true && q.mastery === true), 'flags bigCheck+mastery')
    assert(qs.every(q => q.timeLimit === MASTERY_CONFIG.timeLimit), '6 s limit')
    // Náhodné pořadí: aspoň někdy jiné než kanonické a≤b (mimo čtverce)
    let sawSwapped = false
    for (let t = 0; t < 20 && !sawSwapped; t++) {
      for (const q of generateBigCheckRound({})) {
        const [lo, hi] = q.masteryKey.split('×').map(Number)
        if (lo !== hi && q.shownA === hi && q.shownB === lo) {
          sawSwapped = true
          break
        }
      }
    }
    assert(sawSwapped, 'factor order should sometimes be swapped')
  }

  // Započtení denního cíle (2 úspěšná kola)
  assert(creditDailyAfterBigCheck(0) === 2, '0 → 2')
  assert(creditDailyAfterBigCheck(1) === 2, '1 → 2')
  assert(creditDailyAfterBigCheck(2) === 2, '2 → 2')
  assert(creditDailyAfterBigCheck(3) === 3, '3 stays 3')
  assert(
    creditDailyAfterBigCheck(0, MASTERY_CONFIG.dailyGoalRounds) === MASTERY_CONFIG.dailyGoalRounds,
    'grant equals dailyGoalRounds',
  )

  // Vyhodnocení: ≤2 chyby = úspěch (jen při plných 36)
  {
    const ok = evaluateBigCheck(Array.from({ length: 36 }, (_, i) => ({
      isCorrect: i >= 2,
      masteryKey: `k${i}`,
      display: `${i}`,
    })))
    assert(ok && ok.success === true && ok.errors === 2, '2 errors → success')
    assert(ok.coins === 100 && ok.badgeName === 'Finalista', 'success rewards')

    const fail = evaluateBigCheck(Array.from({ length: 36 }, (_, i) => ({
      isCorrect: i >= 3,
      masteryKey: `k${i}`,
      display: `${i}`,
    })))
    assert(fail && fail.success === false && fail.errors === 3, '3 errors → fail')
    assert(fail.coins === 0 && fail.badgeName === null, 'no success rewards')
    assert(fail.mistakes.length === 3, 'mistake list')
  }

  // Přerušení: nedokončená kontrola se NEOZNAČÍ jako proběhlá → nabídne se znovu
  {
    const pairs = allMasteryPairs()
    const partial = pairs.slice(0, 10).map((p, i) => ({
      isCorrect: i !== 0,
      masteryKey: p.key,
      display: p.key,
    }))
    assert(isBigCheckFullyAnswered(partial) === false, '10 answers ≠ fully answered')
    assert(isBigCheckFullyAnswered([]) === false, 'empty ≠ fully answered')
    assert(isBigCheckFullyAnswered(null) === false, 'null ≠ fully answered')
    assert(
      shouldMarkBigCheckDone(partial, { bigCheckDone: false }) === false,
      'interrupted attempt must not mark done',
    )
    assert(
      shouldOfferBigCheck({ fixed: 32, bigCheckDone: false }) === true,
      'after interrupt, still offered (bigCheckDone stays false)',
    )
    assert(evaluateBigCheck(partial) === null, 'partial → no evaluation / no rewards')

    // Duplikáty místo 36 unikátních
    const dupes = Array.from({ length: 36 }, () => ({
      isCorrect: true,
      masteryKey: '2×2',
    }))
    assert(isBigCheckFullyAnswered(dupes) === false, '36 with duplicate keys ≠ complete')
    assert(shouldMarkBigCheckDone(dupes, { bigCheckDone: false }) === false, 'dupes not done')

    // Plných 36 unikátních → smí se označit
    const full = pairs.map((p, i) => ({
      isCorrect: i !== 0,
      masteryKey: p.key,
      display: p.key,
    }))
    assert(isBigCheckFullyAnswered(full) === true, '36 unique → fully answered')
    assert(
      shouldMarkBigCheckDone(full, { bigCheckDone: false }) === true,
      'full round may mark done',
    )
    assert(
      shouldMarkBigCheckDone(full, { bigCheckDone: true }) === false,
      'already done → do not mark again',
    )
  }
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
