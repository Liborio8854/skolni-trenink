import pravopisIy from '../../data/pravopis-iy.json' with { type: 'json' }
import { OTEVRENA_TEST } from './otevrenaTest'
import { OTEVRENA_MULTI_TEST } from './otevrenaMultiTest'
import { PRIRAZOVANI_TEST } from './prirazovaniTest'

/** Doplní display / options / correctIdx, aby JSON ze specifikace fungoval ve stávajícím UI. */
function normalizeQuestion(q) {
  const next = { ...q }
  if (!next.display && next.payload?.prompt) {
    next.display = next.payload.prompt
  }
  if (next.type === 'vyber' && Array.isArray(next.payload?.options)) {
    const opts = next.payload.options
    next.options = opts.map(o => (typeof o === 'string' ? o : o.text))
    if (next.payload.correctOptionId != null) {
      const id = String(next.payload.correctOptionId)
      next.correctIdx = opts.findIndex(o => String(o?.id ?? o) === id)
    }
    if (next.correct == null && next.correctIdx >= 0) {
      next.correct = next.options[next.correctIdx]
    }
  }
  if (next.hint === undefined) next.hint = null
  if (next.sourceText === undefined) next.sourceText = null
  return next
}

/** Banka otázek nových formátů. */
export const QUESTION_BANK = [
  ...pravopisIy.map(normalizeQuestion),
  ...OTEVRENA_TEST,
  ...OTEVRENA_MULTI_TEST,
  ...PRIRAZOVANI_TEST,
]

export function getBankQuestions(category) {
  return QUESTION_BANK.filter(q => q.category === category)
}

export function bankCategories() {
  return [...new Set(QUESTION_BANK.map(q => q.category))]
}

export function findQuestionById(id) {
  if (!id) return null
  return QUESTION_BANK.find(q => q.id === id) || null
}
