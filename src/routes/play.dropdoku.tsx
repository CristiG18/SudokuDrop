import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  applyGravity,
  collides,
  createBag,
  emptyBoard,
  findAndClear,
  hardDrop,
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
import { ArrowLeft, ArrowDown, Gem, Pause, Play, RotateCw } from "lucide-react";
import { sfx, unlockAudio } from "@/lib/sfx";
import { PauseSheet } from "@/components/PauseSheet";
import { RewardedHelperModal } from "@/components/RewardedHelperModal";

export const Route = createFileRoute("/play/dropdoku")({
  head: () => ({
    meta: [
      { title: "Sudoku Drop — joc" },
      { name: "description", content: "Endless falling Sudoku puzzle." },
    ],
  }),
  component: DropdokuPage,
  validateSearch: (s: Record<string, unknown>) => ({
    difficulty: (s.difficulty as Difficulty) || "normal",
    resume: s.resume === true || s.resume === "true" ? true : undefined,
  }),
});

interface Popup {
  id: number;
  x: number;
  y: number;
  text: string;
}

function previewForHelper(
  helper: Helper,
  r: number,
  c: number,
): Array<{ r: number; c: number }> {
  if (helper === "hammer" || helper === "swap") return [{ r, c }];
  if (helper === "boom") {
    // 2x2 anchored so it stays on board
    const sr = Math.min(r, ROWS - 2);
    const sc = Math.min(c, COLS - 2);
    return [
      { r: sr, c: sc },
      { r: sr, c: sc + 1 },
      { r: sr + 1, c: sc },
      { r: sr + 1, c: sc + 1 },
    ];
  }
  // cross: full row + full column
  const cells: Array<{ r: number; c: number }> = [];
  for (let i = 0; i < COLS; i++) cells.push({ r, c: i });
  for (let i = 0; i < ROWS; i++) if (i !== r) cells.push({ r: i, c });
  return cells;
}

