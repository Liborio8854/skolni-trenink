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
import { localDateKey } from '../utils/date'
import {
  fetchNasobilkaMastery,
  upsertNasobilkaMasteryEntry,
  fetchNasobilkaDenni,
  incrementNasobilkaKola,
} from '../lib/sync'

const LOCAL_KEY = 'skolni-trenink-nasobilka-mastery'

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

function localDailyForToday(userId) {
  const local = loadLocal(userId)
  const today = localDateKey()
  if (local?.dailyDate === today) return local.dailySuccessful || 0
  return 0
}

export function useNasobilkaMastery(userId) {
  const userIdRef = useRef(userId)
  const [entries, setEntries] = useState(() => {
    const local = loadLocal(userId)
    return ensureEntries(local?.entries || {})
  })
  const entriesRef = useRef(entries)
  const [dailySuccessful, setDailySuccessful] = useState(() => localDailyForToday(userId))
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
      date: localDateKey(),
      celebrationSeen,
    })
  }, [entries, dailySuccessful, celebrationSeen, userId])

  const syncDailyFromRemote = useCallback(async () => {
    const uid = userIdRef.current
    if (!uid) return
    const today = localDateKey()
    const remote = await fetchNasobilkaDenni(uid, today)
    if (remote == null) return // offline / chyba — nech lokální zálohu

    const localCount = localDailyForToday(uid)
    if (localCount > remote) {
      // Doženeme offline přírůstky atomickými +1
      let current = remote
      for (let i = 0; i < localCount - remote; i++) {
        const next = await incrementNasobilkaKola(today)
        if (next == null) break
        current = next
      }
      setDailySuccessful(Math.max(current, localCount))
    } else {
      setDailySuccessful(remote)
    }
  }, [])

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
      await syncDailyFromRemote()
      if (!cancelled) setLoaded(true)
    })().catch(err => {
      console.warn('Načtení mastery selhalo:', err)
      if (!cancelled) setLoaded(true)
    })
    return () => { cancelled = true }
  }, [userId, syncDailyFromRemote])

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

  const recordSuccessfulRound = useCallback(async () => {
    const today = localDateKey()
    setDailySuccessful(n => n + 1) // optimisticky + lokální záloha

    const remoteCount = await incrementNasobilkaKola(today)
    if (remoteCount != null) {
      setDailySuccessful(remoteCount)
    }
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
    refreshDaily: syncDailyFromRemote,
  }
}
