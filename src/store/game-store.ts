import { create } from "zustand";
import { persist } from "zustand/middleware";

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
  | "retro";
export type ThemeKey = "emerald" | "amber" | "ocean" | "rose";
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

interface GameState {
  diamonds: number;
  coins: number;
  tickets: number;
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
  addHelpers: (h: Helper, n: number) => void;
  useHelper: (h: Helper) => boolean;
  setDropdokuHighScore: (score: number) => void;
  setClassicHighScore: (d: ClassicDifficulty, score: number) => void;
  unlockSkin: (s: Skin) => void;
  setSkin: (s: Skin) => void;
  setTheme: (t: ThemeKey) => void;
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

export const useGameStore = create<GameState>()(
  persist(
    (set, get) => ({
      diamonds: 250,
      coins: 0,
      tickets: 3,
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
      addTickets: (n) => set({ tickets: get().tickets + n }),
      useTicket: () => {
        if (get().tickets <= 0) return false;
        set({ tickets: get().tickets - 1 });
        return true;
      },
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
      version: 4,
      migrate: (persisted: unknown, version) => {
        const s = (persisted ?? {}) as Partial<GameState>;
        if (version < 3) {
          s.activeTheme = "emerald";
          s.ownedThemes = ["emerald"];
          s.diamonds = Math.max(s.diamonds ?? 0, 1000);
          s.tickets = Math.max(s.tickets ?? 0, 1000);
          s.dropdokuSession = null;
          s.classicSession = null;
        }
        if (version < 4) {
          const previous = s.helpers ?? DEFAULT_HELPERS;
          s.helpers = { ...DEFAULT_HELPERS };
          (Object.keys(DEFAULT_HELPERS) as Helper[]).forEach((h) => {
            const value = previous[h];
            s.helpers![h] =
              typeof value === "number" && Number.isFinite(value) ? value : DEFAULT_HELPERS[h];
          });
        }
        return s as GameState;
      },
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
