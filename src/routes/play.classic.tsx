import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, Eraser, Lightbulb, Pause, Play, RotateCcw } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { submitScore } from "@/lib/leaderboard";
import {
  generatePuzzle,
  type SudokuDifficulty,
  type SudokuGrid,
  type SudokuSolution,
} from "@/game/classic";
import { useGameStore } from "@/store/game-store";
import { sfx, unlockAudio } from "@/lib/sfx";
import { PauseSheet } from "@/components/PauseSheet";
import { HintShopModal } from "@/components/HintShopModal";
import { useT } from "@/i18n";
import { toast } from "sonner";


export const Route = createFileRoute("/play/classic")({
  head: () => ({ meta: [{ title: "Sudoku Clasic — joc" }] }),
  component: ClassicGame,
  validateSearch: (s: Record<string, unknown>) => {
    const rawSeed = s.seed;
    const parsedSeed =
      typeof rawSeed === "number"
        ? rawSeed
        : typeof rawSeed === "string"
          ? Number(rawSeed)
          : undefined;
    return {
      difficulty: (s.difficulty as SudokuDifficulty) || "medium",
      seed: Number.isFinite(parsedSeed) ? parsedSeed : undefined,
      resume: s.resume === true || s.resume === "true" ? true : undefined,
    };
  },
});

// Maximum allowed time per difficulty (seconds). Hit it and you lose.
const TIME_LIMIT: Record<SudokuDifficulty, number> = {
  easy: 30 * 60,
  medium: 25 * 60,
  hard: 20 * 60,
  expert: 17 * 60,
  extreme: 12 * 60,
};

// Base score awarded at perfect run, scaled down by time used / mistakes / hints.
const BASE_SCORE: Record<SudokuDifficulty, number> = {
  easy: 1500,
  medium: 2500,
  hard: 4000,
  expert: 6000,
  extreme: 9000,
};

function computeFinalScore(d: SudokuDifficulty, seconds: number, mistakes: number, hintsUsed: number) {
  const limit = TIME_LIMIT[d];
  const ratio = Math.max(0, (limit - seconds) / limit);
  const score = Math.round(BASE_SCORE[d] * ratio - mistakes * 200 - hintsUsed * 100);
  return Math.max(0, score);
}

