# Datový model

## Princip

Stávající appka má otázky jednoho typu (výběr správné odpovědi). Přijímačkový modul přidává čtyři nové typy. Model musí být rozšiřitelný — přidání dalšího typu později nesmí vyžadovat přepis existujícího kódu.

Řešení: jednotný obal (`Question`) s polem `type`, které určuje, jak se otázka vykresluje a vyhodnocuje. Specifická data každého typu jsou v `payload`.

## Základní struktura otázky

```javascript
{
  id: "cj-pravopis-0042",        // unikátní ID, prefix = předmět-kategorie
  subject: "cestina",             // "cestina" | "matematika"
  category: "pravopis-iy",        // slug kategorie, viz 03-kategorie-faze1.md
  type: "an-svazek",              // typ úlohy, viz níže
  difficulty: "zacatecnik",       // "zacatecnik" | "pokrocily"
  points: 2,                      // bodová hodnota (kopíruje Cermat)
  payload: { ... },               // data specifická pro typ
  explanation: "..."              // vysvětlení správného řešení (volitelné)
}
```

### Pole

| Pole | Typ | Povinné | Popis |
|---|---|---|---|
| `id` | string | ano | Unikátní napříč celou bankou |
| `subject` | string | ano | Předmět |
| `category` | string | ano | Kategorie — určuje statistiky a zaměření drilu |
| `type` | string | ano | Typ úlohy — určuje komponentu a vyhodnocení |
| `difficulty` | string | ano | Obtížnost |
| `points` | number | ano | Body podle Cermatu (1–5) |
| `payload` | object | ano | Data podle typu |
| `explanation` | string | ne | Text zobrazený po odpovědi |
| `sourceText` | string | ne | Výchozí text k úloze (pokud je potřeba) |

## Typy úloh a jejich payload

### 1. `vyber` — výběr jedné odpovědi (ABCD/ABCDE)

Stávající typ, zachovat kompatibilitu.

```javascript
{
  type: "vyber",
  payload: {
    prompt: "Která z následujících vět NENÍ zapsána pravopisně správně?",
    options: [
      { id: "a", text: "Družičky udělaly nevěstě krásný věnec." },
      { id: "b", text: "Nejmenší děti si směly hrát na mělčině." },
      { id: "c", text: "Kluci uzavřeli o prázdninách příměří." },
      { id: "d", text: "V průběhu roku vydělal slušné jmění." }
    ],
    correctOptionId: "a"
  }
}
```

**Vyhodnocení:** Správně = vybrané ID odpovídá `correctOptionId`. Vše nebo nic.

### 2. `an-svazek` — svazek tvrzení ANO/NE

Velmi častý v Cermatu — 4 tvrzení, u každého rozhodnout.

```javascript
{
  type: "an-svazek",
  payload: {
    prompt: "Rozhodněte o každé z následujících vět, zda je zapsána pravopisně správně.",
    statements: [
      { id: "1", text: "To staré rozvyklané zábradlí se musí vyměnit.", correct: false },
      { id: "2", text: "Na půdě jsem našel několik papírových sáčků.", correct: true },
      { id: "3", text: "Náš plánovaný pobyt narušili nečekané okolnosti.", correct: false },
      { id: "4", text: "Opakované výzvy jsem si všiml až na poslední chvíli.", correct: true }
    ]
  }
}
```

**Vyhodnocení podle Cermatu (částečné body):**
- 4 podúlohy správně → plný počet bodů
- 3 podúlohy správně → polovina bodů (zaokrouhleno dolů)
- 2 a méně → 0 bodů

Implementovat jako funkci, ne natvrdo — Cermat občas mění poměry.

### 3. `otevrena` — otevřená odpověď (číslo nebo slovo)

```javascript
{
  type: "otevrena",
  payload: {
    prompt: "Vypočtěte: 45 − 15 : 5 + 42 : (10 − 4)",
    answerType: "number",           // "number" | "text"
    correctAnswers: ["49"],          // pole — může být víc správných tvarů
    unit: null,                      // volitelně "cm", "korun", "gramů"
    tolerance: 0                     // pro čísla — povolená odchylka
  }
}
```

Pro textové odpovědi:

```javascript
{
  type: "otevrena",
  payload: {
    prompt: "Napište podstatné jméno, které je dvouslabičné, je příbuzné se slovem POŠKODIT a skloňuje se podle vzoru SOUDCE.",
    answerType: "text",
    correctAnswers: ["škůdce"],
    caseSensitive: false,
    normalizeDiacritics: false       // false = diakritika se kontroluje
  }
}
```

**Vyhodnocení:**
- Číslo: porovnat hodnotu, respektovat `tolerance`
- Text: normalizovat mezery, porovnat s `correctAnswers`
- Diakritika se KONTROLUJE (je to test z češtiny), ale při chybě zobrazit vysvětlující hlášku "Skoro! Pozor na diakritiku."

