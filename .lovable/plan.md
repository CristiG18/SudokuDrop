# Plan — Polish pass + Phase 3 (backend)

Splitting into clear blocks. I'll implement A→D in this turn; E (backend) follows after you OK the visual changes.

## A. Dropdoku gameplay fixes

1. **Per-cell gravity (split pieces)** — rewrite `applyGravity` so every locked cell falls independently per column. A horizontal domino landing on top of a 3-tall column now splits: the supported half stays, the unsupported half keeps falling to the floor. Runs after every lock and after every cascade clear.
2. **Hard-drop button** — add a prominent ⬇ button in the control row, plus keep double-tap. Tween the piece down with a quick ease-out so it reads as a "slam".
3. **Drag-to-move with finger** — add pointer handlers on the board: horizontal drag moves the active piece column-by-column (threshold ≈ cellSize/2), short tap rotates, swipe down = hard drop. Existing left/right zones stay for users who prefer them, but the board itself becomes draggable.
4. **Line/box clear FX** — when a unit clears: jewel scale-pop + white flash + score pop-up ("+120 ×1.5") rising from the cleared center, plus a short WebAudio "chime" (no asset, generated via OscillatorNode so no extra files). Async via `setTimeout` so render never stalls.
5. **Back = pause + resume modal** — intercepting the back arrow opens a pause sheet with **Continuă** / **Joc nou** / **Ieși**. Game state is preserved in the zustand store under `dropdokuSession` so "Continuă" works even after navigating away (only for solo modes — disabled when we add 1v1).

## B. Home + navigation

- Home hero changes from "Sudoku Clasic" to **"Sudoku Drop"** as the primary CTA (the signature mode). Classic becomes the secondary card.
- New **Tutorial** entry on home + under Explorează: `/tutorial` index listing all modes; each mode has its own page (`/tutorial/dropdoku`, `/tutorial/classic`, `/tutorial/daily`, `/tutorial/events`, `/tutorial/battle`) with short illustrated steps + "Joacă acum" button.

## C. Classic Sudoku polish

- Difficulty cards on `/classic` show only the **label** (Ușor / Mediu / Greu / Expert / Extrem) — remove the clue-count subtitle.
- **Hints limited to 3** per run, shown as a counter on the bulb button; disabled at 0.
- **Auto-complete toggle** in a new `/settings` page (persisted in zustand). When ON: as soon as only one candidate remains for each empty cell across the whole grid, the rest auto-fills with a short cascade animation.
- **Pause-on-back**: intercept the back button → pause modal with **Continuă** / **Joc nou**. Active classic run is saved in zustand so users can resume from home.
- **Board corner fix**: the inner grid currently shows square corners poking out of the rounded card. Fix by giving the board wrapper `overflow-hidden` + matching inner radius, and removing the outer border that creates the visual seam.
- **End-of-run percentile**: on win, compute and show "Ești în top X%" using buckets 1, 5, 10, 20, 30, 40, … 100. v1 = local heuristic based on time vs difficulty baseline; v2 (Phase E) replaces with real server percentile from the scores table.
- **Streak rewards**: track consecutive Classic wins in zustand. At 3/5/10 wins in a row → award diamonds + a toast. This feeds into tournament eligibility later.

## D. Visual differentiation

You liked the reference style but don't want a copy. Adjustments so it's clearly ours:
- Asymmetric header: small avatar + greeting top-left, diamond chip top-right (instead of centered title).
- Mode cards use a **left accent bar** + soft pill icon, not full-bleed colored cards.
- Number pad: 3×3 grid layout with a wider central "0/erase" zone instead of a 9-wide strip.
- Custom typography pair: **Sora** (display) + **Inter** (body), loaded via `<link>` in `__root.tsx`.
- Soft "frosted" pause/win modals with a thin gradient border.

## E. Phase 3 — backend (separate next turn, after A–D approved)

Lovable Cloud + Supabase. Tables: `profiles`, `diamonds_ledger`, `skins_owned`, `helpers_inventory`, `scores` (mode, difficulty, score, time_seconds, created_at), `daily_runs`, `event_progress`, `tournaments`, `tournament_entries`, `user_roles` (admin gate). RLS + grants per the rules. Auth: email + Google. Server functions for: submit_score (computes real percentile), claim_daily, tournament prize distribution, helper-timer anti-cheat validation. Leaderboards page wired to real data; percentile on win modal switches to server value.

---

## Technical notes (skippable)

- Gravity rewrite is in `src/game/engine.ts` `applyGravity` — already iterates columns; just need to keep it the way it is and call it after `lockPiece` even when no clears happen (currently only called inside the cascade path).
- Drag handler: `onPointerDown/Move/Up` on the board wrapper; track `startX`, compare `(currentX - startX) / cellSize` to derive column delta; commit via `tryMove`. Throttle with `requestAnimationFrame`.
- Audio: lazy `new AudioContext()` on first user gesture (mobile autoplay policy), one `playChime(freq, dur)` helper. No asset files.
- Percentile buckets: `const buckets = [1,5,10,20,30,40,50,60,70,80,90,100]; return buckets.find(b => pct <= b)`.
- Auto-complete singles: scan empty cells, for each compute candidate set (row ∪ col ∪ box complement of solution), if all empties have exactly one candidate → fill in 50ms intervals.
- Resume state: `dropdokuSession` and `classicSession` in zustand `persist`. Cleared on win/lose or "Joc nou".

OK to proceed with A–D now? Phase E (backend) will be a separate turn so you can review each.
