import { useState } from 'react'
import { glass, glassStrong } from '../utils/styles'

/**
 * A/N svazek — 4 tvrzení, u každého ANO/NE.
 * onSubmit(answers) volá rodič s { [statementId]: boolean }.
 * evaluation = výsledek evaluateAnswer (po odeslání).
 */
export default function AnSvazekQuestion({ question, submitted, evaluation, onSubmit }) {
  const statements = question.payload?.statements || []
  const [answers, setAnswers] = useState({})

  const allAnswered = statements.length > 0 && statements.every(s => answers[s.id] === true || answers[s.id] === false)

  const setAnswer = (id, value) => {
    if (submitted) return
    setAnswers(prev => ({ ...prev, [id]: value }))
  }

  const handleCheck = () => {
    if (!allAnswered || submitted) return
    onSubmit(answers)
  }

  const anBtn = (selected, kind, disabled) => {
    const isAno = kind === true
    let bg = 'rgba(255,255,255,.07)'
    let brd = '1px solid rgba(255,255,255,.15)'
    let color = '#E8ECF4'

    if (selected) {
      if (isAno) {
        bg = 'linear-gradient(135deg,rgba(39,174,96,.4),rgba(46,204,113,.25))'
        brd = '1.5px solid rgba(39,174,96,.7)'
        color = '#4ADE80'
      } else {
        bg = 'linear-gradient(135deg,rgba(231,76,60,.4),rgba(192,57,43,.25))'
        brd = '1.5px solid rgba(231,76,60,.7)'
        color = '#F87171'
      }
    }

    return {
      minWidth: 52,
      minHeight: 48,
      padding: '10px 14px',
      borderRadius: 12,
      border: brd,
      background: bg,
      color,
      fontSize: 14,
      fontWeight: 800,
      cursor: disabled ? 'default' : 'pointer',
      transition: 'all .2s ease',
      backdropFilter: 'blur(12px)',
      WebkitBackdropFilter: 'blur(12px)',
      opacity: disabled && !selected ? 0.55 : 1,
    }
  }

  return (
    <div style={{ animation: 'popIn .4s cubic-bezier(.34,1.56,.64,1)' }}>
      <div style={{
        ...glassStrong,
        borderRadius: 24,
        padding: '24px 18px',
        marginBottom: 16,
      }}>
        <div style={{
          fontSize: 16,
          fontWeight: 800,
          lineHeight: 1.45,
          marginBottom: 18,
          textAlign: 'left',
          color: '#E8ECF4',
        }}>
          {question.payload?.prompt}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {statements.map((s, i) => {
            const detail = evaluation?.detail?.perStatement?.[s.id]
            const rowOk = submitted ? detail?.ok : null
            let rowBg = 'rgba(255,255,255,.04)'
            let rowBorder = '1px solid rgba(255,255,255,.1)'
            if (rowOk === true) {
              rowBg = 'rgba(39,174,96,.12)'
              rowBorder = '1px solid rgba(39,174,96,.35)'
            } else if (rowOk === false) {
              rowBg = 'rgba(231,76,60,.12)'
              rowBorder = '1px solid rgba(231,76,60,.35)'
            }

            return (
              <div
                key={s.id}
                style={{
                  background: rowBg,
                  border: rowBorder,
                  borderRadius: 16,
                  padding: '12px 12px',
                  transition: 'all .25s ease',
                }}
              >
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <div style={{
                    fontSize: 15,
                    fontWeight: 700,
                    lineHeight: 1.4,
                    textAlign: 'left',
                    color: '#E8ECF4',
                  }}>
                    <span style={{ color: '#8892A8', marginRight: 4 }}>{i + 1}.</span>
                    {s.text}
                  </div>
                  <div style={{ display: 'flex', gap: 10 }}>
                    <button
                      type="button"
                      style={{ ...anBtn(answers[s.id] === true, true, submitted), flex: 1 }}
                      onClick={() => setAnswer(s.id, true)}
                      disabled={submitted}
                    >ANO</button>
                    <button
                      type="button"
                      style={{ ...anBtn(answers[s.id] === false, false, submitted), flex: 1 }}
                      onClick={() => setAnswer(s.id, false)}
                      disabled={submitted}
                    >NE</button>
                  </div>
                </div>
                {submitted && rowOk === false && (
                  <div style={{
                    marginTop: 8,
                    fontSize: 13,
                    color: '#8892A8',
                    textAlign: 'left',
                    animation: 'fadeIn .3s ease',
                  }}>
                    Správně: <strong style={{ color: '#4ADE80' }}>{s.correct ? 'ANO' : 'NE'}</strong>
                  </div>
                )}
              </div>
            )
          })}
        </div>

        {submitted && evaluation && (
          <div style={{
            marginTop: 16,
            fontSize: 14,
            fontWeight: 800,
            color: evaluation.pointsEarned === evaluation.pointsMax
              ? '#4ADE80'
              : evaluation.pointsEarned > 0 ? '#FFD166' : '#F87171',
            textAlign: 'center',
            animation: 'fadeIn .3s ease',
          }}>
            Získal jsi {evaluation.pointsEarned} ze {evaluation.pointsMax} bodů
            {' '}({evaluation.detail.correctCount} ze {evaluation.detail.total} správně)
          </div>
        )}

        {submitted && question.explanation && (
          <div style={{
            marginTop: 12,
            fontSize: 13,
            color: '#8892A8',
            fontStyle: 'italic',
            lineHeight: 1.45,
            textAlign: 'left',
            animation: 'fadeIn .3s ease',
          }}>
            {question.explanation}
          </div>
        )}
      </div>

      {!submitted && (
        <button
          type="button"
          onClick={handleCheck}
          disabled={!allAnswered}
          style={{
            ...glass,
            width: '100%',
            padding: 16,
            borderRadius: 18,
            border: allAnswered
              ? '1px solid rgba(255,209,102,.35)'
              : '1px solid rgba(255,255,255,.08)',
            fontSize: 16,
            fontWeight: 900,
            cursor: allAnswered ? 'pointer' : 'default',
            background: allAnswered
              ? 'linear-gradient(135deg,rgba(255,209,102,.22),rgba(255,107,53,.15))'
              : 'rgba(255,255,255,.04)',
            color: allAnswered ? '#FFD166' : '#555',
            transition: 'all .25s',
          }}
        >
          {allAnswered ? 'Zkontrolovat' : 'Odpověz na všechny věty'}
        </button>
      )}
    </div>
  )
}
