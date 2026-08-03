import { create } from "zustand";
import { persist } from "zustand/middleware";
import {
  TICKET_CAP,
  TICKET_VIDEOS_PER_DAY,
  TOURNAMENT_ENTRY_COINS,
  applyXp,
  levelUpReward,
  regenerated,
  xpForRun,
} from "@/game/economy";


export type Helper = "hammer" | "swap" | "boom" | "cross";
export type ControlMode = "buttons" | "gestures";
export type Skin =
  | "default"
  | "glass"
  | "neon"
  | "wood"
  | "marble"
  | "sunset"
  | "galaxy"
  | "candy"
  | "ice"
  | "retro"
  | "paper"
  | "mono"
  | "bubble"
  | "forest"
  | "sakura"
  | "lava"
  | "aurora"
  | "cyber"
  | "obsidian"
  | "gold";
export type ThemeKey =
  | "emerald"
  | "amber"
  | "ocean"
  | "rose"
  | "violet"
  | "teal"
  | "sand"
  | "slate"
  | "crimson"
  | "indigo"
  | "mint"
  | "midnight";
export type ClassicDifficulty = "easy" | "medium" | "hard" | "expert" | "extreme";

export interface ClassicHighScores {
  easy: number;
  medium: number;
  hard: number;
  expert: number;
  extreme: number;
}

export interface HighScores {
  dropdoku: number;
  classic: ClassicHighScores;
}

export interface ClassicSession {
  difficulty: string;
  seed: number;
  puzzle: (number | null)[][];
  solution: number[][];
  grid: (number | null)[][];
  mistakes: number;
  seconds: number;
  hintsLeft: number;
  startedAt: number;
}

export interface DropdokuSession {
  difficulty: string;
  board: (number | null)[][];
  score: number;
  totalClears: number;
  pieceIndex: number;
  bag: number[];
  startedAt: number;
  seconds: number;
}

interface Settings {
  autoComplete: boolean;
  sound: boolean;
  haptics: boolean;
  controlMode: ControlMode;
}

type RewardsUsed = Partial<Record<Helper, number>>;

const DEFAULT_HELPERS: Record<Helper, number> = { hammer: 2, swap: 2, boom: 2, cross: 2 };

export interface DailyClaim {
  day: number; // 1..7
  coins: number;
  tickets: number;
}

export interface TournamentState {
  seasonKey: string; // ISO week, e.g. 2026-W32
  entered: boolean;
  bestScore: number;
  runs: number;
}

export interface LevelUpResult {
  level: number;
  levelsGained: number;
  coins: number;
  tickets: number;
  xpGained: number;
}

interface GameState {
  diamonds: number;
  coins: number;
  tickets: number;
  ticketsUpdatedAt: number;
  ticketVideosToday: number;
  ticketVideoDate: string | null;
  xp: number;
  level: number;
  tournament: TournamentState;
  loginStreak: number;
  lastLoginDate: string | null; // YYYY-MM-DD
  monthlyProgress: Record<string, boolean>; // key: YYYY-MM-day
  highScores: HighScores;
  helpers: Record<Helper, number>;
  ownedSkins: Skin[];
  activeSkin: Skin;
  activeTheme: ThemeKey;
  ownedThemes: ThemeKey[];
  settings: Settings;
  classicStreak: number;
  classicSession: ClassicSession | null;
  dropdokuSession: DropdokuSession | null;
  rewardsUsed: RewardsUsed;
  addDiamonds: (n: number) => void;
  spendDiamonds: (n: number) => boolean;
  addCoins: (n: number) => void;
  spendCoins: (n: number) => boolean;
  addTickets: (n: number) => void;
  useTicket: () => boolean;
  regenTickets: () => void;
  ticketVideosLeft: () => number;
  watchAdForTicket: () => boolean;
  exchangeGemsForCoins: (gems: number, coins: number) => boolean;
  exchangeCoinsForTickets: (coins: number, tickets: number) => boolean;
  currentSeasonKey: () => string;
  isTournamentEntered: () => boolean;
  enterTournament: () => boolean;
  recordTournamentRun: (score: number) => void;
  addXp: (n: number) => LevelUpResult;
  awardRunXp: (difficulty: string, score: number, tournament?: boolean) => LevelUpResult;
  addHelpers: (h: Helper, n: number) => void;
  useHelper: (h: Helper) => boolean;
  setDropdokuHighScore: (score: number) => void;
  setClassicHighScore: (d: ClassicDifficulty, score: number) => void;
  unlockSkin: (s: Skin) => void;
  setSkin: (s: Skin) => void;
  setTheme: (t: ThemeKey) => void;
  unlockTheme: (t: ThemeKey) => void;
  setSetting: <K extends keyof Settings>(key: K, value: Settings[K]) => void;
  setClassicSession: (s: ClassicSession | null) => void;
  setDropdokuSession: (s: DropdokuSession | null) => void;
  bumpClassicStreak: () => number;
  resetClassicStreak: () => void;
  bumpRewardUsed: (h: Helper) => number;
  resetRewardsUsed: () => void;
  markMonthlyLevel: (level: number) => void;
  isMonthlyDone: (level: number) => boolean;
  checkDailyPending: () => DailyClaim | null;
  claimDaily: () => DailyClaim | null;
}

