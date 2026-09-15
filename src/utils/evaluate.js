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

/** TODO: A/N svazek — částečné body podle Cermatu. */
function evaluateAnSvazek(question, _userAnswer) {
  // TODO: 4 správně → plný počet, 3 → polovina (floor), 2 a méně → 0
  return result({
    correct: false,
    pointsEarned: 0,
    pointsMax: question.points ?? 0,
    detail: { unimplemented: true },
  })
}

/** TODO: otevřená odpověď (číslo / text). */
function evaluateOtevrena(question, _userAnswer) {
  // TODO: number + tolerance; text + normalizace mezer / diakritiky
  return result({
    correct: false,
    pointsEarned: 0,
    pointsMax: question.points ?? 0,
    detail: { unimplemented: true },
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
