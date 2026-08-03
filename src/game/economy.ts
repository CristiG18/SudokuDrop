/**
 * Central economy rules: tickets, coins, gems, XP and percentile formatting.
 *
 * Currency flow is one-directional:
 *   real money -> gems -> coins -> tickets
 * Tournament entry costs coins; each tournament run costs one ticket.
 * Solo/offline modes are always free.
 */

export const TICKET_CAP = 5;
export const TICKET_REGEN_MS = 45 * 60 * 1000; // 1 ticket / 45 min
export const TICKET_VIDEOS_PER_DAY = 5;
export const TOURNAMENT_ENTRY_COINS = 1000;
export const TOURNAMENT_RUN_TICKETS = 1;

export interface GemsToCoinsPack {
  gems: number;
  coins: number;
}
export const GEMS_TO_COINS: GemsToCoinsPack[] = [
  { gems: 10, coins: 500 },
  { gems: 50, coins: 3000 },
  { gems: 100, coins: 7000 },
];

export interface CoinsToTicketsPack {
  coins: number;
  tickets: number;
}
export const COINS_TO_TICKETS: CoinsToTicketsPack[] = [
  { coins: 150, tickets: 1 },
  { coins: 600, tickets: 5 },
];

/** Milliseconds until the next ticket regenerates, or 0 when the meter is full. */
export function msToNextTicket(tickets: number, ticketsUpdatedAt: number, now = Date.now()) {
  if (tickets >= TICKET_CAP) return 0;
  const elapsed = Math.max(0, now - ticketsUpdatedAt);
  return Math.max(0, TICKET_REGEN_MS - (elapsed % TICKET_REGEN_MS));
}

/** How many tickets accrued since the last stamp, capped at TICKET_CAP. */
export function regenerated(tickets: number, ticketsUpdatedAt: number, now = Date.now()) {
  if (tickets >= TICKET_CAP) return { tickets, ticketsUpdatedAt: now };
  const elapsed = Math.max(0, now - ticketsUpdatedAt);
  const gained = Math.floor(elapsed / TICKET_REGEN_MS);
  if (gained <= 0) return { tickets, ticketsUpdatedAt };
  const next = Math.min(TICKET_CAP, tickets + gained);
  // Keep the remainder so partial progress is not lost.
  const stamp = next >= TICKET_CAP ? now : ticketsUpdatedAt + gained * TICKET_REGEN_MS;
  return { tickets: next, ticketsUpdatedAt: stamp };
}

export function formatCountdown(ms: number) {
  const total = Math.ceil(ms / 1000);
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

/* ------------------------------- XP / level ------------------------------- */

export function xpForLevel(level: number) {
  return 100 + 75 * (Math.max(1, level) - 1);
}

/** Applies XP and rolls over as many levels as needed. */
export function applyXp(level: number, xp: number, gained: number) {
  let lv = Math.max(1, level);
  let cur = Math.max(0, xp) + Math.max(0, gained);
  let levelsGained = 0;
  while (cur >= xpForLevel(lv)) {
    cur -= xpForLevel(lv);
    lv += 1;
    levelsGained += 1;
  }
  return { level: lv, xp: cur, levelsGained };
}

export type XpDifficulty = "easy" | "normal" | "medium" | "hard" | "expert" | "extreme";

const XP_BASE: Record<string, number> = {
  easy: 10,
  normal: 20,
  medium: 20,
  hard: 35,
  expert: 50,
  extreme: 50,
};

/** XP for a finished run: difficulty base + a small score bonus, x1.5 in tournaments. */
export function xpForRun(difficulty: string, score: number, tournament = false) {
  const base = XP_BASE[difficulty] ?? 20;
  const bonus = Math.min(50, Math.floor(Math.max(0, score) / 500));
  return Math.round((base + bonus) * (tournament ? 1.5 : 1));
}

/** Reward granted on level-up: coins always, a ticket every 5 levels. */
export function levelUpReward(level: number) {
  return { coins: 50 + level * 10, tickets: level % 5 === 0 ? 1 : 0 };
}

/* ------------------------------- Percentile ------------------------------- */

/**
 * Buckets a raw percentile (0 = best) into the display ladder:
 * top 1%, then 5..25 in steps of 5, then top 50, top 75, then bottom 25%.
 */
export function formatPercentile(percent: number): string {
  const p = Math.min(100, Math.max(0, percent));
  if (p <= 1) return "Top 1%";
  for (const step of [5, 10, 15, 20, 25]) {
    if (p <= step) return `Top ${step}%`;
  }
  if (p <= 50) return "Top 50%";
  if (p <= 75) return "Top 75%";
  return "Ultimii 25%";
}

/**
 * Estimated percentile from a score against a reference "good" score.
 * Deterministic curve — no server data needed for the offline build.
 */
export function estimatePercentile(score: number, reference: number) {
  if (reference <= 0) return 50;
  const ratio = score / reference;
  // ratio 0 -> 95th percentile (bottom), ratio >= 2 -> top 1%.
  const p = 95 * Math.exp(-1.6 * ratio);
  return Math.min(99, Math.max(0.5, p));
}

/** Same idea for time-based puzzles: lower time is better. */
export function estimateTimePercentile(seconds: number, reference: number) {
  if (seconds <= 0 || reference <= 0) return 50;
  return estimatePercentile(reference / seconds, 1);
}
