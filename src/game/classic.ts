// Classic 9x9 Sudoku generator.
// Algorithm: build canonical solved grid, shuffle digits/bands/stacks,
// then mask cells by difficulty.
import { mulberry32 } from "./schedule";

export type SudokuGrid = (number | null)[][];
export type SudokuSolution = number[][];

const N = 9;

function basePattern(r: number, c: number) {
  return (3 * (r % 3) + Math.floor(r / 3) + c) % 9;
}

function shuffle<T>(a: T[], rng: () => number): T[] {
  const out = a.slice();
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

export function generateSolved(seed = Date.now()): SudokuSolution {
  const rng = mulberry32(seed);
  const nums = shuffle([1, 2, 3, 4, 5, 6, 7, 8, 9], rng);
  const rowBands = shuffle([0, 1, 2], rng);
  const colStacks = shuffle([0, 1, 2], rng);
  const rowsInBand = [shuffle([0, 1, 2], rng), shuffle([0, 1, 2], rng), shuffle([0, 1, 2], rng)];
  const colsInStack = [shuffle([0, 1, 2], rng), shuffle([0, 1, 2], rng), shuffle([0, 1, 2], rng)];

  const rows = rowBands.flatMap((b) => rowsInBand[b].map((r) => b * 3 + r));
  const cols = colStacks.flatMap((s) => colsInStack[s].map((c) => s * 3 + c));

  const grid: number[][] = [];
  for (let r = 0; r < N; r++) {
    const row: number[] = [];
    for (let c = 0; c < N; c++) {
      row.push(nums[basePattern(rows[r], cols[c])]);
    }
    grid.push(row);
  }
  return grid;
}

export type SudokuDifficulty = "easy" | "medium" | "hard" | "expert" | "extreme";

const CLUE_COUNTS: Record<SudokuDifficulty, number> = {
  easy: 45,
  medium: 36,
  hard: 30,
  expert: 26,
  extreme: 23,
};

export function maskPuzzle(
  solution: SudokuSolution,
  difficulty: SudokuDifficulty,
  seed = Date.now(),
): SudokuGrid {
  const rng = mulberry32(seed ^ 0x9e3779b9);
  const clues = CLUE_COUNTS[difficulty];
  const positions = shuffle(
    Array.from({ length: N * N }, (_, i) => i),
    rng,
  );
  const grid: SudokuGrid = solution.map((r) => r.slice() as (number | null)[]);
  let removed = 0;
  const toRemove = N * N - clues;
  for (const p of positions) {
    if (removed >= toRemove) break;
    const r = Math.floor(p / N);
    const c = p % N;
    grid[r][c] = null;
    removed++;
  }
  return grid;
}

export function generatePuzzle(difficulty: SudokuDifficulty, seed = Date.now()) {
  const solution = generateSolved(seed);
  const puzzle = maskPuzzle(solution, difficulty, seed);
  return { solution, puzzle };
}

export function isSolved(grid: SudokuGrid, solution: SudokuSolution): boolean {
  for (let r = 0; r < N; r++)
    for (let c = 0; c < N; c++)
      if (grid[r][c] !== solution[r][c]) return false;
  return true;
}
