import { useRef } from 'react'

const COLORS = ['#FFD166', '#FF6B35', '#4ADE80', '#60A5FA', '#EF476F', '#A855F7', '#2DD4BF', '#FB923C']

export default function ConfettiBurst() {
  const pieces = useRef(
    Array.from({ length: 24 }, (_, i) => ({
      id: i,
      color: COLORS[i % COLORS.length],
      angle: (i / 24) * 360 + (Math.random() * 15 - 7.5),
      dist: 60 + Math.random() * 120,
      size: 5 + Math.random() * 6,
      dur: 0.5 + Math.random() * 0.4,
      delay: Math.random() * 0.15,
      shape: Math.random() > 0.5 ? '50%' : '2px',
    }))
  ).current

  return (
    <div style={{
      position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 999,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      {pieces.map(p => {
        const rad = (p.angle * Math.PI) / 180
        const tx = Math.cos(rad) * p.dist
        const ty = Math.sin(rad) * p.dist - 40
        return (
          <div key={p.id} style={{ position: 'absolute' }}>
            <style>{`
              @keyframes cf_${p.id} {
                0% { transform: translate(0,0) rotate(0deg) scale(1); opacity: 1; }
                100% { transform: translate(${tx}px, ${ty + 80}px) rotate(${p.angle * 3}deg) scale(0.2); opacity: 0; }
              }
            `}</style>
            <div style={{
              width: p.size, height: p.size,
              background: p.color,
              borderRadius: p.shape,
              animation: `cf_${p.id} ${p.dur}s ease-out ${p.delay}s both`,
            }} />
          </div>
        )
      })}
    </div>
  )
}
