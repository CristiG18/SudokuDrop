
# Sudoku Drop — Jewel Style: Build Plan

This is a large spec (6 systems, 5 game modes, economy, tournaments, backend). I'll build it in phases so you can validate look & feel early before we wire up backend/tournaments. Each phase is shippable on its own.

## Phase 1 — Design system + shell + Dropdoku core (this turn)
- Pastel "jewel" design system in `src/styles.css` (soft shadows, rounded panels, pastel palette, themed tokens for future skins).
- Main menu (airy, big Play CTA), bottom-sheet difficulty selector (Easy/Normal/Hard).
- Routes: `/` (menu), `/play/dropdoku`, `/classic`, `/daily`, `/events`, `/tournaments`, `/shop`, `/leaderboard`.
- Dropdoku engine (client-only, React state):
  - 9x9 grid, scaled cells, 6px sub-grid lines, 4px gutter jewels.
  - Domino pieces, bag system (2/3/4 sets per difficulty), Joker every 12th piece.
  - Split touch controls (L/R move, center rotate), wall-kick.
  - Line/column/3×3 box clears, gravity with bounce tween, scoring + 1.0x→1.5x→2.0x multiplier.
- Helpers UI (Hammer / Swap / Boom) with 10→6→3s anti-stalling timer overlay, board pause.
- Game-over overlay with revive (1st free / 50 💎 after).
- Global state via Zustand: diamonds, high scores, helper inventory, active skin.

## Phase 2 — Other modes
- Classic Sudoku (template-based puzzles + solver).
- Daily Challenge with deterministic weekly seed (3E/2M/2H shuffled by ISO year+week).
- Monthly Events: 100 levels, scaled difficulty bands, monthly reskin (Jan ice, Feb rose, Oct amber, …), 1st-of-month reset.
- Shop UI: diamond packs, background themes, piece skins.

## Phase 3 — Backend (Lovable Cloud)
- Enable Cloud, auth (email + Google).
- Tables: `profiles`, `diamonds_ledger`, `skins_owned`, `helpers_inventory`, `scores`, `daily_runs`, `event_progress`, `tournaments`, `tournament_entries` (+ RLS + grants + `user_roles` for admin).
- Leaderboards (All-time + Weekly).
- Tournaments matchmaking UI + prize distribution server function (1st/2nd/3rd tiers + 4–10 choice modal).

## Technical notes
- Stack stays TanStack Start + Tailwind v4 + shadcn. No Capacitor config changes needed for the web build — APK packaging is a later step (`npx cap add android` once you export).
- Anti-cheat helper timer + tournament prize grants run server-side in Phase 3 so they can't be tampered with client-side.
- All visuals use semantic tokens so the monthly reskin + shop skins are a single CSS variable swap.

## What I need from you
1. **OK to start with Phase 1 now?** (Menu + Dropdoku playable end-to-end, no backend yet.) Phases 2 & 3 follow in separate turns so each is reviewable.
2. **Auth providers** for Phase 3: email/password + Google (default), or different?
3. **Tournament real-time vs async**: async leaderboard-based (simpler, recommended for v1) or live matchmaking with presence? I recommend async.

Reply "go" and I'll start Phase 1.
