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
import { ClearFx, type ClearFxItem } from "@/components/game/ClearFx";
import { RewardedHelperModal } from "@/components/RewardedHelperModal";
import { useT } from "@/i18n";
import {
  estimatePercentile,
  formatPercentile,
  versusRivalLive,
  versusRivalName,
  versusRivalScore,
} from "@/game/economy";
import { fmtNum } from "@/lib/format";

export const Route = createFileRoute("/play/dropdoku")({
  head: () => ({
    meta: [
      { title: "Sudoku Drop — joc" },
      { name: "description", content: "Endless falling Sudoku puzzle." },
    ],
  }),
  component: DropdokuRoute,
  validateSearch: (s: Record<string, unknown>) => {
    const modes = ["timeattack"] as const;
    type GameMode = (typeof modes)[number];
    return {
      difficulty: (s.difficulty as Difficulty) || "normal",
      resume: s.resume === true || s.resume === "true" ? true : undefined,
      mode: modes.includes(s.mode as GameMode) ? (s.mode as GameMode) : undefined,
      seconds:
        typeof s.seconds === "number" ? s.seconds : s.seconds ? Number(s.seconds) : undefined,
      // Tournament category this run counts towards (e.g. "duel:hard").
      tkey: typeof s.tkey === "string" ? s.tkey : undefined,
      // Versus bracket match (score is reported to the running bracket).
      vkey: typeof s.vkey === "string" ? s.vkey : undefined,
    };
  },

});

interface Popup {
  id: number;
  x: number;
  y: number;
  text: string;
  kind: "score" | "time";
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

// The game board is seeded with randomness and persisted state, so it can only
// be built in the browser. Rendering it during SSR causes hydration mismatches.
function DropdokuRoute() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) {
    return <DropdokuLoading />;
  }
  return <DropdokuPage />;
}

function DropdokuLoading() {
  const t = useT();
  return (
    <div className="min-h-screen flex items-center justify-center text-muted-foreground text-sm">
      {t("Se încarcă…")}
    </div>
  );
}

