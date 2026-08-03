// Dropdoku core engine — pure logic, no React.
export const ROWS = 9;
export const COLS = 9;

export type CellValue = number | null; // 1..9, 0 = joker, null = empty
export type Board = CellValue[][];

export type Difficulty = "easy" | "normal" | "hard";

export interface PieceCell {
  dr: number;
  dc: number;
  value: number; // 1..9 or 0 (joker)
}

export interface Piece {
  r: number;
  c: number;
  cells: PieceCell[];
  isJoker?: boolean;
}

export function emptyBoard(): Board {
  return Array.from({ length: ROWS }, () => Array<CellValue>(COLS).fill(null));
}

export function createBag(difficulty: Difficulty): number[] {
  const sets = difficulty === "easy" ? 2 : difficulty === "normal" ? 3 : 4;
  const bag: number[] = [];
  for (let s = 0; s < sets; s++) for (let n = 1; n <= 9; n++) bag.push(n);
  for (let i = bag.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [bag[i], bag[j]] = [bag[j], bag[i]];
  }
  return bag;
}

export function spawnPiece(bag: number[], pieceIndex: number): Piece {
  const a = bag.pop() ?? 1;
  const b = bag.pop() ?? 1;
  // Spawn 3 rows above the visible board so the piece falls IN.
  if (pieceIndex > 0 && pieceIndex % 12 === 0) {
    const jokerLeft = Math.random() < 0.5;
    return {
      r: -3,
      c: 4,
      isJoker: true,
      cells: [
        { dr: 0, dc: 0, value: jokerLeft ? 0 : a },
        { dr: 0, dc: 1, value: jokerLeft ? a : 0 },
      ],
    };
  }
  return {
    r: -3,
    c: 4,
    cells: [
      { dr: 0, dc: 0, value: a },
      { dr: 0, dc: 1, value: b },
    ],
  };
}

export function collides(board: Board, piece: Piece, dr = 0, dc = 0): boolean {
  for (const cell of piece.cells) {
    const r = piece.r + cell.dr + dr;
    const c = piece.c + cell.dc + dc;
    if (c < 0 || c >= COLS) return true;
    if (r >= ROWS) return true;
    if (r < 0) continue;
    if (board[r][c] !== null) return true;
  }
  return false;
}

export function tryMove(board: Board, piece: Piece, dc: number): Piece | null {
  if (collides(board, piece, 0, dc)) return null;
  return { ...piece, c: piece.c + dc };
}

export function tryRotate(board: Board, piece: Piece): Piece | null {
  if (piece.cells.length < 2) return piece;
  const rotated = piece.cells.map((c) => ({
    dr: c.dc,
    dc: -c.dr,
    value: c.value,
  }));
  const minDr = Math.min(...rotated.map((c) => c.dr));
  const minDc = Math.min(...rotated.map((c) => c.dc));
  const norm = rotated.map((c) => ({ ...c, dr: c.dr - minDr, dc: c.dc - minDc }));
  const candidate: Piece = { ...piece, cells: norm };
  if (!collides(board, candidate)) return candidate;
  for (const kick of [1, -1, 2, -2]) {
    if (!collides(board, candidate, 0, kick)) {
      return { ...candidate, c: candidate.c + kick };
    }
  }
  return null;
}

export function hardDrop(board: Board, piece: Piece): Piece {
  let p = piece;
  while (!collides(board, p, 1, 0)) p = { ...p, r: p.r + 1 };
  return p;
}

export function lockPiece(board: Board, piece: Piece): Board {
  const next = board.map((row) => row.slice());
  for (const cell of piece.cells) {
    const r = piece.r + cell.dr;
    const c = piece.c + cell.dc;
    if (r >= 0 && r < ROWS && c >= 0 && c < COLS) {
      next[r][c] = cell.value;
    }
  }
  return next;
}

function isUnitComplete(values: CellValue[]): boolean {
  if (values.some((v) => v === null)) return false;
  const nums = values.filter((v) => v !== 0) as number[];
  const set = new Set(nums);
  if (set.size !== nums.length) return false;
  const missing = [1, 2, 3, 4, 5, 6, 7, 8, 9].filter((n) => !set.has(n)).length;
  const jokers = values.filter((v) => v === 0).length;
  return missing === jokers;
}

