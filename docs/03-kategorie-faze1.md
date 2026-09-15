# Kategorie fáze 1 — obsah

Kategorie pro první fázi přípravy (září–listopad). Drilové oblasti, kde má appka největší přidanou hodnotu.

**Zásada:** Všechny otázky jsou vlastní, ne kopírované z Cermatu. Musí ale odpovídat typem, obtížností a formulací.

---

## ČEŠTINA

### 1. Pravopis i/y

```javascript
{
  slug: "pravopis-iy",
  subject: "cestina",
  name: "Pravopis i/y",
  description: "Vyjmenovaná slova, shoda přísudku s podmětem, koncovky",
  icon: "✏️",
  phase: 1,
  cermatWeight: 6,
  types: ["an-svazek", "vyber"]
}
```

**Co se trénuje:** vyjmenovaná slova a slova příbuzná, shoda přísudku s podmětem (byli/byly), koncovky přídavných jmen, tvrdé a měkké souhlásky.

**Příklad — A/N svazek (2 body):**

```javascript
{
  id: "cj-pravopis-iy-0001",
  subject: "cestina",
  category: "pravopis-iy",
  type: "an-svazek",
  difficulty: "zacatecnik",
  points: 2,
  payload: {
    prompt: "Rozhodni o každé z následujících vět, zda je zapsána pravopisně správně.",
    statements: [
      { id: "1", text: "Chlapci si na hřišti hráli až do večera.", correct: true },
      { id: "2", text: "Květiny na okně už dávno uvadli.", correct: false },
      { id: "3", text: "Slyšel jsem, jak ptáci zpívali v korunách stromů.", correct: true },
      { id: "4", text: "Naše kočky spali celé odpoledne na gauči.", correct: false }
    ]
  },
  explanation: "Podmět rodu ženského v množném čísle (květiny, kočky) vyžaduje v příčestí koncovku -y: uvadly, spaly."
}
```

**Příklad — výběr (1 bod):**

```javascript
{
  id: "cj-pravopis-iy-0002",
  subject: "cestina",
  category: "pravopis-iy",
  type: "vyber",
  difficulty: "pokrocily",
  points: 1,
  payload: {
    prompt: "Která z následujících vět NENÍ zapsána pravopisně správně?",
    options: [
      { id: "a", text: "Babička nasypala slepicím zrní na dvorek." },
      { id: "b", text: "Myslivec vyprávěl o lišce, kterou zahlédl v lese." },
      { id: "c", text: "Na zahradě rozkvetly bílé kopretyny." },
      { id: "d", text: "Sousedovi psi štěkali celou noc." }
    ],
    correctOptionId: "c"
  },
  explanation: "Správně je kopretiny — slovo nepatří mezi vyjmenovaná slova po p ani není s žádným příbuzné."
}
```

**Kolik otázek:** minimálně 60 pro rozumný dril (30 začátečník, 30 pokročilý).

---

### 2. Hledání chyby ve větě

```javascript
{
  slug: "hledani-chyby",
  subject: "cestina",
  name: "Najdi chybu",
  description: "Rozpoznání pravopisné chyby ve větě nebo textu",
  icon: "🔍",
  phase: 1,
  cermatWeight: 4,
  types: ["vyber", "otevrena-multi"]
}
```

**Co se trénuje:** rozpoznat chybu v jinak správném textu. V Cermatu je to velmi častá úloha za 4 body (najdi 4 chyby v textu a napiš správně).

**Příklad — výběr (1 bod):**

```javascript
{
  id: "cj-chyba-0001",
  subject: "cestina",
  category: "hledani-chyby",
  type: "vyber",
  difficulty: "zacatecnik",
  points: 1,
  payload: {
    prompt: "Která z následujících vět obsahuje pravopisnou chybu?",
    options: [
      { id: "a", text: "Ráno jsme vyrazili na dlouhou túru do hor." },
      { id: "b", text: "Vítr foukal tak silně, že jsme se sotva udrželi." },
      { id: "c", text: "Cesta byla zarostlá a museli jsme jít opatrně." },
      { id: "d", text: "Na vrcholu jsme si udělaly krátkou přestávku." }
    ],
    correctOptionId: "d"
  },
  explanation: "Pokud je podmět rodu mužského životného v množném čísle (my = chlapci/lidé), píše se udělali."
}
```

**Příklad — multi (4 body), pokročilý:**

