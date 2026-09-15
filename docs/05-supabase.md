# Supabase — databáze a synchronizace

## Proč a kdy

**Proč:** Eda trénuje na telefonu, tabletu i počítači. Bez synchronizace by měl na každém zařízení jinou historii, jiný chybník a jinou sérii.

**Kdy:** Napojit **před plněním obsahu**. Jakmile bude v localStorage 400 otázek a několik týdnů historie, migrace je zbytečná práce navíc.

---

## Tabulky

### `questions` — banka otázek

```sql
create table questions (
  id text primary key,
  subject text not null,
  category text not null,
  type text not null,
  difficulty text not null,
  points integer not null default 1,
  source_text text,
  payload jsonb not null,
  explanation text,
  enabled boolean not null default true,
  created_at timestamptz not null default now()
);

create index questions_category_idx on questions(category, difficulty) where enabled;
create index questions_subject_idx on questions(subject) where enabled;
```

**Poznámka k `payload jsonb`:** Struktura se liší podle typu úlohy. JSONB je tady správná volba — umožňuje přidat nový typ bez migrace schématu.

### `categories` — definice kategorií

```sql
create table categories (
  slug text primary key,
  subject text not null,
  name text not null,
  description text,
  icon text,
  phase integer not null default 1,
  cermat_weight integer,
  enabled boolean not null default true,
  sort_order integer not null default 0
);
```

### `answers` — historie odpovědí

```sql
create table answers (
  id bigserial primary key,
  user_id uuid not null references auth.users(id),
  question_id text not null references questions(id),
  category text not null,
  subject text not null,
  correct boolean not null,
  points_earned integer not null,
  points_max integer not null,
  time_spent_ms integer,
  attempt_number integer not null default 1,
  answered_at timestamptz not null default now()
);

create index answers_user_time_idx on answers(user_id, answered_at desc);
create index answers_user_category_idx on answers(user_id, category);
```

**Toto je jediná tabulka, která roste.** Za rok přípravy to bude řádově 10–15 tisíc řádků. Bez problému.

### `user_progress` — herní stav

```sql
create table user_progress (
  user_id uuid primary key references auth.users(id),
  stars integer not null default 0,
  coins integer not null default 0,
  streak_days integer not null default 0,
  streak_last_day date,
  streak_freezes integer not null default 0,
  daily_goal integer not null default 20,
  current_phase integer not null default 1,
  paused_until date,
  updated_at timestamptz not null default now()
);
```

### `error_log` — chybník

```sql
create table error_log (
  id bigserial primary key,
  user_id uuid not null references auth.users(id),
  question_id text not null references questions(id),
  wrong_count integer not null default 1,
  last_wrong_at timestamptz not null default now(),
  resolved boolean not null default false,
  detail jsonb,                    -- která podúloha byla špatně (pro A/N svazky)
  unique(user_id, question_id)
);

create index error_log_active_idx on error_log(user_id) where not resolved;
```

**Pole `detail`:** U A/N svazků a multi-odpovědí si pamatovat, která konkrétní podúloha byla špatně. Při opakování ji zvýraznit.

### `weak_spot_flags` — ruční označení po papírovém testu

```sql
create table weak_spot_flags (
  id bigserial primary key,
  user_id uuid not null references auth.users(id),
  category text not null references categories(slug),
  note text,
  flagged_at timestamptz not null default now(),
  expires_at timestamptz not null
);

create index weak_spot_active_idx on weak_spot_flags(user_id, expires_at);
```

---

## Autentizace

**Doporučení: e-mail + heslo, bez potvrzovacího e-mailu.**

Appku používá jedno dítě a jeden rodič. Není potřeba OAuth ani magic linky. V Supabase vypnout "Confirm email" — jinak by Eda po registraci čekal na e-mail, který nemá kde otevřít.

Pokud později přibudou spolužáci, model už to unese — každý má svůj účet, data jsou oddělená přes RLS.

### Row Level Security

Zapnout na všech tabulkách s uživatelskými daty.

```sql
alter table answers enable row level security;
alter table user_progress enable row level security;
alter table error_log enable row level security;
alter table weak_spot_flags enable row level security;

create policy "vlastni_odpovedi" on answers
  for all using (auth.uid() = user_id);

create policy "vlastni_pokrok" on user_progress
  for all using (auth.uid() = user_id);

create policy "vlastni_chybnik" on error_log
  for all using (auth.uid() = user_id);

create policy "vlastni_slaba_mista" on weak_spot_flags
  for all using (auth.uid() = user_id);
```

