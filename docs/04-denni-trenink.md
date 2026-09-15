# Denní trénink a statistiky

## Proč to existuje

Eda otevře appku a nemá přemýšlet, co má dnes dělat. Appka mu to nabídne. To zní jako drobnost, ale je to rozdíl mezi tím, jestli si sedne a začne, nebo bude deset minut vybírat a nakonec to vzdá.

---

## Dnešní trénink

### Vzhled

```
┌─────────────────────────────────────┐
│  Ahoj Edo! 👋                       │
│  Čtvrtek 15. října                  │
│                                     │
│  ┌───────────────────────────────┐  │
│  │  DNEŠNÍ TRÉNINK               │  │
│  │                               │  │
│  │  📚 Slovní druhy              │  │
│  │  20 minut · 15 otázek         │  │
│  │                               │  │
│  │      [ Začít trénink ]        │  │
│  └───────────────────────────────┘  │
│                                     │
│  🔥 Série: 12 dní                   │
│                                     │
│  Chceš něco jiného?  →              │
└─────────────────────────────────────┘
```

Ve dnech volna:

```
┌─────────────────────────────────────┐
│  ┌───────────────────────────────┐  │
│  │  DNES MÁŠ VOLNO 🎉            │  │
│  │                               │  │
│  │  Odpočiň si, zítra pokračujeme│  │
│  │                               │  │
│  │  [ Přesto chci trénovat ]     │  │
│  └───────────────────────────────┘  │
└─────────────────────────────────────┘
```

**Důležité:** Volný den neznamená zamčenou appku. Když chce, může. Ale nemá pocit, že něco zameškal.

### Logika výběru

Rozvrh je konfigurovatelný, ne natvrdo v kódu — Eda může mít jiný rozvrh v pololetí.

```javascript
const defaultSchedule = {
  1: { subject: "cestina", minutes: 15 },    // pondělí
  2: { subject: "matematika", minutes: 15 }, // úterý
  3: null,                                    // středa — volno
  4: { subject: "mixed", minutes: 20 },      // čtvrtek — těžší blok
  5: null,                                    // pátek — lektor
  6: { subject: "optional", minutes: 10 },   // sobota — dobrovolné
  0: { subject: "optional", minutes: 10 }    // neděle — dobrovolné
};
```

### Výběr konkrétní kategorie

Priorita při výběru, odshora dolů:

1. **Ručně označené slabé místo** (po papírovém testu) — pokud existuje aktivní příznak pro daný předmět
2. **Automaticky detekované slabé místo** — kategorie s úspěšností pod 65 % a alespoň 10 odpověďmi
3. **Nejdéle netrénovaná kategorie** v daném předmětu
4. **Náhodně** z aktivních kategorií fáze

```javascript
function selectTodayCategory(subject, stats, flags, phase) {
  const available = categories.filter(
    c => c.subject === subject && c.phase <= phase && c.enabled
  );
  
  // 1. Ruční příznak
  const flagged = available.find(c => 
    flags.some(f => f.category === c.slug && f.expiresAt > Date.now())
  );
  if (flagged) return flagged;
  
  // 2. Slabé místo podle statistik
  const weak = available
    .filter(c => {
      const s = stats[c.slug];
      return s && s.totalAnswered >= 10 && s.successRate < 0.65;
    })
    .sort((a, b) => stats[a.slug].successRate - stats[b.slug].successRate)[0];
  if (weak) return weak;
  
  // 3. Nejdéle netrénovaná
  const oldest = available.sort((a, b) => 
    (stats[a.slug]?.lastPracticed || 0) - (stats[b.slug]?.lastPracticed || 0)
  )[0];
  return oldest;
}
```

### Čtvrteční mix

Ve čtvrtek (nebo v den označený jako `"mixed"`) se míchají obě kategorie — polovina otázek z češtiny, polovina z matiky. Je to náročnější blok a zároveň připravuje na to, že u zkoušky se přepíná mezi předměty.

### Chybník v denním tréninku

Do každého bloku zamíchat **2–3 otázky z chybníku**, pokud v něm něco je. Nedávat je na začátek — dítě má nejdřív chytit rytmus.

---

## Statistiky

### Přehled pro Edu

Jednoduchý, vizuální, motivační. Ne tabulka čísel.

