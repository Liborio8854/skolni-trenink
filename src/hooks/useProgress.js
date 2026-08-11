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
  errorLog: [],       // [{question, correct, type, count, lastSeen}]
  totalRounds: 0,
  totalCorrect: 0,
  totalAnswered: 0,
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
      // Already active today, do nothing
      return
    }

    if (progress.lastActiveDate === yesterday) {
      // Continue streak, reset daily counter
      setProgress(p => ({ ...p, dailyCorrect: 0 }))
    } else if (progress.lastActiveDate && progress.lastActiveDate !== today) {
      // Streak broken (more than 1 day gap)
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
      // Keep only last 100 errors
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
    resetProgress,
  }
}