Otázky a kategorie jsou společné, jen ke čtení:

```sql
alter table questions enable row level security;
alter table categories enable row level security;

create policy "cteni_otazek" on questions
  for select using (true);

create policy "cteni_kategorii" on categories
  for select using (true);
```

Zápis do `questions` dělat přes Supabase dashboard nebo skriptem se service key, ne z appky.

---

## Offline režim

**Toto je důležité.** Eda může trénovat na telefonu bez signálu (cestou, na chatě). Appka musí fungovat offline.

### Strategie

1. **Otázky cachovat lokálně.** Při startu stáhnout banku otázek pro aktivní kategorie a uložit do IndexedDB nebo localStorage. Refresh jednou za čas, ne při každém spuštění.

2. **Odpovědi ukládat lokálně, synchronizovat na pozadí.** Když je offline, odpovědi jdou do fronty. Při obnovení připojení se odešlou.

```javascript
// Zjednodušený princip
async function saveAnswer(answer) {
  // Vždy nejdřív lokálně
  await localDb.answers.add({ ...answer, synced: false });
  updateLocalProgress(answer);
  
  // Pokus o odeslání
  if (navigator.onLine) {
    try {
      await supabase.from('answers').insert(answer);
      await localDb.answers.update(answer.id, { synced: true });
    } catch (e) {
      // Zůstane ve frontě, odešle se později
    }
  }
}

async function syncPending() {
  const pending = await localDb.answers.where('synced').equals(false).toArray();
  if (pending.length === 0) return;
  
  const { error } = await supabase.from('answers').insert(pending);
  if (!error) {
    await localDb.answers.where('synced').equals(false).modify({ synced: true });
  }
}

window.addEventListener('online', syncPending);
```

3. **Herní stav (mince, hvězdy, streak) řešit lokálně jako zdroj pravdy**, na server posílat po každém dokončeném kole. Při konfliktu (trénoval na dvou zařízeních) brát vyšší hodnotu.

---

## Migrace ze localStorage

Jednorázový krok při prvním přihlášení.

```javascript
async function migrateFromLocalStorage(userId) {
  const migrated = localStorage.getItem('migrated_to_supabase');
  if (migrated) return;
  
  const progress = JSON.parse(localStorage.getItem('progress') || '{}');
  const errorLog = JSON.parse(localStorage.getItem('errorLog') || '[]');
  
  if (progress.stars || progress.coins) {
    await supabase.from('user_progress').upsert({
      user_id: userId,
      stars: progress.stars || 0,
      coins: progress.coins || 0,
      streak_days: progress.streak || 0,
      streak_last_day: progress.lastDay || null
    });
  }
  
  if (errorLog.length > 0) {
    await supabase.from('error_log').upsert(
      errorLog.map(e => ({
        user_id: userId,
        question_id: e.questionId,
        wrong_count: e.count || 1
      }))
    );
  }
  
  localStorage.setItem('migrated_to_supabase', '1');
}
```

**Nemazat localStorage po migraci** — pokud by se něco pokazilo, je z čeho obnovit. Smazat až po několika týdnech provozu.

---

## Import otázek

Otázky nepsat ručně do dashboardu. Připravit skript, který nahraje JSON soubor.

```javascript
// scripts/import-questions.js
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY   // service key, ne anon!
);

const questions = JSON.parse(fs.readFileSync(process.argv[2], 'utf-8'));

const rows = questions.map(q => ({
  id: q.id,
  subject: q.subject,
  category: q.category,
  type: q.type,
  difficulty: q.difficulty,
  points: q.points,
  source_text: q.sourceText || null,
  payload: q.payload,
  explanation: q.explanation || null
}));

const { error } = await supabase.from('questions').upsert(rows);
console.log(error ? `Chyba: ${error.message}` : `Nahráno ${rows.length} otázek.`);
```

Spuštění: `node scripts/import-questions.js data/pravopis-iy.json`

**Service key nikdy nedávat do frontendu ani do gitu.** Držet v `.env`, který je v `.gitignore`.

---

## Pořadí implementace

1. Založit projekt v Supabase, vytvořit tabulky
2. Zapnout RLS a nastavit policies
3. Napojit autentizaci (e-mail + heslo, bez potvrzení)
4. Implementovat migraci z localStorage
5. Nahradit localStorage volání Supabase klientem (s lokální cache)
6. Doplnit offline frontu a synchronizaci
7. Připravit import skript a nahrát první otázky