```
┌─────────────────────────────────────┐
│  MŮJ POKROK                         │
│                                     │
│  ČEŠTINA                            │
│  Pravopis i/y      ████████░░  82%  │
│  Slovní druhy      ██████░░░░  61%  │
│  Tvoření slov      ███████░░░  74%  │
│  Najdi chybu       █████████░  88%  │
│                                     │
│  MATEMATIKA                         │
│  Počítání          █████████░  91%  │
│  Převody           ██████░░░░  63%  │
│  Slovní úlohy      █████░░░░░  54%  │
│  Geometrie         ███████░░░  77%  │
│                                     │
│  Celkem otázek: 342                 │
│  Nejlepší série: 18 dní             │
└─────────────────────────────────────┘
```

**Barvy:** nad 80 % zelená, 65–80 % žlutá, pod 65 % oranžová. **Ne červená** — nemá to působit jako selhání.

### Přehled pro rodiče

Samostatná obrazovka, dostupná přes nastavení (nemusí být chráněná heslem, ale nemá být na hlavní stránce).

```
┌─────────────────────────────────────┐
│  PŘEHLED PRO RODIČE                 │
│  Týden 12.–18. října                │
│                                     │
│  Odtrénováno: 4 dny ze 4 plánovaných│
│  Celkem otázek: 58                  │
│  Průměrná úspěšnost: 71 %           │
│                                     │
│  ── NA CO SE ZAMĚŘIT ──────────     │
│  ⚠ Slovní úlohy — 54 %              │
│    Nejčastější chyba: vícekrokové   │
│    úlohy se zlomky                  │
│                                     │
│  ⚠ Převody jednotek — 63 %          │
│    Nejčastější chyba: převody       │
│    hmotnosti (kg ↔ g)               │
│                                     │
│  ── ZLEPŠENÍ ──────────────────     │
│  ✓ Pravopis i/y: 68 % → 82 %        │
│                                     │
│  ── ZADAT SLABÉ MÍSTO ──────────    │
│  Po papírovém testu označ kategorie,│
│  na které se má appka zaměřit:      │
│  [ Vybrat kategorie ]               │
└─────────────────────────────────────┘
```

Tenhle přehled je určený pro čtvrteční společný rozbor v 16:30 — Libor otevře, vidí za týden a ví, o čem s Edou mluvit.

### Zadání slabého místa po papírovém testu

Formulář, kde Libor zaškrtne kategorie a volitelně přidá poznámku:

```javascript
{
  categories: ["slovni-ulohy", "geometrie-vypocty"],
  note: "Papírový test 2024/1 — obsahy a vícekrokové úlohy",
  durationDays: 7
}
```

Po uložení appka po dobu 7 dnů preferuje tyto kategorie v denním tréninku.

---

## Fáze přípravy

Appka ví, ve které fázi příprava je, a podle toho upravuje délku bloků a nabídku kategorií.

```javascript
const phases = [
  {
    id: 1,
    name: "Základy",
    from: "2026-09-01",
    to: "2026-11-30",
    dailyMinutes: 15,
    thursdayMinutes: 20,
    questionsPerRound: 10
  },
  {
    id: 2,
    name: "Prohlubování",
    from: "2026-12-01",
    to: "2027-02-28",
    dailyMinutes: 20,
    thursdayMinutes: 0,          // čtvrtek = papírový test
    questionsPerRound: 12
  },
  {
    id: 3,
    name: "Ostrá příprava",
    from: "2027-03-01",
    to: "2027-04-15",
    dailyMinutes: 20,
    thursdayMinutes: 0,
    questionsPerRound: 15,
    focusOnWeakSpots: true       // jen slabá místa, žádný obecný dril
  }
];
```

Fáze se přepíná automaticky podle data, ale musí jít **přepnout ručně** — plán může klouzat kvůli nemoci nebo prázdninám.

### Zobrazení fáze

Diskrétně, aby to nevytvářelo tlak:

```
Fáze: Základy · Do zkoušky zbývá 214 dní
```

**Odpočet dní zobrazovat jen ve fázi 1 a 2.** Ve fázi 3, kdy je zkouška blízko, ho skrýt nebo nahradit něčím klidnějším ("Blíží se to, jsi připravený"). Odpočítávání "zbývá 9 dní" týden před zkouškou je zbytečný stres.

---

## Prázdninový režim

Možnost pozastavit denní trénink bez ztráty série:

```
┌─────────────────────────────────────┐
│  PAUZA                              │
│                                     │
│  Jedeš na prázdniny nebo jsi        │
│  nemocný? Zapni pauzu a série       │
│  se ti nepřeruší.                   │
│                                     │
│  Pauza do: [ 3. 1. 2027 ]           │
│      [ Zapnout pauzu ]              │
└─────────────────────────────────────┘
```

Během pauzy appka nenabízí denní trénink a nepočítá zmeškané dny. Vánoce jsou v plánu jako úplná pauza — prevence vyhoření.
