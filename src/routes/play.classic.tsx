import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, Eraser, Lightbulb, Pause, Play, RotateCcw } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { generatePuzzle, type SudokuDifficulty, type SudokuGrid } from "@/game/classic";

export const Route = createFileRoute("/play/classic")({
  head: () => ({ meta: [{ title: "Sudoku Clasic — joc" }] }),
  component: ClassicGame,
  validateSearch: (s: Record<string, unknown>) => ({
    difficulty: (s.difficulty as SudokuDifficulty) || "medium",
    seed: typeof s.seed === "number" ? (s.seed as number) : undefined,
  }),
});

function ClassicGame() {
  const { difficulty, seed } = Route.useSearch();
  const navigate = useNavigate();

  const { puzzle, solution, fixed } = useMemo(() => {
    const s = seed ?? Date.now();
    const { puzzle: p, solution } = generatePuzzle(difficulty, s);
    const fixed = p.map((row) => row.map((v) => v !== null));
    return { puzzle: p, solution, fixed };
  }, [difficulty, seed]);

  const [grid, setGrid] = useState<SudokuGrid>(() => puzzle.map((r) => r.slice()));
  const [sel, setSel] = useState<{ r: number; c: number } | null>(null);
  const [mistakes, setMistakes] = useState(0);
  const [seconds, setSeconds] = useState(0);
  const [paused, setPaused] = useState(false);
  const [won, setWon] = useState(false);

  useEffect(() => {
    setGrid(puzzle.map((r) => r.slice()));
    setMistakes(0);
    setSeconds(0);
    setWon(false);
  }, [puzzle]);

  useEffect(() => {
    if (paused || won) return;
    const id = setInterval(() => setSeconds((s) => s + 1), 1000);
    return () => clearInterval(id);
  }, [paused, won]);

  const enter = (n: number | null) => {
    if (!sel || won) return;
    const { r, c } = sel;
    if (fixed[r][c]) return;
    const next = grid.map((row) => row.slice());
    if (n === null) {
      next[r][c] = null;
    } else {
      if (solution[r][c] !== n) setMistakes((m) => m + 1);
      next[r][c] = n;
    }
    setGrid(next);
    // check win
    let done = true;
    for (let i = 0; i < 9 && done; i++)
      for (let j = 0; j < 9 && done; j++)
        if (next[i][j] !== solution[i][j]) done = false;
    if (done) setWon(true);
  };

  const counts = useMemo(() => {
    const c: Record<number, number> = {};
    for (let i = 1; i <= 9; i++) c[i] = 0;
    for (const row of grid) for (const v of row) if (v) c[v]++;
    return c;
  }, [grid]);

  const cellSize = typeof window === "undefined" ? 38 : Math.min(40, Math.floor((window.innerWidth - 24) / 9));
  const inner = cellSize * 9;
  const time = `${String(Math.floor(seconds / 60)).padStart(2, "0")}:${String(seconds % 60).padStart(2, "0")}`;

  return (
    <div className="min-h-screen flex flex-col px-3 pt-4">
      {/* Top bar */}
      <div className="flex items-center justify-between px-2">
        <button onClick={() => navigate({ to: "/classic", search: {} })} className="w-9 h-9 rounded-full bg-card border border-border flex items-center justify-center">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="text-center">
          <div className="text-xs text-muted-foreground capitalize">{difficulty}</div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground tabular-nums">{time}</span>
          <button onClick={() => setPaused((p) => !p)} className="w-9 h-9 rounded-full bg-card border border-border flex items-center justify-center">
            {paused ? <Play className="w-4 h-4" /> : <Pause className="w-4 h-4" />}
          </button>
        </div>
      </div>

      <div className="mt-2 px-2 flex items-center justify-between text-sm">
        <span className="text-muted-foreground">Greșeli: <span className="text-foreground font-semibold">{mistakes}</span>/3</span>
        <span className="text-primary font-bold">Scor: {Math.max(0, 1000 - mistakes * 100 - seconds)}</span>
      </div>

      {/* Board */}
      <div className="mt-4 flex justify-center">
        <div className="bg-card rounded-md border border-board-line-thick" style={{ width: inner, height: inner }}>
          <div className="grid" style={{ gridTemplateColumns: `repeat(9, ${cellSize}px)`, gridTemplateRows: `repeat(9, ${cellSize}px)` }}>
            {grid.map((row, r) =>
              row.map((v, c) => {
                const selected = sel?.r === r && sel?.c === c;
                const sameRow = sel?.r === r;
                const sameCol = sel?.c === c;
                const sameBox =
                  sel && Math.floor(sel.r / 3) === Math.floor(r / 3) && Math.floor(sel.c / 3) === Math.floor(c / 3);
                const highlight = !selected && (sameRow || sameCol || sameBox);
                const sameValue = sel && grid[sel.r][sel.c] && grid[sel.r][sel.c] === v && !selected;
                const wrong = v !== null && !fixed[r][c] && v !== solution[r][c];
                const rightThick = (c + 1) % 3 === 0 && c !== 8;
                const bottomThick = (r + 1) % 3 === 0 && r !== 8;
                return (
                  <button
                    key={`${r}-${c}`}
                    onClick={() => setSel({ r, c })}
                    className="flex items-center justify-center"
                    style={{
                      backgroundColor: selected
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

      {/* Tools */}
      <div className="mt-5 flex justify-around">
        <ToolBtn Icon={RotateCcw} label="Reset" onClick={() => { setGrid(puzzle.map((r) => r.slice())); setMistakes(0); }} />
        <ToolBtn Icon={Eraser} label="Șterge" onClick={() => enter(null)} />
        <ToolBtn Icon={Lightbulb} label="Indiciu" onClick={() => { if (sel && !fixed[sel.r][sel.c]) enter(solution[sel.r][sel.c]); }} />
      </div>

      {/* Number pad */}
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
        <div className="fixed inset-0 bg-foreground/40 backdrop-blur-sm flex items-center justify-center z-30" onClick={() => setPaused(false)}>
          <div className="bg-card rounded-2xl p-8 text-center shadow-card">
            <h2 className="text-xl font-bold mb-3">Pauză</h2>
            <button onClick={() => setPaused(false)} className="px-6 py-2 rounded-full bg-primary text-primary-foreground font-semibold">
              Continuă
            </button>
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
            <div className="flex flex-col gap-2 mt-5">
              <button
                onClick={() => navigate({ to: "/play/classic", search: { difficulty } })}
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

function ToolBtn({ Icon, label, onClick }: { Icon: typeof Eraser; label: string; onClick: () => void }) {
  return (
    <button onClick={onClick} className="flex flex-col items-center gap-1">
      <div className="w-11 h-11 rounded-full bg-card border border-border shadow-soft flex items-center justify-center">
        <Icon className="w-5 h-5 text-primary" strokeWidth={1.7} />
      </div>
      <span className="text-[11px] text-muted-foreground">{label}</span>
    </button>
  );
}