export interface ClearResult {
  board: Board;
  clears: number;
  rows: number;
  cols: number;
  boxes: number;
  cells: Array<{ r: number; c: number }>;
  /** Indices of the cleared units, used to drive the visual effects. */
  rowIdx: number[];
  colIdx: number[];
  boxIdx: Array<{ br: number; bc: number }>;
}

export function findAndClear(board: Board): ClearResult {
  const toClear = new Set<string>();
  let clears = 0;
  let rows = 0;
  let cols = 0;
  let boxes = 0;
  const rowIdx: number[] = [];
  const colIdx: number[] = [];
  const boxIdx: Array<{ br: number; bc: number }> = [];

  for (let r = 0; r < ROWS; r++) {
    if (isUnitComplete(board[r])) {
      clears++;
      rows++;
      rowIdx.push(r);
      for (let c = 0; c < COLS; c++) toClear.add(`${r},${c}`);
    }
  }
  for (let c = 0; c < COLS; c++) {
    const col = board.map((row) => row[c]);
    if (isUnitComplete(col)) {
      clears++;
      cols++;
      colIdx.push(c);
      for (let r = 0; r < ROWS; r++) toClear.add(`${r},${c}`);
    }
  }
  for (let br = 0; br < 3; br++) {
    for (let bc = 0; bc < 3; bc++) {
      const cells: CellValue[] = [];
      for (let r = br * 3; r < br * 3 + 3; r++)
        for (let c = bc * 3; c < bc * 3 + 3; c++) cells.push(board[r][c]);
      if (isUnitComplete(cells)) {
        clears++;
        boxes++;
        boxIdx.push({ br, bc });
        for (let r = br * 3; r < br * 3 + 3; r++)
          for (let c = bc * 3; c < bc * 3 + 3; c++) toClear.add(`${r},${c}`);
      }
    }
  }

  if (clears === 0)
    return {
      board,
      clears: 0,
      rows: 0,
      cols: 0,
      boxes: 0,
      cells: [],
      rowIdx: [],
      colIdx: [],
      boxIdx: [],
    };


  const next = board.map((row) => row.slice());
  const cleared: Array<{ r: number; c: number }> = [];
  for (const key of toClear) {
    const [r, c] = key.split(",").map(Number);
    next[r][c] = null;
    cleared.push({ r, c });
  }
  return { board: next, clears, rows, cols, boxes, cells: cleared, rowIdx, colIdx, boxIdx };
}

// Ice mode: pushes a partially-filled "frozen" row up from the bottom.
export function pushGarbageRow(board: Board): Board {
  const next = board.map((row) => row.slice());
  // shift everything up one row (top row is discarded)
  for (let r = 0; r < ROWS - 1; r++) next[r] = next[r + 1].slice();
  const row: CellValue[] = Array<CellValue>(COLS).fill(null);
  const holes = 2 + Math.floor(Math.random() * 2);
  const holeCols = new Set<number>();
  while (holeCols.size < holes) holeCols.add(Math.floor(Math.random() * COLS));
  for (let c = 0; c < COLS; c++) {
    if (!holeCols.has(c)) row[c] = 1 + Math.floor(Math.random() * 9);
  }
  next[ROWS - 1] = row;
  return next;
}


// Per-column gravity: every cell falls to the bottom of its column
// independently. This is what makes a horizontal domino landing on top of
// a tall column "split" — the unsupported half keeps falling.
export function applyGravity(board: Board): Board {
  const next = emptyBoard();
  for (let c = 0; c < COLS; c++) {
    const stack: number[] = [];
    for (let r = 0; r < ROWS; r++) {
      const v = board[r][c];
      if (v !== null) stack.push(v);
    }
    for (let i = 0; i < stack.length; i++) {
      next[ROWS - 1 - i][c] = stack[stack.length - 1 - i];
    }
  }
  return next;
}

export function multiplierFor(totalClears: number): number {
  return 1 + 0.5 * Math.floor(totalClears / 10);
}

export function clearTopRows(board: Board, n: number): Board {
  const next = board.map((row) => row.slice());
  for (let r = 0; r < Math.min(n, ROWS); r++) {
    for (let c = 0; c < COLS; c++) next[r][c] = null;
  }
  return applyGravity(next);
}
