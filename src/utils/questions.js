import { VYJNA } from '../data/vyjna'
import { PREDPONY } from '../data/predpony'
import { ROUND_SIZE } from '../data/constants'
import { getBankQuestions, bankCategories } from '../data/questionBank'

/** Stabilní ID otázky pro st_answers / st_error_log. */
export function getQuestionId(question) {
  if (!question) return null
  if (question.id) return String(question.id)
  if (question.category && question.display != null) {
    return `${question.category}:${question.display}`
  }
  return null
}

export function shuffle(a) {
  const b = [...a]
  for (let i = b.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[b[i], b[j]] = [b[j], b[i]]
  }
  return b
}

export function genMath(type) {
  if (type === 'nasobilka') {
    const a = 2 + Math.floor(Math.random() * 9)
    const b = 2 + Math.floor(Math.random() * 9)
    return { q: `${a} × ${b}`, answer: a * b }
  }
  if (type === 'scitani') {
    const a = 10 + Math.floor(Math.random() * 70)
    const b = 1 + Math.floor(Math.random() * (100 - a))
    return { q: `${a} + ${b}`, answer: a + b }
  }
  const a = 20 + Math.floor(Math.random() * 80)
  const b = 1 + Math.floor(Math.random() * (a - 1))
  return { q: `${a} − ${b}`, answer: a - b }
}

export function mathOpts(correct, mathType) {
  const ones = correct % 10
  const opts = [correct]

  if (mathType === 'scitani') {
    const offsets = shuffle([-30, -20, -10, 10, 20, 30])
    for (const off of offsets) {
      const v = correct + off
      if (v > 0 && !opts.includes(v)) opts.push(v)
      if (opts.length >= 3) break
    }
    let att = 0
    while (opts.length < 4 && att < 50) {
      att++
      const off = Math.floor(Math.random() * 20) - 10
      const v = correct + off
      if (v > 0 && !opts.includes(v) && v % 10 !== ones) opts.push(v)
    }
    while (opts.length < 4) {
      const v = correct + opts.length * 7
      if (!opts.includes(v)) opts.push(v)
    }
  } else {
    let att = 0
    while (opts.length < 4 && att < 50) {
      att++
      const off = Math.floor(Math.random() * 20) - 10
      const v = correct + off
      if (v > 0 && !opts.includes(v)) opts.push(v)
    }
  }
  return shuffle(opts)
}

const LEGACY_CATS = new Set(['vyjna', 'predpony', 'nasobilka', 'pocitani'])
const BANK_CATS = new Set(bankCategories())

function makeVyberPayload(display, options, correctIdx) {
  return {
    prompt: display,
    options: options.map((text, i) => ({ id: String(i), text })),
    correctOptionId: String(correctIdx),
  }
}

