import { localDateKey } from '../utils/date.js'

/** Konfigurace režimu Mistr násobilky — text odměny lze později změnit. */
export const MASTERY_CONFIG = {
  rewardLabel: '🎁 Odměna: příspěvek na klávesnici',
  completeMessage: 'Splnil jsi to! Řekni rodičům o příspěvek na klávesnici 🎹⌨️',
  badgeName: 'Mistr násobilky',
  coinsPerFix: 50,
  dailyGoalRounds: 2,
  roundSize: 10,
  successPct: 90,
  timeLimit: 8,
  flashMs: 3000,
  totalExamples: 36,
}

export const MASTERY_STATES = {
  NEZNAMO: 'neznamo',
  UCIM_SE: 'ucim_se',
  UMIM: 'umim',
  ZAFIXOVANO: 'zafixovano',
}

export const STATE_WEIGHTS = {
  [MASTERY_STATES.NEZNAMO]: 4,
  [MASTERY_STATES.UCIM_SE]: 3,
  [MASTERY_STATES.UMIM]: 2,
  [MASTERY_STATES.ZAFIXOVANO]: 0.5,
}

export const STATE_COLORS = {
  [MASTERY_STATES.NEZNAMO]: '#6B7280',
  [MASTERY_STATES.UCIM_SE]: '#F59E0B',
  [MASTERY_STATES.UMIM]: '#22C55E',
  [MASTERY_STATES.ZAFIXOVANO]: '#EAB308',
}

export const STATE_LABELS = {
  [MASTERY_STATES.NEZNAMO]: 'Neznámé',
  [MASTERY_STATES.UCIM_SE]: 'Učím se',
  [MASTERY_STATES.UMIM]: 'Umím',
  [MASTERY_STATES.ZAFIXOVANO]: 'Zafixováno',
}

/** Všech 36 dvojic 2 ≤ a ≤ b ≤ 9. */
export function allMasteryPairs() {
  const pairs = []
  for (let a = 2; a <= 9; a++) {
    for (let b = a; b <= 9; b++) {
      pairs.push({ a, b, key: exampleKey(a, b) })
    }
  }
  return pairs
}

export function exampleKey(a, b) {
  const lo = Math.min(a, b)
  const hi = Math.max(a, b)
  return `${lo}×${hi}`
}

export function parseExampleKey(key) {
  const m = String(key).match(/^(\d+)[×x](\d+)$/)
  if (!m) return null
  return { a: Number(m[1]), b: Number(m[2]) }
}

export function emptyEntry(key) {
  return {
    priklad: key,
    stav: MASTERY_STATES.NEZNAMO,
    serie: 0,
    blesk_dny: [],
    blesk_ab: false,
    blesk_ba: false,
    aktualizovano: null,
  }
}

export function normalizeMasteryEntry(row) {
  if (!row?.priklad) return null
  return {
    priklad: row.priklad,
    stav: row.stav || MASTERY_STATES.NEZNAMO,
    serie: row.serie || 0,
    blesk_dny: Array.isArray(row.blesk_dny) ? [...row.blesk_dny] : [],
    blesk_ab: !!row.blesk_ab,
    blesk_ba: !!row.blesk_ba,
    aktualizovano: row.aktualizovano || null,
  }
}

export function ensureEntries(map) {
  const next = { ...(map || {}) }
  for (const { key } of allMasteryPairs()) {
    if (!next[key]) next[key] = emptyEntry(key)
    else next[key] = normalizeMasteryEntry(next[key]) || emptyEntry(key)
  }
  return next
}

function entryTimeMs(entry) {
  if (!entry?.aktualizovano) return 0
  const t = Date.parse(entry.aktualizovano)
  return Number.isFinite(t) ? t : 0
}

/**
 * Sloučí lokální cache a remote řádky: pro každý příklad vyhraje novější aktualizovano.
 * Při shodě / chybějícím čase má přednost remote (server je zdroj při konfliktu časů).
 */
export function mergeMasteryEntries(localMap, remoteRows) {
  const map = ensureEntries(localMap)
  for (const raw of remoteRows || []) {
    const remote = normalizeMasteryEntry(raw)
    if (!remote) continue
    const local = map[remote.priklad] || emptyEntry(remote.priklad)
    const remoteTs = entryTimeMs(remote)
    const localTs = entryTimeMs(local)
    // Novější vyhrává. Při remTs >= localTs (včetně 0=0) bereme remote.
    if (remoteTs >= localTs) {
      map[remote.priklad] = remote
    }
  }
  return map
}

/**
 * Aktualizace stavu po odpovědi.
 * @param {object} entry
 * @param {{ correct: boolean, ms: number, shownA: number, shownB: number }} answer
 * @returns {{ entry: object, newlyFixed: boolean }}
 */
