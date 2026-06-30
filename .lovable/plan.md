# Polish pass + Shop / Leaderboard / Skins

Toate modificările sunt frontend (fără backend nou). Magazinul, skinurile și clasamentul rulează pe state local (zustand) cu seed pentru top — gata să fie conectate la Cloud în Faza 3.

## 1. Sudoku Drop — alegere dificultate la „Joacă acum"

- Pe Home, butonul `Joacă acum` deschide un **bottom-sheet** cu 3 carduri: **Ușor / Normal / Dificil** (descrieri scurte: nr. de seturi din sac).
- Dacă există `dropdokuSession` activă → primul card devine **„Continuă (Normal · 02:14 · 1240p)"** cu timp scurs + scor.
- După alegere → `navigate /play/dropdoku?difficulty=...`.
- Bottom-sheet reutilizabil (`<DifficultySheet/>`) — folosit și mai jos pentru clasic.

## 2. Sudoku Clasic — fix evidențiere, timer/limită, scoring

### Evidențiere
- În `play.classic.tsx`, highlight-ul pe rând/coloană/box folosea `border` care suprapunea bordurile groase 3×3. Schimb pe **background tint + ring intern** (`bg-primary/8`, `ring-1 ring-inset ring-primary/20`) — bordurile externe și separatorii 3×3 rămân vizibile.
- Celula selectată: ring intern mai gros, fără să taie marginea tablei.

### Cifre rămase (1–9 footer)
- Card individual mai pronunțat: fundal `bg-accent`, badge cu count în colț, opacitate redusă (`opacity-40 grayscale`) când cifra e completă, ring activ când e cifra selectată. Layout 9 coloane egale, ușor mai înalte.

### Timer + limită + scoring
- Difficulty → timp maxim: easy 30', medium 25', hard 20', expert 17', extreme 12' (afișat în header).
- 3 greșeli **sau** depășirea timpului → game over.
- Scor la final: `base[difficulty] * (timeLeft / totalTime) - mistakes*150 - hintsUsed*100`, minim 0. Salvat în `highScores.classic[difficulty]`.
- Adăugat în store: `highScores.classic`, `setClassicHighScore`.
- Game-over modal: scor, timp, „Joacă din nou" / „Înapoi".

## 3. Pauză + reluare sesiune

### Pauză (clasic + dropdoku solo)
Sheet cu 3 (sau 4) butoane:
- **Continuă** (resume)
- **Restart** (doar solo — clasic & dropdoku)
- **Meniu principal** (păstrează sesiunea)
- **Ieși** (șterge sesiunea)

La turnee & 1v1 (`battle`, `tournaments`) → fără Restart, fără păstrare sesiune.

### Home – „Continuă jocul"
- Dacă există `classicSession` SAU `dropdokuSession` → deasupra cardurilor carusel apare un card **„Continuă"** prioritar cu:
  - Mod (Dropdoku / Clasic) + dificultate
  - Timp scurs (HH:MM)
  - Tap → reia jocul direct.
- Butonul mare `Joacă acum` rămâne (deschide difficulty sheet pentru dropdoku nou).

## 4. Helper "Cross" badge fix

`HelperBar` — badge count e deja generic, dar `cross` n-are același styling vizual (probabil tăiat de `overflow`). Verificare: badge poziționat `-top-1 -right-1` cu `z-10`, container `relative` + `overflow-visible`. Aplic fix global pe toate cele 4.

## 5. Rewarded-video pentru helperi

Când userul tapează un helper la **count 0**:
- Apare modal `<RewardedHelperModal helper="bomb">`:
  - Pas 1: **„Vezi un video — primești 1 [helper]"** (gratuit, max 3 vizionări pe meci per helper, tracked în store: `rewardsUsed[matchId][helper]`).
  - După 3 vizionări: pas 2 devine **„Cumpără 3 [helper] — 100 💎"**.
- "Video" = simulare locală cu progress bar 5s + fade (fără SDK ads acum, stub `await playRewardedAd()`). Backend Cloud îl va înlocui mai târziu.
- Recompensă: `addHelpers(helper, 1)` (video) sau `addHelpers(helper, 3)` + `spendDiamonds(100)`.

## 6. Shop (frontend, fără plăți)

`src/routes/shop.tsx` reactivat:
- **Tab Diamante**: 4 pachete (100 / 500 / 1200 / 3000) — buton „Cumpără" → toast „În curând (necesită plată)". Disabled pentru moment; pregătit pentru Stripe/Paddle.
- **Tab Skinuri jucărie**: 4 skin-uri pentru piese dropdoku — `default` (deținut), `glass`, `neon`, `wood`. Cost 300 💎 fiecare, plată cu gemuri locali, `unlockSkin` + `setSkin`.
- **Tab Helperi**: pachete 3×Hammer/Swap/Bomb/Cross — 100 💎.
- Card mic „Skin activ" sus.
- Vizual: carduri cu accent stâng, preview piesă mini.

## 7. Skinuri aplicate

În `Jewel.tsx` — variantă vizuală în funcție de `activeSkin`:
- `default`: cel actual (pastel disc).
- `glass`: gradient alb translucid + border subțire.
- `neon`: fundal închis + glow primary.
- `wood`: tonuri caramel + textură noise CSS.
Aplicat pe Board (dropdoku). Nu schimbă logica.

## 8. Leaderboard local (frontend)

`src/routes/leaderboard.tsx`:
- Tabs: **Dropdoku** / **Clasic** (cu sub-tabs per dificultate la clasic).
- Top 50 generat seed-static (nume + scoruri credibile), userul curent inserat cu high-score-ul lui și marcat cu badge „Tu".
- Footer: „Clasamentul real se activează cu Lovable Cloud".

## 9. Tehnic — fișiere atinse

- `src/store/game-store.ts` — `highScores.classic`, `classicSession.startedAt`, `dropdokuSession.startedAt`, `rewardsUsed`, helper counters cross fix.
- `src/components/DifficultySheet.tsx` (nou) — reutilizabil.
- `src/components/RewardedHelperModal.tsx` (nou).
- `src/components/PauseSheet.tsx` (nou) — reutilizat în play.classic & play.dropdoku.
- `src/components/ContinueCard.tsx` (nou) — afișat pe Home.
- `src/components/game/Jewel.tsx` — skin variants.
- `src/components/game/HelperBar.tsx` — badge fix + handler pentru count 0 → open rewarded modal.
- `src/routes/index.tsx` — Continue card + Joacă acum → DifficultySheet.
- `src/routes/play.classic.tsx` — timer/limită, scoring, highlight fix, footer counts redesign, pause sheet, rezultat final.
- `src/routes/play.dropdoku.tsx` — pause sheet, rewarded modal, startedAt persistat.
- `src/routes/shop.tsx` — implementare completă.
- `src/routes/leaderboard.tsx` — date locale + user inject.
- `src/styles.css` — clase tint utilitare dacă lipsesc.

## 10. În afara scope-ului acestei runde

- Plăți reale (Stripe/Paddle) — separat.
- Backend Cloud (Supabase): clasamente reale, daily, turnee, recompense din ad — următoarea fază.
- SDK real de rewarded ads — necesită integrare Capacitor.
