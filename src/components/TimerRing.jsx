export default function TimerRing({ timeLeft, timeLimit }) {
  const size = 60, stroke = 5
  const r = (size - stroke) / 2
  const circ = 2 * Math.PI * r
  const frac = Math.max(0, timeLeft / timeLimit)
  const offset = circ * (1 - frac)
  const col = frac > 0.5 ? '#4ADE80' : frac > 0.25 ? '#FFB830' : '#F87171'

  return (
    <div style={{ position: 'relative', width: size, height: size, margin: '0 auto 16px' }}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none"
          stroke="rgba(255,255,255,0.08)" strokeWidth={stroke} />
        <circle cx={size / 2} cy={size / 2} r={r} fill="none"
          stroke={col} strokeWidth={stroke}
          strokeDasharray={circ} strokeDashoffset={offset}
          strokeLinecap="round"
          style={{ transition: 'stroke-dashoffset 0.1s linear, stroke 0.3s' }} />
      </svg>
      <div style={{
        position: 'absolute', top: 0, left: 0, width: size, height: size,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 20, fontWeight: 900, color: col,
      }}>
        {Math.ceil(timeLeft)}
      </div>
    </div>
  )
}
