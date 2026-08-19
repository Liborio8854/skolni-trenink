import { useState, useEffect } from 'react'
 
const STORAGE_KEY = 'skolni-trenink'
 
const defaultState = {
  stars: 0,
  coins: 0,
  streak: 0,
  lastActiveDate: null,
  dailyCorrect: 0,
  dailyGoal: 30,
  difficulty: 'advanced',
  errorLog: [],
  totalRounds: 0,
  totalCorrect: 0,
  totalAnswered: 0,
  // Time tracking: { "2026-08-12": 345 } (seconds per day)
  dailyTime: {},
  sessionStart: null,
}
 
export function useProgress() {
  const [progress, setProgress] = useState(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) {
        const parsed = JSON.parse(stored)
        return { ...defaultState, ...parsed }
      }
    } catch (e) {}
    return { ...defaultState }
  })
 
  // Save to localStorage whenever progress changes
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(progress))
    } catch (e) {}
  }, [progress])
 
  // Check streak on load
  useEffect(() => {
    const today = new Date().toISOString().slice(0, 10)
    const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10)
 
    if (progress.lastActiveDate === today) {
      return
    }
 
    if (progress.lastActiveDate === yesterday) {
      setProgress(p => ({ ...p, dailyCorrect: 0 }))
    } else if (progress.lastActiveDate && progress.lastActiveDate !== today) {
      setProgress(p => ({ ...p, streak: 0, dailyCorrect: 0 }))
    }
  }, [])
 
  const addCorrect = (earnedStars, earnedCoins) => {
    const today = new Date().toISOString().slice(0, 10)
    setProgress(p => {
      const newDailyCorrect = p.dailyCorrect + 1
      const wasGoalMet = p.dailyCorrect >= p.dailyGoal
      const isGoalMet = newDailyCorrect >= p.dailyGoal
      const streakInc = (!wasGoalMet && isGoalMet && p.lastActiveDate !== today) ? 1 : 0
 
      return {
        ...p,
        stars: p.stars + earnedStars,
        coins: p.coins + earnedCoins,
        dailyCorrect: newDailyCorrect,
        totalCorrect: p.totalCorrect + 1,
        totalAnswered: p.totalAnswered + 1,
        streak: p.streak + streakInc,
        lastActiveDate: today,
      }
    })
  }
 
  const addWrong = () => {
    const today = new Date().toISOString().slice(0, 10)
    setProgress(p => ({
      ...p,
      totalAnswered: p.totalAnswered + 1,
      lastActiveDate: today,
    }))
  }
 
  const addRound = () => {
    setProgress(p => ({ ...p, totalRounds: p.totalRounds + 1 }))
  }
 
  const addError = (question) => {
    if (!question) return
    setProgress(p => {
      const key = question.display + '|' + question.correct
      const existing = p.errorLog.find(e => e.key === key)
      let newLog
      if (existing) {
        newLog = p.errorLog.map(e =>
          e.key === key ? { ...e, count: e.count + 1, lastSeen: Date.now() } : e
        )
      } else {
        newLog = [...p.errorLog, {
          key,
          display: question.display,
          correct: question.correct,
          hint: question.hint,
          type: question.type,
          count: 1,
          lastSeen: Date.now(),
        }]
      }
      if (newLog.length > 100) {
        newLog = newLog.sort((a, b) => b.lastSeen - a.lastSeen).slice(0, 100)
      }
      return { ...p, errorLog: newLog }
    })
  }
 
  const setDifficulty = (d) => {
    setProgress(p => ({ ...p, difficulty: d }))
  }
 
  const spendCoins = (amount) => {
    if (progress.coins < amount) return false
    setProgress(p => ({ ...p, coins: p.coins - amount }))
    return true
  }
 
  // Time tracking
  const MAX_SESSION = 15 * 60 // Max 15 minutes per session
 
  const saveSessionTime = (p) => {
    if (!p.sessionStart) return p
    const elapsed = Math.min(Math.round((Date.now() - p.sessionStart) / 1000), MAX_SESSION)
    if (elapsed < 2) return { ...p, sessionStart: null } // Ignore tiny sessions
    const today = new Date().toISOString().slice(0, 10)
    const prevTime = p.dailyTime[today] || 0
    return {
      ...p,
      sessionStart: null,
      dailyTime: { ...p.dailyTime, [today]: prevTime + elapsed },
    }
  }
 
  // On load: recover any stale session (app was closed mid-round)
  useEffect(() => {
    if (progress.sessionStart) {
      setProgress(p => saveSessionTime(p))
    }
  }, [])
 
  // Auto-save when user leaves the page or switches apps
  useEffect(() => {
    const handleVisibility = () => {
      if (document.visibilityState === 'hidden') {
        setProgress(p => {
          if (!p.sessionStart) return p
          const saved = saveSessionTime(p)
          try { localStorage.setItem(STORAGE_KEY, JSON.stringify(saved)) } catch(e) {}
          return saved
        })
      }
    }
 
    const handleBeforeUnload = () => {
      const p = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}')
      if (p.sessionStart) {
        const saved = saveSessionTime(p)
        try { localStorage.setItem(STORAGE_KEY, JSON.stringify(saved)) } catch(e) {}
      }
    }
 
    document.addEventListener('visibilitychange', handleVisibility)
    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => {
      document.removeEventListener('visibilitychange', handleVisibility)
      window.removeEventListener('beforeunload', handleBeforeUnload)
    }
  }, [])
 
  const startSession = () => {
    setProgress(p => ({ ...p, sessionStart: Date.now() }))
  }
 
  const endSession = () => {
    setProgress(p => saveSessionTime(p))
  }
 
  const getTodayTime = () => {
    const today = new Date().toISOString().slice(0, 10)
    return progress.dailyTime[today] || 0
  }
 
  const getWeekTime = () => {
    const now = new Date()
    let total = 0
    for (let i = 0; i < 7; i++) {
      const d = new Date(now)
      d.setDate(d.getDate() - i)
      const key = d.toISOString().slice(0, 10)
      total += progress.dailyTime[key] || 0
    }
    return total
  }
 
  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60)
    const s = seconds % 60
    if (m === 0) return `${s}s`
    return `${m}m ${s}s`
  }
 
  const resetProgress = () => {
    setProgress({ ...defaultState })
  }
 
  return {
    progress,
    addCorrect,
    addWrong,
    addRound,
    addError,
    setDifficulty,
    spendCoins,
    startSession,
    endSession,
    getTodayTime,
    getWeekTime,
    formatTime,
    resetProgress,
  }
}
 
