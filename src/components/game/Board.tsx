import {
  ROWS,
  COLS,
  type Board as BoardT,
  type Piece,
} from "@/game/engine";
import { Jewel } from "./Jewel";

interface BoardProps {
  board: BoardT;
  piece: Piece | null;
  clearingCells: Array<{ r: number; c: number }>;
  helperMode: null | "hammer" | "swap" | "boom";
  onCellTap: (r: number, c: number) => void;
  swapFirst: { r: number; c: number } | null;
  cellSize: number;
}

const THICK = 2;

export function Board({
  board,
  piece,
  clearingCells,
  helperMode,
  onCellTap,
  swapFirst,
  cellSize,
}: BoardProps) {
  const isClearing = (r: number, c: number) =>
    clearingCells.some((p) => p.r === r && p.c === c);

  const pieceCellAt = (r: number, c: number) => {
    if (!piece) return null;
    for (const cell of piece.cells) {
      if (piece.r + cell.dr === r && piece.c + cell.dc === c) return cell.value;
    }
    return null;
  };

  const inner = cellSize * COLS;

  return (
    <div
      className="relative bg-card rounded-2xl p-2 shadow-soft"
      style={{ width: inner + 16, height: inner + 16 }}
    >
      <div
        className="grid relative bg-board border border-board-line-thick rounded-md overflow-hidden"
        style={{
          gridTemplateColumns: `repeat(${COLS}, ${cellSize}px)`,
          gridTemplateRows: `repeat(${ROWS}, ${cellSize}px)`,
        }}
      >
        {board.map((row, r) =>
          row.map((v, c) => {
            const pv = pieceCellAt(r, c);
            const clearing = isClearing(r, c);
            const isSwapFirst = swapFirst?.r === r && swapFirst?.c === c;
            const rightThick = (c + 1) % 3 === 0 && c !== COLS - 1;
            const bottomThick = (r + 1) % 3 === 0 && r !== ROWS - 1;
            return (
              <button
                key={`${r}-${c}`}
                onClick={() => helperMode && onCellTap(r, c)}
                className="flex items-center justify-center"
                style={{
                  borderRight: `${rightThick ? THICK : 1}px solid ${rightThick ? "var(--color-board-line-thick)" : "var(--color-board-line-thin)"}`,
                  borderBottom: `${bottomThick ? THICK : 1}px solid ${bottomThick ? "var(--color-board-line-thick)" : "var(--color-board-line-thin)"}`,
                  backgroundColor: isSwapFirst ? "var(--color-cell-selected)" : undefined,
                }}
                aria-label={`cell ${r}-${c}`}
              >
                {pv !== null ? (
                  <Jewel value={pv} size={cellSize - 2} popping />
                ) : v !== null ? (
                  <span
                    className={clearing ? "opacity-0 transition-opacity duration-300" : ""}
                    style={{
                      color: "var(--color-cell-user)",
                      fontSize: cellSize * 0.5,
                      fontWeight: 600,
                    }}
                  >
                    {v === 0 ? "★" : v}
                  </span>
                ) : null}
              </button>
            );
          }),
        )}
      </div>
    </div>
  );
}