```javascript
{
  id: "cj-chyba-0002",
  subject: "cestina",
  category: "hledani-chyby",
  type: "otevrena-multi",
  difficulty: "pokrocily",
  points: 4,
  sourceText: "V sobotu jsme se vypravily na výlet k rybníku. Cesta vedla podél pole, kde právě dozrávalo obylí. U vody jsme rozdělali malý ohníček a opekly si buřty. Odpoledne se obloha zatáhla a začalo pršet, tak jsme rychle sbalyli věci a vydali se domů.",
  payload: {
    prompt: "Najdi ve výchozím textu čtyři slova zapsaná s pravopisnou chybou a napiš je PRAVOPISNĚ SPRÁVNĚ.",
    fieldCount: 4,
    answerType: "text",
    correctAnswers: ["vypravili", "obilí", "opekli", "sbalili"],
    acceptAnyOrder: true,
    caseSensitive: false
  },
  explanation: "vypravili/opekli — podmět my (chlapci) vyžaduje -i; obilí — není příbuzné s vyjmenovanými slovy po b; sbalili — sloveso balit, měkké i."
}
```

**Kolik otázek:** 40 (25 výběr, 15 multi).

---

### 3. Slovní druhy

```javascript
{
  slug: "slovni-druhy",
  subject: "cestina",
  name: "Slovní druhy",
  description: "Určování slovních druhů v kontextu věty",
  icon: "📚",
  phase: 1,
  cermatWeight: 3,
  types: ["vyber", "an-svazek"]
}
```

**Co se trénuje:** určení slovního druhu konkrétního slova ve větě, rozpoznání ohebných a neohebných slov, případy kdy stejné slovo může být různým druhem.

**Důležité:** Cermat netestuje jen "vyjmenuj slovní druhy", ale schopnost určit druh **v kontextu** — často u slov, která mohou být více druhy.

**Příklad — výběr (1 bod):**

```javascript
{
  id: "cj-druhy-0001",
  subject: "cestina",
  category: "slovni-druhy",
  type: "vyber",
  difficulty: "pokrocily",
  points: 1,
  payload: {
    prompt: "Které z tvrzení o výrazu KOLEM je pravdivé?",
    options: [
      { id: "a", text: "Ve větě „Prošli jsme kolem domu.\" i ve větě „Auto jelo na jednom kolem.\" je předložkou." },
      { id: "b", text: "Ve větě „Prošli jsme kolem domu.\" je předložkou, ve větě „Auto jelo na jednom kolem.\" je podstatným jménem." },
      { id: "c", text: "Ve větě „Prošli jsme kolem domu.\" je podstatným jménem, ve větě „Auto jelo na jednom kolem.\" je předložkou." },
      { id: "d", text: "V obou větách je podstatným jménem." }
    ],
    correctOptionId: "b"
  },
  explanation: "V první větě kolem uvozuje spojení s podstatným jménem — je předložka. Ve druhé je to tvar podstatného jména kolo v 7. pádě."
}
```

**Příklad — A/N svazek (2 body):**

```javascript
{
  id: "cj-druhy-0002",
  subject: "cestina",
  category: "slovni-druhy",
  type: "an-svazek",
  difficulty: "zacatecnik",
  points: 2,
  payload: {
    prompt: "Rozhodni o každém úseku, zda se v něm vyskytuje neohebné slovo.",
    statements: [
      { id: "1", text: "běžel velmi rychle", correct: true },
      { id: "2", text: "krásná zelená louka", correct: false },
      { id: "3", text: "seděli jsme pod stromem", correct: true },
      { id: "4", text: "moje starší sestra", correct: false }
    ]
  },
  explanation: "Neohebná slova: velmi a rychle (příslovce), pod (předložka). Ve zbylých úsecích jsou jen ohebná slova."
}
```

**Kolik otázek:** 40.

---

### 4. Tvoření slov

```javascript
{
  slug: "tvoreni-slov",
  subject: "cestina",
  name: "Tvoření slov",
  description: "Zdrobněliny, slova příbuzná, vzory skloňování, předpony",
  icon: "🧩",
  phase: 1,
  cermatWeight: 5,
  types: ["otevrena", "vyber"]
}
```

**Co se trénuje:** vytvořit slovo podle zadaných podmínek (počet slabik, vzor, příbuznost, přítomnost předpony). Toto je typ, který se v Cermatu objevuje **v každém testu** a děti na něm často padají.

