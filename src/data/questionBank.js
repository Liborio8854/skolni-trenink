import { PRAVOPIS_IY_AN_TEST } from './pravopisIyTest'
import { OTEVRENA_TEST } from './otevrenaTest'
import { OTEVRENA_MULTI_TEST } from './otevrenaMultiTest'
import { PRIRAZOVANI_TEST } from './prirazovaniTest'

/** Banka otázek nových formátů (zatím testovací obsah). */
export const QUESTION_BANK = [
  ...PRAVOPIS_IY_AN_TEST,
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