function DropdokuPage() {
  const t = useT();
  const { difficulty, resume, mode, seconds: attackSeconds, tkey, vkey } = Route.useSearch();
  const isTimeAttack = mode === "timeattack";
  const isTimed = isTimeAttack;
  // Versus bracket match: no game over, no revive — just a win/loss result.
  const isVersus = Boolean(vkey);
  // Revive is only offered in Classic and in Time Attack tournaments.
  const canRevive = Boolean(tkey) && !isVersus;
  // Special modes never resume / never persist a session.
  const isSpecial = Boolean(mode);
  const totalAttackSecs = isTimeAttack ? Math.max(30, attackSeconds ?? 120) : 0;
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
  const awardRunXp = useGameStore((s) => s.awardRunXp);
  const recordCategoryScore = useGameStore((s) => s.recordCategoryScore);
  const recordVersusMatch = useGameStore((s) => s.recordVersusMatch);
  const setModeBest = useGameStore((s) => s.setModeBest);
  const versusRun = useGameStore((s) => s.versus);

  // The rival for this Versus match is drawn once, so the live score can be
  // shown while playing and reused when the match is recorded.
  const rival = useMemo(() => {
    if (!vkey) return null;
    return {
      target: versusRivalScore(versusRun?.difficulty ?? "easy", versusRun?.round ?? 0),
      name: versusRivalName(),
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [vkey]);



  const initial = useMemo(() => {
    if (!isSpecial && resume && savedSession && savedSession.difficulty === difficulty) {
      return {
        board: savedSession.board as BoardT,
        bag: savedSession.bag.slice(),
        pieceIndex: savedSession.pieceIndex,
        score: savedSession.score,
        totalClears: savedSession.totalClears,
        startedAt: savedSession.startedAt,
        seconds: savedSession.seconds ?? 0,
      };
    }
    return {
      board: emptyBoard(),
      bag: createBag(difficulty),
      pieceIndex: 0,
      score: 0,
      totalClears: 0,
      startedAt: Date.now(),
      seconds: 0,
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
  const [endXp, setEndXp] = useState<{ xp: number; levelsGained: number; rank: string } | null>(null);
  const xpAwardedRef = useRef(false);
  const [usedFreeRevive, setUsedFreeRevive] = useState(false);
  const [popups, setPopups] = useState<Popup[]>([]);
  const popupId = useRef(0);

  const [helperMode, setHelperMode] = useState<Helper | null>(null);
  const [helperPresses, setHelperPresses] = useState(0);
  const [swapFirst, setSwapFirst] = useState<{ r: number; c: number } | null>(null);
  const [previewCells, setPreviewCells] = useState<Array<{ r: number; c: number }>>([]);
  const [fxItems, setFxItems] = useState<ClearFxItem[]>([]);
  const fxId = useRef(0);

  const [bonusSecs, setBonusSecs] = useState(0);
  const [reviveCount, setReviveCount] = useState(0);

  const baseSpeed = difficulty === "easy" ? 900 : difficulty === "normal" ? 700 : 520;
  const speed = Math.max(220, baseSpeed - totalClears * 8);
  const gravityNextAtRef = useRef(Date.now() + speed);

  const startedAtRef = useRef(initial.startedAt);
  const [secondsPlayed, setSecondsPlayed] = useState(initial.seconds);
  const [rewardHelper, setRewardHelper] = useState<Helper | null>(null);

  // Tick the play timer only while actively playing.
  useEffect(() => {
    if (paused || backOpen || gameOver || helperMode) return;
    const id = setInterval(() => setSecondsPlayed((s) => s + 1), 1000);
    return () => clearInterval(id);
  }, [paused, backOpen, gameOver, helperMode]);

  // Pause automatically when the tab/app is hidden so the game doesn't run in background.
  useEffect(() => {
    const onVis = () => {
      if (document.visibilityState === "hidden") setPaused(true);
    };
    document.addEventListener("visibilitychange", onVis);
    return () => document.removeEventListener("visibilitychange", onVis);
  }, []);

  // Countdown for Time Attack.
  const remainingAttack = isTimed
    ? Math.max(0, totalAttackSecs + bonusSecs - secondsPlayed)
    : 0;
  // Rival's live score in a Versus match, paced with the match clock.
  const rivalLive = rival
    ? versusRivalLive(
        rival.target,
        totalAttackSecs > 0 ? secondsPlayed / totalAttackSecs : 0,
      )
    : 0;
  useEffect(() => {
    if (!isTimed || gameOver) return;
    if (remainingAttack === 0) {
      setGameOver(true);
      setHighScore(score);
      setSession(null);
      if (soundOn) sfx.fail();
      return;
    }
    // Vibrations: every full minute, and every second in last 10s.
    if (typeof navigator !== "undefined" && "vibrate" in navigator) {
      if (remainingAttack <= 10) navigator.vibrate(40);
      else if (remainingAttack > 0 && remainingAttack % 60 === 0) navigator.vibrate([60, 40, 60]);
    }
  }, [remainingAttack, isTimed, gameOver, score, setHighScore, setSession, soundOn]);

  useEffect(() => {
    if (gameOver || isSpecial) return;
    setSession({
      difficulty,
      board,
      bag,
      pieceIndex,
      score,
      totalClears,
      startedAt: startedAtRef.current,
      seconds: secondsPlayed,
    });
  }, [difficulty, board, bag, pieceIndex, score, totalClears, gameOver, isSpecial, secondsPlayed, setSession]);


  useEffect(() => {
    if (piece || gameOver) return;
    let nextBag = bag;
    if (nextBag.length < 2) nextBag = [...nextBag, ...createBag(difficulty)];
    const p = spawnPiece(nextBag, pieceIndex);
    // Game over: if this piece, translated so its top row is 0, would already
    // overlap the stack, there's no room left for new pieces.
    const atTop: Piece = { ...p, r: 0 };
    if (collides(board, atTop, 0, 0)) {
      setGameOver(true);
      setHighScore(score);
      setSession(null);
      if (soundOn) sfx.fail();
      return;
    }
    setPiece(p);
    gravityNextAtRef.current = Date.now() + speed;
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
    speed,
  ]);

  // Award XP once per finished run and compute the percentile bucket.
  useEffect(() => {
    if (!gameOver || xpAwardedRef.current) return;
    xpAwardedRef.current = true;
    const res = awardRunXp(difficulty, score, !!tkey || !!vkey);
    if (tkey) recordCategoryScore(tkey, score);
    if (vkey) {
      recordVersusMatch(score, rival?.target, rival?.name);
      // Versus never shows Game Over — you go back to the bracket screen.
      navigate({ to: "/battle" });
      return;
    }
    if (!tkey) setModeBest(`free:${mode ?? difficulty}`, score);
    // Global leaderboard (no-op when signed out or offline).
    if (tkey) {
      const [, ...rest] = tkey.split(":");
      void submitScore("ta", rest.join(":"), score);
    } else {
      void submitScore("free", String(mode ?? difficulty), score);
    }

    const rank = formatPercentile(estimatePercentile(score, Math.max(1500, highScore || 1500)));
    setEndXp({ xp: res.xpGained, levelsGained: res.levelsGained, rank });
  }, [
    gameOver,
    awardRunXp,
    difficulty,
    score,
    highScore,
    tkey,
    vkey,
    mode,
    recordCategoryScore,
    recordVersusMatch,
    setModeBest,
    rival,
    navigate,
  ]);

  const cellSize = useMemo(() => {
    if (typeof window === "undefined") return 36;
    const max = Math.min(window.innerWidth - 32, 420);
    return Math.floor((max - 16) / COLS);
  }, []);
  const cellSizeRef = useRef(cellSize);
  cellSizeRef.current = cellSize;

  const spawnPopup = useCallback(
    (text: string, cells: Array<{ r: number; c: number }>, cs: number, kind: "score" | "time" = "score") => {
      if (!cells.length) return;
      const cx = cells.reduce((a, p) => a + p.c, 0) / cells.length;
      const cy = cells.reduce((a, p) => a + p.r, 0) / cells.length;
      const x = (cx + 0.5) * cs;
      const y = (cy + 0.5) * cs;
      const id = ++popupId.current;
      setPopups((cur) => [...cur, { id, x, y, text, kind }]);
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
      const items: ClearFxItem[] = [
        ...result.rowIdx.map((index) => ({ id: ++fxId.current, kind: "row" as const, index })),
        ...result.colIdx.map((index) => ({ id: ++fxId.current, kind: "col" as const, index })),
        ...result.boxIdx.map((b) => ({ id: ++fxId.current, kind: "box" as const, br: b.br, bc: b.bc })),
      ];
      setFxItems((cur) => [...cur, ...items]);
      const ids = new Set(items.map((i) => i.id));
      setTimeout(() => setFxItems((cur) => cur.filter((i) => !ids.has(i.id))), 700);
      if (typeof navigator !== "undefined" && navigator.vibrate)
        navigator.vibrate(result.boxes > 0 ? [18, 30, 22] : 18);
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

  const boardRef = useRef(board);
  const pieceRef = useRef(piece);
  const speedRef = useRef(speed);
  const soundOnRef = useRef(soundOn);
  const resolveClearsRef = useRef(resolveClears);

  boardRef.current = board;
  pieceRef.current = piece;
  speedRef.current = speed;
  soundOnRef.current = soundOn;
  resolveClearsRef.current = resolveClears;

  useEffect(() => {
    if (paused || backOpen || gameOver || helperMode) {
      gravityNextAtRef.current = Date.now() + speedRef.current;
      return;
    }
    const id = setInterval(() => {
      if (!pieceRef.current) return;
      const now = Date.now();
      if (now < gravityNextAtRef.current) return;
      gravityNextAtRef.current = now + speedRef.current;
      setPiece((cur) => {
        if (!cur) return cur;
        const latestBoard = boardRef.current;
        if (!collides(latestBoard, cur, 1, 0)) return { ...cur, r: cur.r + 1 };
        const locked = lockPiece(latestBoard, cur);
        if (soundOnRef.current) sfx.drop();
        resolveClearsRef.current(locked);
        return null;
      });
    }, 50);
    return () => clearInterval(id);
  }, [paused, backOpen, gameOver, helperMode]);

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

  // Global window gestures: work anywhere on screen when in gesture mode and not in helper mode.
  const boardWrapRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    if (controlMode !== "gestures") return;
    let startX = 0;
    let startY = 0;
    let lastCols = 0;
    let moved = false;
    let startedAt = 0;
    let active = false;

    const isBlocked = (target: EventTarget | null) => {
      if (!(target instanceof Element)) return false;
      if (target.closest("button, a, input, [data-no-gesture]")) return true;
      if (boardWrapRef.current && boardWrapRef.current.contains(target)) return true; // board owns its own handling
      return false;
    };

    const onDown = (e: PointerEvent) => {
      if (helperMode || paused || gameOver || !piece) return;
      if (isBlocked(e.target)) return;
      active = true;
      startX = e.clientX;
      startY = e.clientY;
      lastCols = 0;
      moved = false;
      startedAt = Date.now();
    };
    const onMove = (e: PointerEvent) => {
      if (!active) return;
      const dx = e.clientX - startX;
      const cols = Math.round(dx / cellSizeRef.current);
      if (cols !== lastCols) {
        const delta = cols - lastCols;
        lastCols = cols;
        moved = true;
        moveBy(delta);
      }
    };
    const onUp = (e: PointerEvent) => {
      if (!active) return;
      active = false;
      const dy = e.clientY - startY;
      const dx = e.clientX - startX;
      const elapsed = Date.now() - startedAt;
      const swipedDown = dy > cellSizeRef.current * 2.5 && Math.abs(dy) > Math.abs(dx);
      const tappedShort = !moved && elapsed < 250 && Math.abs(dx) < 10 && Math.abs(dy) < 10;
      if (swipedDown) {
        doHardDrop();
        return;
      }
      if (tappedShort) {
        const pct = e.clientX / window.innerWidth;
        if (pct < 0.3) moveBy(-1);
        else if (pct > 0.7) moveBy(1);
        else doRotate();
      }
    };

    window.addEventListener("pointerdown", onDown);
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    window.addEventListener("pointercancel", onUp);
    return () => {
      window.removeEventListener("pointerdown", onDown);
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      window.removeEventListener("pointercancel", onUp);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [controlMode, helperMode, paused, gameOver, piece, board]);

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

  // Gem revives double each time: 100 → 200 → 400 …
  const reviveCost = 100 * Math.pow(2, reviveCount);

  const revive = (free: boolean) => {
    if (!free && !spendDiamonds(reviveCost)) return;
    if (free) setUsedFreeRevive(true);
    else setReviveCount((n) => n + 1);
    xpAwardedRef.current = false;
    setEndXp(null);
    if (isTimed) setBonusSecs((s) => s + 30);
    setBoard((b) => clearTopRows(b, 3));
    setGameOver(false);
    setPiece(null);
  };

  const startFresh = () => {
    setSession(null);
    xpAwardedRef.current = false;
    setEndXp(null);
    startedAtRef.current = Date.now();
    setBoard(emptyBoard());
    setBag(createBag(difficulty));
    setPieceIndex(0);
    setPiece(null);
    setScore(0);
    setTotalClears(0);
    setSecondsPlayed(0);
    setBonusSecs(0);
    setReviveCount(0);
    setGameOver(false);
    setUsedFreeRevive(false);
    setBackOpen(false);
    setPaused(false);
  };


  const fmtMS = (s: number) =>
    `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;


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
          {fmtNum(score)}
        </div>
        <button
          onClick={() => setPaused((p) => !p)}
          className="soft-card w-10 h-10 flex items-center justify-center"
        >
          {paused ? <Play className="w-5 h-5" /> : <Pause className="w-5 h-5" />}
        </button>
      </header>

      {isVersus && rival && (
        <div className="px-4 pb-2">
          <div className="soft-card px-4 py-2 flex items-center justify-between text-sm">
            <span className="font-bold text-primary tabular-nums">
              {t("Tu")} {fmtNum(score)}
            </span>
            <span className="text-[11px] text-muted-foreground uppercase tracking-wide">
              {t("live")}
            </span>
            <span className="font-bold tabular-nums">
              {fmtNum(rivalLive)} {rival.name}
            </span>
          </div>
        </div>
      )}

      {isTimed && (
        <div className="px-4 pb-2 flex flex-col items-center justify-center">
          <div
            className={
              "soft-card px-5 py-2 text-3xl font-bold tabular-nums " +
              (remainingAttack <= 10 ? "text-destructive animate-pulse" : "text-primary")
            }
          >
            {fmtMS(remainingAttack)}
          </div>
        </div>
      )}


      <div className="px-4 flex items-center justify-center gap-3 text-xs text-muted-foreground">
        {mode && (
          <>
            <span className="px-2 py-0.5 rounded-full bg-accent text-accent-foreground font-semibold uppercase">
              {t("Time Attack")}
            </span>
            <span>·</span>
          </>
        )}
        <span>{t("Record")} {fmtNum(highScore)}</span>
        <span>·</span>
        <span>{difficulty.toUpperCase()}</span>
        <span>·</span>
        <span><Gem className="inline w-3 h-3 text-primary" /> {fmtNum(diamonds)}</span>
        <span>·</span>
        <button
          onClick={() =>
            setSetting("controlMode", controlMode === "buttons" ? "gestures" : "buttons")
          }
          className="underline underline-offset-2"
        >
          {controlMode === "buttons" ? t("Butoane") : t("Gesturi")}
        </button>
      </div>


      <div className="flex-1 flex items-center justify-center relative">
        <div className="relative" ref={boardWrapRef}>
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
          <ClearFx
            items={fxItems}
            cellSize={cellSize}
            offsetTop={cellSize * 3 + 8}
            offsetLeft={8}
          />
          {popups.map((p) => (
            <div
              key={p.id}
              className={
                "absolute pointer-events-none font-bold text-sm drop-shadow-sm " +
                (p.kind === "time" ? "text-amber-500" : "text-primary")
              }
              style={{
                left: p.x + 8,
                // Board sits below the 3-row preview strip; time bonuses are
                // lifted further so they never sit on top of the score popup.
                top: p.y + 8 + cellSize * 3 + (p.kind === "time" ? -26 : 0),
                transform: "translate(-50%, -50%)",
                animation: "popup-rise 900ms ease-out forwards",
                zIndex: 30,
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
            ? t("Glisare stânga/dreapta · click 30% margini = 1 căsuță · click centru = rotire · swipe jos = drop")
            : t("Butoane: stânga · rotire · drop · dreapta")}
        </p>
      </div>

      <RewardedHelperModal helper={rewardHelper} onClose={() => setRewardHelper(null)} />

      {helperMode && (
        <HelperTimer
          key={`${helperMode}-${helperPresses}`}
          seconds={helperSeconds}
          label={
            helperMode === "swap"
              ? swapFirst
                ? t("SWAP — alege a 2-a piesă")
                : t("SWAP — alege prima piesă")
              : `${helperMode.toUpperCase()} — ${t("ține apăsat pentru previzualizare")}`
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
        title={t("Meniu pauză")}
        onResume={() => setBackOpen(false)}
        onRestart={startFresh}
        onMenu={() => navigate({ to: "/" })}
        onExit={() => {
          setSession(null);
          navigate({ to: "/" });
        }}
      />

      {gameOver && !isVersus && (
        <div className="fixed inset-0 bg-foreground/60 backdrop-blur-sm flex items-center justify-center z-30 px-6">
          <div className="soft-card p-8 text-center w-full max-w-sm animate-slide-up">
            <h2 className="text-3xl font-bold mb-1">{t("Game Over")}</h2>
            <p className="text-muted-foreground mb-1">{t("Scor")}: {fmtNum(score)}</p>
            {endXp && (
              <p className="text-sm font-semibold text-primary mb-4">
                +{endXp.xp} XP · {t(endXp.rank)}
                {endXp.levelsGained > 0 && ` · ${t("Nivel nou!")}`}
              </p>
            )}
            <div className="flex flex-col gap-3">
              {canRevive && !usedFreeRevive && (
                <button
                  onClick={() => revive(true)}
                  className="px-6 py-3 rounded-2xl bg-accent text-accent-foreground font-bold"
                >
                  ▶ {t("Vezi reclama — Reînvie gratuit")}
                </button>
              )}
              {canRevive && usedFreeRevive && (
                <button
                  onClick={() => revive(false)}
                  disabled={diamonds < reviveCost}
                  className="px-6 py-3 rounded-2xl bg-primary text-primary-foreground font-bold disabled:opacity-40"
                >
                  <Gem className="inline w-4 h-4 mr-1" /> {fmtNum(reviveCost)} — {t("Reînvie")}
                </button>
              )}
              <button onClick={startFresh} className="px-6 py-3 rounded-2xl bg-muted font-bold">
                {t("Joc nou")}
              </button>
              <button
                onClick={() => navigate({ to: "/" })}
                className="px-6 py-3 rounded-2xl text-muted-foreground font-semibold"
              >
                {t("Meniu")}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
