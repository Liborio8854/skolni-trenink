# Prompty pro Cursor

Zadávej po jednom, v tomto pořadí. Po každém zkontroluj, že appka funguje, teprve pak pokračuj.

**Zásada:** Jeden prompt = jeden ohraničený úkol. Neříkej Cursoru "projdi všechny soubory a udělej modul" — dostaneš zmatek.

**Před začátkem:** Udělej zálohu celé složky projektu. Bez gitu nemáš návrat zpět.

---

## BLOK A — Datový model

### Prompt A1 — příprava

```
Přečti @docs/00-prehled.md a @docs/01-datovy-model.md.

Projdi současnou strukturu otázek v projektu a napiš mi:
1. Kde jsou otázky definované a v jakém formátu
2. Kde se vyhodnocují odpovědi
3. Kde se ukládá pokrok (hvězdy, mince, streak, chybník)
4. Co bude potřeba změnit, aby šlo přidat nové typy úloh podle specifikace

Zatím NIC neměň, jen mi to popiš.
```

### Prompt A2 — rozšíření modelu

```
Podle @docs/01-datovy-model.md rozšiř datovou strukturu otázek:

1. Přidej pole: subject, category, type, points, payload, explanation, sourceText
2. Stávající otázky převeď na type: "vyber" — musí fungovat dál stejně
3. Vytvoř definice kategorií podle specifikace (zatím jen struktura, obsah později)
4. Vytvoř centrální funkci evaluateAnswer(question, userAnswer), která podle
   question.type zavolá správnou vyhodnocovací logiku

Zatím NEMĚŇ UI. Jen datovou vrstvu a vyhodnocení.
Po dokončení mi napiš, co jsi změnil a jak to otestovat.
```

---

## BLOK B — Formáty úloh

### Prompt B1 — A/N svazek

```
Podle @docs/02-formaty-uloh.md, sekce "A/N svazek", implementuj nový formát úlohy.

Vytvoř komponentu, která:
- Zobrazí zadání a 4 tvrzení, u každého tlačítka ANO/NE
- Tlačítko Zkontrolovat je aktivní až po zodpovězení všech tvrzení
- Po odeslání zobrazí, která tvrzení byla správně a která ne
- Vyhodnotí podle Cermat logiky (4 správně = plné body, 3 = polovina, méně = 0)

Použij stávající vizuální styl appky. Na mobilu musí být ANO/NE dostatečně velká
tlačítka (min. 44×44 px).

Přidej dvě testovací otázky, ať to jde vyzkoušet.
```

### Prompt B2 — otevřená odpověď

```
Podle @docs/02-formaty-uloh.md, sekce "Otevřená odpověď", implementuj formát
s textovým vstupem.

Požadavky:
- Podpora answerType "number" i "text"
- Pro číslo otevřít numerickou klávesnici na mobilu (inputMode="numeric")
- Desetinná čárka i tečka se berou jako totéž
- Volitelná jednotka se zobrazí staticky za polem
- Enter odešle odpověď
- Při textové odpovědi: pokud se liší jen diakritikou, zobrazit hlášku
  "Skoro! Máš správné slovo, ale zkontroluj si diakritiku."

Přidej dvě testovací otázky (jednu číselnou, jednu textovou).
```

### Prompt B3 — otevřená odpověď s více poli

```
Podle @docs/02-formaty-uloh.md, sekce "Otevřená odpověď s více poli",
implementuj formát otevrena-multi.

Požadavky:
- Zobrazí zadaný počet vstupních polí (fieldCount)
- Enter přeskočí na další pole, v posledním odešle
- Vyhodnocení podle Cermatu: chyba = chybějící správná odpověď NEBO zapsaná špatná
- Body = maxPoints − počet chyb, minimálně 0
- Po odeslání ukázat rozpis: co našel správně, co chybělo, co bylo špatně

Přidej jednu testovací otázku.
```

### Prompt B4 — přiřazování

```
Podle @docs/02-formaty-uloh.md, sekce "Přiřazování", implementuj formát prirazovani.

Požadavky:
- Položky s dropdownem pro výběr možnosti
- Možnosti A–F vypsané pod položkami v plném znění
- Jednu možnost nelze přiřadit víckrát — použitá zmizí z ostatních dropdownů
- Změna výběru vrátí předchozí možnost do nabídky
- 1 bod za každé správné přiřazení

NEPOUŽÍVEJ drag & drop — na mobilu nefunguje dobře.

Přidej jednu testovací otázku.
```

