# Školní Trénink

Aplikace na procvičování učiva 4. a 5. třídy ZŠ — vyjmenovaná slova, předpony vy-/vi-, malá násobilka a sčítání/odčítání do 100.

## Spuštění lokálně

```bash
npm install
npm run dev
```

## Nasazení na Vercel

1. Nahraj projekt na GitHub
2. Na [vercel.com](https://vercel.com) propoj repozitář
3. Vercel automaticky detekuje Vite a nasadí

## PWA — instalace na mobil

- **iOS Safari**: Sdílení → Přidat na plochu
- **Android Chrome**: Menu → Nainstalovat aplikaci

## Struktura projektu

```
src/
├── App.jsx              # Hlavní komponenta
├── main.jsx             # Entry point
├── components/
│   ├── TimerRing.jsx    # Kruhový odpočet
│   └── ConfettiBurst.jsx # Animace konfet
├── data/
│   ├── constants.js     # Kategorie, texty, konstanty
│   ├── vyjna.js         # Vyjmenovaná slova
│   └── predpony.js      # Předpony vy-/vi-
├── hooks/
│   └── useProgress.js   # localStorage persistence
└── utils/
    ├── questions.js     # Generátor otázek
    ├── sounds.js        # Web Audio zvuky
    └── styles.js        # Sdílené styly (liquid glass)
```

## Technologie

- Vite + React 18
- PWA (vite-plugin-pwa)
- localStorage pro ukládání pokroku
- Web Audio API pro zvuky