**Příklad — otevřená odpověď (1 bod):**

```javascript
{
  id: "cj-tvoreni-0001",
  subject: "cestina",
  category: "tvoreni-slov",
  type: "otevrena",
  difficulty: "pokrocily",
  points: 1,
  payload: {
    prompt: "Napiš podstatné jméno, které je v 1. pádě čísla jednotného dvouslabičné, je příbuzné se slovem UČIT, skloňuje se podle vzoru MUŽ a neobsahuje předponu.",
    answerType: "text",
    correctAnswers: ["učeň"],
    caseSensitive: false
  },
  explanation: "Učeň — dvě slabiky (u-čeň), příbuzné se slovem učit, vzor muž (bez učně), bez předpony."
}
```

**Příklad — zdrobněliny, výběr (1 bod):**

```javascript
{
  id: "cj-tvoreni-0002",
  subject: "cestina",
  category: "tvoreni-slov",
  type: "vyber",
  difficulty: "zacatecnik",
  points: 1,
  sourceText: "Zdrobněliny typu A: v kořeni slova se samohláska PRODLUŽUJE (rada → rádka).\nZdrobněliny typu B: v kořeni slova se samohláska NEMĚNÍ (strom → stromek).",
  payload: {
    prompt: "Které tvrzení o zdrobnělinách VÁZIČKA a LÍSTEČEK je pravdivé?",
    options: [
      { id: "a", text: "Obě jsou typu A." },
      { id: "b", text: "Obě jsou typu B." },
      { id: "c", text: "Vázička je typu A, lísteček je typu B." },
      { id: "d", text: "Vázička je typu B, lísteček je typu A." }
    ],
    correctOptionId: "b"
  },
  explanation: "Vázička ← váza (á zůstává á), lísteček ← lístek (í zůstává í). U obou se samohláska nemění."
}
```

**Poznámka k formulaci:** Cermat používá tuto konstrukci s definicí v textu 2 a aplikací v otázce velmi často. Trénovat ji je cenné samo o sobě — dítě se učí pracovat s pravidlem, které vidí poprvé.

**Kolik otázek:** 50 (je to nejnáročnější kategorie).

---

## MATEMATIKA

### 5. Pořadí operací

```javascript
{
  slug: "poradi-operaci",
  subject: "matematika",
  name: "Počítání",
  description: "Pořadí operací, závorky, počítání s většími čísly",
  icon: "🔢",
  phase: 1,
  cermatWeight: 4,
  types: ["otevrena"]
}
```

**Co se trénuje:** správné pořadí operací (závorky → násobení/dělení → sčítání/odčítání), počítání zpaměti i písemně s čísly do statisíců.

**Příklad (2 body):**

```javascript
{
  id: "ma-poradi-0001",
  subject: "matematika",
  category: "poradi-operaci",
  type: "otevrena",
  difficulty: "zacatecnik",
  points: 2,
  payload: {
    prompt: "Vypočítej:  36 + 24 : 6 − 5 · 4",
    answerType: "number",
    correctAnswers: ["20"],
    tolerance: 0
  },
  explanation: "Nejprve dělení a násobení: 24 : 6 = 4, 5 · 4 = 20. Pak zleva doprava: 36 + 4 − 20 = 20."
}
```

**Příklad (2 body), pokročilý:**

```javascript
{
  id: "ma-poradi-0002",
  subject: "matematika",
  category: "poradi-operaci",
  type: "otevrena",
  difficulty: "pokrocily",
  points: 2,
  payload: {
    prompt: "Vypočítej:  40 · 2500 − 2500 : 25 + 25",
    answerType: "number",
    correctAnswers: ["99925"],
    tolerance: 0
  },
  explanation: "40 · 2500 = 100 000; 2500 : 25 = 100. Pak 100 000 − 100 + 25 = 99 925."
}
```

**Kolik otázek:** 60 (snadno se generují, hodí se pro rychlý denní dril).

---

### 6. Převody jednotek

```javascript
{
  slug: "prevody-jednotek",
  subject: "matematika",
  name: "Převody jednotek",
  description: "Délka, hmotnost, čas, objem — i v rovnostech",
  icon: "📏",
  phase: 1,
  cermatWeight: 3,
  types: ["otevrena"]
}
```

