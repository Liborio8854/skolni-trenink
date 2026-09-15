import { VYJNA } from '../data/vyjna'
import { PREDPONY } from '../data/predpony'
import { ROUND_SIZE } from '../data/constants'

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

export function generateQuestions(activeCats, difficulty) {
  const questions = []
  const perCat = Math.ceil(ROUND_SIZE / activeCats.length)
  const isBegin = difficulty === 'beginner'
  const used = new Set()

  const vyjnaPool = shuffle(
    isBegin ? VYJNA.filter(v => v.rada === 'B' || v.rada === 'L') : [...VYJNA]
  )
  const predPool = shuffle(
    isBegin ? PREDPONY.filter(p => p.opts[0] === 'vy' || p.opts[0] === 'vi') : [...PREDPONY]
  )
  let vyjnaIdx = 0, predIdx = 0

  for (const cat of activeCats) {
    for (let i = 0; i < perCat && questions.length < ROUND_SIZE; i++) {
      if (cat === 'vyjna') {
        if (vyjnaIdx >= vyjnaPool.length) vyjnaIdx = 0
        const item = vyjnaPool[vyjnaIdx++]
        const isY = item.correct === 'y' || item.correct === 'ý'
        const options = ['y / ý', 'i / í']
        const correctIdx = isY ? 0 : 1
        questions.push({
          type: 'vyber',
          category: 'vyjna',
          subject: 'cestina',
          points: 1,
          display: item.word,
          options,
          correctIdx,
          correct: item.correct, hint: item.hint, rada: item.rada,
          payload: {
            prompt: item.word,
            options: options.map((text, i) => ({ id: String(i), text })),
            correctOptionId: String(correctIdx),
          },
          explanation: item.hint || null,
          sourceText: null,
        })
      } else if (cat === 'predpony') {
        if (predIdx >= predPool.length) predIdx = 0
        const item = predPool[predIdx++]
        const shuffledOpts = shuffle([...item.opts])
        const correctIdx = shuffledOpts.indexOf(item.correct)
        questions.push({
          type: 'vyber',
          category: 'predpony',
          subject: 'cestina',
          points: 1,
          display: item.word,
          options: shuffledOpts,
          correctIdx,
          correct: item.correct, hint: item.hint,
          payload: {
            prompt: item.word,
            options: shuffledOpts.map((text, i) => ({ id: String(i), text })),
            correctOptionId: String(correctIdx),
          },
          explanation: item.hint || null,
          sourceText: null,
        })
      } else if (cat === 'nasobilka') {
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
          key = `${Math.min(a,b)}×${Math.max(a,b)}`
        } while (used.has(key) && att < 30)
        used.add(key)
        const answer = a * b
        const opts = mathOpts(answer, 'nasobilka')
        const options = opts.map(String)
        const correctIdx = opts.indexOf(answer)
        const display = `${a} × ${b}`
        questions.push({
          type: 'vyber',
          category: 'nasobilka',
          subject: 'matematika',
          points: 1,
          display,
          options,
          correctIdx,
          correct: String(answer), timeLimit: isBegin ? 12 : 8,
          payload: {
            prompt: display,
            options: options.map((text, i) => ({ id: String(i), text })),
            correctOptionId: String(correctIdx),
          },
          explanation: null,
          sourceText: null,
        })
      } else {
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
        } while (used.has(key) && att < 30)
        used.add(key)
        const opts = mathOpts(m.answer, st)
        const options = opts.map(String)
        const correctIdx = opts.indexOf(m.answer)
        questions.push({
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
          payload: {
            prompt: m.q,
            options: options.map((text, i) => ({ id: String(i), text })),
            correctOptionId: String(correctIdx),
          },
          explanation: null,
          sourceText: null,
        })
      }
    }
  }
  return shuffle(questions).slice(0, ROUND_SIZE)
}
