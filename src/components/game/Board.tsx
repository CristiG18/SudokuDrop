import { useRef } from "react";
import { ROWS, COLS, type Board as BoardT, type Piece } from "@/game/engine";
import { Jewel } from "./Jewel";
import type { Helper, ControlMode } from "@/store/game-store";

interface BoardProps {
  board: BoardT;
  piece: Piece | null;
  clearingCells: Array<{ r: number; c: number }>;
  frozenCells?: Array<{ r: number; c: number }>;
  helperMode: Helper | null;
  swapFirst: { r: number; c: number } | null;
  previewCells: Array<{ r: number; c: number }>;
  cellSize: number;
  controlMode: ControlMode;
  // Gestures
  onDragMove?: (deltaCols: number) => void;
  onDragEnd?: (totalCols: number, swipedDown: boolean, tappedShort: boolean, tapX: number, tapY: number, width: number) => void;
  // Helper interaction
  onHelperHoverCell?: (r: number, c: number | null) => void;
  onHelperCommit?: (r: number, c: number) => void;
}

const THICK = 2;

export function Board({
  board,
  piece,
  clearingCells,
  helperMode,
  swapFirst,
  previewCells,
  cellSize,
  controlMode,
  onDragMove,
  onDragEnd,
  onHelperHoverCell,
  onHelperCommit,
}: BoardProps) {
  const isClearing = (r: number, c: number) => clearingCells.some((p) => p.r === r && p.c === c);
  const isPreview = (r: number, c: number) => previewCells.some((p) => p.r === r && p.c === c);

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
    helperCell: { r: number; c: number } | null;
  } | null>(null);

  const cellFromEvent = (e: React.PointerEvent) => {
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const x = e.clientX - rect.left - 8; // padding
    const y = e.clientY - rect.top - 8;
    const c = Math.floor(x / cellSize);
    const r = Math.floor(y / cellSize);
    if (r < 0 || r >= ROWS || c < 0 || c >= COLS) return null;
    return { r, c };
  };

  const handlePointerDown = (e: React.PointerEvent) => {
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    if (helperMode) {
      const cell = cellFromEvent(e);
      drag.current = {
        startX: e.clientX,
        startY: e.clientY,
        lastCols: 0,
        moved: false,
        startedAt: Date.now(),
        helperCell: cell,
      };
      if (cell) onHelperHoverCell?.(cell.r, cell.c);
      return;
    }
    if (controlMode !== "gestures") return;
    drag.current = {
      startX: e.clientX,
      startY: e.clientY,
      lastCols: 0,
      moved: false,
      startedAt: Date.now(),
      helperCell: null,
    };
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!drag.current) return;
    if (helperMode) {
      const cell = cellFromEvent(e);
      if (cell && (drag.current.helperCell?.r !== cell.r || drag.current.helperCell?.c !== cell.c)) {
        drag.current.helperCell = cell;
        onHelperHoverCell?.(cell.r, cell.c);
      }
      return;
    }
    if (controlMode !== "gestures") return;
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
    if (!drag.current) return;
    if (helperMode) {
      const cell = drag.current.helperCell;
      drag.current = null;
      onHelperHoverCell?.(-1, null);
      if (cell) onHelperCommit?.(cell.r, cell.c);
      return;
    }
    if (controlMode !== "gestures") {
      drag.current = null;
      return;
    }
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const localX = e.clientX - rect.left;
    const localY = e.clientY - rect.top;
    const dy = e.clientY - drag.current.startY;
    const dx = e.clientX - drag.current.startX;
    const elapsed = Date.now() - drag.current.startedAt;
    const swipedDown = dy > cellSize * 2.5 && Math.abs(dy) > Math.abs(dx);
    const tappedShort =
      !drag.current.moved && elapsed < 250 && Math.abs(dx) < 10 && Math.abs(dy) < 10;
    onDragEnd?.(drag.current.lastCols, swipedDown, tappedShort, localX, localY, rect.width);
    drag.current = null;
  };

  // Piece cells that are still above the visible board (r < 0) — render as
  // a translucent preview overlay so the player can plan the landing spot.
  const abovePieceCells = piece
    ? piece.cells
        .map((cell) => ({
          r: piece.r + cell.dr,
          c: piece.c + cell.dc,
          value: cell.value,
        }))
        .filter((p) => p.r < 0 && p.c >= 0 && p.c < COLS)
    : [];
  const previewStripRows = 3;
  const previewStripHeight = cellSize * previewStripRows;

  return (
    <div
      className="relative"
      style={{ width: inner + 16 }}
    >
      {/* Preview strip above the board — shows the piece before it enters */}
      <div
        className="relative mx-auto"
        style={{
          width: inner + 16,
          height: previewStripHeight,
          padding: "0 8px",
          pointerEvents: "none",
        }}
      >
        <div
          className="relative"
          style={{ width: inner, height: previewStripHeight }}
        >
          {abovePieceCells.map((p, i) => {
            const rowFromTop = previewStripRows + p.r; // p.r is negative (-3..-1)
            return (
              <div
                key={`above-${i}`}
                className="absolute flex items-center justify-center rounded-md"
                style={{
                  left: p.c * cellSize,
                  top: rowFromTop * cellSize,
                  width: cellSize,
                  height: cellSize,
                  opacity: 0.55 + rowFromTop * 0.12,
                }}
              >
                <Jewel value={p.value} size={cellSize - 4} popping={false} />
              </div>
            );
          })}
        </div>
      </div>

      <div
        className="relative bg-card rounded-2xl p-2 shadow-soft"
        style={{ width: inner + 16, height: inner + 16, touchAction: "none" }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
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
            const preview = isPreview(r, c);
            const rightThick = (c + 1) % 3 === 0 && c !== COLS - 1;
            const bottomThick = (r + 1) % 3 === 0 && r !== ROWS - 1;
            return (
              <div
                key={`${r}-${c}`}
                className="flex items-center justify-center"
                style={{
                  borderRight: `${rightThick ? THICK : 1}px solid ${rightThick ? "var(--color-board-line-thick)" : "var(--color-board-line-thin)"}`,
                  borderBottom: `${bottomThick ? THICK : 1}px solid ${bottomThick ? "var(--color-board-line-thick)" : "var(--color-board-line-thin)"}`,
                  backgroundColor: clearing || isSwapFirst || preview
                    ? "var(--color-cell-selected)"
                    : undefined,
                  transition: "background-color 150ms ease",
                }}
                aria-label={`cell ${r}-${c}`}
              >
                {pv !== null ? (
                  <Jewel value={pv} size={cellSize - 2} popping />
                ) : v !== null ? (
                  <Jewel value={v} size={cellSize - 2} clearing={clearing} />
                ) : null}
              </div>
            );
          }),
        )}
      </div>
      </div>
    </div>
  );
}
