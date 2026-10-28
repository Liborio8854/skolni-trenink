import { useState, useEffect, useRef, useCallback } from 'react'
import {
  ensureEntries,
  emptyEntry,
  applyMasteryAnswer,
  mergeMasteryEntries,
  fixedCount,
  progressPct,
  MASTERY_CONFIG,
} from '../data/nasobilkaMastery'
import { fetchNasobilkaMastery, upsertNasobilkaMasteryEntry } from '../lib/sync'

const LOCAL_KEY = 'skolni-trenink-nasobilka-mastery'

function todayKey() {
  return new Date().toISOString().slice(0, 10)
}

function loadLocal(userId) {
  try {
    const raw = localStorage.getItem(LOCAL_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw)
    if (userId && parsed.userId && parsed.userId !== userId) return null
    return parsed
  } catch {
    return null
  }
}

function saveLocal(userId, entries, daily) {
  try {
    localStorage.setItem(LOCAL_KEY, JSON.stringify({
      userId: userId || null,
      entries,
      dailySuccessful: daily.count,
      dailyDate: daily.date,
      celebrationSeen: daily.celebrationSeen || false,
    }))
  } catch { /* ignore */ }
}

export function useNasobilkaMastery(userId) {
  const userIdRef = useRef(userId)
  const [entries, setEntries] = useState(() => {
    const local = loadLocal(userId)
    return ensureEntries(local?.entries || {})
  })
  const entriesRef = useRef(entries)
  const [dailySuccessful, setDailySuccessful] = useState(() => {
    const local = loadLocal(userId)
    if (local?.dailyDate === todayKey()) return local.dailySuccessful || 0
    return 0
  })
  const [celebrationSeen, setCelebrationSeen] = useState(() => {
    const local = loadLocal(userId)
    return !!local?.celebrationSeen
  })
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    userIdRef.current = userId
  }, [userId])

  useEffect(() => {
    entriesRef.current = entries
  }, [entries])

  useEffect(() => {
    saveLocal(userId, entries, {
      count: dailySuccessful,
      date: todayKey(),
      celebrationSeen,
    })
  }, [entries, dailySuccessful, celebrationSeen, userId])

  useEffect(() => {
    if (!userId) {
      setLoaded(true)
      return
    }
    let cancelled = false
    ;(async () => {
      const remote = await fetchNasobilkaMastery(userId)
      if (cancelled) return
      setEntries(prev => {
        const merged = mergeMasteryEntries(prev, remote)
        entriesRef.current = merged
        return merged
      })
      setLoaded(true)
    })().catch(err => {
      console.warn('Načtení mastery selhalo:', err)
      if (!cancelled) setLoaded(true)
    })
    return () => { cancelled = true }
  }, [userId])

  useEffect(() => {
    const local = loadLocal(userId)
    if (local?.dailyDate && local.dailyDate !== todayKey()) {
      setDailySuccessful(0)
    }
  }, [userId])

  const recordMasteryAnswer = useCallback((question, { correct, ms }) => {
    if (!question?.masteryKey) return { newlyFixed: false, entry: null }

    const cur = entriesRef.current[question.masteryKey] || emptyEntry(question.masteryKey)
    const { entry, newlyFixed } = applyMasteryAnswer(cur, {
      correct,
      ms,
      shownA: question.shownA,
      shownB: question.shownB,
    })
    const next = { ...entriesRef.current, [question.masteryKey]: entry }
    entriesRef.current = next
    setEntries(next)

    const uid = userIdRef.current
    if (uid) upsertNasobilkaMasteryEntry(uid, entry)

    return { newlyFixed, entry }
  }, [])

  const recordSuccessfulRound = useCallback(() => {
    setDailySuccessful(n => n + 1)
  }, [])

  const markCelebrationSeen = useCallback(() => {
    setCelebrationSeen(true)
  }, [])

  const fixed = fixedCount(entries)
  const pct = progressPct(entries)
  const allFixed = fixed >= MASTERY_CONFIG.totalExamples
  const showBigCelebration = allFixed && !celebrationSeen

  return {
    entries,
    loaded,
    dailySuccessful,
    dailyGoal: MASTERY_CONFIG.dailyGoalRounds,
    fixed,
    pct,
    allFixed,
    showBigCelebration,
    recordMasteryAnswer,
    recordSuccessfulRound,
    markCelebrationSeen,
  }
}
