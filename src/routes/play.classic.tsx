import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, Eraser, Lightbulb, Pause, Play, RotateCcw } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { generatePuzzle, type SudokuDifficulty, type SudokuGrid, type SudokuSolution } from "@/game/classic";
import { useGameStore } from "@/store/game-store";
import { sfx, unlockAudio } from "@/lib/sfx";

export const Route = createFileRoute("/play/classic")({
  head: () => ({ meta: [{ title: "Sudoku Clasic — joc" }] }),
  component: ClassicGame,
  validateSearch: (s: Record<string, unknown>) => ({
    difficulty: (s.difficulty as SudokuDifficulty) || "medium",
    seed: typeof s.seed === "number" ? (s.seed as number) : undefined,
    resume: s.resume === true || s.resume === "true" ? true : undefined,
  }),
});

// Baseline target times (seconds) used for local percentile until backend lands.
const BASELINES: Record<SudokuDifficulty, number> = {
  easy: 240,
  medium: 420,
  hard: 600,
  expert: 900,
  extreme: 1200,
};

const PERCENTILE_BUCKETS = [1, 5, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100];

function computePercentile(difficulty: SudokuDifficulty, seconds: number, mistakes: number) {
  const baseline = BASELINES[difficulty];
  // ratio < 1 = faster than baseline -> better percentile
  const ratio = seconds / baseline + mistakes * 0.05;
  let pct = Math.round(ratio * 50); // 1.0 ratio -> top 50%
  if (pct < 1) pct = 1;
  if (pct > 100) pct = 100;
  return PERCENTILE_BUCKETS.find((b) => pct <= b) ?? 100;
}