### 4. `otevrena-multi` — otevřená odpověď s více poli

Cermat často žádá více odpovědí najednou (např. "vypište tři slova").

```javascript
{
  type: "otevrena-multi",
  payload: {
    prompt: "Vypište z textu tři zdrobněliny typu A.",
    fieldCount: 3,
    answerType: "text",
    correctAnswers: ["ohrádka", "kopýtko", "ocásek"],
    acceptAnyOrder: true,            // pořadí nerozhoduje
    caseSensitive: false
  }
}
```

**Vyhodnocení podle Cermatu:**
- Za chybu se počítá jak chybějící správná odpověď, tak zapsání špatné
- 0 chyb → plný počet bodů
- 1 chyba → body − 1
- atd. až na 0

### 5. `prirazovani` — přiřazování

```javascript
{
  type: "prirazovani",
  payload: {
    prompt: "Přiřaďte k jednotlivým souvětím odpovídající tvrzení.",
    items: [
      { id: "5.1", text: "Nevim, proč nechává věcem volný průběh." },
      { id: "5.2", text: "Pozítří jede k rodičům a těší se na koláče." },
      { id: "5.3", text: "Když Tomáš spad z kola, měl škrábance." }
    ],
    options: [
      { id: "A", text: "Pouze první podtržený tvar je nespisovný." },
      { id: "B", text: "Pouze třetí podtržený tvar je nespisovný." },
      { id: "C", text: "Dva tvary jsou nespisovné, první a druhý." },
      { id: "D", text: "Dva tvary jsou nespisovné, první a třetí." },
      { id: "E", text: "Dva tvary jsou nespisovné, druhý a třetí." }
    ],
    correctMapping: { "5.1": "A", "5.2": "E", "5.3": "D" }
  }
}
```

**Poznámka:** Cermat má vždy víc možností než položek (2 zbudou nepoužité). To je záměr — brání odhadování metodou vyloučení. Zachovat.

**Vyhodnocení:** 1 bod za každé správné přiřazení.

## Kategorie

```javascript
{
  slug: "pravopis-iy",
  subject: "cestina",
  name: "Pravopis i/y",
  description: "Vyjmenovaná slova, shoda přísudku s podmětem",
  icon: "✏️",
  phase: 1,                        // ve které fázi přípravy se aktivuje
  cermatWeight: 6,                 // typická bodová váha v reálném testu
  types: ["an-svazek", "vyber"]    // jaké formáty se v kategorii používají
}
```

Pole `cermatWeight` slouží k tomu, aby appka mohla doporučit, čemu věnovat víc času — kategorie s vyšší váhou mají větší dopad na výsledek.

## Výsledky a statistiky

### Záznam jedné odpovědi

```javascript
{
  questionId: "cj-pravopis-0042",
  category: "pravopis-iy",
  subject: "cestina",
  timestamp: 1725360000000,
  correct: true,                   // úplně správně?
  pointsEarned: 2,
  pointsMax: 2,
  timeSpentMs: 18400,
  attemptNumber: 1                 // pokolikáté už tuto otázku viděl
}
```

### Agregované statistiky po kategoriích

Počítat průběžně, ne ukládat — odvodit z historie odpovědí:

```javascript
{
  category: "pravopis-iy",
  totalAnswered: 47,
  successRate: 0.72,               // podíl získaných bodů z možných
  lastPracticed: 1725360000000,
  trend: "improving",              // "improving" | "stable" | "declining"
  isWeakSpot: false                // successRate < 0.65 a alespoň 10 otázek
}
```

**Práh pro slabé místo:** úspěšnost pod 65 % při minimálně 10 zodpovězených otázkách. Pod 10 otázek nemá statistika výpovědní hodnotu.

## Ruční označení slabých míst

Po papírovém testu Libor zadá, které kategorie byly problematické. Tento příznak má přednost před automatickou statistikou:

```javascript
{
  category: "geometrie-vypocty",
  manuallyFlagged: true,
  flaggedAt: 1725360000000,
  expiresAt: 1725964800000,        // platí 7 dní, pak se vrátí k automatice
  note: "Papírový test 2024/1 — chyboval v obsazích"
}
```

## Kompatibilita se stávající appkou

Stávající otázky (vyjmenovaná slova, násobilka atd.) musí dál fungovat. Postup:

1. Stávající otázky dostanou `type: "vyber"` (nebo odpovídající typ)
2. Doplní se jim `subject`, `category`, `points: 1`
3. Chybník, hvězdy, mince a streak fungují stejně pro staré i nové kategorie

**Nepřepisovat stávající logiku her — jen ji rozšířit o nové typy.**