### Prompt B5 — integrace do herní smyčky

```
Propoj nové formáty se stávající herní logikou:

1. Kolo o 10 otázkách může obsahovat mix typů
2. Mince: 10 za plný počet bodů, 5 za částečný, 0 za nulu
3. Hvězdy podle stávající logiky
4. Otázky s méně než plným počtem bodů jdou do chybníku
5. U A/N svazků a multi-odpovědí si chybník pamatuje, která podúloha byla špatně
6. Konfety jen při plném počtu bodů
7. Nápověda po 25 s (u matematických slovních úloh až po 45 s), přeskočení po 40 s

Zkontroluj, že stávající kategorie (vyjmenovaná slova, násobilka) fungují beze změny.
```

---

## BLOK C — Supabase

### Prompt C1 — schéma

```
Přečti @docs/05-supabase.md.

Vygeneruj mi kompletní SQL skript pro založení databáze:
- Všechny tabulky podle specifikace
- Indexy
- RLS policies

Skript budu spouštět v Supabase SQL editoru. Napiš ho jako jeden souvislý blok,
který jde zkopírovat a spustit najednou.
```

### Prompt C2 — klient a autentizace

```
Podle @docs/05-supabase.md napoj appku na Supabase.

1. Přidej @supabase/supabase-js
2. Vytvoř klienta (URL a anon key z .env)
3. Implementuj přihlášení e-mailem a heslem — jednoduchá obrazovka
4. Bez potvrzovacího e-mailu
5. Po přihlášení spustit migraci z localStorage podle specifikace

.env přidej do .gitignore.
Zatím neměň, odkud se berou otázky — jen autentizaci a migraci.
```

### Prompt C3 — čtení a zápis dat

```
Nahraď localStorage voláními Supabase:

1. Otázky se načítají ze Supabase a cachují lokálně (IndexedDB nebo localStorage)
2. Odpovědi se ukládají do tabulky answers
3. Herní stav (hvězdy, mince, streak) se synchronizuje po každém dokončeném kole
4. Chybník se čte a zapisuje do error_log

DŮLEŽITÉ: herní stav drž lokálně jako zdroj pravdy, na server posílej po kole.
Při konfliktu ber vyšší hodnotu.

localStorage zatím nemaž — necháme ho jako zálohu.
```

### Prompt C4 — offline režim

```
Podle @docs/05-supabase.md, sekce "Offline režim", doplň podporu offline.

1. Odpovědi se vždy ukládají nejdřív lokálně s příznakem synced: false
2. Při online stavu se odesílají na server
3. Při obnovení připojení (event 'online') se odešle celá fronta
4. Appka musí být plně funkční bez připojení — otázky z cache, odpovědi do fronty

Přidej diskrétní indikátor, když jsou nesynchronizovaná data
(malá ikona, ne rušivá hláška).
```

### Prompt C5 — import skript

```
Podle @docs/05-supabase.md vytvoř skript scripts/import-questions.js,
který nahraje otázky z JSON souboru do Supabase.

- Používá service key z .env (SUPABASE_SERVICE_KEY)
- Upsert podle id, aby šlo skript spustit opakovaně
- Vypíše, kolik otázek nahrál nebo jaká nastala chyba
- Spuštění: node scripts/import-questions.js data/nazev-souboru.json

Vytvoř i složku data/ s jedním ukázkovým JSON souborem podle
@docs/03-kategorie-faze1.md.
```

---

## BLOK D — Obsah

### Prompt D1 — první kategorie

```
Přečti @docs/03-kategorie-faze1.md.

Vytvoř JSON soubor data/pravopis-iy.json s 20 otázkami kategorie "Pravopis i/y"
podle specifikace:
- 10 začátečník, 10 pokročilý
- Mix typů: 12× an-svazek, 8× vyber
- Každá otázka musí mít explanation
- ID podle konvence: cj-pravopis-iy-0001 atd.

Otázky musí být VLASTNÍ, ne kopírované z Cermatu, ale stejného typu a obtížnosti.
Zaměř se na: vyjmenovaná slova, shoda přísudku s podmětem, koncovky přídavných jmen.
```

### Prompt D2 — druhá kategorie