function DropdokuPage() {
  const { difficulty, resume } = Route.useSearch();
  const navigate = useNavigate();

  const helpers = useGameStore((s) => s.helpers);
  const consumeHelper = useGameStore((s) => s.useHelper);
  const diamonds = useGameStore((s) => s.diamonds);
  const spendDiamonds = useGameStore((s) => s.spendDiamonds);
  const setHighScore = useGameStore((s) => s.setDropdokuHighScore);
  const highScore = useGameStore((s) => s.highScores.dropdoku);
  const savedSession = useGameStore((s) => s.dropdokuSession);
  const setSession = useGameStore((s) => s.setDropdokuSession);
  const soundOn = useGameStore((s) => s.settings.sound);
  const controlMode = useGameStore((s) => s.settings.controlMode);
  const setSetting = useGameStore((s) => s.setSetting);

  const initial = useMemo(() => {
    if (resume && savedSession && savedSession.difficulty === difficulty) {
      return {
        board: savedSession.board as BoardT,
        bag: savedSession.bag.slice(),
        pieceIndex: savedSession.pieceIndex,
        score: savedSession.score,
        totalClears: savedSession.totalClears,
        startedAt: savedSession.startedAt,
      };
    }
    return {
      board: emptyBoard(),
      bag: createBag(difficulty),
      pieceIndex: 0,
      score: 0,
      totalClears: 0,
      startedAt: Date.now(),
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const [board, setBoard] = useState<BoardT>(initial.board);
  const [bag, setBag] = useState<number[]>(initial.bag);
  const [pieceIndex, setPieceIndex] = useState(initial.pieceIndex);
  const [piece, setPiece] = useState<Piece | null>(null);
  const [score, setScore] = useState(initial.score);
  const [totalClears, setTotalClears] = useState(initial.totalClears);
  const [clearingCells, setClearingCells] = useState<Array<{ r: number; c: number }>>([]);
  const [paused, setPaused] = useState(false);
  const [backOpen, setBackOpen] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [usedFreeRevive, setUsedFreeRevive] = useState(false);
  const [popups, setPopups] = useState<Popup[]>([]);
  const popupId = useRef(0);

  const [helperMode, setHelperMode] = useState<Helper | null>(null);
  const [helperPresses, setHelperPresses] = useState(0);
  const [swapFirst, setSwapFirst] = useState<{ r: number; c: number } | null>(null);
  const [previewCells, setPreviewCells] = useState<Array<{ r: number; c: number }>>([]);

  const baseSpeed = difficulty === "easy" ? 900 : difficulty === "normal" ? 700 : 520;
  const speed = Math.max(220, baseSpeed - totalClears * 8);

  const startedAtRef = useRef(initial.startedAt);
  const [rewardHelper, setRewardHelper] = useState<Helper | null>(null);

  useEffect(() => {
    if (gameOver) return;
    setSession({
      difficulty,
      board,
      bag,
      pieceIndex,
      score,
      totalClears,
      startedAt: startedAtRef.current,
    });
  }, [difficulty, board, bag, pieceIndex, score, totalClears, gameOver, setSession]);

  useEffect(() => {
    if (piece || gameOver) return;
    let nextBag = bag;
    if (nextBag.length < 2) nextBag = [...nextBag, ...createBag(difficulty)];
    const p = spawnPiece(nextBag, pieceIndex);
    if (collides(board, p, 1, 0) && collides(board, p, 0, 0)) {
      setGameOver(true);
      setHighScore(score);
      setSession(null);
      if (soundOn) sfx.fail();
      return;
    }
    setPiece(p);
    setBag(nextBag);
    setPieceIndex((i) => i + 1);
  }, [
    piece,
    gameOver,
    bag,
    board,
    difficulty,
    pieceIndex,
    score,
    setHighScore,
    setSession,
    soundOn,
  ]);

  const cellSize = useMemo(() => {
    if (typeof window === "undefined") return 36;
    const max = Math.min(window.innerWidth - 32, 420);
    return Math.floor((max - 16) / COLS);
  }, []);
  const cellSizeRef = useRef(cellSize);
  cellSizeRef.current = cellSize;

  const spawnPopup = useCallback(
    (text: string, cells: Array<{ r: number; c: number }>, cs: number) => {
      if (!cells.length) return;
      const cx = cells.reduce((a, p) => a + p.c, 0) / cells.length;
      const cy = cells.reduce((a, p) => a + p.r, 0) / cells.length;
      const x = (cx + 0.5) * cs;
      const y = (cy + 0.5) * cs;
      const id = ++popupId.current;
      setPopups((cur) => [...cur, { id, x, y, text }]);
      setTimeout(() => setPopups((cur) => cur.filter((p) => p.id !== id)), 900);
    },
    [],
  );

  const resolveClears = useCallback(
    (b: BoardT) => {
      const settled = applyGravity(b);
      const result = findAndClear(settled);
      if (result.clears === 0) {
        setBoard(settled);
        return;
      }
      setClearingCells(result.cells);
      setBoard(result.board);
      const mult = multiplierFor(totalClears);
      const gain = Math.round(100 * result.clears * mult);
      setScore((s) => s + gain);
      setTotalClears((t) => t + result.clears);
      if (soundOn) sfx.clear(result.clears);
      spawnPopup(`+${gain}`, result.cells, cellSizeRef.current);
      setTimeout(() => {
        const dropped = applyGravity(result.board);
        setClearingCells([]);
        const cascade = findAndClear(dropped);
        if (cascade.clears > 0) {
          setTimeout(() => resolveClears(dropped), 80);
        } else {
          setBoard(dropped);
        }
      }, 320);
    },
    [totalClears, soundOn, spawnPopup],
  );

  useEffect(() => {
    if (!piece || paused || backOpen || gameOver || helperMode) return;
    const id = setInterval(() => {
      setPiece((cur) => {
        if (!cur) return cur;
        if (!collides(board, cur, 1, 0)) return { ...cur, r: cur.r + 1 };
        const locked = lockPiece(board, cur);
        if (soundOn) sfx.drop();
        resolveClears(locked);
        return null;
      });
    }, speed);
    return () => clearInterval(id);
  }, [piece, board, paused, backOpen, gameOver, helperMode, speed, resolveClears, soundOn]);

  const moveBy = (dc: number) => {
    if (!piece || paused || gameOver || helperMode) return;
    let p = piece;
    const dir = Math.sign(dc);
    for (let i = 0; i < Math.abs(dc); i++) {
      const moved = tryMove(board, p, dir);
      if (!moved) break;
      p = moved;
    }
    if (p !== piece) setPiece(p);
  };

  const doRotate = () => {
    if (!piece || paused || gameOver || helperMode) return;
    const r = tryRotate(board, piece);
    if (r) setPiece(r);
  };

  const doHardDrop = () => {
    if (!piece || paused || gameOver || helperMode) return;
    const dropped = hardDrop(board, piece);
    const locked = lockPiece(board, dropped);
    setPiece(null);
    if (soundOn) sfx.drop();
    resolveClears(locked);
  };

  // Gesture handlers (only active in gesture mode)
  const onDragMove = (delta: number) => moveBy(delta);
  const onDragEnd = (
    _total: number,
    swipedDown: boolean,
    tappedShort: boolean,
    tapX: number,
    _tapY: number,
    width: number,
  ) => {
    unlockAudio();
    if (!piece || paused || gameOver || helperMode) return;
    if (swipedDown) {
      doHardDrop();
      return;
    }
    if (tappedShort) {
      const pct = tapX / width;
      if (pct < 0.3) moveBy(-1);
      else if (pct > 0.7) moveBy(1);
      else doRotate();
    }
  };

  // Helpers
  const startHelper = (h: Helper) => {
    if (helpers[h] <= 0 || gameOver) return;
    setHelperMode(h);
    setSwapFirst(null);
    setPreviewCells([]);
    setHelperPresses((n) => n + 1);
    setPaused(true);
  };

  const helperSeconds =
    helperPresses === 0 ? 10 : helperPresses === 1 ? 10 : helperPresses === 2 ? 6 : 3;

  const cancelHelper = () => {
    setHelperMode(null);
    setSwapFirst(null);
    setPreviewCells([]);
    setPaused(false);
  };

  const onHelperHover = (r: number, c: number | null) => {
    if (!helperMode) return;
    if (c === null || r < 0) {
      // keep preview, will commit on release
      return;
    }
    if (helperMode === "swap") {
      // just highlight current cell
      setPreviewCells([{ r, c }]);
      return;
    }
    setPreviewCells(previewForHelper(helperMode, r, c));
  };

  const applyHelperAt = (r: number, c: number) => {
    if (!helperMode) return;
    if (helperMode === "hammer") {
      if (board[r][c] === null) {
        setPreviewCells([]);
        return;
      }
      const next = board.map((row) => row.slice());
      next[r][c] = null;
      if (consumeHelper("hammer")) {
        const after = applyGravity(next);
        setBoard(after);
        setHelperPresses(0);
        setHelperMode(null);
        setPreviewCells([]);
        setPaused(false);
        resolveClears(after);
      }
    } else if (helperMode === "swap") {
      if (board[r][c] === null) {
        setPreviewCells([]);
        return;
      }
      if (!swapFirst) {
        setSwapFirst({ r, c });
        setPreviewCells([{ r, c }]);
        return;
      }
      if (swapFirst.r === r && swapFirst.c === c) {
        // cancel selection
        setSwapFirst(null);
        setPreviewCells([]);
        return;
      }
      const next = board.map((row) => row.slice());
      [next[r][c], next[swapFirst.r][swapFirst.c]] = [
        next[swapFirst.r][swapFirst.c],
        next[r][c],
      ];
      if (consumeHelper("swap")) {
        setBoard(next);
        setSwapFirst(null);
        setHelperPresses(0);
        setHelperMode(null);
        setPreviewCells([]);
        setPaused(false);
        resolveClears(next);
      }
    } else if (helperMode === "boom" || helperMode === "cross") {
      const cells = previewForHelper(helperMode, r, c);
      const next = board.map((row) => row.slice());
      for (const p of cells) next[p.r][p.c] = null;
      if (consumeHelper(helperMode)) {
        const after = applyGravity(next);
        setBoard(after);
        setHelperPresses(0);
        setHelperMode(null);
        setPreviewCells([]);
        setPaused(false);
        resolveClears(after);
      }
    }
  };

  const revive = (free: boolean) => {
    if (!free && !spendDiamonds(50)) return;
    if (free) setUsedFreeRevive(true);
    setBoard((b) => clearTopRows(b, 3));
    setGameOver(false);
    setPiece(null);
  };

  const startFresh = () => {
    setSession(null);
    setBoard(emptyBoard());
    setBag(createBag(difficulty));
    setPieceIndex(0);
    setPiece(null);
    setScore(0);
    setTotalClears(0);
    setGameOver(false);
    setUsedFreeRevive(false);
    setBackOpen(false);
  };

  return (
    <div className="min-h-screen flex flex-col" onClick={unlockAudio}>
      <header className="px-4 pt-4 pb-2 flex items-center justify-between">
        <button
          onClick={() => setBackOpen(true)}
          className="soft-card w-10 h-10 flex items-center justify-center"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="soft-card px-4 py-1.5 text-base font-bold">
          <span className="text-muted-foreground mr-2 text-xs font-medium">SCOR</span>
          {score}
        </div>
        <button
          onClick={() => setPaused((p) => !p)}
          className="soft-card w-10 h-10 flex items-center justify-center"
        >
          {paused ? <Play className="w-5 h-5" /> : <Pause className="w-5 h-5" />}
        </button>
      </header>

      <div className="px-4 flex items-center justify-center gap-3 text-xs text-muted-foreground">
        <span>Record {highScore}</span>
        <span>·</span>
        <span>{difficulty.toUpperCase()}</span>
        <span>·</span>
        <span><Gem className="inline w-3 h-3 text-primary" /> {diamonds}</span>
        <span>·</span>
        <button
          onClick={() =>
            setSetting("controlMode", controlMode === "buttons" ? "gestures" : "buttons")
          }
          className="underline underline-offset-2"
        >
          {controlMode === "buttons" ? "Butoane" : "Gesturi"}
        </button>
      </div>

      <div className="flex-1 flex items-center justify-center relative">
        <div className="relative">
          <Board
            board={board}
            piece={piece}
            clearingCells={clearingCells}
            helperMode={helperMode}
            swapFirst={swapFirst}
            previewCells={previewCells}
            cellSize={cellSize}
            controlMode={controlMode}
            onDragMove={onDragMove}
            onDragEnd={onDragEnd}
            onHelperHoverCell={onHelperHover}
            onHelperCommit={applyHelperAt}
          />
          {popups.map((p) => (
            <div
              key={p.id}
              className="absolute pointer-events-none font-bold text-primary text-sm"
              style={{
                left: p.x + 8,
                top: p.y + 8,
                transform: "translate(-50%, -50%)",
                animation: "popup-rise 900ms ease-out forwards",
              }}
            >
              {p.text}
            </div>
          ))}
        </div>
      </div>

      {/* Controls — only when buttons mode */}
      {controlMode === "buttons" && (
        <div className="px-6 pb-2 flex items-center justify-center gap-3">
          <button
            onClick={() => moveBy(-1)}
            className="soft-card w-14 h-14 flex items-center justify-center active:scale-95 transition"
            aria-label="stânga"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
          <button
            onClick={doRotate}
            className="soft-card w-14 h-14 flex items-center justify-center active:scale-95 transition"
            aria-label="rotește"
          >
            <RotateCw className="w-6 h-6" />
          </button>
          <button
            onClick={doHardDrop}
            className="w-20 h-14 rounded-2xl bg-primary text-primary-foreground flex items-center justify-center font-bold shadow-card active:scale-95 transition"
            aria-label="aruncă"
          >
            <ArrowDown className="w-7 h-7" />
          </button>
          <button
            onClick={() => moveBy(1)}
            className="soft-card w-14 h-14 flex items-center justify-center active:scale-95 transition"
            aria-label="dreapta"
          >
            <ArrowLeft className="w-6 h-6 rotate-180" />
          </button>
        </div>
      )}
      {controlMode === "gestures" && (
        <div className="px-6 pb-2 flex items-center justify-center">
          <button
            onClick={doHardDrop}
            className="w-24 h-12 rounded-2xl bg-primary text-primary-foreground flex items-center justify-center font-bold shadow-card active:scale-95 transition"
            aria-label="drop"
          >
            <ArrowDown className="w-6 h-6" />
          </button>
        </div>
      )}

      <div className="px-4 pb-6 pt-2">
        <HelperBar
          counts={helpers}
          active={helperMode}
          onPick={startHelper}
          onEmpty={(h) => setRewardHelper(h)}
          disabled={gameOver}
        />
        <p className="text-center text-[11px] text-muted-foreground mt-3">
          {controlMode === "gestures"
            ? "Glisare stânga/dreapta · click 30% margini = 1 căsuță · click centru = rotire · swipe jos = drop"
            : "Butoane: stânga · rotire · drop · dreapta"}
        </p>
      </div>

      <RewardedHelperModal helper={rewardHelper} onClose={() => setRewardHelper(null)} />

      {helperMode && (
        <HelperTimer
          seconds={helperSeconds}
          label={
            helperMode === "swap"
              ? swapFirst
                ? "SWAP — alege a 2-a piesă"
                : "SWAP — alege prima piesă"
              : `${helperMode.toUpperCase()} — ține apăsat pentru previzualizare`
          }
          onExpire={cancelHelper}
          onCancel={cancelHelper}
        />
      )}

      <PauseSheet
        open={paused && !helperMode && !backOpen}
        onResume={() => setPaused(false)}
        onRestart={startFresh}
        onMenu={() => navigate({ to: "/" })}
        onExit={() => {
          setSession(null);
          navigate({ to: "/" });
        }}
      />

      <PauseSheet
        open={backOpen}
        title="Meniu pauză"
        onResume={() => setBackOpen(false)}
        onRestart={startFresh}
        onMenu={() => navigate({ to: "/" })}
        onExit={() => {
          setSession(null);
          navigate({ to: "/" });
        }}
      />

      {gameOver && (
        <div className="fixed inset-0 bg-foreground/60 backdrop-blur-sm flex items-center justify-center z-30 px-6">
          <div className="soft-card p-8 text-center w-full max-w-sm animate-slide-up">
            <h2 className="text-3xl font-bold mb-1">Game Over</h2>
            <p className="text-muted-foreground mb-4">Scor: {score}</p>
            <div className="flex flex-col gap-3">
              {!usedFreeRevive && (
                <button
                  onClick={() => revive(true)}
                  className="px-6 py-3 rounded-2xl bg-accent text-accent-foreground font-bold"
                >
                  ▶ Vezi reclama — Reînvie gratuit
                </button>
              )}
              <button
                onClick={() => revive(false)}
                disabled={diamonds < 50}
                className="px-6 py-3 rounded-2xl bg-primary text-primary-foreground font-bold disabled:opacity-40"
              >
                <Gem className="inline w-4 h-4 mr-1" /> 50 — Reînvie
              </button>
              <button onClick={startFresh} className="px-6 py-3 rounded-2xl bg-muted font-bold">
                Joc nou
              </button>
              <button
                onClick={() => navigate({ to: "/" })}
                className="px-6 py-3 rounded-2xl text-muted-foreground font-semibold"
              >
                Meniu
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
