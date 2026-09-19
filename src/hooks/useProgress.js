import { useState, useEffect, useRef } from 'react'
import { CATS } from '../data/constants'
import { findQuestionById } from '../data/questionBank'
import { getQuestionId } from '../utils/questions'
import { migrateFromLocalStorage } from '../lib/migrate'
import {
  fetchUserProgress,
  fetchErrorLog,
  syncUserProgress,
  insertAnswer,
  upsertErrorLogEntry,
  mergeGameState,
} from '../lib/sync'
import { getCategory } from '../data/categories'

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

function withStreakDecay(p) {
  const today = new Date().toISOString().slice(0, 10)
  const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10)

  if (p.lastActiveDate === today) return p
  if (p.lastActiveDate === yesterday) return { ...p, dailyCorrect: 0 }
  if (p.lastActiveDate) return { ...p, streak: 0, dailyCorrect: 0 }
  return p
}

function errorLogKey(entry) {
  return entry?.question?.id || entry?.questionId || entry?.key || null
}

function findErrorEntry(errorLog, question, key) {
  return errorLog.find(e =>
    e.key === key
    || e.question?.id === key
    || e.questionId === key
    || (question?.category && e.category === question.category && e.display === question.display)
  )
}

function nextErrorLog(errorLog, question, detail) {
  const key = getQuestionId(question)
    || `${question.category}|${question.display}|${question.correct}`
  const existing = findErrorEntry(errorLog, question, key)
  let newLog
  let entry
  if (existing) {
    entry = {
      ...existing,
      key: existing.question?.id || existing.questionId || existing.key || key,
      count: (existing.count || 0) + 1,
      lastSeen: Date.now(),
      detail: detail ?? existing.detail ?? null,
      question: existing.question || snapshotQuestion(question),
    }
    newLog = errorLog.map(e => (e === existing ? entry : e))
  } else {
    entry = {
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
    }
    newLog = [...errorLog, entry]
  }
  if (newLog.length > 100) {
    newLog = newLog.sort((a, b) => b.lastSeen - a.lastSeen).slice(0, 100)
  }
  return { newLog, entry }
}

function mergeErrorLogs(localLog, remoteRows) {
  const map = new Map()
  for (const e of localLog || []) {
    const k = errorLogKey(e)
    if (k) map.set(String(k), e)
  }
  for (const row of remoteRows || []) {
    const id = row.question_id
    if (!id) continue
    const existing = map.get(String(id))
    const lastSeen = row.last_wrong_at ? Date.parse(row.last_wrong_at) : Date.now()
    if (existing) {
      map.set(String(id), {
        ...existing,
        count: Math.max(existing.count || 0, row.wrong_count || 0),
        lastSeen: Math.max(existing.lastSeen || 0, lastSeen || 0),
        detail: row.detail ?? existing.detail ?? null,
      })
    } else {
      const q = findQuestionById(id)
      map.set(String(id), {
        key: id,
        questionId: id,
        display: q?.display,
        correct: q?.correct,
        hint: q?.hint,
        category: q?.category,
        type: q?.type,
        question: q ? snapshotQuestion(q) : null,
        detail: row.detail ?? null,
        count: row.wrong_count || 1,
        lastSeen: lastSeen || Date.now(),
      })
    }
  }
  return [...map.values()]
}

function applyMergedGameState(p, merged) {
  if (!merged) return p
  return {
    ...p,
    stars: Math.max(p.stars || 0, merged.stars || 0),
    coins: Math.max(p.coins || 0, merged.coins || 0),
    streak: Math.max(p.streak || 0, merged.streak_days || 0),
    lastActiveDate: merged.streak_last_day || p.lastActiveDate,
    dailyGoal: merged.daily_goal || p.dailyGoal,
  }
}

export function useProgress(userId) {
  const userIdRef = useRef(userId)
  const shouldSyncRef = useRef(false)

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

  useEffect(() => {
    userIdRef.current = userId
  }, [userId])

  // Save to localStorage whenever progress changes (záloha — nemazat)
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(progress))
    } catch (e) {}
  }, [progress])

  // Check streak on load
  useEffect(() => {
    setProgress(p => {
      const next = withStreakDecay(p)
      return next
    })
  }, [])

  // Migrace + načtení pokroku a chybníku ze Supabase
  useEffect(() => {
    if (!userId) return
    let cancelled = false

    ;(async () => {
      await migrateFromLocalStorage(userId)
      if (cancelled) return

      const [remote, remoteLog] = await Promise.all([
        fetchUserProgress(userId),
        fetchErrorLog(userId),
      ])
      if (cancelled) return

      setProgress(p => {
        const mergedRemote = mergeGameState(p, remote)
        const withGame = applyMergedGameState(p, mergedRemote)
        const withLog = {
          ...withGame,
          errorLog: mergeErrorLogs(p.errorLog, remoteLog),
        }
        return withStreakDecay(withLog)
      })
    })().catch(err => {
      console.warn('Načtení dat ze Supabase selhalo:', err)
    })

    return () => {
      cancelled = true
    }
  }, [userId])

  // Po dokončeném kole odeslat herní stav (lokální je zdroj pravdy, konflikt = max)
  useEffect(() => {
    if (!shouldSyncRef.current || !userId) return
    shouldSyncRef.current = false
    syncUserProgress(userId, progress).then(merged => {
      if (!merged) return
      setProgress(p => {
        const next = applyMergedGameState(p, merged)
        if (
          next.stars === p.stars
          && next.coins === p.coins
          && next.streak === p.streak
          && next.lastActiveDate === p.lastActiveDate
        ) return p
        return next
      })
    })
  }, [progress, userId])

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

  const finishRound = (extraCoins = 0) => {
    shouldSyncRef.current = true
    setProgress(p => ({
      ...p,
      totalRounds: p.totalRounds + 1,
      coins: p.coins + (extraCoins || 0),
    }))
  }

  const addError = (question, detail = null) => {
    if (!question) return
    const { entry } = nextErrorLog(progress.errorLog, question, detail)
    setProgress(p => {
      const next = nextErrorLog(p.errorLog, question, detail)
      return { ...p, errorLog: next.newLog }
    })
    const uid = userIdRef.current
    const qid = getQuestionId(question) || entry.key
    if (uid && qid) {
      upsertErrorLogEntry(uid, {
        question_id: qid,
        wrong_count: entry.count,
        detail: entry.detail ?? null,
      })
    }
  }

  const recordAnswer = (question, evaluation, timeSpentMs) => {
    const uid = userIdRef.current
    if (!uid || !question) return
    const questionId = getQuestionId(question)
    if (!questionId) return

    const prev = findErrorEntry(progress.errorLog, question, questionId)
    const subject = question.subject || getCategory(question.category)?.subject || 'cestina'

    insertAnswer({
      user_id: uid,
      question_id: questionId,
      category: question.category,
      subject,
      correct: !!evaluation?.correct,
      points_earned: evaluation?.pointsEarned ?? 0,
      points_max: evaluation?.pointsMax ?? question.points ?? 1,
      time_spent_ms: Number.isFinite(timeSpentMs) ? Math.round(timeSpentMs) : null,
      attempt_number: (prev?.count || 0) + 1,
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
      if (!Array.isArray(next)) return p
      const all = allCatIds()
      const valid = next.filter(id => all.includes(id))
      // Aspoň jedna kategorie (bez znovu-přidávání „newcomers“ — to jen při loadu)
      if (valid.length === 0) return p
      return { ...p, activeCats: valid }
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
    finishRound,
    addError,
    recordAnswer,
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