**Co se trénuje:** převody mezi jednotkami délky (km, m, dm, cm, mm), hmotnosti (t, kg, dag, g), času (h, min, s), objemu (hl, l, dl, ml). Cermat je často zadává jako rovnost s neznámou.

**Příklad — jednoduchý převod (1 bod):**

```javascript
{
  id: "ma-prevody-0001",
  subject: "matematika",
  category: "prevody-jednotek",
  type: "otevrena",
  difficulty: "zacatecnik",
  points: 1,
  payload: {
    prompt: "Kolik centimetrů je 3,5 metru?",
    answerType: "number",
    correctAnswers: ["350"],
    unit: "cm",
    tolerance: 0
  }
}
```

**Příklad — rovnost s neznámou (1 bod), pokročilý:**

```javascript
{
  id: "ma-prevody-0002",
  subject: "matematika",
  category: "prevody-jednotek",
  type: "otevrena",
  difficulty: "pokrocily",
  points: 1,
  payload: {
    prompt: "Doplň číslo tak, aby platila rovnost:\n\n12 m − 8 dm + ___ cm = 13 m",
    answerType: "number",
    correctAnswers: ["180"],
    unit: "cm",
    tolerance: 0
  },
  explanation: "12 m = 1200 cm, 8 dm = 80 cm, 13 m = 1300 cm. Takže 1200 − 80 + x = 1300, tedy x = 180."
}
```

**Kolik otázek:** 50.

---

### 7. Jednoduché slovní úlohy

```javascript
{
  slug: "slovni-ulohy",
  subject: "matematika",
  name: "Slovní úlohy",
  description: "Trojčlenka, úměrnost, jednoduché vícekrokové úlohy",
  icon: "💭",
  phase: 1,
  cermatWeight: 8,
  types: ["otevrena"]
}
```

**Co se trénuje:** převedení textu na výpočet. Nejdůležitější kategorie v matematice — má nejvyšší bodovou váhu a děti na ní padají nejčastěji.

**Příklad — trojčlenka (1 bod):**

```javascript
{
  id: "ma-slovni-0001",
  subject: "matematika",
  category: "slovni-ulohy",
  type: "otevrena",
  difficulty: "zacatecnik",
  points: 1,
  sourceText: "V pekárně stojí 1 kg chleba 45 korun.",
  payload: {
    prompt: "Kolik korun zaplatíme za 400 g chleba?",
    answerType: "number",
    correctAnswers: ["18"],
    unit: "korun",
    tolerance: 0
  },
  explanation: "400 g je 0,4 kg. 45 · 0,4 = 18 korun. (Nebo: 1 g stojí 45:1000 = 0,045 Kč, 400 · 0,045 = 18 Kč.)"
}
```

**Příklad — vícekroková (2 body), pokročilý:**

```javascript
{
  id: "ma-slovni-0002",
  subject: "matematika",
  category: "slovni-ulohy",
  type: "otevrena",
  difficulty: "pokrocily",
  points: 2,
  sourceText: "V knihovně je celkem 240 knih. Třetina všech knih jsou pohádky. Ze zbývajících knih je polovina dobrodružných.",
  payload: {
    prompt: "Kolik dobrodružných knih je v knihovně?",
    answerType: "number",
    correctAnswers: ["80"],
    unit: "knih",
    tolerance: 0
  },
  explanation: "Pohádky: 240 : 3 = 80. Zbývá 240 − 80 = 160. Dobrodružné: 160 : 2 = 80 knih."
}
```

**Poznámka:** U slovních úloh dát nápovědu později (45 s) — dítě potřebuje čas na přemýšlení. Nápověda by měla navádět na postup, ne prozradit výsledek: "Zjisti nejdřív, kolik je pohádek."

**Kolik otázek:** 50.

---

### 8. Geometrie — výpočty

```javascript
{
  slug: "geometrie-vypocty",
  subject: "matematika",
  name: "Geometrie",
  description: "Obvod, obsah, čtvercová síť, vlastnosti útvarů",
  icon: "📐",
  phase: 1,
  cermatWeight: 6,
  types: ["otevrena", "vyber"]
}
```

**Co se trénuje:** obvod a obsah čtverce, obdélníku a složených útvarů, práce se čtvercovou sítí, jednoduché úvahy o vlastnostech útvarů.

**Bez rýsování** — konstrukční úlohy zůstávají na papíře.

**Příklad — obsah (1 bod):**

