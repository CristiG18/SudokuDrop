// Dropdoku core engine — pure logic, no React.
export const ROWS = 9;
export const COLS = 9;

export type CellValue = number | null; // 1..9, 0 = joker, null = empty
export type Board = CellValue[][];

export type Difficulty = "easy" | "normal" | "hard";

export interface PieceCell {
  dr: number; // delta row from anchor
  dc: number;
  value: number; // 1..9 or 0 (joker)
}

export interface Piece {
  r: number; // anchor row (can be -1 grace)
  c: number; // anchor col
  cells: PieceCell[];
  isJoker?: boolean;
}

export function emptyBoard(): Board {
  return Array.from({ length: ROWS }, () => Array<CellValue>(COLS).fill(null));
}

// Bag system. setsPerBag: 2 easy, 3 normal, 4 hard.
export function createBag(difficulty: Difficulty): number[] {
  const sets = difficulty === "easy" ? 2 : difficulty === "normal" ? 3 : 4;
  const bag: number[] = [];
  for (let s = 0; s < sets; s++) {
    for (let n = 1; n <= 9; n++) bag.push(n);
  }
  // Fisher-Yates
  for (let i = bag.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [bag[i], bag[j]] = [bag[j], bag[i]];
  }
  return bag;
}

// Spawn a piece. pieceIndex used for joker cadence.
export function spawnPiece(bag: number[], pieceIndex: number): Piece {
  // Joker every 12th piece (single cell, value 0).
  if (pieceIndex > 0 && pieceIndex % 12 === 0) {
    return {
      r: -1,
      c: 4,
      isJoker: true,
      cells: [{ dr: 0, dc: 0, value: 0 }],
    };
  }
  // Pull two values. Refill bag if empty (caller handles refill ideally).
  const a = bag.pop() ?? 1;
  const b = bag.pop() ?? 1;
  return {
    r: -1,
    c: 4,
    cells: [
      { dr: 0, dc: 0, value: a },
      { dr: 0, dc: 1, value: b }, // horizontal domino
    ],
  };
}

export function collides(board: Board, piece: Piece, dr = 0, dc = 0): boolean {
  for (const cell of piece.cells) {
    const r = piece.r + cell.dr + dr;
    const c = piece.c + cell.dc + dc;
    if (c < 0 || c >= COLS) return true;
    if (r >= ROWS) return true;
    if (r < 0) continue; // grace period
    if (board[r][c] !== null) return true;
  }
  return false;
}

export function tryMove(board: Board, piece: Piece, dc: number): Piece | null {
  if (collides(board, piece, 0, dc)) return null;
  return { ...piece, c: piece.c + dc };
}

export function tryRotate(board: Board, piece: Piece): Piece | null {
  if (piece.cells.length < 2) return piece; // joker: no-op
  // Rotate 90° CW around anchor (0,0).
  const rotated = piece.cells.map((c) => ({
    dr: c.dc,
    dc: -c.dr,
    value: c.value,
  }));
  // Normalize so min dr/dc is 0
  const minDr = Math.min(...rotated.map((c) => c.dr));
  const minDc = Math.min(...rotated.map((c) => c.dc));
  const norm = rotated.map((c) => ({ ...c, dr: c.dr - minDr, dc: c.dc - minDc }));
  const candidate: Piece = { ...piece, cells: norm };
  if (!collides(board, candidate)) return candidate;
  // Wall-kick: try shifting +1 and -1
  for (const kick of [1, -1, 2, -2]) {
    if (!collides(board, candidate, 0, kick)) {
      return { ...candidate, c: candidate.c + kick };
    }
  }
  return null;
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

// A line/box is "complete" when all 9 cells are filled AND
// the set of values forms 1..9 (joker counts as the missing number).
function isUnitComplete(values: CellValue[]): boolean {
  if (values.some((v) => v === null)) return false;
  const nums = values.filter((v) => v !== 0) as number[];
  const set = new Set(nums);
  if (set.size !== nums.length) return false; // duplicates
  // missing numbers count must equal joker count
  const missing = [1, 2, 3, 4, 5, 6, 7, 8, 9].filter((n) => !set.has(n)).length;
  const jokers = values.filter((v) => v === 0).length;
  return missing === jokers;
}

export interface ClearResult {
  board: Board;
  clears: number; // number of units cleared
  cells: Array<{ r: number; c: number }>;
}

export function findAndClear(board: Board): ClearResult {
  const toClear = new Set<string>();
  let clears = 0;

  for (let r = 0; r < ROWS; r++) {
    if (isUnitComplete(board[r])) {
      clears++;
      for (let c = 0; c < COLS; c++) toClear.add(`${r},${c}`);
    }
  }
  for (let c = 0; c < COLS; c++) {
    const col = board.map((row) => row[c]);
    if (isUnitComplete(col)) {
      clears++;
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
        for (let r = br * 3; r < br * 3 + 3; r++)
          for (let c = bc * 3; c < bc * 3 + 3; c++) toClear.add(`${r},${c}`);
      }
    }
  }

  if (clears === 0) return { board, clears: 0, cells: [] };

  const next = board.map((row) => row.slice());
  const cleared: Array<{ r: number; c: number }> = [];
  for (const key of toClear) {
    const [r, c] = key.split(",").map(Number);
    next[r][c] = null;
    cleared.push({ r, c });
  }
  return { board: next, clears, cells: cleared };
}

// Gravity: in this game pieces above cleared cells fall down by gaps in the same column.
export function applyGravity(board: Board): Board {
  const next = emptyBoard();
  for (let c = 0; c < COLS; c++) {
    const stack: number[] = [];
    for (let r = 0; r < ROWS; r++) {
      const v = board[r][c];
      if (v !== null) stack.push(v);
    }
    // place from bottom
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