/** ISO-week key, e.g. 2026-W32 — Monday 00:00 to Sunday 23:59. */
export function seasonKey(date = new Date()) {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const week = Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
  return `${d.getUTCFullYear()}-W${String(week).padStart(2, "0")}`;
}


function todayISO() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}
function isYesterday(prev: string) {
  const d = new Date(prev);
  d.setDate(d.getDate() + 1);
  return (
    `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}` ===
    todayISO()
  );
}
function monthKey(level: number) {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${level}`;
}

const SKINS: Skin[] = [
  "default",
  "glass",
  "neon",
  "wood",
  "marble",
  "sunset",
  "galaxy",
  "candy",
  "ice",
  "retro",
  "paper",
  "mono",
  "bubble",
  "forest",
  "sakura",
  "lava",
  "aurora",
  "cyber",
  "obsidian",
  "gold",
];
const THEMES: ThemeKey[] = [
  "emerald",
  "amber",
  "ocean",
  "rose",
  "violet",
  "teal",
  "sand",
  "slate",
  "crimson",
  "indigo",
  "mint",
  "midnight",
];
const CONTROL_MODES: ControlMode[] = ["buttons", "gestures"];

function num(v: unknown, fallback: number): number {
  return typeof v === "number" && Number.isFinite(v) ? v : fallback;
}
function bool(v: unknown, fallback: boolean): boolean {
  return typeof v === "boolean" ? v : fallback;
}
function isMatrix(v: unknown, rows: number, cols: number): boolean {
  return (
    Array.isArray(v) &&
    v.length === rows &&
    v.every((row) => Array.isArray(row) && row.length === cols)
  );
}

function sanitizeClassicSession(v: unknown): ClassicSession | null {
  const s = v as Partial<ClassicSession> | null | undefined;
  if (!s || typeof s !== "object") return null;
  if (!isMatrix(s.puzzle, 9, 9) || !isMatrix(s.solution, 9, 9) || !isMatrix(s.grid, 9, 9))
    return null;
  if (typeof s.difficulty !== "string") return null;
  return {
    difficulty: s.difficulty,
    seed: num(s.seed, 1),
    puzzle: s.puzzle as (number | null)[][],
    solution: s.solution as number[][],
    grid: s.grid as (number | null)[][],
    mistakes: num(s.mistakes, 0),
    seconds: num(s.seconds, 0),
    hintsLeft: num(s.hintsLeft, 3),
    startedAt: num(s.startedAt, Date.now()),
  };
}

function sanitizeDropdokuSession(v: unknown): DropdokuSession | null {
  const s = v as Partial<DropdokuSession> | null | undefined;
  if (!s || typeof s !== "object") return null;
  if (!isMatrix(s.board, 9, 9)) return null;
  if (typeof s.difficulty !== "string") return null;
  return {
    difficulty: s.difficulty,
    board: s.board as (number | null)[][],
    score: num(s.score, 0),
    totalClears: num(s.totalClears, 0),
    pieceIndex: num(s.pieceIndex, 0),
    bag: Array.isArray(s.bag) ? (s.bag.filter((n) => typeof n === "number") as number[]) : [],
    startedAt: num(s.startedAt, Date.now()),
    seconds: num(s.seconds, 0),
  };
}

/**
 * Repairs any persisted blob so a stale / partial / corrupted save can never
 * crash the app. Every field falls back to a valid default.
 */
export function sanitizeState(raw: unknown): Partial<GameState> {
  const s = (raw ?? {}) as Record<string, unknown>;
  const hs = (s.highScores ?? {}) as Record<string, unknown>;
  const classic = (hs.classic ?? {}) as Record<string, unknown>;
  const prevHelpers = (s.helpers ?? {}) as Record<string, unknown>;
  const settings = (s.settings ?? {}) as Record<string, unknown>;

  const helpers = { ...DEFAULT_HELPERS };
  (Object.keys(DEFAULT_HELPERS) as Helper[]).forEach((h) => {
    helpers[h] = Math.max(0, Math.floor(num(prevHelpers[h], DEFAULT_HELPERS[h])));
  });

  const ownedSkins = Array.isArray(s.ownedSkins)
    ? (s.ownedSkins.filter((x): x is Skin => SKINS.includes(x as Skin)) as Skin[])
    : [];
  if (!ownedSkins.includes("default")) ownedSkins.unshift("default");

  const ownedThemes = Array.isArray(s.ownedThemes)
    ? (s.ownedThemes.filter((x): x is ThemeKey => THEMES.includes(x as ThemeKey)) as ThemeKey[])
    : [];
  if (!ownedThemes.includes("emerald")) ownedThemes.unshift("emerald");

  const activeSkin = SKINS.includes(s.activeSkin as Skin) ? (s.activeSkin as Skin) : "default";
  const activeTheme = THEMES.includes(s.activeTheme as ThemeKey)
    ? (s.activeTheme as ThemeKey)
    : "emerald";

  const tour = (s.tournament ?? {}) as Record<string, unknown>;

  return {
    diamonds: Math.max(0, Math.floor(num(s.diamonds, 250))),
    coins: Math.max(0, Math.floor(num(s.coins, 0))),
    tickets: Math.max(0, Math.floor(num(s.tickets, 3))),
    ticketsUpdatedAt: num(s.ticketsUpdatedAt, Date.now()),
    ticketVideosToday: Math.max(0, Math.floor(num(s.ticketVideosToday, 0))),
    ticketVideoDate: typeof s.ticketVideoDate === "string" ? s.ticketVideoDate : null,
    xp: Math.max(0, Math.floor(num(s.xp, 0))),
    level: Math.max(1, Math.floor(num(s.level, 1))),
    tournament: {
      seasonKey: typeof tour.seasonKey === "string" ? tour.seasonKey : seasonKey(),
      entered: bool(tour.entered, false),
      bestScore: Math.max(0, Math.floor(num(tour.bestScore, 0))),
      runs: Math.max(0, Math.floor(num(tour.runs, 0))),
    },
    loginStreak: Math.max(0, Math.floor(num(s.loginStreak, 0))),
    lastLoginDate: typeof s.lastLoginDate === "string" ? s.lastLoginDate : null,

    monthlyProgress:
      s.monthlyProgress && typeof s.monthlyProgress === "object"
        ? (s.monthlyProgress as Record<string, boolean>)
        : {},
    highScores: {
      dropdoku: Math.max(0, num(hs.dropdoku, 0)),
      classic: {
        easy: Math.max(0, num(classic.easy, 0)),
        medium: Math.max(0, num(classic.medium, 0)),
        hard: Math.max(0, num(classic.hard, 0)),
        expert: Math.max(0, num(classic.expert, 0)),
        extreme: Math.max(0, num(classic.extreme, 0)),
      },
    },
    helpers,
    ownedSkins,
    activeSkin,
    ownedThemes,
    activeTheme,
    settings: {
      autoComplete: bool(settings.autoComplete, true),
      sound: bool(settings.sound, true),
      haptics: bool(settings.haptics, true),
      controlMode: CONTROL_MODES.includes(settings.controlMode as ControlMode)
        ? (settings.controlMode as ControlMode)
        : "gestures",
    },
    classicStreak: Math.max(0, Math.floor(num(s.classicStreak, 0))),
    classicSession: sanitizeClassicSession(s.classicSession),
    dropdokuSession: sanitizeDropdokuSession(s.dropdokuSession),
    rewardsUsed:
      s.rewardsUsed && typeof s.rewardsUsed === "object" ? (s.rewardsUsed as RewardsUsed) : {},
  };
}

export const useGameStore = create<GameState>()(
  persist(
    (set, get) => ({
      diamonds: 250,
      coins: 0,
      tickets: 3,
      ticketsUpdatedAt: Date.now(),
      ticketVideosToday: 0,
      ticketVideoDate: null,
      xp: 0,
      level: 1,
      tournament: { seasonKey: seasonKey(), entered: false, bestScore: 0, runs: 0 },
      loginStreak: 0,

      lastLoginDate: null,
      monthlyProgress: {},
      highScores: {
        dropdoku: 0,
        classic: { easy: 0, medium: 0, hard: 0, expert: 0, extreme: 0 },
      },
      helpers: DEFAULT_HELPERS,
      ownedSkins: ["default"],
      activeSkin: "default",
      activeTheme: "emerald",
      ownedThemes: ["emerald"],
      settings: { autoComplete: true, sound: true, haptics: true, controlMode: "gestures" },
      classicStreak: 0,
      classicSession: null,
      dropdokuSession: null,
      rewardsUsed: {},
      addDiamonds: (n) => set({ diamonds: get().diamonds + n }),
      spendDiamonds: (n) => {
        if (get().diamonds < n) return false;
        set({ diamonds: get().diamonds - n });
        return true;
      },
      addCoins: (n) => set({ coins: get().coins + n }),
      spendCoins: (n) => {
        if (get().coins < n) return false;
        set({ coins: get().coins - n });
        return true;
      },
      addTickets: (n) => set({ tickets: Math.max(0, get().tickets + n) }),
      useTicket: () => {
        get().regenTickets();
        const cur = get().tickets;
        if (cur <= 0) return false;
        // Dropping below the cap restarts the regeneration clock.
        const patch: Partial<GameState> = { tickets: cur - 1 };
        if (cur >= TICKET_CAP) patch.ticketsUpdatedAt = Date.now();
        set(patch as GameState);
        return true;
      },
      regenTickets: () => {
        const { tickets, ticketsUpdatedAt } = get();
        const next = regenerated(tickets, ticketsUpdatedAt);
        if (next.tickets !== tickets || next.ticketsUpdatedAt !== ticketsUpdatedAt) {
          set({ tickets: next.tickets, ticketsUpdatedAt: next.ticketsUpdatedAt });
        }
      },
      ticketVideosLeft: () => {
        const today = todayISO();
        const used = get().ticketVideoDate === today ? get().ticketVideosToday : 0;
        return Math.max(0, TICKET_VIDEOS_PER_DAY - used);
      },
      watchAdForTicket: () => {
        get().regenTickets();
        if (get().ticketVideosLeft() <= 0) return false;
        if (get().tickets >= TICKET_CAP) return false;
        const today = todayISO();
        const used = get().ticketVideoDate === today ? get().ticketVideosToday : 0;
        set({
          tickets: Math.min(TICKET_CAP, get().tickets + 1),
          ticketVideosToday: used + 1,
          ticketVideoDate: today,
        });
        return true;
      },
      exchangeGemsForCoins: (gems, coins) => {
        if (get().diamonds < gems) return false;
        set({ diamonds: get().diamonds - gems, coins: get().coins + coins });
        return true;
      },
      exchangeCoinsForTickets: (coins, tickets) => {
        if (get().coins < coins) return false;
        // Purchased tickets may exceed the regeneration cap.
        set({ coins: get().coins - coins, tickets: get().tickets + tickets });
        return true;
      },
      currentSeasonKey: () => seasonKey(),
      isTournamentEntered: () => {
        const tr = get().tournament;
        return tr.entered && tr.seasonKey === seasonKey();
      },
      enterTournament: () => {
        if (get().isTournamentEntered()) return true;
        if (get().coins < TOURNAMENT_ENTRY_COINS) return false;
        set({
          coins: get().coins - TOURNAMENT_ENTRY_COINS,
          tournament: { seasonKey: seasonKey(), entered: true, bestScore: 0, runs: 0 },
        });
        return true;
      },
      recordTournamentRun: (score) => {
        const tr = get().tournament;
        const fresh = tr.seasonKey === seasonKey() ? tr : { ...tr, seasonKey: seasonKey(), bestScore: 0, runs: 0 };
        set({
          tournament: {
            ...fresh,
            bestScore: Math.max(fresh.bestScore, score),
            runs: fresh.runs + 1,
          },
        });
      },
      addXp: (n) => {
        const res = applyXp(get().level, get().xp, n);
        let coins = 0;
        let tickets = 0;
        for (let lv = get().level + 1; lv <= res.level; lv++) {
          const r = levelUpReward(lv);
          coins += r.coins;
          tickets += r.tickets;
        }
        set({
          level: res.level,
          xp: res.xp,
          coins: get().coins + coins,
          tickets: get().tickets + tickets,
        });
        return { level: res.level, levelsGained: res.levelsGained, coins, tickets, xpGained: n };
      },
      awardRunXp: (difficulty, score, tournament = false) =>
        get().addXp(xpForRun(difficulty, score, tournament)),

      addHelpers: (h, n) => {
        const current = get().helpers[h];
        const safeCurrent = Number.isFinite(current) ? current : 0;
        set({ helpers: { ...get().helpers, [h]: safeCurrent + n } });
      },
      useHelper: (h) => {
        const current = get().helpers[h];
        const safeCurrent = Number.isFinite(current) ? current : 0;
        if (safeCurrent <= 0) return false;
        set({ helpers: { ...get().helpers, [h]: safeCurrent - 1 } });
        return true;
      },
      setDropdokuHighScore: (score) => {
        if (score > get().highScores.dropdoku) {
          set({ highScores: { ...get().highScores, dropdoku: score } });
        }
      },
      setClassicHighScore: (d, score) => {
        const cur = get().highScores.classic?.[d] ?? 0;
        if (score > cur) {
          set({
            highScores: {
              ...get().highScores,
              classic: { ...get().highScores.classic, [d]: score },
            },
          });
        }
      },
      unlockSkin: (s) =>
        set({
          ownedSkins: get().ownedSkins.includes(s) ? get().ownedSkins : [...get().ownedSkins, s],
        }),
      setSkin: (s) => set({ activeSkin: s }),
      setTheme: (t) => set({ activeTheme: t }),
      unlockTheme: (t) =>
        set({
          ownedThemes: get().ownedThemes.includes(t) ? get().ownedThemes : [...get().ownedThemes, t],
        }),
      setSetting: (key, value) => set({ settings: { ...get().settings, [key]: value } }),
      setClassicSession: (s) => set({ classicSession: s }),
      setDropdokuSession: (s) => {
        if (!s) set({ rewardsUsed: {} });
        set({ dropdokuSession: s });
      },
      bumpClassicStreak: () => {
        const next = get().classicStreak + 1;
        set({ classicStreak: next });
        return next;
      },
      resetClassicStreak: () => set({ classicStreak: 0 }),
      bumpRewardUsed: (h) => {
        const n = (get().rewardsUsed[h] ?? 0) + 1;
        set({ rewardsUsed: { ...get().rewardsUsed, [h]: n } });
        return n;
      },
      resetRewardsUsed: () => set({ rewardsUsed: {} }),
      markMonthlyLevel: (level) => {
        const k = monthKey(level);
        if (get().monthlyProgress[k]) return;
        set({ monthlyProgress: { ...get().monthlyProgress, [k]: true } });
      },
      isMonthlyDone: (level) => !!get().monthlyProgress[monthKey(level)],
      checkDailyPending: () => {
        const last = get().lastLoginDate;
        if (last === todayISO()) return null;
        const nextStreak = last && isYesterday(last) ? get().loginStreak + 1 : 1;
        const { dayInCycle, tickets } = dailyRewardFor(nextStreak);
        const coins = 20 + Math.min(dayInCycle, 7) * 10;
        return { day: dayInCycle, coins, tickets };
      },
      claimDaily: () => {
        const pending = get().checkDailyPending();
        if (!pending) return null;
        const last = get().lastLoginDate;
        const nextStreak = last && isYesterday(last) ? get().loginStreak + 1 : 1;
        set({
          coins: get().coins + pending.coins,
          tickets: get().tickets + pending.tickets,
          loginStreak: nextStreak,
          lastLoginDate: todayISO(),
        });
        return pending;
      },
    }),
    {
      name: "sudoku-drop-store",
      version: 8,
      // Only data is persisted — actions always come from fresh code.
      partialize: (state) =>
        ({
          diamonds: state.diamonds,
          coins: state.coins,
          tickets: state.tickets,
          ticketsUpdatedAt: state.ticketsUpdatedAt,
          ticketVideosToday: state.ticketVideosToday,
          ticketVideoDate: state.ticketVideoDate,
          xp: state.xp,
          level: state.level,
          tournament: state.tournament,
          loginStreak: state.loginStreak,
          lastLoginDate: state.lastLoginDate,
          monthlyProgress: state.monthlyProgress,
          highScores: state.highScores,
          helpers: state.helpers,
          ownedSkins: state.ownedSkins,
          activeSkin: state.activeSkin,
          ownedThemes: state.ownedThemes,
          activeTheme: state.activeTheme,
          settings: state.settings,
          classicStreak: state.classicStreak,
          classicSession: state.classicSession,
          dropdokuSession: state.dropdokuSession,
          rewardsUsed: state.rewardsUsed,
        }) as unknown as GameState,
      migrate: (persisted: unknown, version) => {
        const s = sanitizeState(persisted);
        if (version < 3) {
          s.activeTheme = "emerald";
          s.ownedThemes = ["emerald"];
          s.diamonds = Math.max(s.diamonds ?? 0, 1000);
          s.tickets = Math.max(s.tickets ?? 0, 1000);
          s.dropdokuSession = null;
          s.classicSession = null;
        }
        if (version < 6) {
          // Testing grant
          s.diamonds = Math.max(s.diamonds ?? 0, 9000);
        }
        if (version < 8) {
          // Tickets are now a capped, regenerating resource — clamp old stockpiles
          // and hand out starter coins so the tournament entry is reachable.
          s.tickets = Math.min(TICKET_CAP, s.tickets ?? TICKET_CAP);
          s.ticketsUpdatedAt = Date.now();
          s.coins = Math.max(s.coins ?? 0, 2000);
          s.xp = s.xp ?? 0;
          s.level = s.level ?? 1;
        }
        return s as GameState;

      },
      // Last line of defense: whatever comes out of storage is repaired before
      // it reaches any component, so a partial blob can never crash a screen.
      merge: (persisted, current) => ({ ...current, ...sanitizeState(persisted) }),
    },
  ),
);

// Daily login rewards: alternating 3-day / 4-day cycles, tickets grow by 1 each cycle.
// Days 1-3 → 1 ticket, 4-7 → 2, 8-10 → 3, 11-14 → 4, 15-17 → 5, 18-21 → 6, ...
function dailyRewardFor(streakDay: number): { dayInCycle: number; tickets: number } {
  let remaining = streakDay;
  let tickets = 1;
  let cycleLen = 3;
  let start = 1;
  while (remaining > cycleLen) {
    remaining -= cycleLen;
    start += cycleLen;
    tickets += 1;
    cycleLen = cycleLen === 3 ? 4 : 3;
  }
  const dayInCycle = ((streakDay - 1) % 7) + 1;
  return { dayInCycle, tickets };
}
