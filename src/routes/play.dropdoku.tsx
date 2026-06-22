import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  applyGravity,
  collides,
  createBag,
  emptyBoard,
  findAndClear,
  lockPiece,
  multiplierFor,
  spawnPiece,
  tryMove,
  tryRotate,
  type Board as BoardT,
  type Difficulty,
  type Piece,
  ROWS,
  COLS,
  clearTopRows,
} from "@/game/engine";
import { Board } from "@/components/game/Board";
import { HelperBar } from "@/components/game/HelperBar";
import { HelperTimer } from "@/components/game/HelperTimer";
import { useGameStore, type Helper } from "@/store/game-store";
import { ArrowLeft, Gem, Pause, Play } from "lucide-react";

export const Route = createFileRoute("/play/dropdoku")({
  head: () => ({
    meta: [
      { title: "Dropdoku — Sudoku Drop" },
      { name: "description", content: "Endless falling Sudoku puzzle." },
    ],
  }),
  component: DropdokuPage,
  validateSearch: (s: Record<string, unknown>) => ({
    difficulty: (s.difficulty as Difficulty) || "normal",
  }),
});

function DropdokuPage() {
  const { difficulty } = Route.useSearch();
  const navigate = useNavigate();

  const helpers = useGameStore((s) => s.helpers);
  const useHelperStore = useGameStore((s) => s.useHelper);
  const diamonds = useGameStore((s) => s.diamonds);
  const spendDiamonds = useGameStore((s) => s.spendDiamonds);
  const setHighScore = useGameStore((s) => s.setHighScore);
  const highScore = useGameStore((s) => s.highScores.dropdoku);

  const [board, setBoard] = useState<BoardT>(emptyBoard);
  const [bag, setBag] = useState<number[]>(() => createBag(difficulty));
  const [pieceIndex, setPieceIndex] = useState(0);
  const [piece, setPiece] = useState<Piece | null>(null);
  const [score, setScore] = useState(0);
  const [totalClears, setTotalClears] = useState(0);
  const [clearingCells, setClearingCells] = useState<Array<{ r: number; c: number }>>([]);
  const [paused, setPaused] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [usedFreeRevive, setUsedFreeRevive] = useState(false);

  // Helper state
  const [helperMode, setHelperMode] = useState<Helper | null>(null);
  const [helperPresses, setHelperPresses] = useState(0); // resets to 0 after a successful use
  const [swapFirst, setSwapFirst] = useState<{ r: number; c: number } | null>(null);

  const baseSpeed = difficulty === "easy" ? 900 : difficulty === "normal" ? 700 : 520;
  const speed = Math.max(220, baseSpeed - totalClears * 8);

  // Spawn first piece
  useEffect(() => {
    if (piece || gameOver) return;
    let nextBag = bag;
    if (nextBag.length < 2) {
      nextBag = [...nextBag, ...createBag(difficulty)];
    }
    const p = spawnPiece(nextBag, pieceIndex);
    if (collides(board, p, 1, 0) && collides(board, p, 0, 0)) {
      // No room at spawn -> game over
      setGameOver(true);
      setHighScore("dropdoku", score);
      return;
    }
    setPiece(p);
    setBag(nextBag);
    setPieceIndex((i) => i + 1);
  }, [piece, gameOver, bag, board, difficulty, pieceIndex, score, setHighScore]);

  // Resolve clears with animation
  const resolveClears = useCallback((b: BoardT) => {
    const result = findAndClear(b);
    if (result.clears === 0) {
      setBoard(b);
      return;
    }
    setClearingCells(result.cells);
    setBoard(b);
    const mult = multiplierFor(totalClears);
    setScore((s) => s + Math.round(100 * result.clears * mult));
    setTotalClears((t) => t + result.clears);
    setTimeout(() => {
      const dropped = applyGravity(result.board);
      setClearingCells([]);
      // Cascade
      const cascade = findAndClear(dropped);
      if (cascade.clears > 0) {
        setTimeout(() => resolveClears(dropped), 80);
      } else {
        setBoard(dropped);
      }
    }, 320);
  }, [totalClears]);

  // Gravity tick
  useEffect(() => {
    if (!piece || paused || gameOver || helperMode) return;
    const id = setInterval(() => {
      setPiece((cur) => {
        if (!cur) return cur;
        if (!collides(board, cur, 1, 0)) {
          return { ...cur, r: cur.r + 1 };
        }
        // Lock
        const locked = lockPiece(board, cur);
        resolveClears(locked);
        return null;
      });
    }, speed);
    return () => clearInterval(id);
  }, [piece, board, paused, gameOver, helperMode, speed, resolveClears]);

  // Controls — split screen taps
  const handleZoneTap = (zone: "left" | "right" | "center") => {
    if (!piece || paused || gameOver || helperMode) return;
    if (zone === "left") {
      const moved = tryMove(board, piece, -1);
      if (moved) setPiece(moved);
    } else if (zone === "right") {
      const moved = tryMove(board, piece, 1);
      if (moved) setPiece(moved);
    } else {
      const rotated = tryRotate(board, piece);
      if (rotated) setPiece(rotated);
    }
  };

  // Hard drop on swipe-down (simple double tap center)
  const lastCenter = useRef(0);
  const onCenterTap = () => {
    const now = Date.now();
    if (now - lastCenter.current < 280) {
      // hard drop
      if (!piece) return;
      let p = piece;
      while (!collides(board, p, 1, 0)) p = { ...p, r: p.r + 1 };
      const locked = lockPiece(board, p);
      setPiece(null);
      resolveClears(locked);
    } else {
      handleZoneTap("center");
    }
    lastCenter.current = now;
  };

  // Helpers
  const startHelper = (h: Helper) => {
    if (helpers[h] <= 0 || gameOver) return;
    // pause + start timer (10/6/3 cascade)
    setHelperMode(h);
    setSwapFirst(null);
    setHelperPresses((n) => n + 1);
    setPaused(true);
  };

  const helperSeconds =
    helperPresses === 0 ? 10 : helperPresses === 1 ? 10 : helperPresses === 2 ? 6 : 3;

  const cancelHelper = () => {
    setHelperMode(null);
    setSwapFirst(null);
    setPaused(false);
  };

  const onCellTap = (r: number, c: number) => {
    if (!helperMode) return;
    if (helperMode === "hammer") {
      if (board[r][c] === null) return;
      const next = board.map((row) => row.slice());
      next[r][c] = null;
      const after = applyGravity(next);
      if (useHelperStore("hammer")) {
        setBoard(after);
        setHelperPresses(0);
        setHelperMode(null);
        setPaused(false);
        resolveClears(after);
      }
    } else if (helperMode === "swap") {
      if (board[r][c] === null) return;
      if (!swapFirst) {
        setSwapFirst({ r, c });
        return;
      }
      const isAdj =
        Math.abs(swapFirst.r - r) + Math.abs(swapFirst.c - c) === 1;
      if (!isAdj) {
        setSwapFirst({ r, c });
        return;
      }
      const next = board.map((row) => row.slice());
      [next[r][c], next[swapFirst.r][swapFirst.c]] = [
        next[swapFirst.r][swapFirst.c],
        next[r][c],
      ];
      if (useHelperStore("swap")) {
        setBoard(next);
        setSwapFirst(null);
        setHelperPresses(0);
        setHelperMode(null);
        setPaused(false);
        resolveClears(next);
      }
    } else if (helperMode === "boom") {
      const next = board.map((row) => row.slice());
      // + cross
      for (let i = 0; i < COLS; i++) next[r][i] = null;
      for (let i = 0; i < ROWS; i++) next[i][c] = null;
      const after = applyGravity(next);
      if (useHelperStore("boom")) {
        setBoard(after);
        setHelperPresses(0);
        setHelperMode(null);
        setPaused(false);
        resolveClears(after);
      }
    }
  };

  const cellSize = useMemo(() => {
    if (typeof window === "undefined") return 36;
    const max = Math.min(window.innerWidth - 32, 420);
    return Math.floor((max - 16) / COLS);
  }, []);

  const mult = multiplierFor(totalClears);

  // Revive
  const revive = (free: boolean) => {
    if (!free && !spendDiamonds(50)) return;
    if (free) setUsedFreeRevive(true);
    setBoard((b) => clearTopRows(b, 3));
    setGameOver(false);
    setPiece(null);
  };

  return (
    <div className="min-h-screen flex flex-col">
      {/* HUD */}
      <header className="px-4 pt-4 pb-2 flex items-center justify-between">
        <button
          onClick={() => navigate({ to: "/" })}
          className="soft-card w-10 h-10 flex items-center justify-center"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex gap-2">
          <div className="soft-card px-3 py-1.5 text-sm font-bold">
            <span className="text-muted-foreground mr-1">Score</span>
            {score}
          </div>
          <div className="soft-card px-3 py-1.5 text-sm font-bold">
            <span className="text-muted-foreground mr-1">x</span>
            {mult.toFixed(1)}
          </div>
        </div>
        <button
          onClick={() => setPaused((p) => !p)}
          className="soft-card w-10 h-10 flex items-center justify-center"
        >
          {paused ? <Play className="w-5 h-5" /> : <Pause className="w-5 h-5" />}
        </button>
      </header>

      <div className="px-4 text-center text-xs text-muted-foreground">
        Best {highScore} · {difficulty.toUpperCase()} ·{" "}
        <Gem className="inline w-3 h-3 text-diamond" /> {diamonds}
      </div>

      {/* Board */}
      <div className="flex-1 flex items-center justify-center relative">
        <Board
          board={board}
          piece={piece}
          clearingCells={clearingCells}
          helperMode={helperMode}
          onCellTap={onCellTap}
          swapFirst={swapFirst}
          cellSize={cellSize}
        />

        {/* Touch zones overlay */}
        {!helperMode && !paused && !gameOver && (
          <div className="absolute inset-0 flex">
            <button
              className="flex-[3]"
              onClick={() => handleZoneTap("left")}
              aria-label="move left"
            />
            <button
              className="flex-[4]"
              onClick={onCenterTap}
              aria-label="rotate / hard drop"
            />
            <button
              className="flex-[3]"
              onClick={() => handleZoneTap("right")}
              aria-label="move right"
            />
          </div>
        )}
      </div>

      {/* Helpers */}
      <div className="p-4 pb-6">
        <HelperBar
          counts={helpers}
          active={helperMode}
          onPick={startHelper}
          disabled={gameOver}
        />
        <p className="text-center text-xs text-muted-foreground mt-3">
          ← move · tap center to rotate · double-tap to drop · → move
        </p>
      </div>

      {/* Helper Timer */}
      {helperMode && (
        <HelperTimer
          seconds={helperSeconds}
          label={helperMode.toUpperCase()}
          onExpire={cancelHelper}
          onCancel={cancelHelper}
        />
      )}

      {/* Pause overlay */}
      {paused && !helperMode && (
        <div className="fixed inset-0 bg-foreground/40 backdrop-blur-sm flex items-center justify-center z-30">
          <div className="soft-card p-8 text-center">
            <h2 className="text-2xl font-bold mb-4">Paused</h2>
            <button
              onClick={() => setPaused(false)}
              className="px-8 py-3 rounded-2xl bg-primary text-primary-foreground font-bold"
            >
              Resume
            </button>
          </div>
        </div>
      )}

      {/* Game Over */}
      {gameOver && (
        <div className="fixed inset-0 bg-foreground/60 backdrop-blur-sm flex items-center justify-center z-30 px-6">
          <div className="soft-card p-8 text-center w-full max-w-sm animate-slide-up">
            <h2 className="text-3xl font-bold mb-1">Game Over</h2>
            <p className="text-muted-foreground mb-4">Score: {score}</p>
            <div className="flex flex-col gap-3">
              {!usedFreeRevive && (
                <button
                  onClick={() => revive(true)}
                  className="px-6 py-3 rounded-2xl bg-accent text-accent-foreground font-bold"
                >
                  ▶ Watch Ad to Revive (Free)
                </button>
              )}
              <button
                onClick={() => revive(false)}
                disabled={diamonds < 50}
                className="px-6 py-3 rounded-2xl bg-primary text-primary-foreground font-bold disabled:opacity-40"
              >
                <Gem className="inline w-4 h-4 mr-1" /> 50 — Revive
              </button>
              <button
                onClick={() => navigate({ to: "/" })}
                className="px-6 py-3 rounded-2xl bg-muted font-bold"
              >
                Main Menu
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
