# Economie: Tichete, Monede, Gemuri + Turnee + XP/Level

## 0. Fix blocant (întâi)

Dicționarul de traduceri are cheia „Aur" duplicată (liniile 156 și 276) — asta oprește build-ul acum. Se șterge duplicatul.

## 1. Fluxul valutelor (o singură direcție)

```text
Bani reali ──> 💎 Gemuri ──> 🪙 Monede ──> 🎟️ Tichete
                                 └──> înscriere turneu (1000 🪙)
```

- **Gemuri → Monede**: pachete de schimb (ex. 10 💎 = 500 🪙, 50 💎 = 3000 🪙, 100 💎 = 7000 🪙 — bonus la pachetele mari).
- **Monede → Tichete**: ex. 150 🪙 = 1 tichet, 600 🪙 = 5 tichete.
- Nu există conversie inversă (tichete/monede nu se transformă în gemuri).

## 2. Tichete

- Capacitate maximă: **5**. (Pentru tichetele din reclame sau cumpărate cu bani se poate pune suplimentar)
- Regenerare: **1 tichet / 45 min**, doar până la maxim 5 (nu se acumulează peste).
- Timer vizibil în bara de sus („următorul tichet în MM:SS").
- **Video reward**: se primește până la maxim 5 bilete. Fiecare video vizionat returnează 1 bilet, limitat la **5 vizionări/zi** (contor resetat la miezul nopții local).
- Cumpărare cu monede oricând (vezi mai sus), inclusiv peste plafonul de 5.
- Un tichet se consumă la **fiecare joc din turneu / Battle**.

## 3. Mod offline = gratuit

- Toate modurile solo (Clasic, Dropdoku, Rush, Time Rush, Daily, Evenimente) → **fără cost de tichet**, oricând.
- Tichetele se folosesc **doar** pentru meciurile competitive (turneu / Battle / Time Attack).

## 4. Turnee

- **Înscriere: 1000 🪙**, o singură dată pe sezon (sezon = 1 săptămână, luni 00:00 → duminică 23:59).
- După înscriere, fiecare rundă jucată costă **1 🎟️**.
- Se contorizează cel mai bun scor din sezon; clasamentul se închide duminică seara și premiile (gemuri, tichete, skinuri/culori) merg la primele locuri.
- Ecran turneu: status înscriere, monede curente, buton „Înscrie-te (1000 🪙)", apoi „Joacă (1 🎟️)".
- Dacă nu ai monede → pop-up cu schimb gemuri→monede; dacă nu ai tichete → pop-up cu video / schimb monede→tichete.

## 5. XP și niveluri

- XP din orice joc terminat: bază după mod + bonus scor/dificultate (ex. Ușor 10, Normal 20, Greu 35, Expert/Extrem 50; turneu ×1.5).
- Curba: `XP_necesar(level) = 100 + 75 * (level - 1)` — creștere lineară, ușor de citit.
- Bară de progres pe `/personal` și mini-indicator în meniul principal; animație „Level up!" cu recompensă (monede + un tichet la fiecare 5 niveluri).

## 6. Clasare procentuală (top X%)

Afișare după fiecare joc și în clasamente, cu granularitate descrescătoare:

- Top 1%, apoi **din 5 în 5** până la 25%: 5%, 10%, 15%, 20%, 25%
- Apoi: **Top 50%**, **Top 75%**, iar restul: **Ultimii 25%**
Funcție unică `formatPercentile(p)` folosită peste tot, ca să nu apară valori inconsistente.

## 7. Detalii tehnice

**Store (`src/store/game-store.ts`)**

- Câmpuri noi: `ticketsUpdatedAt` (pentru regenerare offline-safe), `ticketVideosToday` + `ticketVideoDate`, `xp`, `level`, `tournament: { seasonKey, entered, bestScore, runs }`.
- Acțiuni: `regenTickets()` (calcul din timestamp la mount + interval), `watchAdForTickets()`, `exchangeGemsForCoins(pack)`, `exchangeCoinsForTickets(pack)`, `enterTournament()`, `addXp(n)`.
- Bump versiune persist + `sanitizeState` pentru câmpurile noi.

**Fișiere noi**

- `src/game/economy.ts` — constante pachete, cost înscriere, regen, curba XP, `formatPercentile`.
- `src/components/ExchangeSheet.tsx` — schimb gemuri→monede și monede→tichete.
- `src/components/TicketMeter.tsx` — contor + timer regenerare + buton video.
- `src/components/XpBar.tsx`.

**Fișiere modificate**

- `src/routes/battle.tsx` — înscriere turneu 1000 🪙, cost 1 🎟️ pe rundă, sezon săptămânal.
- `src/routes/play.dropdoku.tsx`, `src/routes/play.classic.tsx` — solo gratuit, acordare XP la final, afișare percentilă.
- `src/routes/personal.tsx` — nivel, XP, statistici.
- `src/routes/shop.tsx` — tab „Schimb" (gemuri→monede, monede→tichete).
- `src/routes/index.tsx` — TicketMeter + XpBar în header.
- `src/i18n/dictionaries.ts` — texte noi (+ fix duplicat).

Confirmi și încep?