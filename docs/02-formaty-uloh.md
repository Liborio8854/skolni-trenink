# Formáty úloh — UI a vyhodnocení

## Obecné zásady

**Vypadat jako Cermat, chovat se jako appka.** Formát a formulace odpovídají reálnému testu, aby nebyl u zkoušky překvapením. Ale zpětná vazba je okamžitá a hravá — to je přidaná hodnota appky.

**Mobilní first.** Eda bude trénovat hlavně na telefonu. Všechny ovládací prvky musí být pohodlně klikatelné palcem, minimálně 44×44 px.

**Zachovat stávající vizuál.** Nové formáty používají stejné barvy, fonty a animace jako stávající appka. Konfety po správné odpovědi zůstávají.

---

## 1. A/N svazek

### Vzhled

```
┌─────────────────────────────────────┐
│  Rozhodni o každé větě, zda je      │
│  zapsána pravopisně správně.        │
│                                     │
│                          ANO    NE  │
│  1. To staré rozvyklané zábradlí    │
│     se musí vyměnit.      ( )   ( ) │
│                                     │
│  2. Na půdě jsem našel několik      │
│     papírových sáčků.     ( )   ( ) │
│                                     │
│  3. Náš plánovaný pobyt narušili    │
│     nečekané okolnosti.   ( )   ( ) │
│                                     │
│  4. Opakované výzvy jsem si všiml   │
│     až na poslední chvíli. ( )  ( ) │
│                                     │
│         [ Zkontrolovat ]            │
└─────────────────────────────────────┘
```

### Chování

- Uživatel musí odpovědět na **všechny** podúlohy, teprve pak se aktivuje tlačítko Zkontrolovat
- Tlačítko je do té doby zašedlé s textem "Odpověz na všechny věty"
- Kliknutím na druhou možnost se první odznačí (radio button chování v rámci řádku)
- Na mobilu jsou ANO/NE jako dvě dostatečně velká tlačítka, ne malé kroužky

### Po odeslání

- Správné řádky zezelenají, špatné zčervenají
- U špatných se zobrazí správná odpověď
- Pod tím vysvětlení (pole `explanation`), pokud existuje
- Zobrazí se získané body: "Získal jsi 1 ze 2 bodů (3 ze 4 správně)"

### Vyhodnocení

```javascript
function evaluateAnSvazek(statements, userAnswers, maxPoints) {
  const correctCount = statements.filter(
    s => userAnswers[s.id] === s.correct
  ).length;
  
  const total = statements.length;
  
  // Cermat logika pro 4 podúlohy / 2 body:
  // 4 správně = 2 b, 3 správně = 1 b, 2 a méně = 0 b
  if (correctCount === total) return maxPoints;
  if (correctCount === total - 1) return Math.floor(maxPoints / 2);
  return 0;
}
```

**Konfety** jen při plném počtu bodů. Při částečném úspěchu jemnější zpětná vazba (např. povzbudivá hláška bez animace).

---

## 2. Otevřená odpověď

### Vzhled — číselná

```
┌─────────────────────────────────────┐
│  Vypočítej:                         │
│                                     │
│  45 − 15 : 5 + 42 : (10 − 4)        │
│                                     │
│      ┌─────────────┐                │
│      │             │                │
│      └─────────────┘                │
│                                     │
│         [ Zkontrolovat ]            │
└─────────────────────────────────────┘
```

### Vzhled — s jednotkou

Pokud má odpověď jednotku, zobrazit ji staticky za polem:

```
      ┌─────────────┐
      │             │  cm²
      └─────────────┘
```

Uživatel píše jen číslo, jednotka je daná. (V reálném testu musí jednotku napsat sám a chyba v jednotce stojí bod — na to upozorní rozbor s rodičem, appka to nemusí komplikovat.)

### Chování

- Pro `answerType: "number"` otevřít **numerickou klávesnici** na mobilu (`inputMode="numeric"`)
- Pro `answerType: "text"` normální klávesnice s českou diakritikou
- Enter odešle odpověď
- Prázdné pole → tlačítko neaktivní

### Vyhodnocení — číslo

```javascript
function evaluateNumber(userInput, correctAnswers, tolerance = 0) {
  const normalized = userInput
    .replace(/\s/g, '')
    .replace(',', '.');           // desetinná čárka i tečka
  
  const value = parseFloat(normalized);
  if (isNaN(value)) return false;
  
  return correctAnswers.some(correct => 
    Math.abs(value - parseFloat(correct)) <= tolerance
  );
}
```

### Vyhodnocení — text

```javascript
function evaluateText(userInput, correctAnswers, options = {}) {
  const normalize = (s) => {
    let result = s.trim().replace(/\s+/g, ' ');
    if (!options.caseSensitive) result = result.toLowerCase();
    return result;
  };
  
  const user = normalize(userInput);
  return correctAnswers.some(c => normalize(c) === user);
}
```

**Speciální případ — diakritika.** Pokud se odpověď liší JEN diakritikou, nepočítat jako správnou (je to test z češtiny), ale zobrazit hlášku:

> "Skoro! Máš správné slovo, ale zkontroluj si diakritiku."

To je pedagogicky užitečnější než suché "špatně".

