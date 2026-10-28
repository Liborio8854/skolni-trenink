import { Fragment } from 'react'
import { glass, glassStrong, glassBadge } from '../utils/styles'
import ConfettiBurst from './ConfettiBurst'
import {
  MASTERY_CONFIG,
  STATE_COLORS,
  STATE_FIXED_GLOW,
  STATE_LABELS,
  MASTERY_STATES,
  cellState,
} from '../data/nasobilkaMastery'

const ROWS = [2, 3, 4, 5, 6, 7, 8, 9]

export default function NasobilkaMasteryScreen({
  entries,
  fixed,
  pct,
  dailySuccessful,
  dailyGoal,
  allFixed,
  showBigCelebration,
  fixToast,
  onStartRound,
  onBack,
  onDismissCelebration,
}) {
  return (
    <div>
      {showBigCelebration && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 1000,
          background: 'rgba(15,12,41,.92)',
          display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center',
          padding: 24, textAlign: 'center',
          animation: 'fadeIn .4s ease',
        }}>
          <ConfettiBurst />
          <div style={{ fontSize: 64, marginBottom: 12 }}>🏆</div>
          <div style={{
            fontSize: 28, fontWeight: 900, marginBottom: 8,
            background: 'linear-gradient(135deg,#FFD166,#FF6B35 50%,#EF476F)',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
          }}>Odznak: {MASTERY_CONFIG.badgeName}</div>
          <div style={{
            fontSize: 16, fontWeight: 700, color: '#E8ECF4',
            maxWidth: 340, lineHeight: 1.5, marginBottom: 24,
          }}>{MASTERY_CONFIG.completeMessage}</div>
          <button
            onClick={onDismissCelebration}
            style={{
              ...glassStrong,
              padding: '14px 28px', borderRadius: 16,
              fontSize: 16, fontWeight: 800, cursor: 'pointer',
              color: '#FFD166',
              border: '1px solid rgba(255,209,102,.35)',
            }}
          >Paráda! 🎉</button>
        </div>
      )}

      {fixToast && (
        <div style={{
          position: 'fixed', top: 24, left: '50%', transform: 'translateX(-50%)',
          zIndex: 900,
          padding: '12px 20px', borderRadius: 16,
          fontWeight: 800,
          fontSize: 15,
          color: '#1F2937',
          background: STATE_COLORS[MASTERY_STATES.ZAFIXOVANO],
          border: `1px solid ${STATE_COLORS[MASTERY_STATES.ZAFIXOVANO]}`,
          boxShadow: STATE_FIXED_GLOW,
          animation: 'popIn .35s ease',
          whiteSpace: 'nowrap',
        }}>
          ⭐ {fixToast}
        </div>
      )}

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <button
          onClick={onBack}
          style={{
            ...glassBadge, cursor: 'pointer',
            padding: '6px 14px', fontSize: 14, color: '#E8ECF4',
          }}
        >← Zpět</button>
        <div style={{ ...glassBadge, display: 'flex', alignItems: 'center', gap: 5 }}>
          🏆 {pct}%
        </div>
      </div>

      <div style={{
        fontSize: 26, fontWeight: 900, textAlign: 'center', marginBottom: 4,
        background: 'linear-gradient(135deg,#FFD166,#FF6B35)',
        WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
      }}>🏆 Mistr násobilky</div>
      <div style={{ fontSize: 13, color: '#8892A8', textAlign: 'center', marginBottom: 20 }}>
        Malá násobilka 2–9 · limit 6 s · blesk do 3 s · učím se 3–6 s
      </div>

      {/* Legenda */}
      <div style={{
        display: 'flex', flexWrap: 'wrap', gap: 8, justifyContent: 'center',
        marginBottom: 14, fontSize: 11, fontWeight: 700, color: '#8892A8',
      }}>
        {Object.entries(STATE_LABELS).map(([k, label]) => (
          <span key={k} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <span style={{
              width: 12, height: 12, borderRadius: 3,
              background: STATE_COLORS[k],
              boxShadow: k === MASTERY_STATES.ZAFIXOVANO ? STATE_FIXED_GLOW : 'none',
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 8, lineHeight: 1,
            }}>
              {k === MASTERY_STATES.ZAFIXOVANO ? '⭐' : null}
            </span>
            {label}
          </span>
        ))}
      </div>

      {/* Tabulka 8×8 */}
      <div style={{
        ...glassStrong,
        borderRadius: 20, padding: 12, marginBottom: 16,
        overflowX: 'auto',
      }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: '22px repeat(8, 1fr)',
          gap: 3,
          minWidth: 280,
        }}>
          <div />
          {ROWS.map(c => (
            <div key={`h${c}`} style={{
              textAlign: 'center', fontSize: 11, fontWeight: 800, color: '#8892A8', paddingBottom: 4,
            }}>{c}</div>
          ))}
          {ROWS.map(row => (
            <Fragment key={`row-${row}`}>
              <div style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 11, fontWeight: 800, color: '#8892A8',
              }}>{row}</div>
              {ROWS.map(col => {
                const stav = cellState(entries, row, col)
                const color = STATE_COLORS[stav]
                const isFixed = stav === MASTERY_STATES.ZAFIXOVANO
                return (
                  <div
                    key={`${row}x${col}`}
                    title={`${row} × ${col} — ${STATE_LABELS[stav]}`}
                    style={{
                      aspectRatio: '1',
                      borderRadius: 6,
                      background: color,
                      boxShadow: isFixed ? STATE_FIXED_GLOW : 'none',
                      border: '1px solid transparent',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: 'clamp(8px, 2.2vw, 12px)',
                      lineHeight: 1,
                    }}
                  >
                    {isFixed ? '⭐' : null}
                  </div>
                )
              })}
            </Fragment>
          ))}
        </div>
      </div>

      <div style={{
        ...glass,
        borderRadius: 18, padding: '14px 18px', marginBottom: 12,
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14, fontWeight: 700 }}>
          <span>{fixed} / {MASTERY_CONFIG.totalExamples} zafixováno</span>
          <span style={{ color: '#FFD166' }}>{pct}%</span>
        </div>
        <div style={{
          height: 10, borderRadius: 5, background: 'rgba(255,255,255,.08)',
          marginTop: 10, overflow: 'hidden',
        }}>
          <div style={{
            height: '100%', borderRadius: 5,
            width: `${pct}%`,
            background: 'linear-gradient(90deg,#EAB308,#FFD166,#F59E0B)',
            transition: 'width .5s ease',
            boxShadow: '0 0 12px #EAB30855',
          }} />
        </div>
        <div style={{
          marginTop: 10, fontSize: 13, fontWeight: 700, color: '#8892A8',
        }}>
          {MASTERY_CONFIG.rewardLabel}
        </div>
      </div>

      <div style={{
        ...glass,
        borderRadius: 16, padding: '12px 18px', marginBottom: 20,
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      }}>
        <span style={{ fontSize: 13, fontWeight: 700, color: '#8892A8' }}>Dnes úspěšná kola</span>
        <span style={{ fontSize: 16, fontWeight: 900, color: '#FFD166' }}>
          {dailySuccessful} / {dailyGoal}
        </span>
      </div>

      {allFixed && (
        <div style={{
          textAlign: 'center', marginBottom: 16, fontSize: 14, fontWeight: 800,
          color: '#FFD166', animation: 'pulse 2s ease infinite',
        }}>
          🏅 Máš odznak {MASTERY_CONFIG.badgeName}!
        </div>
      )}

      <button
        onClick={onStartRound}
        style={{
          width: '100%', padding: 18, borderRadius: 18,
          border: '1px solid rgba(255,209,102,.35)',
          fontSize: 18, fontWeight: 900, cursor: 'pointer',
          background: 'linear-gradient(135deg,rgba(234,179,8,.25),rgba(255,107,53,.15))',
          color: '#FFD166',
          boxShadow: '0 4px 24px rgba(234,179,8,.2), inset 0 1px 0 rgba(255,255,255,.15)',
          letterSpacing: 0.5,
          backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)',
        }}
      >
        Začít kolo
      </button>
    </div>
  )
}
