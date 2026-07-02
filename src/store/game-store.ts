import { create } from "zustand";
import { persist } from "zustand/middleware";

export type Helper = "hammer" | "swap" | "boom" | "cross";
export type ControlMode = "buttons" | "gestures";
export type Skin = "default" | "glass" | "neon" | "wood";
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
}

interface Settings {
  autoComplete: boolean;
  sound: boolean;
  haptics: boolean;
  controlMode: ControlMode;
}

type RewardsUsed = Partial<Record<Helper, number>>;

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
      helpers: { hammer: 2, swap: 2, boom: 2, cross: 2 },
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
      addHelpers: (h, n) => set({ helpers: { ...get().helpers, [h]: get().helpers[h] + n } }),
      useHelper: (h) => {
        if (get().helpers[h] <= 0) return false;
        set({ helpers: { ...get().helpers, [h]: get().helpers[h] - 1 } });
        return true;
      },
      setDropdokuHighScore: (score) => {
        if (score > get().highScores.dropdoku) {
          set({ highScores: { ...get().highScores, dropdoku: score } });
        }
      },
      setClassicHighScore: (d, score) => {
        const cur = get().highScores.classic[d];
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
        const dayInCycle = ((nextStreak - 1) % 7) + 1;
        const coins = 10 + Math.min(dayInCycle, 7) * 5;
        const tickets = dayInCycle % 3 === 0 ? 1 : 0;
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
    { name: "sudoku-drop-store" },
  ),
);