function ClassicGame() {
  const { difficulty, seed, resume } = Route.useSearch();
  const navigate = useNavigate();
  const session = useGameStore((s) => s.classicSession);
  const setSession = useGameStore((s) => s.setClassicSession);
  const autoCompleteOn = useGameStore((s) => s.settings.autoComplete);
  const soundOn = useGameStore((s) => s.settings.sound);
  const bumpStreak = useGameStore((s) => s.bumpClassicStreak);
  const resetStreak = useGameStore((s) => s.resetClassicStreak);
  const streak = useGameStore((s) => s.classicStreak);
  const addDiamonds = useGameStore((s) => s.addDiamonds);

  // Init either from resume session, or generate.
  const init = useMemo(() => {
    if (resume && session && session.difficulty === difficulty) {
      return {
        puzzle: session.puzzle as SudokuGrid,
        solution: session.solution as SudokuSolution,
        fixed: session.puzzle.map((row) => row.map((v) => v !== null)),
        grid: session.grid as SudokuGrid,
        mistakes: session.mistakes,
        seconds: session.seconds,
        hintsLeft: session.hintsLeft,
        seed: session.seed,
      };
    }
    const s = seed ?? Date.now();
    const { puzzle, solution } = generatePuzzle(difficulty, s);
    const fixed = puzzle.map((row) => row.map((v) => v !== null));
    return {
      puzzle,
      solution,
      fixed,
      grid: puzzle.map((r) => r.slice()),
      mistakes: 0,
      seconds: 0,
      hintsLeft: 3,
      seed: s,
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const [grid, setGrid] = useState<SudokuGrid>(init.grid);
  const [sel, setSel] = useState<{ r: number; c: number } | null>(null);
  const [mistakes, setMistakes] = useState(init.mistakes);
  const [seconds, setSeconds] = useState(init.seconds);
  const [paused, setPaused] = useState(false);
  const [backOpen, setBackOpen] = useState(false);
  const [won, setWon] = useState(false);
  const [hintsLeft, setHintsLeft] = useState(init.hintsLeft);
  const [flashCells, setFlashCells] = useState<Set<string>>(new Set());

  const { puzzle, solution, fixed } = init;

  // Persist session
  useEffect(() => {
    if (won) return;
    setSession({
      difficulty,
      seed: init.seed,
      puzzle,
      solution,
      grid,
      mistakes,
      seconds,
      hintsLeft,
    });
  }, [grid, mistakes, seconds, hintsLeft, won, difficulty, init.seed, puzzle, solution, setSession]);

  useEffect(() => {
    if (paused || backOpen || won) return;
    const id = setInterval(() => setSeconds((s) => s + 1), 1000);
    return () => clearInterval(id);
  }, [paused, backOpen, won]);

  const flashUnits = useCallback((r: number, c: number, next: SudokuGrid) => {
    const cells: string[] = [];
    // row
    if (next[r].every((v) => v !== null)) for (let i = 0; i < 9; i++) cells.push(`${r},${i}`);
    // col
    if (next.every((row) => row[c] !== null)) for (let i = 0; i < 9; i++) cells.push(`${i},${c}`);
    // box
    const br = Math.floor(r / 3) * 3;
    const bc = Math.floor(c / 3) * 3;
    let boxFull = true;
    for (let i = br; i < br + 3 && boxFull; i++)
      for (let j = bc; j < bc + 3 && boxFull; j++) if (next[i][j] === null) boxFull = false;
    if (boxFull) {
      for (let i = br; i < br + 3; i++) for (let j = bc; j < bc + 3; j++) cells.push(`${i},${j}`);
    }
    if (cells.length) {
      if (soundOn) sfx.clear(1);
      setFlashCells(new Set(cells));
      setTimeout(() => setFlashCells(new Set()), 600);
    }
  }, [soundOn]);

  const checkWin = useCallback((next: SudokuGrid) => {
    for (let i = 0; i < 9; i++)
      for (let j = 0; j < 9; j++)
        if (next[i][j] !== solution[i][j]) return false;
    return true;
  }, [solution]);

  const finish = useCallback((finalGrid: SudokuGrid) => {
    setGrid(finalGrid);
    setWon(true);
    setSession(null);
    if (soundOn) sfx.win();
    const next = bumpStreak();
    if (next === 3) addDiamonds(20);
    else if (next === 5) addDiamonds(50);
    else if (next === 10) addDiamonds(150);
  }, [bumpStreak, addDiamonds, setSession, soundOn]);

  const tryAutoComplete = useCallback((next: SudokuGrid) => {
    if (!autoCompleteOn) return false;
    // Auto-complete kicks in when ≤ 6 empties remain and each remaining
    // cell's only legal candidate (per row/col/box) matches the solution.
    let empties = 0;
    for (let r = 0; r < 9; r++) for (let c = 0; c < 9; c++) if (next[r][c] === null) empties++;
    if (empties === 0 || empties > 6) return false;

    const candidatesOk = () => {
      for (let r = 0; r < 9; r++) {
        for (let c = 0; c < 9; c++) {
          if (next[r][c] !== null) continue;
          const used = new Set<number>();
          for (let i = 0; i < 9; i++) {
            if (next[r][i] !== null) used.add(next[r][i] as number);
            if (next[i][c] !== null) used.add(next[i][c] as number);
          }
          const br = Math.floor(r / 3) * 3, bc = Math.floor(c / 3) * 3;
          for (let i = br; i < br + 3; i++) for (let j = bc; j < bc + 3; j++)
            if (next[i][j] !== null) used.add(next[i][j] as number);
          let cnt = 0;
          for (let n = 1; n <= 9; n++) if (!used.has(n)) cnt++;
          if (cnt !== 1) return false;
        }
      }
      return true;
    };
    if (!candidatesOk()) return false;

    // Cascade-fill remaining cells
    const remaining: Array<{ r: number; c: number }> = [];
    for (let r = 0; r < 9; r++) for (let c = 0; c < 9; c++) if (next[r][c] === null) remaining.push({ r, c });
    let working = next.map((row) => row.slice());
    remaining.forEach((pos, i) => {
      setTimeout(() => {
        working = working.map((row) => row.slice());
        working[pos.r][pos.c] = solution[pos.r][pos.c];
        setGrid(working);
        if (soundOn) sfx.click();
        if (i === remaining.length - 1) {
          setTimeout(() => finish(working), 200);
        }
      }, 80 * i);
    });
    return true;
  }, [autoCompleteOn, solution, finish, soundOn]);

  const enter = (n: number | null) => {
    if (!sel || won) return;
    const { r, c } = sel;
    if (fixed[r][c]) return;
    const next = grid.map((row) => row.slice());
    if (n === null) {
      next[r][c] = null;
      setGrid(next);
      return;
    }
    if (solution[r][c] !== n) {
      const nextMistakes = mistakes + 1;
      setMistakes(nextMistakes);
      if (soundOn) sfx.fail();
      if (nextMistakes >= 3) {
        // game lost
        resetStreak();
        setSession(null);
      }
    } else if (soundOn) {
      sfx.click();
    }
    next[r][c] = n;
    setGrid(next);
    flashUnits(r, c, next);
    if (checkWin(next)) {
      finish(next);
    } else {
      tryAutoComplete(next);
    }
  };

  const useHint = () => {
    if (!sel || hintsLeft <= 0 || won) return;
    if (fixed[sel.r][sel.c]) return;
    const next = grid.map((row) => row.slice());
    next[sel.r][sel.c] = solution[sel.r][sel.c];
    setGrid(next);
    setHintsLeft((h) => h - 1);
    if (soundOn) sfx.click();
    flashUnits(sel.r, sel.c, next);
    if (checkWin(next)) finish(next);
    else tryAutoComplete(next);
  };

  const reset = () => {
    setGrid(puzzle.map((r) => r.slice()));
    setMistakes(0);
    setHintsLeft(3);
  };

  const counts = useMemo(() => {
    const c: Record<number, number> = {};
    for (let i = 1; i <= 9; i++) c[i] = 0;
    for (const row of grid) for (const v of row) if (v) c[v]++;
    return c;
  }, [grid]);

  const cellSizeRef = useRef(38);
  const cellSize = useMemo(() => {
    if (typeof window === "undefined") return 38;
    return Math.min(40, Math.floor((window.innerWidth - 24) / 9));
  }, []);
  cellSizeRef.current = cellSize;
  const inner = cellSize * 9;
  const time = `${String(Math.floor(seconds / 60)).padStart(2, "0")}:${String(seconds % 60).padStart(2, "0")}`;
  const lost = mistakes >= 3 && !won;
  const percentile = won ? computePercentile(difficulty, seconds, mistakes) : null;

  const startFresh = () => {
    setSession(null);
    navigate({
      to: "/play/classic",
      search: { difficulty, seed: Date.now() },
      replace: true,
    });
    setTimeout(() => window.location.reload(), 0);
  };

  return (
    <div className="min-h-screen flex flex-col px-3 pt-4" onClick={unlockAudio}>
      <div className="flex items-center justify-between px-2">
        <button
          onClick={() => setBackOpen(true)}
          className="w-9 h-9 rounded-full bg-card border border-border flex items-center justify-center"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="text-center">
          <div className="text-xs text-muted-foreground capitalize">{difficulty}</div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground tabular-nums">{time}</span>
          <button
            onClick={() => setPaused((p) => !p)}
            className="w-9 h-9 rounded-full bg-card border border-border flex items-center justify-center"
          >
            {paused ? <Play className="w-4 h-4" /> : <Pause className="w-4 h-4" />}
          </button>
        </div>
      </div>

      <div className="mt-2 px-2 flex items-center justify-between text-sm">
        <span className="text-muted-foreground">
          Greșeli: <span className="text-foreground font-semibold">{mistakes}</span>/3
        </span>
        {streak > 0 && (
          <span className="text-xs px-2 py-0.5 rounded-full bg-accent text-accent-foreground font-semibold">
            🔥 {streak}
          </span>
        )}
        <span className="text-primary font-bold">
          Scor: {Math.max(0, 1000 - mistakes * 100 - seconds)}
        </span>
      </div>

      <div className="mt-4 flex justify-center">
        <div
          className="bg-card rounded-xl overflow-hidden"
          style={{
            width: inner,
            height: inner,
            boxShadow: "inset 0 0 0 1.5px var(--color-board-line-thick)",
          }}
        >
          <div
            className="grid"
            style={{
              gridTemplateColumns: `repeat(9, ${cellSize}px)`,
              gridTemplateRows: `repeat(9, ${cellSize}px)`,
            }}
          >
            {grid.map((row, r) =>
              row.map((v, c) => {
                const selected = sel?.r === r && sel?.c === c;
                const sameRow = sel?.r === r;
                const sameCol = sel?.c === c;
                const sameBox =
                  sel &&
                  Math.floor(sel.r / 3) === Math.floor(r / 3) &&
                  Math.floor(sel.c / 3) === Math.floor(c / 3);
                const highlight = !selected && (sameRow || sameCol || sameBox);
                const sameValue =
                  sel && grid[sel.r][sel.c] && grid[sel.r][sel.c] === v && !selected;
                const wrong = v !== null && !fixed[r][c] && v !== solution[r][c];
                const isFlash = flashCells.has(`${r},${c}`);
                const rightThick = (c + 1) % 3 === 0 && c !== 8;
                const bottomThick = (r + 1) % 3 === 0 && r !== 8;
                return (
                  <button
                    key={`${r}-${c}`}
                    onClick={() => setSel({ r, c })}
                    className="flex items-center justify-center"
                    style={{
                      backgroundColor: isFlash
                        ? "var(--color-accent)"
                        : selected
                          ? "var(--color-cell-selected)"
                          : sameValue
                            ? "color-mix(in oklab, var(--color-cell-selected) 60%, white)"
                            : highlight
                              ? "var(--color-muted)"
                              : "transparent",
                      color: wrong
                        ? "var(--color-destructive)"
                        : fixed[r][c]
                          ? "var(--color-cell-fixed)"
                          : "var(--color-cell-user)",
                      fontWeight: fixed[r][c] ? 600 : 500,
                      fontSize: cellSize * 0.5,
                      borderRight: `${rightThick ? 2 : 1}px solid ${rightThick ? "var(--color-board-line-thick)" : "var(--color-board-line-thin)"}`,
                      borderBottom: `${bottomThick ? 2 : 1}px solid ${bottomThick ? "var(--color-board-line-thick)" : "var(--color-board-line-thin)"}`,
                      transition: "background-color 200ms ease, transform 200ms ease",
                      transform: isFlash ? "scale(1.06)" : "scale(1)",
                    }}
                  >
                    {v ?? ""}
                  </button>
                );
              }),
            )}
          </div>
        </div>
      </div>

      <div className="mt-5 flex justify-around">
        <ToolBtn Icon={RotateCcw} label="Reset" onClick={reset} />
        <ToolBtn Icon={Eraser} label="Șterge" onClick={() => enter(null)} />
        <ToolBtn
          Icon={Lightbulb}
          label={`Indiciu ${hintsLeft}`}
          onClick={useHint}
          disabled={hintsLeft <= 0}
        />
      </div>

      <div className="mt-5 px-2 pb-6 grid grid-cols-9 gap-1.5">
        {Array.from({ length: 9 }, (_, i) => i + 1).map((n) => {
          const left = 9 - counts[n];
          return (
            <button
              key={n}
              onClick={() => enter(n)}
              disabled={left <= 0}
              className="aspect-[3/4] rounded-xl bg-card border border-border shadow-soft flex flex-col items-center justify-center disabled:opacity-30"
            >
              <span className="text-xl font-bold text-primary leading-none">{n}</span>
              <span className="text-[10px] text-muted-foreground mt-0.5">{left}</span>
            </button>
          );
        })}
      </div>

      {paused && !won && (
        <div
          className="fixed inset-0 bg-foreground/40 backdrop-blur-sm flex items-center justify-center z-30"
          onClick={() => setPaused(false)}
        >
          <div className="bg-card rounded-2xl p-8 text-center shadow-card">
            <h2 className="text-xl font-bold mb-3">Pauză</h2>
            <button
              onClick={() => setPaused(false)}
              className="px-6 py-2 rounded-full bg-primary text-primary-foreground font-semibold"
            >
              Continuă
            </button>
          </div>
        </div>
      )}

      {backOpen && (
        <div className="fixed inset-0 bg-foreground/50 backdrop-blur-sm flex items-end sm:items-center justify-center z-30 px-4">
          <div className="bg-card rounded-3xl p-6 w-full max-w-sm shadow-card animate-slide-up">
            <h2 className="text-xl font-bold text-center">Pauză</h2>
            <p className="text-center text-sm text-muted-foreground mt-1">
              Vrei să continui sau să începi un joc nou?
            </p>
            <div className="flex flex-col gap-2 mt-5">
              <button
                onClick={() => setBackOpen(false)}
                className="py-3 rounded-2xl bg-primary text-primary-foreground font-semibold"
              >
                Continuă jocul
              </button>
              <button
                onClick={startFresh}
                className="py-3 rounded-2xl bg-muted font-semibold"
              >
                Joc nou
              </button>
              <button
                onClick={() => navigate({ to: "/" })}
                className="py-3 rounded-2xl text-muted-foreground"
              >
                Ieși la meniu
              </button>
            </div>
          </div>
        </div>
      )}

      {lost && (
        <div className="fixed inset-0 bg-foreground/60 backdrop-blur-sm flex items-center justify-center z-30 px-6">
          <div className="bg-card rounded-3xl p-8 text-center w-full max-w-sm shadow-card animate-slide-up">
            <h2 className="text-2xl font-bold">Ai pierdut</h2>
            <p className="text-sm text-muted-foreground mt-2">3 greșeli</p>
            <div className="flex flex-col gap-2 mt-5">
              <button
                onClick={startFresh}
                className="py-3 rounded-full bg-primary text-primary-foreground font-semibold"
              >
                Joc Nou
              </button>
              <button
                onClick={() => navigate({ to: "/" })}
                className="py-3 rounded-full bg-muted font-semibold"
              >
                Acasă
              </button>
            </div>
          </div>
        </div>
      )}

      {won && (
        <div className="fixed inset-0 bg-foreground/50 backdrop-blur-sm flex items-center justify-center z-30 px-6">
          <div className="bg-card rounded-3xl p-8 text-center w-full max-w-sm shadow-card animate-slide-up">
            <h2 className="text-2xl font-bold">Felicitări! 🎉</h2>
            <p className="text-sm text-muted-foreground mt-2">
              Timp: {time} · Greșeli: {mistakes}
            </p>
            {percentile !== null && (
              <div className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-full bg-accent text-accent-foreground font-bold">
                ✨ Ești în top {percentile}%
              </div>
            )}
            {streak > 1 && (
              <p className="text-xs text-muted-foreground mt-3">🔥 {streak} victorii consecutive</p>
            )}
            <div className="flex flex-col gap-2 mt-5">
              <button
                onClick={startFresh}
                className="py-3 rounded-full bg-primary text-primary-foreground font-semibold"
              >
                Joc Nou
              </button>
              <button
                onClick={() => navigate({ to: "/" })}
                className="py-3 rounded-full bg-muted font-semibold"
              >
                Acasă
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function ToolBtn({
  Icon,
  label,
  onClick,
  disabled,
}: {
  Icon: typeof Eraser;
  label: string;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="flex flex-col items-center gap-1 disabled:opacity-40"
    >
      <div className="w-11 h-11 rounded-full bg-card border border-border shadow-soft flex items-center justify-center">
        <Icon className="w-5 h-5 text-primary" strokeWidth={1.7} />
      </div>
      <span className="text-[11px] text-muted-foreground">{label}</span>
    </button>
  );
}
