import { useRef } from "react";
import { ROWS, COLS, type Board as BoardT, type Piece } from "@/game/engine";
import { Jewel } from "./Jewel";

interface BoardProps {
  board: BoardT;
  piece: Piece | null;
  clearingCells: Array<{ r: number; c: number }>;
  helperMode: null | "hammer" | "swap" | "boom";
  onCellTap: (r: number, c: number) => void;
  swapFirst: { r: number; c: number } | null;
  cellSize: number;
  // Gesture handlers (optional)
  onDragMove?: (deltaCols: number) => void;
  onDragEnd?: (totalCols: number, swipedDown: boolean, tappedShort: boolean) => void;
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
  onDragMove,
  onDragEnd,
}: BoardProps) {
  const isClearing = (r: number, c: number) => clearingCells.some((p) => p.r === r && p.c === c);

  const pieceCellAt = (r: number, c: number) => {
    if (!piece) return null;
    for (const cell of piece.cells) {
      if (piece.r + cell.dr === r && piece.c + cell.dc === c) return cell.value;
    }
    return null;
  };

  const inner = cellSize * COLS;

  const drag = useRef<{
    startX: number;
    startY: number;
    lastCols: number;
    moved: boolean;
    startedAt: number;
  } | null>(null);

  const handlePointerDown = (e: React.PointerEvent) => {
    if (helperMode) return;
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    drag.current = {
      startX: e.clientX,
      startY: e.clientY,
      lastCols: 0,
      moved: false,
      startedAt: Date.now(),
    };
  };
  const handlePointerMove = (e: React.PointerEvent) => {
    if (!drag.current || helperMode) return;
    const dx = e.clientX - drag.current.startX;
    const cols = Math.round(dx / cellSize);
    if (cols !== drag.current.lastCols) {
      const delta = cols - drag.current.lastCols;
      drag.current.lastCols = cols;
      drag.current.moved = true;
      onDragMove?.(delta);
    }
  };
  const handlePointerUp = (e: React.PointerEvent) => {
    if (!drag.current || helperMode) return;
    const dy = e.clientY - drag.current.startY;
    const dx = e.clientX - drag.current.startX;
    const elapsed = Date.now() - drag.current.startedAt;
    const swipedDown = dy > cellSize * 2.5 && Math.abs(dy) > Math.abs(dx);
    const tappedShort =
      !drag.current.moved && elapsed < 220 && Math.abs(dx) < 8 && Math.abs(dy) < 8;
    onDragEnd?.(drag.current.lastCols, swipedDown, tappedShort);
    drag.current = null;
  };

  return (
    <div
      className="relative bg-card rounded-2xl p-2 shadow-soft"
      style={{ width: inner + 16, height: inner + 16 }}
      onPointerDown={onDragMove ? handlePointerDown : undefined}
      onPointerMove={onDragMove ? handlePointerMove : undefined}
      onPointerUp={onDragMove ? handlePointerUp : undefined}
      onPointerCancel={onDragMove ? handlePointerUp : undefined}
    >
      <div
        className="grid relative bg-board rounded-md overflow-hidden"
        style={{
          gridTemplateColumns: `repeat(${COLS}, ${cellSize}px)`,
          gridTemplateRows: `repeat(${ROWS}, ${cellSize}px)`,
          boxShadow: "inset 0 0 0 1px var(--color-board-line-thick)",
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
                  backgroundColor: clearing
                    ? "var(--color-cell-selected)"
                    : isSwapFirst
                      ? "var(--color-cell-selected)"
                      : undefined,
                  transition: "background-color 200ms ease",
                }}
                aria-label={`cell ${r}-${c}`}
              >
                {pv !== null ? (
                  <Jewel value={pv} size={cellSize - 2} popping />
                ) : v !== null ? (
                  <span
                    className={
                      clearing
                        ? "scale-125 transition-transform duration-300"
                        : "transition-transform"
                    }
                    style={{
                      color: "var(--color-cell-user)",
                      fontSize: cellSize * 0.5,
                      fontWeight: 600,
                      display: "inline-block",
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
