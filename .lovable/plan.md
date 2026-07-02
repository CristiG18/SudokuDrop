# Phase 4 — Polish, Skins, Game Over, Fixuri + Moduri Noi

## 1. Temă / Culori (setare user)
- Culoare **default: Verde Smarald**.
- `ThemePicker` în `/settings` cu 4 nuanțe inițiale: Verde Smarald (default), Portocaliu-maroniu, Albastru, Roz-coral.
- Aplicare prin `data-theme="..."` pe `<html>` + override CSS variables în `styles.css`.
- Elimin culorile hardcodate care creau flip portocaliu↔albastru; totul pe `--primary`.
- 20+ nuanțe suplimentare de skin în `/shop` tab „Teme" — cumpărate cu gemuri sau câștigate ca premii turneu. `ownedThemes` în store.

## 2. Brand + Logo
- Numele afișat: **Sudoku Drop** cu subtitlu / alias **„aka Dropdoku"**. Folosit în tot UI-ul (home, splash, meta head).
- Logo nou: grilă Sudoku 3×3 stilizată din care o piesă de tip domino / bloc cade în celula finală, palette verde smarald cu accent (bijuterie subtilă). Generat cu `imagegen` premium (text legibil „Sudoku Drop"), salvat în `src/assets/logo.png`.
- Update `head()` în `__root.tsx` cu titlu/descriere „Sudoku Drop (Dropdoku)".

## 3. Dropdoku — fixuri majore
- **Piesele continuă să cadă când ies din app**: tick în `useRef` + cleanup; pauză la `visibilitychange` (tab hidden) și la unmount. Salvez `paused: true`.
- **Butoane rapide opresc căderea**: gravity interval separat de input, deps stabile în `useRef`.
- **Spawn deasupra tablei**: piesele apar la `r: -3`; rendering ignoră r<0; se opresc corect jos.
- **Toate dificultățile funcționale**: fix la Ușor/Normal/Dificil.
- **Game Over**: opresc render piesă curentă + next; afișez `GameOverModal`:
  - **Revive video** (rewarded simulat) — 1x/joc, gratis
  - **Revive gems** — 100 → 200 → 400 → 800 (dublare fiecare folosire)
  - **Joc nou** / **Meniu**
  - Revive = curăț top 3 rânduri.

## 4. Continue Card condiționat
- Session ștearsă la game over / new game / meniu.
- Apare doar dacă există sesiune activă neterminată — separat Drop și Clasic.

## 5. Daily reward + Come-back bonus
- Modal daily doar prima dată/zi (`dailySeenAt` sessionStorage).
- La reintrare în app după ≥6h: 1 💎 per 6h (max 3 💎 la 18h+). Micro popup „Bine ai revenit! +N 💎". Persist `lastAppExit` în localStorage.

## 6. Rute cu eroare
- `/leaderboard` Clasic: tab funcțional cu difficulty selector.
- `/events` play level: navigare corectă → `/play/classic?level=N&event=monthly`; la win `markMonthlyLevel(N)`.
- `/daily`: redirect `/play/classic?daily=YYYY-MM-DD` cu seed determinist.

## 7. Shop — pop-up „Not enough gems"
- Când `diamonds < cost` → `BuyGemsModal` cu 4 pachete (100 / 500 / 1500 / 5000 💎).

## 8. Battle — Time Attack
- **Cost fix: 1 tichet indiferent de timp**.
- Selector: **2 / 3 / 5 / 10 min**.
- `?mode=timeattack&seconds=N`.
- Timer descrescător mare vizibil.
- `navigator.vibrate` la fiecare minut trecut.
- Ultimele 10s: countdown pulsant + vibrație scurtă + tick sound.
- La 0 → game over.

## 9. Moduri noi (3)
- **Ice Mode** (`?variant=ice`): 3-5 celule înghețate — nu poți plasa peste ele; se sparg când completezi rândul/coloana adiacentă.
- **Rush Mode** (`?variant=rush`): gravity +15% la fiecare 30s.
- **Time Rush** (`?variant=timerush`) — NOU:
  - **3 minute** scor max.
  - **+10s** la fiecare linie/coloană spartă.
  - **+15s** la fiecare box 3×3 complet.
  - Grade de dificultate (bag mai mic la Ușor).
  - La 0 → revive video → revive gems (100/200/400...).
- Toate accesibile din `/explore`.

## 10. Fișiere

**Nou:**
- `src/components/GameOverModal.tsx`
- `src/components/BuyGemsModal.tsx`
- `src/components/ThemePicker.tsx`
- `src/components/ComeBackBonus.tsx`
- `src/assets/logo.png` (generat)

**Modificate:**
- `src/store/game-store.ts` — theme (default emerald), ownedThemes, reviveCount, lastAppExit, dailySeenAt
- `src/routes/play.dropdoku.tsx` — tick useRef, spawn r=-3, visibility pause, game over + revive, timeattack, variants (ice/rush/timerush)
- `src/routes/battle.tsx` — Time Attack cost fix 1 tichet + selector timp
- `src/routes/leaderboard.tsx` — tab Clasic
- `src/routes/events.tsx` + `src/routes/daily.tsx` — navigare + progres
- `src/routes/shop.tsx` — tab Teme + BuyGemsModal
- `src/routes/settings.tsx` — ThemePicker
- `src/routes/__root.tsx` — data-theme, logo, meta „Sudoku Drop"
- `src/routes/index.tsx` — logo nou, brand „Sudoku Drop (aka Dropdoku)", daily modal condiționat, continue card fix
- `src/styles.css` — verde smarald ca default + variante teme + 20+ skinuri
- `src/routes/explore.tsx` — 3 moduri noi
- `src/game/engine.ts` — return `boxCleared` pentru timer bonus

Confirmi și încep?
