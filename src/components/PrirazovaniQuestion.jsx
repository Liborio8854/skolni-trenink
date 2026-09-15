import { useState } from 'react'
import { glass, glassStrong } from '../utils/styles'

function previewText(text, max = 36) {
  const t = String(text || '').trim()
  if (t.length <= max) return t
  return `${t.slice(0, max).trim()}…`
}

/**
 * Přiřazování — dropdown u každé položky (bez drag & drop).
 * onSubmit(mapping: { [itemId]: optionId })
 */
export default function PrirazovaniQuestion({ question, submitted, evaluation, onSubmit }) {
  const payload = question.payload || {}
  const items = payload.items || []
  const options = payload.options || []
  const [mapping, setMapping] = useState({})

  const allAssigned = items.length > 0 && items.every(item => mapping[item.id])
  const canSubmit = allAssigned && !submitted

  const usedOptionIds = new Set(
    Object.values(mapping).filter(Boolean)
  )

  const setItemOption = (itemId, optionId) => {
    if (submitted) return
    setMapping(prev => {
      const next = { ...prev }
      if (!optionId) {
        delete next[itemId]
      } else {
        next[itemId] = optionId
      }
      return next
    })
  }

  const availableFor = (itemId) => {
    const current = mapping[itemId]
    return options.filter(opt => opt.id === current || !usedOptionIds.has(opt.id))
  }

  const optionById = (id) => options.find(o => o.id === id)

  const handleCheck = () => {
    if (!canSubmit) return
    onSubmit({ ...mapping })
  }

  return (
    <div style={{ animation: 'popIn .4s cubic-bezier(.34,1.56,.64,1)' }}>
      <div style={{
        ...glassStrong,
        borderRadius: 24,
        padding: '24px 18px',
        marginBottom: 16,
        textAlign: 'left',
      }}>
        <div style={{
          fontSize: 16,
          fontWeight: 800,
          lineHeight: 1.45,
          marginBottom: 18,
          color: '#E8ECF4',
        }}>
          {payload.prompt}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {items.map((item, i) => {
            const detail = evaluation?.detail?.perItem?.[item.id]
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
                key={item.id}
                style={{
                  background: rowBg,
                  border: rowBorder,
                  borderRadius: 16,
                  padding: '12px 12px',
                  transition: 'all .25s ease',
                }}
              >
                <div style={{
                  fontSize: 15,
                  fontWeight: 700,
                  lineHeight: 1.4,
                  marginBottom: 10,
                  color: '#E8ECF4',
                }}>
                  <span style={{ color: '#8892A8', marginRight: 4 }}>{i + 1}.</span>
                  {item.text}
                </div>

                <select
                  value={mapping[item.id] || ''}
                  disabled={submitted}
                  onChange={(e) => setItemOption(item.id, e.target.value)}
                  style={{
                    width: '100%',
                    minHeight: 48,
                    padding: '10px 12px',
                    borderRadius: 12,
                    border: '1px solid rgba(255,255,255,.18)',
                    background: 'rgba(15,12,41,.85)',
                    color: '#E8ECF4',
                    fontSize: 14,
                    fontWeight: 700,
                    fontFamily: 'inherit',
                    outline: 'none',
                    cursor: submitted ? 'default' : 'pointer',
                  }}
                >
                  <option value="">Vyber …</option>
                  {availableFor(item.id).map(opt => (
                    <option key={opt.id} value={opt.id}>
                      {opt.id}) {previewText(opt.text)}
                    </option>
                  ))}
                </select>

                {submitted && rowOk === false && (
                  <div style={{
                    marginTop: 8,
                    fontSize: 13,
                    color: '#8892A8',
                    animation: 'fadeIn .3s ease',
                  }}>
                    Správně:{' '}
                    <strong style={{ color: '#4ADE80' }}>
                      {detail.expected}) {optionById(detail.expected)?.text || detail.expected}
                    </strong>
                  </div>
                )}
              </div>
            )
          })}
        </div>

        <div style={{
          marginTop: 18,
          paddingTop: 14,
          borderTop: '1px solid rgba(255,255,255,.1)',
        }}>
          <div style={{
            fontSize: 12,
            fontWeight: 800,
            color: '#8892A8',
            letterSpacing: 0.5,
            marginBottom: 10,
            textTransform: 'uppercase',
          }}>
            Možnosti
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {options.map(opt => {
              const taken = usedOptionIds.has(opt.id)
              return (
                <div
                  key={opt.id}
                  style={{
                    fontSize: 13,
                    lineHeight: 1.4,
                    color: taken && !submitted ? '#5a6275' : '#C8D0E0',
                    fontWeight: 600,
                  }}
                >
                  <strong style={{ color: taken && !submitted ? '#5a6275' : '#FFD166' }}>
                    {opt.id})
                  </strong>{' '}
                  {opt.text}
                </div>
              )
            })}
          </div>
        </div>

        {submitted && evaluation && (
          <div style={{
            marginTop: 16,
            fontSize: 14,
            fontWeight: 800,
            textAlign: 'center',
            color: evaluation.correct
              ? '#4ADE80'
              : evaluation.pointsEarned > 0 ? '#FFD166' : '#F87171',
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
          {canSubmit ? 'Zkontrolovat' : 'Přiřaď všechny položky'}
        </button>
      )}
    </div>
  )
}
