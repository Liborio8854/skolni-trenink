let audioCtx = null

function getCtx() {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)()
  }
  return audioCtx
}

function playTone(freq, dur, type = 'sine', vol = 0.15) {
  try {
    const ctx = getCtx()
    if (ctx.state === 'suspended') ctx.resume()
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.type = type
    osc.frequency.value = freq
    gain.gain.setValueAtTime(vol, ctx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + dur)
    osc.connect(gain)
    gain.connect(ctx.destination)
    osc.start(ctx.currentTime)
    osc.stop(ctx.currentTime + dur)
  } catch (e) {}
}

export function playCorrect() {
  playTone(523, 0.12, 'sine', 0.13)
  setTimeout(() => playTone(659, 0.12, 'sine', 0.13), 80)
  setTimeout(() => playTone(784, 0.18, 'sine', 0.16), 160)
}

export function playWrong() {
  playTone(330, 0.15, 'square', 0.08)
  setTimeout(() => playTone(262, 0.25, 'square', 0.06), 120)
}

export function playTimeout() {
  playTone(220, 0.3, 'sawtooth', 0.07)
}

export function playResultGreat() {
  ;[523, 659, 784, 1047].forEach((f, i) =>
    setTimeout(() => playTone(f, 0.2, 'sine', 0.13), i * 120)
  )
}

export function playResultOk() {
  ;[523, 659, 784].forEach((f, i) =>
    setTimeout(() => playTone(f, 0.18, 'sine', 0.1), i * 140)
  )
}

export function playResultBad() {
  playTone(392, 0.2, 'sine', 0.1)
  setTimeout(() => playTone(330, 0.3, 'sine', 0.08), 180)
}

// Init audio context on first user interaction
export function initAudio() {
  try {
    const ctx = getCtx()
    if (ctx.state === 'suspended') ctx.resume()
  } catch (e) {}
}
