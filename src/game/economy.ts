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
  { coins: 500, tickets: 1 },
  { coins: 2000, tickets: 5 },
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

/* ----------------------------- Tournaments ------------------------------- */

/**
 * Two tournament families:
 *
 * 1. Versus — a knockout bracket (4 / 8 / 16 players) on an identical seed.
 *    Every match lasts 3 minutes; the higher score advances. The champion takes
 *    the whole pot, the runner-up gets the entry fee back.
 * 2. Time Attack — weekly ladder on 3 / 5 / 10 minutes and four tiers.
 *    Ranking is the best score in a single match (time can be extended by
 *    clearing lines/columns/boxes, so only the score matters).
 */

export const VERSUS_MATCH_SECONDS = 180;

export const VERSUS_SIZES = [4, 8, 16] as const;
export type VersusSize = (typeof VERSUS_SIZES)[number];

export const VERSUS_FEES = [
  100, 500, 1000, 2500, 5000, 10000, 50000, 100000, 250000, 500000, 1000000,
] as const;
export type VersusFee = (typeof VERSUS_FEES)[number];

export interface VersusDifficulty {
  id: "easy" | "medium" | "hard";
  name: string;
  /** Engine difficulty used for the falling pieces. */
  engine: "easy" | "normal" | "hard";
  minLevel: number;
}

export const VERSUS_DIFFICULTIES: VersusDifficulty[] = [
  { id: "easy", name: "Ușor", engine: "easy", minLevel: 1 },
  { id: "medium", name: "Mediu", engine: "normal", minLevel: 3 },
  { id: "hard", name: "Dificil", engine: "hard", minLevel: 6 },
];

/** Pot split: champion takes everything except the runner-up refund. */
export function versusPrize(size: number, fee: number) {
  const pot = size * fee;
  const second = fee;
  return { pot, first: pot - second, second, third: 0 };
}

export function versusKey(size: number, difficulty: string, fee: number) {
  return `vs:${size}:${difficulty}:${fee}`;
}

export type TierId = "easy" | "medium" | "hard" | "extreme";

export interface TimeAttackTier {
  id: TierId;
  name: string;
  minLevel: number;
  /** Engine difficulty (bag count + fall speed) for this tier. */
  engine: "easy" | "normal" | "hard" | "extreme";
  /** Prize multiplier applied on top of the duration base prize. */
  mult: number;
}

export const TIME_ATTACK_TIERS: TimeAttackTier[] = [
  { id: "easy", name: "Ușor", minLevel: 1, engine: "easy", mult: 1 },
  { id: "medium", name: "Mediu", minLevel: 3, engine: "normal", mult: 2 },
  { id: "hard", name: "Dificil", minLevel: 6, engine: "hard", mult: 3.5 },
  { id: "extreme", name: "Extrem", minLevel: 10, engine: "extreme", mult: 6 },
];

/** Only 3, 5 and 10 minute Time Attack tournaments exist. */
export const TIME_ATTACK_MINUTES = [3, 5, 10] as const;
export type TimeAttackMinutes = (typeof TIME_ATTACK_MINUTES)[number];

/**
 * A weekly season is a long grind, so first place has to feel worth it.
 * Duration still only mildly changes the payout: 10 min is at most double 3 min.
 */
const TA_BASE_PRIZE: Record<number, number> = { 3: 1500, 5: 2200, 10: 3000 };
const TA_DURATION_GEM_MULT: Record<number, number> = { 3: 1, 5: 1.4, 10: 2 };

/** First-place gem pool per tier — scales hard with difficulty. */
const TA_TIER_GEMS: Record<TierId, number> = {
  easy: 60,
  medium: 160,
  hard: 350,
  extreme: 750,
};


export interface PrizeRow {
  place: string;
  coins: number;
  gems: number;
  extra?: string;
}

/**
 * Weekly Time Attack payout. Top 3 get the big cuts, then smaller tiers
 * down to top 25% so mid-table play still pays. Gems scale mostly with
 * difficulty, only slightly with duration.
 */
export function timeAttackPrizeTable(minutes: number, tier: TierId): PrizeRow[] {
  const base = TA_BASE_PRIZE[minutes] ?? 250;
  const t = TIME_ATTACK_TIERS.find((x) => x.id === tier);
  const unit = Math.round(base * (t?.mult ?? 1));
  const gemUnit = (TA_TIER_GEMS[tier] ?? 5) * (TA_DURATION_GEM_MULT[minutes] ?? 1);
  const row = (place: string, k: number, extra?: string): PrizeRow => ({
    place,
    coins: Math.round(unit * k),
    gems: Math.round((gemUnit * k) / 10),
    ...(extra ? { extra } : {}),
  });
  return [
    row("Locul 1", 10, "skin exclusiv"),
    row("Locul 2", 6),
    row("Locul 3", 4),
    row("Top 10", 2),
    row("Top 25%", 0.8),
  ];
}

export function timeAttackPrize(minutes: number, tier: TierId) {
  const first = timeAttackPrizeTable(minutes, tier)[0];
  return { coins: first.coins, gems: first.gems, text: `${first.coins} 🪙 + ${first.gems} 💎` };
}

/* ------------------------------ Versus rivals ----------------------------- */

export const VERSUS_RIVAL_NAMES = [
  "Andrei", "Maria", "Cristi", "Ioana", "Vlad", "Elena", "Mihai", "Ana",
  "Radu", "Diana", "George", "Sara", "Tudor", "Bianca", "Stefan", "Carmen",
];

/** Target score the simulated rival will reach by the end of the match. */
export function versusRivalScore(difficulty: string, round: number) {
  const diffBase = difficulty === "hard" ? 4200 : difficulty === "medium" ? 3000 : 2000;
  return Math.round(diffBase * (1 + round * 0.22) * (0.75 + Math.random() * 0.6));
}

export function versusRivalName() {
  return VERSUS_RIVAL_NAMES[Math.floor(Math.random() * VERSUS_RIVAL_NAMES.length)];
}

/** Rival's live score at a given progress (0..1) — slightly uneven pacing. */
export function versusRivalLive(target: number, progress: number) {
  const p = Math.min(1, Math.max(0, progress));
  // Ease-in a touch so the rival doesn't look perfectly linear.
  const curve = 0.85 * p + 0.15 * p * p;
  return Math.round(target * curve);
}


/** Stable identifiers for a tournament category (one paid entry each). */
export function timeAttackKey(minutes: number, tier: TierId) {
  return `ta:${minutes}:${tier}`;
}

/** Human label used in the leaderboard and personal records screens. */
export function tournamentLabel(key: string) {
  const parts = key.split(":");
  if (parts[0] === "ta") {
    const tier = TIME_ATTACK_TIERS.find((x) => x.id === parts[2]);
    return `Time Attack ${parts[1]} min · ${tier?.name ?? parts[2]}`;
  }
  if (parts[0] === "vs") {
    const d = VERSUS_DIFFICULTIES.find((x) => x.id === parts[2]);
    return `Versus ${parts[1]} · ${d?.name ?? parts[2]} · ${Number(parts[3]).toLocaleString("ro-RO")} 🪙`;
  }
  return key;
}