```javascript
{
  id: "ma-geo-0001",
  subject: "matematika",
  category: "geometrie-vypocty",
  type: "otevrena",
  difficulty: "zacatecnik",
  points: 1,
  payload: {
    prompt: "Obdélník má strany dlouhé 12 cm a 7 cm. Jaký je jeho obsah?",
    answerType: "number",
    correctAnswers: ["84"],
    unit: "cm²",
    tolerance: 0
  }
}
```

**Příklad — obrácená úloha (2 body), pokročilý:**

```javascript
{
  id: "ma-geo-0002",
  subject: "matematika",
  category: "geometrie-vypocty",
  type: "otevrena",
  difficulty: "pokrocily",
  points: 2,
  sourceText: "Obdélník má obvod 34 cm. Jedna jeho strana je o 3 cm delší než druhá.",
  payload: {
    prompt: "Jaký je obsah tohoto obdélníku v cm²?",
    answerType: "number",
    correctAnswers: ["70"],
    unit: "cm²",
    tolerance: 0
  },
  explanation: "Obvod 34 = 2·(a+b), takže a+b = 17. Když je jedna o 3 delší: a = 10, b = 7. Obsah = 10 · 7 = 70 cm²."
}
```

**Kolik otázek:** 40.

---

### 9. Logika a řady

```javascript
{
  slug: "logika-rady",
  subject: "matematika",
  name: "Logika a řady",
  description: "Hledání pravidel, číselné řady, jednoduchá kombinatorika",
  icon: "🧠",
  phase: 1,
  cermatWeight: 4,
  types: ["otevrena", "vyber"]
}
```

**Co se trénuje:** rozpoznání pravidla v posloupnosti, jednoduché kombinatorické úvahy, počítání možností.

Cermat má v každém testu poslední úlohu na hledání vzorce v rostoucí posloupnosti obrazců.

**Příklad — řada (2 body):**

```javascript
{
  id: "ma-logika-0001",
  subject: "matematika",
  category: "logika-rady",
  type: "otevrena",
  difficulty: "zacatecnik",
  points: 2,
  sourceText: "V prvním obrazci jsou 3 tečky. V každém dalším obrazci je o 4 tečky více než v předchozím.",
  payload: {
    prompt: "Kolik teček je v 8. obrazci?",
    answerType: "number",
    correctAnswers: ["31"],
    unit: "teček",
    tolerance: 0
  },
  explanation: "Od 1. do 8. obrazce je 7 přírůstků po 4 tečkách: 3 + 7·4 = 3 + 28 = 31."
}
```

**Příklad — kombinatorika (2 body), pokročilý:**

```javascript
{
  id: "ma-logika-0002",
  subject: "matematika",
  category: "logika-rady",
  type: "vyber",
  difficulty: "pokrocily",
  points: 2,
  sourceText: "Na stole leží kartičky s čísly 1, 2, 3, 4, 5.",
  payload: {
    prompt: "Kolik různých dvojciferných čísel lze složit ze dvou různých kartiček?",
    options: [
      { id: "a", text: "10 čísel" },
      { id: "b", text: "15 čísel" },
      { id: "c", text: "20 čísel" },
      { id: "d", text: "25 čísel" },
      { id: "e", text: "jiný počet" }
    ],
    correctOptionId: "c"
  },
  explanation: "Na místě desítek 5 možností, na místě jednotek zbývají 4 (kartička se nesmí opakovat): 5 · 4 = 20."
}
```

**Kolik otázek:** 40.

---

## Souhrn — kolik obsahu je potřeba

| Kategorie | Předmět | Otázek | Priorita |
|---|---|---|---|
| Pravopis i/y | ČJ | 60 | 1 |
| Pořadí operací | MAT | 60 | 1 |
| Tvoření slov | ČJ | 50 | 2 |
| Převody jednotek | MAT | 50 | 2 |
| Slovní úlohy | MAT | 50 | 2 |
| Hledání chyby | ČJ | 40 | 3 |
| Slovní druhy | ČJ | 40 | 3 |
| Geometrie | MAT | 40 | 3 |
| Logika a řady | MAT | 40 | 4 |
| **Celkem** | | **430** | |

**Doporučení:** Nestavět všechno najednou. Začít prioritou 1 (120 otázek), spustit pro Edu, a přidávat další kategorie postupně. Appka bude použitelná už s dvěma kategoriemi.
