import { useState, useRef, useEffect } from 'react'
import { glass, glassStrong } from '../utils/styles'

/**
 * Otevřená odpověď — číslo nebo text.
 * onSubmit(value: string)
 */
export default function OtevrenaQuestion({ question, submitted, evaluation, onSubmit }) {
  const payload = question.payload || {}
  const isNumber = payload.answerType === 'number'
  const [value, setValue] = useState('')
  const inputRef = useRef(null)

  useEffect(() => {
    if (!submitted) inputRef.current?.focus()
  }, [submitted, question?.id])

  const canSubmit = value.trim().length > 0 && !submitted

  const handleCheck = () => {
    if (!canSubmit) return
    onSubmit(value.trim())
  }

  const onKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleCheck()
    }
  }

  const diacriticNearMiss = evaluation?.detail?.diacriticNearMiss

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
            fontSize: 13,
            color: '#8892A8',
            lineHeight: 1.45,
            marginBottom: 14,
            whiteSpace: 'pre-wrap',
          }}>
            {question.sourceText}
          </div>
        )}

        <div style={{
          fontSize: 16,
          fontWeight: 800,
          lineHeight: 1.45,
          marginBottom: 20,
          color: '#E8ECF4',
          whiteSpace: 'pre-wrap',
        }}>
          {payload.prompt}
        </div>

        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          justifyContent: 'center',
        }}>
          <input
            ref={inputRef}
            type="text"
            inputMode={isNumber ? 'numeric' : 'text'}
            autoComplete="off"
            autoCorrect="off"
            spellCheck={false}
            value={value}
            disabled={submitted}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder={isNumber ? 'Číslo…' : 'Odpověď…'}
            style={{
              flex: 1,
              maxWidth: 220,
              minHeight: 52,
              padding: '12px 16px',
              borderRadius: 14,
              border: submitted
                ? (evaluation?.correct
                  ? '1.5px solid rgba(39,174,96,.6)'
                  : '1.5px solid rgba(231,76,60,.55)')
                : '1px solid rgba(255,255,255,.18)',
              background: 'rgba(255,255,255,.08)',
              color: '#fff',
              fontSize: 22,
              fontWeight: 800,
              textAlign: 'center',
              outline: 'none',
              fontFamily: 'inherit',
            }}
          />
          {payload.unit && (
            <span style={{
              fontSize: 18,
              fontWeight: 800,
              color: '#8892A8',
              flexShrink: 0,
            }}>
              {payload.unit}
            </span>
          )}
        </div>

        {submitted && evaluation && (
          <div style={{
            marginTop: 16,
            fontSize: 14,
            fontWeight: 800,
            textAlign: 'center',
            color: evaluation.correct
              ? '#4ADE80'
              : diacriticNearMiss ? '#FFD166' : '#F87171',
            animation: 'fadeIn .3s ease',
          }}>
            {evaluation.correct
              ? `Správně! +${evaluation.pointsEarned} b`
              : `Správně: ${payload.correctAnswers?.[0] ?? ''}${payload.unit ? ` ${payload.unit}` : ''}`}
          </div>
        )}

        {submitted && diacriticNearMiss && (
          <div style={{
            marginTop: 10,
            fontSize: 14,
            fontWeight: 800,
            textAlign: 'center',
            color: '#FFD166',
            animation: 'fadeIn .3s ease',
          }}>
            Skoro! Máš správné slovo, ale zkontroluj si diakritiku.
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
          {canSubmit ? 'Zkontrolovat' : 'Napiš odpověď'}
        </button>
      )}
    </div>
  )
}
