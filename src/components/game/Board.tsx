import { useEffect, useRef, useState } from "react";
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

const GUTTER = 4;
const THICK = 6;

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

  const totalSize = cellSize * COLS + GUTTER * 2;

  return (
    <div
      className="relative jewel-panel p-2"
      style={{ width: totalSize, height: totalSize }}
    >
      {/* Sub-grid 3x3 thick lines */}
      <div className="absolute inset-2 pointer-events-none">
        {[1, 2].map((i) => (
          <div
            key={`v${i}`}
            className="absolute top-0 bottom-0 bg-board-line/40 rounded-full"
            style={{ left: (cellSize * COLS * i) / 3 - THICK / 2, width: THICK }}
          />
        ))}
        {[1, 2].map((i) => (
          <div
            key={`h${i}`}
            className="absolute left-0 right-0 bg-board-line/40 rounded-full"
            style={{ top: (cellSize * ROWS * i) / 3 - THICK / 2, height: THICK }}
          />
        ))}
      </div>

      <div
        className="grid relative"
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
            return (
              <button
                key={`${r}-${c}`}
                onClick={() => helperMode && onCellTap(r, c)}
                className="flex items-center justify-center"
                style={{ padding: 2 }}
                aria-label={`cell ${r}-${c}`}
              >
                {pv !== null ? (
                  <Jewel value={pv} size={cellSize - 4} popping />
                ) : v !== null ? (
                  <Jewel
                    value={v}
                    size={cellSize - 4}
                    clearing={clearing}
                    highlight={isSwapFirst || !!helperMode}
                  />
                ) : (
                  <div
                    className="w-full h-full rounded-[10px] bg-board/60"
                    style={{
                      boxShadow:
                        "inset 0 1px 2px oklch(0 0 0 / 0.04), inset 0 -1px 1px oklch(1 0 0 / 0.6)",
                    }}
                  />
                )}
              </button>
            );
          }),
        )}
      </div>
    </div>
  );
}