```javascript
function isDiacriticNearMiss(userInput, correctAnswers) {
  const strip = (s) => s.normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase().trim();
  
  return correctAnswers.some(c => 
    strip(c) === strip(userInput) && c.toLowerCase().trim() !== userInput.toLowerCase().trim()
  );
}
```

---

## 3. Otevřená odpověď s více poli

### Vzhled

```
┌─────────────────────────────────────┐
│  Vypiš z textu tři zdrobněliny      │
│  typu A.                            │
│                                     │
│  1. ┌─────────────┐                 │
│     └─────────────┘                 │
│  2. ┌─────────────┐                 │
│     └─────────────┘                 │
│  3. ┌─────────────┐                 │
│     └─────────────┘                 │
│                                     │
│         [ Zkontrolovat ]            │
└─────────────────────────────────────┘
```

### Chování

- Enter přeskočí na další pole
- Enter v posledním poli odešle
- Musí být vyplněna všechna pole

### Vyhodnocení

Cermat počítá chyby oboustranně — chybí správná odpověď = chyba, je tam špatná = chyba.

```javascript
function evaluateMulti(userAnswers, correctAnswers, maxPoints) {
  const normalize = (s) => s.trim().toLowerCase();
  const user = userAnswers.map(normalize).filter(Boolean);
  const correct = correctAnswers.map(normalize);
  
  // Kolik správných uživatel našel
  const found = correct.filter(c => user.includes(c)).length;
  // Kolik nesprávných napsal
  const wrong = user.filter(u => !correct.includes(u)).length;
  // Kolik správných chybí
  const missing = correct.length - found;
  
  const errors = wrong + missing;
  
  return Math.max(0, maxPoints - errors);
}
```

**Zobrazit rozpis:** "Našel jsi 2 ze 3. Chybělo: *ocásek*. Slovo *svíčka* není zdrobnělina typu A."

---

## 4. Přiřazování

### Vzhled — mobil

Na malém displeji nefunguje drag & drop dobře. Použít **dropdown u každé položky**:

```
┌─────────────────────────────────────┐
│  Přiřaď k souvětím tvrzení.         │
│                                     │
│  1. Nevim, proč nechává věcem       │
│     volný průběh.                   │
│     ┌──────────────────────┐        │
│     │ Vyber ...         ▾ │        │
│     └──────────────────────┘        │
│                                     │
│  2. Pozítří jede k rodičům...       │
│     ┌──────────────────────┐        │
│     │ Vyber ...         ▾ │        │
│     └──────────────────────┘        │
│                                     │
│  ── Možnosti ──────────────────     │
│  A) Pouze první tvar je nespisovný. │
│  B) Pouze třetí tvar je nespisovný. │
│  C) Dva tvary — první a druhý.      │
│  D) Dva tvary — první a třetí.      │
│  E) Dva tvary — druhý a třetí.      │
│                                     │
│         [ Zkontrolovat ]            │
└─────────────────────────────────────┘
```

### Chování

- Možnosti A–E jsou vypsané pod položkami (aby si je mohl přečíst celé)
- Dropdown obsahuje jen písmena s krátkým náhledem textu
- **Použitá možnost zmizí z ostatních dropdownů** — Cermat zakazuje přiřadit jednu možnost víckrát
- Změna výběru vrátí předchozí možnost zpět do nabídky

### Vyhodnocení

```javascript
function evaluatePrirazovani(userMapping, correctMapping) {
  return Object.keys(correctMapping).filter(
    key => userMapping[key] === correctMapping[key]
  ).length;  // 1 bod za každé správné
}
```

---

## Společné prvky všech formátů

### Nápověda a přeskočení

Zachovat stávající mechaniku: nápověda po 25 s, možnost přeskočit po 40 s. Platí pro české kategorie, u matematických počítat s delším časem — u slovních úloh dát nápovědu až po 45 s.

### Zpětná vazba

| Situace | Reakce |
|---|---|
| Plný počet bodů | Konfety + zvuk + "Výborně!" |
| Částečné body | Bez konfet, "Skoro! Získal jsi X ze Y bodů." |
| Nula bodů | Klidná zpětná vazba + vysvětlení + zařazení do chybníku |
| Diakritická chyba | "Skoro! Zkontroluj diakritiku." + půl bodu (volitelné) |

**Nikdy nepoužívat negativní formulace** typu "Špatně!" nebo "Chyba!". Místo toho "Zkusíme to znovu" nebo "Podívej se na to takhle:".

### Chybník

Otázky s méně než plným počtem bodů se zařadí do chybníku a objeví se v příštích kolech. Zachovat stávající logiku.

**Rozšíření pro nové typy:** U A/N svazku a multi-odpovědí zapamatovat, KTERÁ podúloha byla špatně — při opakování ji zvýraznit.

### Body vs. hvězdy a mince

Nové kategorie používají stávající měnu:
- **Mince:** 10 za plný počet bodů, 5 za částečný, 0 za nulu
- **Hvězdy:** podle stávající logiky postupu
- **Cermat body** (`points`) slouží jen ke statistikám, nezobrazují se jako herní měna

Nemíchat dvě měny v UI — Cermat body ukázat jen ve statistikách a v rozboru.