function ClassicGame() {
  const t = useT();
  const search = Route.useSearch();
  const difficulty = search.difficulty as SudokuDifficulty;
  const seed = search.seed;
  const resume = search.resume;
  const navigate = useNavigate();
  const session = useGameStore((s) => s.classicSession);
  const setSession = useGameStore((s) => s.setClassicSession);
  const autoCompleteOn = useGameStore((s) => s.settings.autoComplete);
  const soundOn = useGameStore((s) => s.settings.sound);
  const bumpStreak = useGameStore((s) => s.bumpClassicStreak);
  const resetStreak = useGameStore((s) => s.resetClassicStreak);
  const streak = useGameStore((s) => s.classicStreak);
  const addDiamonds = useGameStore((s) => s.addDiamonds);
  const setClassicHighScore = useGameStore((s) => s.setClassicHighScore);
  const awardRunXp = useGameStore((s) => s.awardRunXp);
  const highScore = useGameStore((s) => s.highScores.classic?.[difficulty] ?? 0);
  const [xpGained, setXpGained] = useState(0);


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
        startedAt: session.startedAt,
      };
    }
    const s = seed ?? 1;
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
      startedAt: Date.now(),
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
  const [hintsUsed, setHintsUsed] = useState(0);
  const [hintShop, setHintShop] = useState(false);
  const [hintAdsUsed, setHintAdsUsed] = useState(0);
  const [flashCells, setFlashCells] = useState<Set<string>>(new Set());
  const startedAtRef = useRef(init.startedAt);
  const [finalScore, setFinalScore] = useState<number | null>(null);

  const { puzzle, solution, fixed } = init;
  const limit = TIME_LIMIT[difficulty];
  const lost = (mistakes >= 3 || seconds >= limit) && !won;

  useEffect(() => {
    if (won || lost) return;
    setSession({
      difficulty,
      seed: init.seed,
      puzzle,
      solution,
      grid,
      mistakes,
      seconds,
      hintsLeft,
      startedAt: startedAtRef.current,
    });
  }, [
    grid, mistakes, seconds, hintsLeft, won, lost,
    difficulty, init.seed, puzzle, solution, setSession,
  ]);

  useEffect(() => {
    if (paused || backOpen || won || lost) return;
    const id = setInterval(() => setSeconds((s) => s + 1), 1000);
    return () => clearInterval(id);
  }, [paused, backOpen, won, lost]);

  // Clear session if we lost
  useEffect(() => {
    if (lost) {
      resetStreak();
      setSession(null);
      if (soundOn) sfx.fail();
    }
  }, [lost, resetStreak, setSession, soundOn]);

  const flashUnits = useCallback(
    (r: number, c: number, next: SudokuGrid) => {
      const cells: string[] = [];
      if (next[r].every((v) => v !== null)) for (let i = 0; i < 9; i++) cells.push(`${r},${i}`);
      if (next.every((row) => row[c] !== null)) for (let i = 0; i < 9; i++) cells.push(`${i},${c}`);
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
    },
    [soundOn],
  );

  const checkWin = useCallback(
    (next: SudokuGrid) => {
      for (let i = 0; i < 9; i++)
        for (let j = 0; j < 9; j++) if (next[i][j] !== solution[i][j]) return false;
      return true;
    },
    [solution],
  );

  const finish = useCallback(
    (finalGrid: SudokuGrid, mistakesUsed: number, hintsUsedFinal: number, secondsUsed: number) => {
      setGrid(finalGrid);
      setWon(true);
      setSession(null);
      if (soundOn) sfx.win();
      const score = computeFinalScore(difficulty, secondsUsed, mistakesUsed, hintsUsedFinal);
      setFinalScore(score);
      setClassicHighScore(difficulty, score);
      void submitScore("classic", difficulty, score);
      const xpRes = awardRunXp(difficulty, score);
      setXpGained(xpRes.xpGained);
      if (xpRes.levelsGained > 0) {
        toast.success(
          `${t("Nivel")} ${xpRes.level}! +${xpRes.coins} 🪙${xpRes.tickets ? ` +${xpRes.tickets} 🎟` : ""}`,
        );
      }
      const next = bumpStreak();
      if (next === 3) addDiamonds(20);
      else if (next === 5) addDiamonds(50);
      else if (next === 10) addDiamonds(150);
    },
    [bumpStreak, addDiamonds, setSession, soundOn, difficulty, setClassicHighScore, awardRunXp, t],
  );


  const tryAutoComplete = useCallback(
    (next: SudokuGrid, mistakesUsed: number, hintsUsedFinal: number) => {
      if (!autoCompleteOn) return false;
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
            const br = Math.floor(r / 3) * 3,
              bc = Math.floor(c / 3) * 3;
            for (let i = br; i < br + 3; i++)
              for (let j = bc; j < bc + 3; j++)
                if (next[i][j] !== null) used.add(next[i][j] as number);
            let cnt = 0;
            for (let n = 1; n <= 9; n++) if (!used.has(n)) cnt++;
            if (cnt !== 1) return false;
          }
        }
        return true;
      };
      if (!candidatesOk()) return false;
      const remaining: Array<{ r: number; c: number }> = [];
      for (let r = 0; r < 9; r++)
        for (let c = 0; c < 9; c++) if (next[r][c] === null) remaining.push({ r, c });
      let working = next.map((row) => row.slice());
      remaining.forEach((pos, i) => {
        setTimeout(() => {
          working = working.map((row) => row.slice());
          working[pos.r][pos.c] = solution[pos.r][pos.c];
          setGrid(working);
          if (soundOn) sfx.click();
          if (i === remaining.length - 1) {
            setTimeout(() => finish(working, mistakesUsed, hintsUsedFinal, seconds), 200);
          }
        }, 80 * i);
      });
      return true;
    },
    [autoCompleteOn, solution, finish, soundOn, seconds],
  );

  const enter = (n: number | null) => {
    if (!sel || won || lost) return;
    const { r, c } = sel;
    if (fixed[r][c]) return;
    const next = grid.map((row) => row.slice());
    if (n === null) {
      next[r][c] = null;
      setGrid(next);
      return;
    }
    let nextMistakes = mistakes;
    if (solution[r][c] !== n) {
      nextMistakes = mistakes + 1;
      setMistakes(nextMistakes);
      if (soundOn) sfx.fail();
    } else if (soundOn) {
      sfx.click();
    }
    next[r][c] = n;
    setGrid(next);
    flashUnits(r, c, next);
    if (checkWin(next)) {
      finish(next, nextMistakes, hintsUsed, seconds);
    } else {
      tryAutoComplete(next, nextMistakes, hintsUsed);
    }
  };

  const useHint = () => {
    if (won || lost) return;
    if (hintsLeft <= 0) {
      setHintShop(true);
      return;
    }
    if (!sel) return;
    if (fixed[sel.r][sel.c]) return;
    const next = grid.map((row) => row.slice());
    next[sel.r][sel.c] = solution[sel.r][sel.c];
    setGrid(next);
    setHintsLeft((h) => h - 1);
    const hu = hintsUsed + 1;
    setHintsUsed(hu);
    if (soundOn) sfx.click();
    flashUnits(sel.r, sel.c, next);
    if (checkWin(next)) finish(next, mistakes, hu, seconds);
    else tryAutoComplete(next, mistakes, hu);
  };


  const reset = () => {
    setGrid(puzzle.map((r) => r.slice()));
    setMistakes(0);
    setHintsLeft(3);
    setHintsUsed(0);
  };

  const counts = useMemo(() => {
    const c: Record<number, number> = {};
    for (let i = 1; i <= 9; i++) c[i] = 0;
    for (const row of grid) for (const v of row) if (v) c[v]++;
    return c;
  }, [grid]);

  const cellSize = 38;
  const inner = cellSize * 9;
  const remaining = Math.max(0, limit - seconds);
  const time = `${String(Math.floor(seconds / 60)).padStart(2, "0")}:${String(seconds % 60).padStart(2, "0")}`;
  const timeLeft = `${String(Math.floor(remaining / 60)).padStart(2, "0")}:${String(remaining % 60).padStart(2, "0")}`;
  const timeWarn = remaining <= 60;

  const startFresh = () => {
    setSession(null);
    if (typeof window !== "undefined") {
      window.location.href = `/play/classic?difficulty=${difficulty}&seed=${Date.now()}`;
    }
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
          <div className="text-[10px] text-muted-foreground">{t("Record")}: {highScore}</div>
        </div>
        <div className="flex items-center gap-2">
          <span
            className={`text-sm tabular-nums font-semibold ${timeWarn ? "text-destructive" : "text-muted-foreground"}`}
          >
            {timeLeft}
          </span>
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
          {t("Greșeli")}: <span className="text-foreground font-semibold">{mistakes}</span>/3
        </span>
        {streak > 0 && (
          <span className="text-xs px-2 py-0.5 rounded-full bg-accent text-accent-foreground font-semibold">
            🔥 {streak}
          </span>
        )}
        <span className="text-primary font-bold tabular-nums">
          {computeFinalScore(difficulty, seconds, mistakes, hintsUsed)}p
        </span>
      </div>

      <div className="mt-4 flex justify-center">
        <div
          className="relative bg-card rounded-xl overflow-hidden"
          style={{ width: inner, height: inner }}
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
                // Background fill only — every grid line is drawn by the
                // overlay below, so highlights can never hide a line.
                const bg = isFlash
                  ? "var(--color-accent)"
                  : selected
                    ? "var(--color-cell-selected)"
                    : sameValue
                      ? "var(--color-cell-same)"
                      : highlight
                        ? "var(--color-cell-peer)"
                        : "transparent";
                return (
                  <button
                    key={`${r}-${c}`}
                    onClick={() => setSel({ r, c })}
                    className="flex items-center justify-center"
                    style={{
                      backgroundColor: bg,
                      color: wrong
                        ? "var(--color-destructive)"
                        : fixed[r][c]
                          ? "var(--color-cell-fixed)"
                          : "var(--color-cell-user)",
                      fontWeight: fixed[r][c] ? 600 : 500,
                      fontSize: cellSize * 0.5,
                      transition: "background-color 160ms ease, transform 200ms ease",
                      transform: isFlash ? "scale(1.06)" : "scale(1)",
                    }}
                  >
                    {v ?? ""}
                  </button>
                );
              }),
            )}
          </div>

          {/* Grid lines drawn on top of the cells */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              boxShadow: "inset 0 0 0 2px var(--color-board-line-thick)",
              backgroundImage: `
                repeating-linear-gradient(to right, var(--color-board-line-thin) 0 1px, transparent 1px ${cellSize}px),
                repeating-linear-gradient(to bottom, var(--color-board-line-thin) 0 1px, transparent 1px ${cellSize}px)
              `,
            }}
          />
          {[1, 2].map((i) => (
            <span
              key={`v${i}`}
              className="absolute top-0 bottom-0 pointer-events-none"
              style={{
                left: i * cellSize * 3 - 1,
                width: 2,
                background: "var(--color-board-line-thick)",
              }}
            />
          ))}
          {[1, 2].map((i) => (
            <span
              key={`h${i}`}
              className="absolute left-0 right-0 pointer-events-none"
              style={{
                top: i * cellSize * 3 - 1,
                height: 2,
                background: "var(--color-board-line-thick)",
              }}
            />
          ))}
        </div>
      </div>


      <div className="mt-5 flex justify-around">
        <ToolBtn Icon={RotateCcw} label={t("Reset")} onClick={reset} />
        <ToolBtn Icon={Eraser} label={t("Șterge")} onClick={() => enter(null)} />
        <ToolBtn
          Icon={Lightbulb}
          label={hintsLeft > 0 ? `${t("Indiciu")} ${hintsLeft}` : `+ ${t("Indiciu")}`}
          onClick={useHint}
        />
      </div>

      <div className="mt-5 px-2 pb-6 grid grid-cols-9 gap-1.5">
        {Array.from({ length: 9 }, (_, i) => i + 1).map((n) => {
          const left = 9 - counts[n];
          const done = left <= 0;
          const isSelVal = sel && grid[sel.r][sel.c] === n;
          return (
            <button
              key={n}
              onClick={() => enter(n)}
              disabled={done}
              className={`relative aspect-[3/4] rounded-xl flex flex-col items-center justify-center transition ${
                done
                  ? "bg-muted text-muted-foreground opacity-50"
                  : isSelVal
                    ? "bg-primary text-primary-foreground shadow-card"
                    : "bg-accent text-primary shadow-soft"
              }`}
            >
              <span className="text-2xl font-bold leading-none">{n}</span>
              <span
                className={`absolute -top-1.5 -right-1.5 min-w-[20px] h-[20px] px-1 rounded-full text-[10px] font-bold flex items-center justify-center shadow ${
                  done
                    ? "bg-muted text-muted-foreground"
                    : "bg-card border border-border text-foreground"
                }`}
              >
                {done ? "✓" : left}
              </span>
            </button>
          );
        })}
      </div>

      <HintShopModal
        open={hintShop}
        adsUsed={hintAdsUsed}
        onClose={() => setHintShop(false)}
        onGrant={(n, fromAd) => {
          setHintsLeft((h) => h + n);
          if (fromAd) setHintAdsUsed((a) => a + 1);
        }}
      />

      <PauseSheet

        open={paused && !backOpen && !won && !lost}
        onResume={() => setPaused(false)}
        onRestart={startFresh}
        onMenu={() => navigate({ to: "/" })}
        onExit={() => {
          setSession(null);
          navigate({ to: "/" });
        }}
      />

      <PauseSheet
        open={backOpen && !won && !lost}
        title={t("Meniu pauză")}
        onResume={() => setBackOpen(false)}
        onRestart={startFresh}
        onMenu={() => navigate({ to: "/" })}
        onExit={() => {
          setSession(null);
          navigate({ to: "/" });
        }}
      />

      {lost && (
        <div className="fixed inset-0 bg-foreground/60 backdrop-blur-sm flex items-center justify-center z-30 px-6">
          <div className="bg-card rounded-3xl p-8 text-center w-full max-w-sm shadow-card animate-slide-up">
            <h2 className="text-2xl font-bold">{t("Ai pierdut")}</h2>
            <p className="text-sm text-muted-foreground mt-2">
              {mistakes >= 3 ? t("3 greșeli") : t("Timpul a expirat")}
            </p>
            <div className="flex flex-col gap-2 mt-5">
              <button
                onClick={startFresh}
                className="py-3 rounded-full bg-primary text-primary-foreground font-semibold"
              >
                {t("Joc Nou")}
              </button>
              <button
                onClick={() => navigate({ to: "/" })}
                className="py-3 rounded-full bg-muted font-semibold"
              >
                {t("Acasă")}
              </button>
            </div>
          </div>
        </div>
      )}

      {won && (
        <div className="fixed inset-0 bg-foreground/50 backdrop-blur-sm flex items-center justify-center z-30 px-6">
          <div className="bg-card rounded-3xl p-8 text-center w-full max-w-sm shadow-card animate-slide-up">
            <h2 className="text-2xl font-bold">{t("Felicitări! 🎉")}</h2>
            <p className="text-sm text-muted-foreground mt-2">
              {t("Timp")}: {time} · {t("Greșeli")}: {mistakes}
            </p>
            {finalScore !== null && (
              <div className="mt-4 inline-flex flex-col items-center gap-1 px-6 py-3 rounded-2xl bg-accent text-accent-foreground">
                <span className="text-xs uppercase tracking-wide">{t("Scor final")}</span>
                <span className="text-3xl font-bold">{finalScore}</span>
              </div>
            )}
            {xpGained > 0 && (
              <p className="text-xs font-semibold text-primary mt-3">+{xpGained} XP</p>
            )}
            {streak > 1 && (
              <p className="text-xs text-muted-foreground mt-1">🔥 {streak} {t("victorii consecutive")}</p>
            )}

            <div className="flex flex-col gap-2 mt-5">
              <button
                onClick={startFresh}
                className="py-3 rounded-full bg-primary text-primary-foreground font-semibold"
              >
                {t("Joc Nou")}
              </button>
              <button
                onClick={() => navigate({ to: "/" })}
                className="py-3 rounded-full bg-muted font-semibold"
              >
                {t("Acasă")}
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