export function applyMasteryAnswer(entry, answer) {
  const prev = entry || emptyEntry('?')
  const wasFixed = prev.stav === MASTERY_STATES.ZAFIXOVANO
  const { a, b } = parseExampleKey(prev.priklad) || { a: 0, b: 0 }
  const isSquare = a === b
  const now = new Date().toISOString()

  if (!answer.correct) {
    return {
      entry: {
        ...prev,
        stav: wasFixed ? MASTERY_STATES.UMIM : MASTERY_STATES.NEZNAMO,
        serie: 0,
        aktualizovano: now,
      },
      newlyFixed: false,
    }
  }

  const isFlash = Number.isFinite(answer.ms) && answer.ms <= MASTERY_CONFIG.flashMs

  if (!isFlash) {
    if (wasFixed) {
      return { entry: prev, newlyFixed: false }
    }
    return {
      entry: {
        ...prev,
        stav: MASTERY_STATES.UCIM_SE,
        serie: 0,
        aktualizovano: now,
      },
      newlyFixed: false,
    }
  }

  // Blesk — pořadí ab = menší×větší jak v klíči
  const orderAb = answer.shownA === a && answer.shownB === b
  const orderBa = answer.shownA === b && answer.shownB === a
  let blesk_ab = !!prev.blesk_ab || orderAb || isSquare
  let blesk_ba = !!prev.blesk_ba || orderBa || isSquare

  const today = localDateKey()
  const days = new Set(Array.isArray(prev.blesk_dny) ? prev.blesk_dny : [])
  days.add(today)
  const blesk_dny = [...days].sort()
  const serie = (prev.serie || 0) + 1

  let stav = MASTERY_STATES.UMIM
  if (serie >= 3 && blesk_dny.length >= 2 && blesk_ab && blesk_ba) {
    stav = MASTERY_STATES.ZAFIXOVANO
  }

  const next = {
    ...prev,
    stav,
    serie,
    blesk_dny,
    blesk_ab,
    blesk_ba,
    aktualizovano: now,
  }

  return {
    entry: next,
    newlyFixed: !wasFixed && stav === MASTERY_STATES.ZAFIXOVANO,
  }
}

function pickWeighted(items, weightFn) {
  const weights = items.map(weightFn)
  const total = weights.reduce((s, w) => s + w, 0)
  if (total <= 0) return items[Math.floor(Math.random() * items.length)]
  let r = Math.random() * total
  for (let i = 0; i < items.length; i++) {
    r -= weights[i]
    if (r <= 0) return items[i]
  }
  return items[items.length - 1]
}

/** Preferuj pořadí, které ještě nebylo bleskem. */
export function chooseDisplayOrder(entry, a, b) {
  if (a === b) return { shownA: a, shownB: b }
  const needAb = !entry?.blesk_ab
  const needBa = !entry?.blesk_ba
  if (needAb && !needBa) return { shownA: a, shownB: b }
  if (needBa && !needAb) return { shownA: b, shownB: a }
  if (Math.random() < 0.5) return { shownA: a, shownB: b }
  return { shownA: b, shownB: a }
}

function mathOpts(correct) {
  const opts = [correct]
  let att = 0
  while (opts.length < 4 && att < 50) {
    att++
    const off = Math.floor(Math.random() * 20) - 10
    const v = correct + off
    if (v > 0 && !opts.includes(v)) opts.push(v)
  }
  while (opts.length < 4) opts.push(correct + opts.length * 3)
  // shuffle
  for (let i = opts.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[opts[i], opts[j]] = [opts[j], opts[i]]
  }
  return opts
}

/**
 * Vážený výběr 10 příkladů bez opakování.
 * @returns {object[]} otázky kompatibilní s quiz UI
 */
export function generateMasteryRound(entriesMap) {
  const entries = ensureEntries(entriesMap)
  const pool = allMasteryPairs().map(p => ({
    ...p,
    entry: entries[p.key] || emptyEntry(p.key),
  }))

  const selected = []
  const remaining = [...pool]
  const n = Math.min(MASTERY_CONFIG.roundSize, remaining.length)

  for (let i = 0; i < n; i++) {
    const pick = pickWeighted(
      remaining,
      item => STATE_WEIGHTS[item.entry.stav] ?? STATE_WEIGHTS[MASTERY_STATES.NEZNAMO],
    )
    const idx = remaining.indexOf(pick)
    remaining.splice(idx, 1)
    selected.push(pick)
  }

  return selected.map(({ a, b, key, entry }) => {
    const { shownA, shownB } = chooseDisplayOrder(entry, a, b)
    const answer = shownA * shownB
    const opts = mathOpts(answer)
    const options = opts.map(String)
    const correctIdx = opts.indexOf(answer)
    const display = `${shownA} × ${shownB}`
    return {
      id: `nasobilka-mastery:${key}:${shownA}x${shownB}`,
      type: 'vyber',
      category: 'nasobilka',
      subject: 'matematika',
      points: 1,
      mastery: true,
      masteryKey: key,
      shownA,
      shownB,
      display,
      options,
      correctIdx,
      correct: String(answer),
      timeLimit: MASTERY_CONFIG.timeLimit,
      payload: {
        prompt: display,
        options: options.map((text, i) => ({ id: String(i), text })),
        correctOptionId: String(correctIdx),
      },
      explanation: null,
      sourceText: null,
    }
  })
}

export function countByState(entriesMap) {
  const entries = ensureEntries(entriesMap)
  const counts = {
    [MASTERY_STATES.NEZNAMO]: 0,
    [MASTERY_STATES.UCIM_SE]: 0,
    [MASTERY_STATES.UMIM]: 0,
    [MASTERY_STATES.ZAFIXOVANO]: 0,
  }
  for (const e of Object.values(entries)) {
    counts[e.stav] = (counts[e.stav] || 0) + 1
  }
  return counts
}

export function fixedCount(entriesMap) {
  return countByState(entriesMap)[MASTERY_STATES.ZAFIXOVANO] || 0
}

export function progressPct(entriesMap) {
  return Math.round((fixedCount(entriesMap) / MASTERY_CONFIG.totalExamples) * 100)
}

export function isRoundSuccessful(results) {
  if (!results?.length) return false
  const correct = results.filter(r => r.isCorrect).length
  const pct = (correct / results.length) * 100
  return pct >= MASTERY_CONFIG.successPct
}

/** Stav buňky v mřížce (řádka × sloupec) — vždy kanonický klíč. */
export function cellState(entriesMap, row, col) {
  const key = exampleKey(row, col)
  return (entriesMap?.[key] || emptyEntry(key)).stav
}
