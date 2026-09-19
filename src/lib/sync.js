import { supabase, TABLES } from './supabase'

/**
 * Sloučí herní stav: lokální je zdroj pravdy, při konfliktu bereme vyšší hodnotu.
 * local: { stars, coins, streak, lastActiveDate, dailyGoal }
 * remote: řádek st_user_progress nebo null
 */
export function mergeGameState(local, remote) {
  const localStars = local?.stars || 0
  const localCoins = local?.coins || 0
  const localStreak = local?.streak || 0
  const localDay = local?.lastActiveDate || local?.lastDay || null
  const localGoal = local?.dailyGoal || 30

  if (!remote) {
    return {
      stars: localStars,
      coins: localCoins,
      streak_days: localStreak,
      streak_last_day: localDay,
      daily_goal: localGoal,
    }
  }

  const { streak, lastActiveDate } = pickStreak(
    { streak: localStreak, lastActiveDate: localDay },
    { streak: remote.streak_days || 0, lastActiveDate: remote.streak_last_day || null },
  )

  return {
    stars: Math.max(localStars, remote.stars || 0),
    coins: Math.max(localCoins, remote.coins || 0),
    streak_days: streak,
    streak_last_day: lastActiveDate,
    daily_goal: Math.max(localGoal, remote.daily_goal || 0) || 30,
  }
}

function pickStreak(local, remote) {
  const ld = local.lastActiveDate
  const rd = remote.lastActiveDate
  if (!rd && !ld) {
    return { streak: Math.max(local.streak, remote.streak), lastActiveDate: null }
  }
  if (!rd) return { streak: local.streak, lastActiveDate: ld }
  if (!ld) return { streak: remote.streak, lastActiveDate: rd }
  if (rd > ld) return { streak: remote.streak, lastActiveDate: rd }
  if (ld > rd) return { streak: local.streak, lastActiveDate: ld }
  return { streak: Math.max(local.streak, remote.streak), lastActiveDate: ld }
}

export async function fetchUserProgress(userId) {
  if (!userId) return null
  const { data, error } = await supabase
    .from(TABLES.userProgress)
    .select('*')
    .eq('user_id', userId)
    .maybeSingle()
  if (error) {
    console.warn('Načtení st_user_progress selhalo:', error.message)
    return null
  }
  return data
}

/** Po dokončeném kole: načti remote, vem max, upsert. Vrací sloučený stav (snake_case). */
export async function syncUserProgress(userId, localProgress) {
  if (!userId) return null
  try {
    const remote = await fetchUserProgress(userId)
    const merged = mergeGameState(localProgress, remote)
    const { error } = await supabase.from(TABLES.userProgress).upsert({
      user_id: userId,
      ...merged,
      updated_at: new Date().toISOString(),
    })
    if (error) {
      console.warn('Uložení st_user_progress selhalo:', error.message)
      return null
    }
    return merged
  } catch (err) {
    console.warn('Uložení st_user_progress selhalo:', err)
    return null
  }
}

export async function insertAnswer(row) {
  if (!row?.user_id || !row?.question_id) return { error: true }
  try {
    const { error } = await supabase.from(TABLES.answers).insert({
      user_id: row.user_id,
      question_id: row.question_id,
      category: row.category,
      subject: row.subject,
      correct: !!row.correct,
      points_earned: row.points_earned ?? 0,
      points_max: row.points_max ?? 1,
      time_spent_ms: row.time_spent_ms ?? null,
      attempt_number: row.attempt_number || 1,
    })
    if (error) {
      console.warn('Uložení st_answers selhalo:', error.message)
      return { error }
    }
    return { error: null }
  } catch (err) {
    console.warn('Uložení st_answers selhalo:', err)
    return { error: err }
  }
}

export async function fetchErrorLog(userId) {
  if (!userId) return []
  const { data, error } = await supabase
    .from(TABLES.errorLog)
    .select('*')
    .eq('resolved', false)
  if (error) {
    console.warn('Načtení st_error_log selhalo:', error.message)
    return []
  }
  return data || []
}

export async function upsertErrorLogEntry(userId, entry) {
  if (!userId || !entry?.question_id) return
  try {
    const { data: existing, error: fetchError } = await supabase
      .from(TABLES.errorLog)
      .select('wrong_count, detail')
      .eq('question_id', entry.question_id)
      .maybeSingle()
    if (fetchError) {
      console.warn('Načtení st_error_log selhalo:', fetchError.message)
    }

    const wrongCount = Math.max(entry.wrong_count || 1, existing?.wrong_count || 0)
    const { error } = await supabase.from(TABLES.errorLog).upsert(
      {
        user_id: userId,
        question_id: entry.question_id,
        wrong_count: wrongCount,
        last_wrong_at: new Date().toISOString(),
        resolved: false,
        detail: entry.detail ?? existing?.detail ?? null,
      },
      { onConflict: 'user_id,question_id' },
    )
    if (error) {
      console.warn('Uložení st_error_log selhalo:', error.message)
    }
  } catch (err) {
    console.warn('Uložení st_error_log selhalo:', err)
  }
}
