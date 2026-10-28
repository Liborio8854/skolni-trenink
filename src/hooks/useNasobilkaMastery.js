import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import {
  ensureEntries,
  emptyEntry,
  applyMasteryAnswer,
  mergeMasteryEntries,
  fixedCount,
  progressPct,
  countGoalDays,
  getRewardProgress,
  MASTERY_CONFIG,
} from '../data/nasobilkaMastery'
import { localDateKey } from '../utils/date'
import {
  fetchNasobilkaMastery,
  upsertNasobilkaMasteryEntry,
  fetchNasobilkaDenni,
  fetchNasobilkaDenniAll,
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
      goalDays: daily.goalDays ?? 0,
      tableCelebrationSeen: !!daily.tableCelebrationSeen,
      rewardCelebrationSeen: !!daily.rewardCelebrationSeen,
      // legacy
      celebrationSeen: !!daily.rewardCelebrationSeen || !!daily.tableCelebrationSeen,
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
  const [goalDays, setGoalDays] = useState(() => {
    const local = loadLocal(userId)
    return local?.goalDays || 0
  })
  const [tableCelebrationSeen, setTableCelebrationSeen] = useState(() => {
    const local = loadLocal(userId)
    return !!(local?.tableCelebrationSeen || local?.celebrationSeen)
  })
  const [rewardCelebrationSeen, setRewardCelebrationSeen] = useState(() => {
    const local = loadLocal(userId)
    return !!local?.rewardCelebrationSeen
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
      goalDays,
      tableCelebrationSeen,
      rewardCelebrationSeen,
    })
  }, [entries, dailySuccessful, goalDays, tableCelebrationSeen, rewardCelebrationSeen, userId])

  const syncGoalDaysFromRemote = useCallback(async () => {
    const uid = userIdRef.current
    if (!uid) return
    const rows = await fetchNasobilkaDenniAll(uid)
    if (rows == null) return // offline — nech lokální zálohu

    const today = localDateKey()
    const localToday = localDailyForToday(uid)
    const merged = rows.map(r => ({ ...r }))
    const todayRow = merged.find(r => r.datum === today)
    if (localToday > 0) {
      if (todayRow) {
        todayRow.uspesna_kola = Math.max(todayRow.uspesna_kola || 0, localToday)
      } else {
        merged.push({ datum: today, uspesna_kola: localToday })
      }
    }

    setGoalDays(countGoalDays(merged))
  }, [])

  const syncDailyFromRemote = useCallback(async () => {
    const uid = userIdRef.current
    if (!uid) return
    const today = localDateKey()
    const remote = await fetchNasobilkaDenni(uid, today)
    if (remote == null) return

    const localCount = localDailyForToday(uid)
    if (localCount > remote) {
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
    await syncGoalDaysFromRemote()
  }, [syncGoalDaysFromRemote])

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
    const goal = MASTERY_CONFIG.dailyGoalRounds
    let prevCount = 0
    setDailySuccessful(n => {
      prevCount = n
      return n + 1
    })

    const remoteCount = await incrementNasobilkaKola(today)
    const finalCount = remoteCount != null ? remoteCount : prevCount + 1
    if (remoteCount != null) setDailySuccessful(remoteCount)

    if (prevCount < goal && finalCount >= goal) {
      const rows = await fetchNasobilkaDenniAll(userIdRef.current)
      if (rows == null) {
        setGoalDays(g => g + 1)
      } else {
        await syncGoalDaysFromRemote()
      }
    }
  }, [syncGoalDaysFromRemote])

  const markCelebrationSeen = useCallback((kind) => {
    if (kind === 'reward') setRewardCelebrationSeen(true)
    else if (kind === 'table') setTableCelebrationSeen(true)
    else {
      setTableCelebrationSeen(true)
      setRewardCelebrationSeen(true)
    }
  }, [])

  const fixed = fixedCount(entries)
  const pct = progressPct(entries)
  const reward = useMemo(
    () => getRewardProgress({ fixed, goalDays }),
    [fixed, goalDays],
  )

  const showBigCelebration = (
    (reward.celebrationKind === 'reward' && !rewardCelebrationSeen)
    || (reward.celebrationKind === 'table' && !tableCelebrationSeen && !reward.rewardUnlocked)
  )

  return {
    entries,
    loaded,
    dailySuccessful,
    dailyGoal: MASTERY_CONFIG.dailyGoalRounds,
    goalDays,
    requiredGoalDays: MASTERY_CONFIG.requiredGoalDays,
    fixed,
    pct,
    allFixed: reward.allFixed,
    daysMet: reward.daysMet,
    rewardUnlocked: reward.rewardUnlocked,
    daysRemaining: reward.daysRemaining,
    celebrationKind: showBigCelebration ? reward.celebrationKind : null,
    celebrationMessage: showBigCelebration ? reward.celebrationMessage : null,
    showBigCelebration,
    recordMasteryAnswer,
    recordSuccessfulRound,
    markCelebrationSeen,
    refreshDaily: syncDailyFromRemote,
  }
}