function generateOne(cat, difficulty, ctx) {
  // Runtime vždy „pokročilý“ (kratší časy); pole difficulty u bankových otázek se nefiltruje
  const isBegin = false

  if (cat === 'vyjna') {
    if (ctx.vyjnaIdx >= ctx.vyjnaPool.length) ctx.vyjnaIdx = 0
    const item = ctx.vyjnaPool[ctx.vyjnaIdx++]
    const isY = item.correct === 'y' || item.correct === 'ý'
    const options = ['y / ý', 'i / í']
    const correctIdx = isY ? 0 : 1
    return {
      id: `vyjna:${item.word}`,
      type: 'vyber',
      category: 'vyjna',
      subject: 'cestina',
      points: 1,
      display: item.word,
      options,
      correctIdx,
      correct: item.correct,
      hint: item.hint,
      rada: item.rada,
      payload: makeVyberPayload(item.word, options, correctIdx),
      explanation: item.hint || null,
      sourceText: null,
    }
  }

  if (cat === 'predpony') {
    if (ctx.predIdx >= ctx.predPool.length) ctx.predIdx = 0
    const item = ctx.predPool[ctx.predIdx++]
    const shuffledOpts = shuffle([...item.opts])
    const correctIdx = shuffledOpts.indexOf(item.correct)
    return {
      id: `predpony:${item.word}`,
      type: 'vyber',
      category: 'predpony',
      subject: 'cestina',
      points: 1,
      display: item.word,
      options: shuffledOpts,
      correctIdx,
      correct: item.correct,
      hint: item.hint,
      payload: makeVyberPayload(item.word, shuffledOpts, correctIdx),
      explanation: item.hint || null,
      sourceText: null,
    }
  }

  if (cat === 'nasobilka') {
    let a, b, key, att = 0
    do {
      att++
      if (isBegin) {
        a = 2 + Math.floor(Math.random() * 4)
        b = 2 + Math.floor(Math.random() * 4)
      } else {
        a = 2 + Math.floor(Math.random() * 9)
        b = 2 + Math.floor(Math.random() * 9)
      }
      key = `${Math.min(a, b)}×${Math.max(a, b)}`
    } while (ctx.used.has(key) && att < 30)
    ctx.used.add(key)
    const answer = a * b
    const opts = mathOpts(answer, 'nasobilka')
    const options = opts.map(String)
    const correctIdx = opts.indexOf(answer)
    const display = `${a} × ${b}`
    return {
      id: `nasobilka:${a}x${b}`,
      type: 'vyber',
      category: 'nasobilka',
      subject: 'matematika',
      points: 1,
      display,
      options,
      correctIdx,
      correct: String(answer),
      timeLimit: isBegin ? 12 : 8,
      payload: makeVyberPayload(display, options, correctIdx),
      explanation: null,
      sourceText: null,
    }
  }

  if (cat === 'pocitani') {
    let m, key, st, att = 0
    do {
      att++
      st = Math.random() > 0.5 ? 'scitani' : 'odcitani'
      if (isBegin) {
        if (st === 'scitani') {
          const a = 10 + Math.floor(Math.random() * 40)
          const b = 1 + Math.floor(Math.random() * (50 - a))
          m = { q: `${a} + ${b}`, answer: a + b }
        } else {
          const a = 20 + Math.floor(Math.random() * 30)
          const b = 1 + Math.floor(Math.random() * (a - 10))
          m = { q: `${a} − ${b}`, answer: a - b }
        }
      } else {
        m = genMath(st)
      }
      key = m.q
    } while (ctx.used.has(key) && att < 30)
    ctx.used.add(key)
    const opts = mathOpts(m.answer, st)
    const options = opts.map(String)
    const correctIdx = opts.indexOf(m.answer)
    return {
      id: `pocitani:${m.q}`,
      type: 'vyber',
      category: 'pocitani',
      subject: 'matematika',
      points: 1,
      display: m.q,
      options,
      correctIdx,
      correct: String(m.answer),
      timeLimit: isBegin
        ? (st === 'scitani' ? 22 : 25)
        : (st === 'scitani' ? 17 : 20),
      payload: makeVyberPayload(m.q, options, correctIdx),
      explanation: null,
      sourceText: null,
    }
  }

  // Bankové kategorie — různé formáty podle dostupných otázek
  if (BANK_CATS.has(cat)) {
    if (!ctx.bankPools[cat] || ctx.bankPools[cat].idx >= ctx.bankPools[cat].pool.length) {
      ctx.bankPools[cat] = { pool: shuffle(getBankQuestions(cat)), idx: 0 }
    }
    const bp = ctx.bankPools[cat]
    if (bp.pool.length === 0) return null
    if (bp.idx >= bp.pool.length) bp.idx = 0
    const q = bp.pool[bp.idx++]
    return { ...q, fromErrorLog: false, errorDetail: null }
  }

  return null
}

function errorEntryToQuestion(entry) {
  if (!entry?.question || !entry.question.type) return null
  return {
    ...entry.question,
    fromErrorLog: true,
    errorDetail: entry.detail || null,
  }
}

/**
 * Zamíchá 2–3 otázky z chybníku do kola — ne na začátek.
 */
function injectErrorLogQuestions(questions, errorLog) {
  if (!errorLog?.length || questions.length < 3) return questions

  const want = Math.min(2 + Math.floor(Math.random() * 2), errorLog.length, questions.length - 2)
  const candidates = shuffle(
    errorLog
      .map(errorEntryToQuestion)
      .filter(Boolean)
  ).slice(0, want)

  if (candidates.length === 0) return questions

  const result = [...questions]
  // Pozice od indexu 2 dál (ne začátek)
  const slots = shuffle(
    Array.from({ length: result.length - 2 }, (_, i) => i + 2)
  ).slice(0, candidates.length)

  slots.forEach((slot, i) => {
    result[slot] = candidates[i]
  })

  return result
}

/**
 * @param {string[]} activeCats
 * @param {string} [_difficulty] — ignorováno; vždy pokročilý režim (kratší časy)
 * @param {array} [errorLog]
 */
export function generateQuestions(activeCats, _difficulty = 'advanced', errorLog = []) {
  if (!activeCats?.length) return []

  const difficulty = 'advanced'
  const ctx = {
    used: new Set(),
    vyjnaPool: shuffle([...VYJNA]),
    predPool: shuffle([...PREDPONY]),
    vyjnaIdx: 0,
    predIdx: 0,
    bankPools: {},
  }

  const questions = []
  const perCat = Math.ceil(ROUND_SIZE / activeCats.length)

  for (const cat of activeCats) {
    for (let i = 0; i < perCat && questions.length < ROUND_SIZE; i++) {
      const q = generateOne(cat, difficulty, ctx)
      if (q) questions.push(q)
    }
  }

  // Doplň, pokud nějaká kategorie nevrátila dost otázek
  let guard = 0
  while (questions.length < ROUND_SIZE && guard < 50) {
    guard++
    const cat = activeCats[questions.length % activeCats.length]
    const q = generateOne(cat, difficulty, ctx)
    if (q) questions.push(q)
    else break
  }

  let round = shuffle(questions).slice(0, ROUND_SIZE)
  round = injectErrorLogQuestions(round, errorLog)
  return round.slice(0, ROUND_SIZE)
}

export { LEGACY_CATS, BANK_CATS }
