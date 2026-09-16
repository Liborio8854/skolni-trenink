import { supabase } from './supabase'

const MIGRATED_KEY = 'migrated_to_supabase'
const APP_STORAGE_KEY = 'skolni-trenink'

/**
 * Jednorázová migrace herního stavu a chybníku z localStorage do Supabase (tabulky st_*).
 * Nemáže lokální data — podle docs/05-supabase.md.
 */
export async function migrateFromLocalStorage(userId) {
  if (!userId) return
  if (localStorage.getItem(MIGRATED_KEY)) return

  let progress = {}
  let errorLog = []

  try {
    const appStored = JSON.parse(localStorage.getItem(APP_STORAGE_KEY) || '{}')
    if (appStored && typeof appStored === 'object') {
      progress = appStored
      errorLog = Array.isArray(appStored.errorLog) ? appStored.errorLog : []
    }
  } catch {
    // ignore parse errors
  }

  // Spec fallback (starší / oddělené klíče)
  if (!progress.stars && !progress.coins) {
    try {
      const legacy = JSON.parse(localStorage.getItem('progress') || '{}')
      if (legacy && typeof legacy === 'object') progress = { ...legacy, ...progress }
    } catch { /* ignore */ }
  }
  if (errorLog.length === 0) {
    try {
      const legacyLog = JSON.parse(localStorage.getItem('errorLog') || '[]')
      if (Array.isArray(legacyLog)) errorLog = legacyLog
    } catch { /* ignore */ }
  }

  if (progress.stars || progress.coins || progress.streak) {
    const { error } = await supabase.from('st_user_progress').upsert({
      user_id: userId,
      stars: progress.stars || 0,
      coins: progress.coins || 0,
      streak_days: progress.streak || 0,
      streak_last_day: progress.lastActiveDate || progress.lastDay || null,
    })
    if (error) {
      console.warn('Migrace st_user_progress selhala:', error.message)
      return // neoznačovat jako hotové — zkusit příště
    }
  }

  if (errorLog.length > 0) {
    const rows = errorLog
      .map(e => {
        const questionId = e.questionId || e.question?.id || null
        if (!questionId) return null
        return {
          user_id: userId,
          question_id: questionId,
          wrong_count: e.wrong_count || e.count || 1,
          detail: e.detail ?? null,
        }
      })
      .filter(Boolean)

    if (rows.length > 0) {
      const { error } = await supabase
        .from('st_error_log')
        .upsert(rows, { onConflict: 'user_id,question_id' })
      if (error) {
        // FK může selhat, dokud nejsou nahrané otázky — progress už je OK
        console.warn('Migrace st_error_log selhala:', error.message)
      }
    }
  }

  localStorage.setItem(MIGRATED_KEY, '1')
}
