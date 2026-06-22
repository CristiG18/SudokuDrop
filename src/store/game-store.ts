import { create } from "zustand";
import { persist } from "zustand/middleware";

export type Helper = "hammer" | "swap" | "boom";
export type Skin = "default" | "glass" | "neon" | "wood";
export type ThemeKey = "default" | "ice" | "amber";

export interface HighScores {
  dropdoku: number;
}

interface GameState {
  diamonds: number;
  highScores: HighScores;
  helpers: Record<Helper, number>;
  ownedSkins: Skin[];
  activeSkin: Skin;
  activeTheme: ThemeKey;
  addDiamonds: (n: number) => void;
  spendDiamonds: (n: number) => boolean;
  addHelpers: (h: Helper, n: number) => void;
  useHelper: (h: Helper) => boolean;
  setHighScore: (mode: keyof HighScores, score: number) => void;
  unlockSkin: (s: Skin) => void;
  setSkin: (s: Skin) => void;
  setTheme: (t: ThemeKey) => void;
}

export const useGameStore = create<GameState>()(
  persist(
    (set, get) => ({
      diamonds: 250,
      highScores: { dropdoku: 0 },
      helpers: { hammer: 2, swap: 2, boom: 2 },
      ownedSkins: ["default"],
      activeSkin: "default",
      activeTheme: "default",
      addDiamonds: (n) => set({ diamonds: get().diamonds + n }),
      spendDiamonds: (n) => {
        if (get().diamonds < n) return false;
        set({ diamonds: get().diamonds - n });
        return true;
      },
      addHelpers: (h, n) =>
        set({ helpers: { ...get().helpers, [h]: get().helpers[h] + n } }),
      useHelper: (h) => {
        if (get().helpers[h] <= 0) return false;
        set({ helpers: { ...get().helpers, [h]: get().helpers[h] - 1 } });
        return true;
      },
      setHighScore: (mode, score) => {
        if (score > get().highScores[mode]) {
          set({ highScores: { ...get().highScores, [mode]: score } });
        }
      },
      unlockSkin: (s) =>
        set({
          ownedSkins: get().ownedSkins.includes(s)
            ? get().ownedSkins
            : [...get().ownedSkins, s],
        }),
      setSkin: (s) => set({ activeSkin: s }),
      setTheme: (t) => set({ activeTheme: t }),
    }),
    { name: "sudoku-drop-store" },
  ),
);
