import { useState, useEffect } from 'react'
import { CATS } from '../data/constants'
 
const STORAGE_KEY = 'skolni-trenink'

function snapshotQuestion(question) {
  if (!question) return null
  const {
    fromErrorLog,
    errorDetail,
    ...rest
  } = question
  return JSON.parse(JSON.stringify(rest))
}

function allCatIds() {
  return CATS.map(c => c.id)
}

/** Obnoví výběr kategorií: platné ID, aspoň jedna; nové kategorie přibydou jako vybrané. */
export function resolveActiveCats(stored) {
  const all = allCatIds()
  if (!Array.isArray(stored) || stored.length === 0) return all
  const valid = stored.filter(id => all.includes(id))
  if (valid.length === 0) return all
  const newcomers = all.filter(id => !stored.includes(id))
  return [...valid, ...newcomers]
}
 
const defaultState = {
  stars: 0,
  coins: 0,
  streak: 0,
  lastActiveDate: null,
  dailyCorrect: 0,
  dailyGoal: 30,
  difficulty: 'advanced', // uchováno pro případný návrat UI
  activeCats: allCatIds(),
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
        const merged = { ...defaultState, ...parsed }
        merged.activeCats = resolveActiveCats(parsed.activeCats)
        // difficulty v progress necháme (pro budoucí UI), runtime ji nepoužíváme k filtraci
        if (!merged.difficulty) merged.difficulty = 'advanced'
        return merged
      }
    } catch (e) {}
    return { ...defaultState, activeCats: allCatIds() }
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
 
  const addError = (question, detail = null) => {
    if (!question) return
    setProgress(p => {
      const key = question.id
        || `${question.category}|${question.display}|${question.correct}`
      const existing = p.errorLog.find(e => e.key === key)
      let newLog
      if (existing) {
        newLog = p.errorLog.map(e =>
          e.key === key
            ? {
                ...e,
                count: e.count + 1,
                lastSeen: Date.now(),
                detail: detail ?? e.detail ?? null,
                question: e.question || snapshotQuestion(question),
              }
            : e
        )
      } else {
        newLog = [...p.errorLog, {
          key,
          display: question.display,
          correct: question.correct,
          hint: question.hint,
          category: question.category,
          type: question.type,
          question: snapshotQuestion(question),
          detail: detail || null,
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

  const setActiveCats = (catsOrUpdater) => {
    setProgress(p => {
      const next = typeof catsOrUpdater === 'function'
        ? catsOrUpdater(p.activeCats)
        : catsOrUpdater
      const resolved = resolveActiveCats(next)
      // Aspoň jedna kategorie
      if (resolved.length === 0) return p
      return { ...p, activeCats: resolved }
    })
  }

  const addCoins = (amount) => {
    if (!amount) return
    setProgress(p => ({ ...p, coins: p.coins + amount }))
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
 
  // On load: discard any stale session (app was closed mid-round, unknown success rate)
  useEffect(() => {
    if (progress.sessionStart) {
      setProgress(p => ({ ...p, sessionStart: null }))
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
 
  const discardSession = () => {
    setProgress(p => ({ ...p, sessionStart: null }))
  }
 
  const resetProgress = () => {
    setProgress({ ...defaultState, activeCats: allCatIds() })
  }
 
  return {
    progress,
    addCorrect,
    addWrong,
    addRound,
    addError,
    addCoins,
    setDifficulty,
    setActiveCats,
    spendCoins,
    startSession,
    endSession,
    discardSession,
    getTodayTime,
    getWeekTime,
    formatTime,
    resetProgress,
  }
}
 
