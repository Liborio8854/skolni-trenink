import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!url || !anonKey) {
  console.warn(
    'Chybí VITE_SUPABASE_URL nebo VITE_SUPABASE_ANON_KEY. Zkopíruj .env.example → .env a doplň hodnoty.'
  )
}

export const supabase = createClient(url || '', anonKey || '')

/** Tabulky v Supabase mají prefix st_ (sdílený projekt). */
export const TABLES = {
  answers: 'st_answers',
  userProgress: 'st_user_progress',
  errorLog: 'st_error_log',
}
