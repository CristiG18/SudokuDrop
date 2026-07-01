# Fix-uri urgente + Monede + Auth (Phase 3)

## A. Fix-uri gameplay & UI

### 1. Bătălie funcțională
- `battle.tsx`: state local pentru mod selectat (`duel` / `timeattack`) — chip-urile devin butoane reale cu `active` derivat din state.
- Tier-urile au buton „Joacă · N 🎟" activ când ai destule tichete → navighează la `/play/battle?mode=...&tier=...` (rută nouă simplă bazată pe dropdoku engine, seed fix pt duel).
- Header afișează `🎟 X` (tichete curente) și `🪙 X` (monede) — mic tooltip la tap pe „i": „Tichetele se câștigă din login zilnic și turnee".

### 2. Continue card pe Home
- În `index.tsx`, `ContinueCard` apare **doar** dacă `classicSession` sau `dropdokuSession` există.
- Dacă ambele există → 2 carduri separate stacked (unul pt Drop, unul pt Clasic), fiecare cu buton propriu „Continuă".

### 3. Dropdoku gesturi globale
- Mut listener-ele swipe/tap din `Board.tsx` pe un wrapper full-screen în `play.dropdoku.tsx` (div `fixed inset-0` la nivel de rută, `pointer-events` doar când helper mode e off).
- Board păstrează doar interacțiunea pt helperi (tap pe celule).
- Swipe-down oriunde pe ecran = hard drop; drag stânga/dreapta = mută; tap în zone 30% = shift, 40% centru = rotate.

### 4. Clasamente — adaugă Clasic
- `leaderboard.tsx`: tabs principale Dropdoku / Clasic; la Clasic sub-tabs pe dificultate (easy/medium/hard/expert/extreme), fiecare cu top 50 seed + user injectat cu high-score-ul lui pe dificultatea respectivă.

### 5. Eveniment lunar — reset & lock
- `events.tsx`: elimin bifările hardcodate. Progres real citit din store nou `monthlyProgress: Record<string, boolean>` (key = `YYYY-MM-day`).
- Zilele completate afișează bifă + „Rejucat" disabled (nu se pot rejuca). Ziua curentă e „Joacă", zilele viitoare sunt lock.
- Reset automat când se schimbă luna.

## B. Sistem monede + tichete + calendar login

### Store
- `game-store.ts`:
  - `coins: number` (câștigate din turnee + login zilnic).
  - `tickets: number` (default 3, folosite la battle).
  - `loginStreak: number`, `lastLoginDate: string` (YYYY-MM-DD).
  - `claimDailyReward()` — verifică data curentă vs `lastLoginDate`: dacă e o zi nouă consecutivă → streak++, dacă e gap → reset la 1. Recompensă = `10 + min(streak, 7) * 5` monede + 1 tichet la fiecare 3 zile.
  - `addCoins`, `spendCoins`, `addTickets`, `useTicket`.

### UI
- Componentă `<DailyRewardModal/>` — apare pe home dacă `lastLoginDate !== today`. Grid 7 zile, ziua curentă pulsă, buton „Colectează". Reset vizual la ziua 8.
- Regula gemuri: **doar achiziții shop** (păstrat). Recompensele in-game (win turneu/battle, daily) → monede + tichete.
- Shop: adaug secțiune „Cumpără cu monede" pt helperi (alternativă la gemuri). Skinurile rămân doar pe gemuri.

## C. Phase 3 — Backend (Lovable Cloud)

Enable Lovable Cloud (Supabase managed) pentru:
1. **Auth cu Google** (Gmail) — buton pe pagina nouă `/auth` + link în `settings.tsx`.
2. **Profil** (`profiles` table): `id (uuid, FK auth.users)`, `display_name`, `avatar_url`, `created_at`.
3. **Sync progres**:
   - Tabel `player_stats`: `user_id`, `diamonds`, `coins`, `tickets`, `login_streak`, `last_login`, `high_scores` (jsonb), `owned_skins` (text[]), `active_skin`.
   - Server function `syncProfile` — la login, upload state local dacă e mai mare, altfel pull.
   - Store zustand: `hydrateFromCloud()` + `pushToCloud()` (debounced la modificări).
4. **Leaderboard global** (opțional în această fază, doar schema):
   - Tabel `leaderboard_entries`: `user_id`, `mode` (dropdoku/classic), `difficulty`, `score`, `created_at`.
   - Server function `submitScore` + `getTopScores(mode, difficulty, limit)`.
   - `leaderboard.tsx` folosește date reale când user e logat, fallback seed dacă nu.
5. **RLS**: policies standard — user citește/scrie doar propriul rând la `profiles`/`player_stats`; leaderboard SELECT public, INSERT doar own.
6. Auto-create profile via trigger `handle_new_user`.

## D. Fișiere

### Modificate
- `src/routes/battle.tsx` — state + navigare
- `src/routes/index.tsx` — continue cards condiționate + daily modal trigger
- `src/routes/play.dropdoku.tsx` — global gestures wrapper
- `src/components/game/Board.tsx` — scot gesture-urile de mișcare (doar helperi)
- `src/routes/leaderboard.tsx` — tabs Dropdoku/Clasic
- `src/routes/events.tsx` — progres real, lock zile viitoare/completate
- `src/routes/shop.tsx` — secțiune monede
- `src/routes/settings.tsx` — buton „Conectează cu Google"
- `src/store/game-store.ts` — coins/tickets/loginStreak/monthlyProgress + acțiuni

### Create
- `src/components/DailyRewardModal.tsx`
- `src/routes/auth.tsx`
- `src/routes/play.battle.tsx`
- `src/lib/cloud-sync.functions.ts` (după enable Cloud)
- Migration Supabase: `profiles`, `player_stats`, `leaderboard_entries` + trigger + RLS

## E. În afara scope-ului
- Plăți reale Stripe (rămâne pt după).
- SDK rewarded ads real (rămâne stub).
- Turnee lunare cu premii distribuite automat (schema pregătită, cron ulterior).

Confirmi și încep implementarea? Enable Lovable Cloud automat la pornire.