```
Vytvoř data/poradi-operaci.json s 20 otázkami kategorie "Pořadí operací"
podle @docs/03-kategorie-faze1.md.

- 10 začátečník (čísla do 100), 10 pokročilý (větší čísla, víc kroků)
- Všechny typu "otevrena" s answerType "number"
- Každá s explanation vysvětlujícím postup
- ID podle konvence: ma-poradi-0001 atd.

Zkontroluj, že všechny výsledky jsou správně spočítané.
```

### Prompt D3 — zbývající kategorie

Postupně, jednu po druhé. Šablona:

```
Vytvoř data/[nazev-kategorie].json s 20 otázkami kategorie "[Název]"
podle @docs/03-kategorie-faze1.md.

Dodrž strukturu, typy a obtížnosti podle specifikace.
Každá otázka musí mít explanation.
```

Pořadí podle priority: tvoreni-slov → prevody-jednotek → slovni-ulohy →
hledani-chyby → slovni-druhy → geometrie-vypocty → logika-rady

---

## BLOK E — Denní trénink

### Prompt E1 — logika výběru

```
Přečti @docs/04-denni-trenink.md.

Implementuj logiku "Dnešní trénink":
1. Konfigurovatelný týdenní rozvrh (výchozí podle specifikace)
2. Funkce selectTodayCategory podle popsané priority
3. Fáze přípravy podle data, s možností ručního přepnutí
4. Do každého kola zamíchat 2–3 otázky z chybníku (ne na začátek)

Zatím jen logika, UI v dalším kroku.
```

### Prompt E2 — obrazovka denního tréninku

```
Podle @docs/04-denni-trenink.md vytvoř úvodní obrazovku s dnešním tréninkem.

- Pozdrav se jménem, datum
- Karta s dnešní kategorií, délkou a počtem otázek
- Tlačítko Začít trénink
- Ve dnech volna: "Dnes máš volno" + možnost přesto trénovat
- Zobrazení série
- Odkaz "Chceš něco jiného?" na ruční výběr kategorie

Použij stávající vizuální styl.
```

### Prompt E3 — statistiky

```
Podle @docs/04-denni-trenink.md implementuj dvě obrazovky statistik:

1. "Můj pokrok" pro Edu — vizuální, barevné pruhy úspěšnosti po kategoriích
   Barvy: nad 80 % zelená, 65–80 % žlutá, pod 65 % oranžová (ne červená)

2. "Přehled pro rodiče" — dostupný z nastavení
   Týdenní souhrn, slabá místa s nejčastějšími chybami, zlepšení
   Formulář pro zadání slabého místa po papírovém testu

Statistiky počítej z tabulky answers, neukládej agregace.
```

### Prompt E4 — prázdninový režim

```
Podle @docs/04-denni-trenink.md přidej možnost pauzy:

- Nastavení data, do kdy pauza trvá
- Během pauzy se nenabízí denní trénink
- Série se nepřerušuje a nepočítají se zmeškané dny
- Po skončení pauzy se vše vrátí do normálu
```

---

## Kontrolní seznam

- [ ] A1 — analýza současného stavu
- [ ] A2 — rozšíření datového modelu
- [ ] B1 — formát A/N svazek
- [ ] B2 — formát otevřená odpověď
- [ ] B3 — formát otevřená multi
- [ ] B4 — formát přiřazování
- [ ] B5 — integrace do herní smyčky
- [ ] C1 — SQL schéma
- [ ] C2 — klient a autentizace
- [ ] C3 — čtení a zápis dat
- [ ] C4 — offline režim
- [ ] C5 — import skript
- [ ] D1 — obsah: pravopis i/y
- [ ] D2 — obsah: pořadí operací
- [ ] D3 — obsah: zbývající kategorie
- [ ] E1 — logika denního tréninku
- [ ] E2 — obrazovka denního tréninku
- [ ] E3 — statistiky
- [ ] E4 — prázdninový režim

---

## Když se něco pokazí

**Cursor udělal příliš mnoho změn najednou.** Vrať se ze zálohy a rozděl prompt na menší části.

**Nefunguje něco, co fungovalo.** Popiš Cursoru přesně, co se rozbilo, a přidej: "Neměň nic jiného než tuto konkrétní věc."

**Cursor nevidí spec soubor.** Zkontroluj, že je otevřená správná složka projektu a že cesta v `@` odkazu odpovídá skutečnému umístění souboru.

**Cursor si vymýšlí strukturu, která neodpovídá specifikaci.** Zopakuj prompt s dovětkem: "Přesně podle specifikace v souboru, neodchyluj se od popsané struktury."
