import { useState } from 'react'
import { glassStrong, bgStyle, wrapStyle, BgBlobs } from '../utils/styles'

export default function AuthScreen({ onSignIn, onSignUp, error, busy }) {
  const [mode, setMode] = useState('login') // 'login' | 'register'
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!email.trim() || !password) return
    setSubmitting(true)
    try {
      if (mode === 'login') {
        await onSignIn(email.trim(), password)
      } else {
        await onSignUp(email.trim(), password)
      }
    } finally {
      setSubmitting(false)
    }
  }

  const disabled = submitting || busy

  return (
    <div style={bgStyle}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Nunito:wght@400;600;700;800;900&display=swap');
        *{box-sizing:border-box;margin:0;padding:0}
        button{font-family:'Nunito',sans-serif}
        input{font-family:'Nunito',sans-serif}
      `}</style>
      <BgBlobs />
      <div style={wrapStyle}>
        <div style={{
          fontSize: 30, fontWeight: 900, textAlign: 'center', marginBottom: 4, marginTop: 40,
          background: 'linear-gradient(135deg,#FFD166,#FF6B35 50%,#EF476F)',
          WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
          letterSpacing: -0.5,
        }}>Školní Trénink</div>
        <div style={{ fontSize: 14, color: '#8892A8', textAlign: 'center', marginBottom: 28 }}>
          {mode === 'login' ? 'Přihlas se ke svému účtu' : 'Vytvoř si nový účet'}
        </div>

        <form
          onSubmit={handleSubmit}
          style={{
            ...glassStrong,
            borderRadius: 20,
            padding: '24px 20px',
          }}
        >
          <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: '#8892A8', marginBottom: 6 }}>
            E-mail
          </label>
          <input
            type="email"
            autoComplete="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            disabled={disabled}
            required
            style={{
              width: '100%',
              padding: '14px 16px',
              borderRadius: 14,
              border: '1px solid rgba(255,255,255,.15)',
              background: 'rgba(0,0,0,.25)',
              color: '#E8ECF4',
              fontSize: 16,
              marginBottom: 16,
              outline: 'none',
            }}
          />

          <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: '#8892A8', marginBottom: 6 }}>
            Heslo
          </label>
          <input
            type="password"
            autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
            value={password}
            onChange={e => setPassword(e.target.value)}
            disabled={disabled}
            required
            minLength={6}
            style={{
              width: '100%',
              padding: '14px 16px',
              borderRadius: 14,
              border: '1px solid rgba(255,255,255,.15)',
              background: 'rgba(0,0,0,.25)',
              color: '#E8ECF4',
              fontSize: 16,
              marginBottom: 20,
              outline: 'none',
            }}
          />

          {error && (
            <div style={{
              marginBottom: 16,
              padding: '10px 14px',
              borderRadius: 12,
              background: 'rgba(239,68,68,.15)',
              border: '1px solid rgba(239,68,68,.35)',
              color: '#FCA5A5',
              fontSize: 13,
              fontWeight: 600,
            }}>
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={disabled}
            style={{
              width: '100%',
              padding: 16,
              borderRadius: 16,
              border: '1px solid rgba(255,209,102,.3)',
              fontSize: 17,
              fontWeight: 900,
              cursor: disabled ? 'default' : 'pointer',
              background: 'linear-gradient(135deg,rgba(255,209,102,.25),rgba(255,107,53,.2))',
              color: '#FFD166',
              opacity: disabled ? 0.6 : 1,
            }}
          >
            {disabled ? 'Počkej…' : mode === 'login' ? 'Přihlásit se' : 'Registrovat'}
          </button>

          <button
            type="button"
            disabled={disabled}
            onClick={() => setMode(m => m === 'login' ? 'register' : 'login')}
            style={{
              width: '100%',
              marginTop: 14,
              padding: 10,
              border: 'none',
              background: 'transparent',
              color: '#8892A8',
              fontSize: 14,
              fontWeight: 700,
              cursor: disabled ? 'default' : 'pointer',
            }}
          >
            {mode === 'login' ? 'Nemáš účet? Registruj se' : 'Už máš účet? Přihlas se'}
          </button>
        </form>
      </div>
    </div>
  )
}
