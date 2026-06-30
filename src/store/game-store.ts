import { create } from "zustand";
import { persist } from "zustand/middleware";

export type Helper = "hammer" | "swap" | "boom" | "cross";
export type ControlMode = "buttons" | "gestures";
export type Skin = "default" | "glass" | "neon" | "wood";
export type ThemeKey = "default" | "ice" | "amber" | "rose";
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

// Tracks how many rewarded ads have been redeemed per helper *in the current match*.
type RewardsUsed = Partial<Record<Helper, number>>;

interface GameState {
  diamonds: number;
  highScores: HighScores;
  helpers: Record<Helper, number>;
  ownedSkins: Skin[];
  activeSkin: Skin;
  activeTheme: ThemeKey;
  settings: Settings;
  classicStreak: number;
  classicSession: ClassicSession | null;
  dropdokuSession: DropdokuSession | null;
  rewardsUsed: RewardsUsed;
  addDiamonds: (n: number) => void;
  spendDiamonds: (n: number) => boolean;
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
}

export const useGameStore = create<GameState>()(
  persist(
    (set, get) => ({
      diamonds: 250,
      highScores: {
        dropdoku: 0,
        classic: { easy: 0, medium: 0, hard: 0, expert: 0, extreme: 0 },
      },
      helpers: { hammer: 2, swap: 2, boom: 2, cross: 2 },
      ownedSkins: ["default"],
      activeSkin: "default",
      activeTheme: "default",
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
        // reset rewards-used when a session ends/starts fresh
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
    }),
    { name: "sudoku-drop-store" },
  ),
);
