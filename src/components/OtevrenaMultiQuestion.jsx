import { useState, useRef, useEffect } from 'react'
import { glass, glassStrong } from '../utils/styles'

/**
 * Otevřená odpověď s více poli.
 * onSubmit(values: string[])
 */
export default function OtevrenaMultiQuestion({ question, submitted, evaluation, onSubmit }) {
  const payload = question.payload || {}
  const fieldCount = payload.fieldCount || (payload.correctAnswers?.length ?? 1)
  const isNumber = payload.answerType === 'number'
  const [values, setValues] = useState(() => Array.from({ length: fieldCount }, () => ''))
  const inputRefs = useRef([])

  useEffect(() => {
    if (!submitted) inputRefs.current[0]?.focus()
  }, [submitted, question?.id])

  const allFilled = values.length === fieldCount && values.every(v => v.trim().length > 0)
  const canSubmit = allFilled && !submitted

  const setValueAt = (idx, text) => {
    setValues(prev => prev.map((v, i) => (i === idx ? text : v)))
  }

  const handleCheck = () => {
    if (!canSubmit) return
    onSubmit(values.map(v => v.trim()))
  }

  const onKeyDown = (idx, e) => {
    if (e.key !== 'Enter') return
    e.preventDefault()
    if (idx < fieldCount - 1) {
      inputRefs.current[idx + 1]?.focus()
    } else {
      handleCheck()
    }
  }

  const detail = evaluation?.detail

  return (
    <div style={{ animation: 'popIn .4s cubic-bezier(.34,1.56,.64,1)' }}>
      <div style={{
        ...glassStrong,
        borderRadius: 24,
        padding: '24px 18px',
        marginBottom: 16,
        textAlign: 'left',
      }}>
        {question.sourceText && (
          <div style={{
            fontSize: 14,
            color: '#C8D0E0',
            lineHeight: 1.5,
            marginBottom: 16,
            whiteSpace: 'pre-wrap',
            padding: '12px 14px',
            borderRadius: 14,
            background: 'rgba(255,255,255,.05)',
            border: '1px solid rgba(255,255,255,.1)',
          }}>
            {question.sourceText}
          </div>
        )}

        <div style={{
          fontSize: 16,
          fontWeight: 800,
          lineHeight: 1.45,
          marginBottom: 18,
          color: '#E8ECF4',
          whiteSpace: 'pre-wrap',
        }}>
          {payload.prompt}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {values.map((val, idx) => (
            <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{
                width: 24,
                fontSize: 14,
                fontWeight: 800,
                color: '#8892A8',
                flexShrink: 0,
              }}>
                {idx + 1}.
              </span>
              <input
                ref={(el) => { inputRefs.current[idx] = el }}
                type="text"
                inputMode={isNumber ? 'numeric' : 'text'}
                autoComplete="off"
                autoCorrect="off"
                spellCheck={false}
                value={val}
                disabled={submitted}
                onChange={(e) => setValueAt(idx, e.target.value)}
                onKeyDown={(e) => onKeyDown(idx, e)}
                placeholder="…"
                style={{
                  flex: 1,
                  minHeight: 48,
                  padding: '10px 14px',
                  borderRadius: 12,
                  border: '1px solid rgba(255,255,255,.18)',
                  background: 'rgba(255,255,255,.08)',
                  color: '#fff',
                  fontSize: 17,
                  fontWeight: 700,
                  outline: 'none',
                  fontFamily: 'inherit',
                }}
              />
            </div>
          ))}
        </div>

        {submitted && detail && (
          <div style={{
            marginTop: 16,
            fontSize: 14,
            lineHeight: 1.5,
            animation: 'fadeIn .3s ease',
          }}>
            <div style={{
              fontWeight: 800,
              marginBottom: 8,
              color: evaluation.correct
                ? '#4ADE80'
                : evaluation.pointsEarned > 0 ? '#FFD166' : '#F87171',
            }}>
              Získal jsi {evaluation.pointsEarned} ze {evaluation.pointsMax} bodů
              {' '}({detail.found.length} ze {detail.total} správně)
            </div>

            {detail.found.length > 0 && (
              <div style={{ color: '#4ADE80', marginBottom: 4, fontWeight: 700 }}>
                Našel jsi: {detail.found.join(', ')}
              </div>
            )}
            {detail.missing.length > 0 && (
              <div style={{ color: '#FFD166', marginBottom: 4, fontWeight: 700 }}>
                Chybělo: {detail.missing.join(', ')}
              </div>
            )}
            {detail.wrong.length > 0 && (
              <div style={{ color: '#F87171', marginBottom: 4, fontWeight: 700 }}>
                Špatně: {detail.wrong.join(', ')}
              </div>
            )}
          </div>
        )}

        {submitted && question.explanation && (
          <div style={{
            marginTop: 12,
            fontSize: 13,
            color: '#8892A8',
            fontStyle: 'italic',
            lineHeight: 1.45,
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
          disabled={!canSubmit}
          style={{
            ...glass,
            width: '100%',
            padding: 16,
            borderRadius: 18,
            border: canSubmit
              ? '1px solid rgba(255,209,102,.35)'
              : '1px solid rgba(255,255,255,.08)',
            fontSize: 16,
            fontWeight: 900,
            cursor: canSubmit ? 'pointer' : 'default',
            background: canSubmit
              ? 'linear-gradient(135deg,rgba(255,209,102,.22),rgba(255,107,53,.15))'
              : 'rgba(255,255,255,.04)',
            color: canSubmit ? '#FFD166' : '#555',
            transition: 'all .25s',
          }}
        >
          {canSubmit ? 'Zkontrolovat' : 'Vyplň všechna pole'}
        </button>
      )}
    </div>
  )
}
