# Přijímačkový modul — přehled

## Cíl

Rozšířit stávající appku Školní Trénink o modul pro přípravu na jednotné přijímací zkoušky (JPZ) na osmiletá gymnázia. Zkouška je v dubnu 2027.

## Rozdělení práce: appka vs. papír

Toto rozdělení je zásadní pro celý návrh. Neplatí, že appka má nahradit testy — má dělat to, co papír neumí.

**Appka dělá denní dril:**
- Krátké bloky 15–20 minut
- Okamžitá zpětná vazba
- Adaptivní opakování slabých míst
- Sledování pokroku po tématech

**Papír dělá simulaci zkoušky:**
- Celé testy z cermat.cz na čas
- Práce se záznamovým archem
- Time management na 60/70 minut
- Konstrukční úlohy (rýsování)
- Čtení s porozuměním v plném rozsahu

**Propojení:** Po papírovém testu se do appky zadají slabé kategorie a appka na ně zacílí dril na další týden.

## Co appka pokrývá

### Čeština
| Kategorie | Formát | Poznámka |
|---|---|---|
| Pravopis i/y ve větách | A/N svazek | 4 věty, rozhodni správně/špatně |
| Hledání chyby ve větě | ABCD | Která věta NENÍ správně |
| Slovní druhy | ABCD | Urči slovní druh slova v kontextu |
| Tvoření slov | Otevřená odpověď | Zdrobněliny, vzory, příbuznost |
| Význam slov | ABCD | Synonyma, antonyma, přenesený význam |

### Matematika
| Kategorie | Formát | Poznámka |
|---|---|---|
| Pořadí operací | Otevřená odpověď | Napiš výsledek |
| Převody jednotek | Otevřená odpověď | Doplň číslo do rovnosti |
| Jednoduché slovní úlohy | Otevřená odpověď | Trojčlenka, úměrnost |
| Geometrie — výpočty | Otevřená odpověď | Obvod, obsah, čtvercová síť |
| Logika a řady | ABCD / Otevřená | Najdi pravidlo, spočítej člen |

## Co appka NEPOKRÝVÁ (zůstává na papíře)

- Čtení s porozuměním (potřebuje celý text + sadu otázek)
- Seřazení částí textu (6 částí najednou)
- Konstrukční úlohy (rýsování kružítkem)
- Vytvoř vlastní větu podle podmínek (potřebuje lidské hodnocení)
- Práce s grafem v kontextu celého testu

## Struktura dokumentace

| Soubor | Obsah | Kdy použít |
|---|---|---|
| `00-prehled.md` | Tento soubor — kontext a rozcestník | Na začátku, pro orientaci |
| `01-datovy-model.md` | Struktura otázek, kategorií, výsledků | Před jakoukoli prací s daty |
| `02-formaty-uloh.md` | Nové typy úloh, UI a vyhodnocení | Při implementaci formátů |
| `03-kategorie-faze1.md` | Konkrétní kategorie s příklady otázek | Při plnění obsahu |
| `04-denni-trenink.md` | Logika denního plánu a statistik | Až po základních formátech |
| `05-supabase.md` | Databázový model a synchronizace | Po dokončení formátů |
| `06-prompty.md` | Sada promptů pro Cursor v pořadí | Průběžně při vývoji |

## Doporučené pořadí implementace

1. **Datový model** — rozšířit strukturu otázek o nové typy
2. **Formáty úloh** — A/N svazek, otevřená odpověď, přiřazování
3. **Supabase** — napojit dřív, než se naplní obsah
4. **Obsah** — postupně plnit kategorie otázkami
5. **Denní trénink** — logika návrhu co dnes procvičit
6. **Statistiky** — přehled úspěšnosti po kategoriích

**Důležité:** Supabase napojit PŘED plněním obsahu. Migrace stovek otázek a odtrénovaných výsledků z localStorage je zbytečná práce.

## Stávající stav appky

- Vite + React, deploy na Vercelu přes GitHub
- PWA, instalovatelná na telefon
- localStorage pro persistenci (hvězdy, mince, streak, chybník)
- Kategorie v1: vyjmenovaná slova, předpony vy-/vi-, malá násobilka, sčítání/odčítání do 100
- Herní mechaniky: 10 otázek na kolo, dvě obtížnosti, hvězdy + mince, streak, chybník, checkpoint

Nový modul musí tyto mechaniky zachovat a využít — přijímačkové kategorie se chovají stejně jako stávající, jen mají jiné formáty úloh.

## Zásady

- **Nekopírovat otázky z Cermatu.** Vlastní otázky stejného typu a obtížnosti.
- **Zachovat stávající mechaniky.** Hvězdy, mince, chybník fungují i pro nové kategorie.
- **Nezahltit.** Bloky 15–20 minut, ne víc. Přetížení je největší riziko.
- **Formát Cermatu.** Úlohy musí vypadat a fungovat jako v testu, aby nebyl formát překvapením.
