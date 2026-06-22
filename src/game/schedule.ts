// Mulberry32 deterministic RNG for daily/weekly seeds.
export function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function seededShuffle<T>(arr: T[], seed: number): T[] {
  const rng = mulberry32(seed);
  const out = arr.slice();
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

// ISO 8601 week number
export function isoWeek(date: Date): { year: number; week: number } {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const week = Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
  return { year: d.getUTCFullYear(), week };
}

export type DailyDifficulty = "easy" | "medium" | "hard";

// 3 Easy, 2 Medium, 2 Hard per ISO week, deterministic shuffle by year+week.
export function weekSchedule(date: Date): DailyDifficulty[] {
  const { year, week } = isoWeek(date);
  const base: DailyDifficulty[] = ["easy", "easy", "easy", "medium", "medium", "hard", "hard"];
  return seededShuffle(base, year * 100 + week);
}

// Monday-first index (0..6)
export function dayOfWeekMon(date: Date): number {
  return (date.getDay() + 6) % 7;
}

export function dailyForDate(date: Date): DailyDifficulty {
  return weekSchedule(date)[dayOfWeekMon(date)];
}

// Monthly themes
export const MONTH_THEMES: Array<{ key: "default" | "ice" | "rose" | "amber"; name: string }> = [
  { key: "ice", name: "Sapphire Ice" },     // Jan
  { key: "rose", name: "Rose Amethyst" },   // Feb
  { key: "default", name: "Spring Mint" },  // Mar
  { key: "default", name: "Cherry Bloom" }, // Apr
  { key: "default", name: "Emerald May" },  // May
  { key: "default", name: "Summer Blue" },  // Jun
  { key: "amber", name: "Sunset Gold" },    // Jul
  { key: "amber", name: "Harvest Amber" },  // Aug
  { key: "default", name: "Autumn Sage" },  // Sep
  { key: "amber", name: "Halloween" },      // Oct
  { key: "default", name: "Frost Pine" },   // Nov
  { key: "ice", name: "Winter Crystal" },   // Dec
];

export function currentMonthTheme(date = new Date()) {
  return MONTH_THEMES[date.getMonth()];
}
