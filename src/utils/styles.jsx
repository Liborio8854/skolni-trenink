export const glass = {
  background: 'rgba(255,255,255,0.06)',
  backdropFilter: 'blur(20px) saturate(1.4)',
  WebkitBackdropFilter: 'blur(20px) saturate(1.4)',
  border: '1px solid rgba(255,255,255,0.12)',
  boxShadow: '0 4px 24px rgba(0,0,0,0.15), inset 0 1px 0 rgba(255,255,255,0.1)',
}

export const glassStrong = {
  background: 'rgba(255,255,255,0.08)',
  backdropFilter: 'blur(24px) saturate(1.5)',
  WebkitBackdropFilter: 'blur(24px) saturate(1.5)',
  border: '1px solid rgba(255,255,255,0.15)',
  boxShadow: '0 8px 32px rgba(0,0,0,0.2), inset 0 1px 0 rgba(255,255,255,0.12), inset 0 -1px 0 rgba(255,255,255,0.05)',
}

export const glassBadge = {
  ...glass,
  borderRadius: 20,
  padding: '6px 14px',
  fontSize: 15,
  fontWeight: 700,
}

export const bgStyle = {
  minHeight: '100vh',
  background: 'linear-gradient(135deg, #0f0c29 0%, #1a1a3e 30%, #24243e 60%, #0f0c29 100%)',
  fontFamily: "'Nunito', 'Segoe UI', sans-serif",
  color: '#E8ECF4',
  position: 'relative',
  overflow: 'hidden',
}

export const wrapStyle = {
  maxWidth: 480,
  margin: '0 auto',
  padding: '20px 16px 40px',
  position: 'relative',
  zIndex: 1,
}

export const blob = (color, size, top, left, anim, dur) => ({
  position: 'absolute',
  width: size, height: size,
  top, left,
  borderRadius: '50%',
  background: color,
  filter: 'blur(80px)',
  opacity: 0.4,
  animation: `${anim} ${dur}s ease-in-out infinite`,
})

export function BgBlobs() {
  return (
    <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', overflow: 'hidden' }}>
      <div style={blob('radial-gradient(circle,#6C5CE7,#a855f7)', '300px', '10%', '5%', 'blobMove1', 20)} />
      <div style={blob('radial-gradient(circle,#2D9CDB,#06b6d4)', '250px', '50%', '60%', 'blobMove2', 25)} />
      <div style={blob('radial-gradient(circle,#E85D3A,#f97316)', '200px', '70%', '15%', 'blobMove3', 22)} />
    </div>
  )
}
