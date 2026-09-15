/**
 * Centrální vyhodnocení odpovědi podle question.type.
 * Vrací: { correct, pointsEarned, pointsMax, detail }
 */

function result({ correct, pointsEarned, pointsMax, detail = {} }) {
  return { correct, pointsEarned, pointsMax, detail }
}

/** Výběr jedné odpovědi (ABCD) — vše nebo nic. */
function evaluateVyber(question, userAnswer) {
  const pointsMax = question.points ?? 1
  const payload = question.payload

  // Nový model: payload.correctOptionId
  if (payload?.correctOptionId != null) {
    let selectedId = userAnswer == null ? null : String(userAnswer)

    // UI zatím posílá index možnosti → mapuj na option.id
    if (typeof userAnswer === 'number' && Array.isArray(payload.options)) {
      const opt = payload.options[userAnswer]
      if (opt) selectedId = String(opt.id)
    }

    const correct = selectedId === String(payload.correctOptionId)
    return result({
      correct,
      pointsEarned: correct ? pointsMax : 0,
      pointsMax,
      detail: {
        selectedOptionId: selectedId,
        correctOptionId: String(payload.correctOptionId),
      },
    })
  }

  // Legacy: porovnání indexu
  const correct = userAnswer === question.correctIdx
  return result({
    correct,
    pointsEarned: correct ? pointsMax : 0,
    pointsMax,
    detail: {
      selectedIdx: userAnswer,
      correctIdx: question.correctIdx,
    },
  })
}

/** Body za A/N svazek podle Cermatu (rozšiřitelné). */
export function scoreAnSvazekPoints(correctCount, total, maxPoints) {
  if (total <= 0) return 0
  if (correctCount === total) return maxPoints
  if (correctCount === total - 1) return Math.floor(maxPoints / 2)
  return 0
}

/** A/N svazek — userAnswer: { [statementId]: boolean } */
function evaluateAnSvazek(question, userAnswer) {
  const pointsMax = question.points ?? 0
  const statements = question.payload?.statements || []
  const answers = userAnswer && typeof userAnswer === 'object' ? userAnswer : {}

  const perStatement = {}
  let correctCount = 0

  for (const s of statements) {
    const user = answers[s.id]
    const ok = user === s.correct
    if (ok) correctCount++
    perStatement[s.id] = { user, expected: s.correct, ok }
  }

  const pointsEarned = scoreAnSvazekPoints(correctCount, statements.length, pointsMax)
  const correct = pointsEarned === pointsMax && pointsMax > 0

  return result({
    correct,
    pointsEarned,
    pointsMax,
    detail: {
      correctCount,
      total: statements.length,
      perStatement,
    },
  })
}

function stripDiacritics(s) {
  return String(s)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
}

function normalizeTextAnswer(s, { caseSensitive = false } = {}) {
  let result = String(s).trim().replace(/\s+/g, ' ')
  if (!caseSensitive) result = result.toLowerCase()
  return result
}

function isDiacriticNearMiss(userInput, correctAnswers, options = {}) {
  const userNorm = normalizeTextAnswer(userInput, options)
  const userStrip = stripDiacritics(userNorm)
  return correctAnswers.some(c => {
    const cNorm = normalizeTextAnswer(c, options)
    return stripDiacritics(cNorm) === userStrip && cNorm !== userNorm
  })
}

function evaluateNumberAnswer(userInput, correctAnswers, tolerance = 0) {
  const normalized = String(userInput).replace(/\s/g, '').replace(',', '.')
  const value = parseFloat(normalized)
  if (Number.isNaN(value)) return false
  return correctAnswers.some(correct =>
    Math.abs(value - parseFloat(String(correct).replace(',', '.'))) <= tolerance
  )
}

function evaluateTextAnswer(userInput, correctAnswers, options = {}) {
  const user = normalizeTextAnswer(userInput, options)
  return correctAnswers.some(c => normalizeTextAnswer(c, options) === user)
}

/** Otevřená odpověď — userAnswer: string */
function evaluateOtevrena(question, userAnswer) {
  const pointsMax = question.points ?? 1
  const payload = question.payload || {}
  const correctAnswers = payload.correctAnswers || []
  const raw = userAnswer == null ? '' : String(userAnswer)
  const answerType = payload.answerType || 'text'

  let correct = false
  let diacriticNearMiss = false

  if (answerType === 'number') {
    correct = evaluateNumberAnswer(raw, correctAnswers, payload.tolerance ?? 0)
  } else {
    const textOpts = {
      caseSensitive: payload.caseSensitive === true,
    }
    correct = evaluateTextAnswer(raw, correctAnswers, textOpts)
    if (!correct) {
      diacriticNearMiss = isDiacriticNearMiss(raw, correctAnswers, textOpts)
    }
  }

  return result({
    correct,
    pointsEarned: correct ? pointsMax : 0,
    pointsMax,
    detail: {
      answerType,
      userAnswer: raw,
      correctAnswers,
      diacriticNearMiss,
    },
  })
}

/** TODO: otevřená odpověď s více poli. */
function evaluateOtevrenaMulti(question, _userAnswer) {
  // TODO: chyby = chybějící správné + navíc špatné; body − 1 za chybu
  return result({
    correct: false,
    pointsEarned: 0,
    pointsMax: question.points ?? 0,
    detail: { unimplemented: true },
  })
}

/** TODO: přiřazování — 1 bod za každé správné párování. */
function evaluatePrirazovani(question, _userAnswer) {
  // TODO: porovnat userMapping s correctMapping
  return result({
    correct: false,
    pointsEarned: 0,
    pointsMax: question.points ?? 0,
    detail: { unimplemented: true },
  })
}

const EVALUATORS = {
  vyber: evaluateVyber,
  'an-svazek': evaluateAnSvazek,
  otevrena: evaluateOtevrena,
  'otevrena-multi': evaluateOtevrenaMulti,
  prirazovani: evaluatePrirazovani,
}

/**
 * @param {object} question
 * @param {*} userAnswer — tvar závisí na type (u vyber: index nebo option id)
 */
export function evaluateAnswer(question, userAnswer) {
  const evaluator = EVALUATORS[question?.type]
  if (!evaluator) {
    return result({
      correct: false,
      pointsEarned: 0,
      pointsMax: question?.points ?? 0,
      detail: { error: `Neznámý typ úlohy: ${question?.type}` },
    })
  }
  return evaluator(question, userAnswer)
}
