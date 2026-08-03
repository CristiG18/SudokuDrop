import { ROWS, COLS } from "@/game/engine";

export type ClearFxItem =
  | { id: number; kind: "row"; index: number }
  | { id: number; kind: "col"; index: number }
  | { id: number; kind: "box"; br: number; bc: number };

interface Props {
  items: ClearFxItem[];
  cellSize: number;
  /** Distance from the top of the board wrapper to the first grid row. */
  offsetTop: number;
  offsetLeft: number;
}

/**
 * Purely decorative celebration layer drawn on top of the board when a row,
 * column or box is completed: a sweeping light beam plus a few sparks.
 */
export function ClearFx({ items, cellSize, offsetTop, offsetLeft }: Props) {
  if (!items.length) return null;
  return (
    <div
      className="pointer-events-none absolute z-20"
      style={{
        left: offsetLeft,
        top: offsetTop,
        width: cellSize * COLS,
        height: cellSize * ROWS,
        overflow: "hidden",
        borderRadius: 6,
      }}
    >
      {items.map((it) => {
        if (it.kind === "row") {
          return (
            <div key={it.id} className="absolute" style={{ left: 0, top: it.index * cellSize, width: "100%", height: cellSize }}>
              <div className="fx-flash" />
              <div className="fx-beam-h" />
              <Sparks count={5} horizontal cellSize={cellSize} />
            </div>
          );
        }
        if (it.kind === "col") {
          return (
            <div key={it.id} className="absolute" style={{ top: 0, left: it.index * cellSize, height: "100%", width: cellSize }}>
              <div className="fx-flash" />
              <div className="fx-beam-v" />
              <Sparks count={5} cellSize={cellSize} />
            </div>
          );
        }
        return (
          <div
            key={it.id}
            className="absolute"
            style={{
              left: it.bc * 3 * cellSize,
              top: it.br * 3 * cellSize,
              width: cellSize * 3,
              height: cellSize * 3,
            }}
          >
            <div className="fx-flash" style={{ borderRadius: 10 }} />
            <div className="fx-box-ring" />
            <Sparks count={7} cellSize={cellSize} />
          </div>
        );
      })}
    </div>
  );
}

function Sparks({
  count,
  horizontal,
  cellSize,
}: {
  count: number;
  horizontal?: boolean;
  cellSize: number;
}) {
  return (
    <>
      {Array.from({ length: count }).map((_, i) => {
        const t = (i + 0.5) / count;
        return (
          <span
            key={i}
            className="fx-spark"
            style={{
              left: horizontal ? `${t * 100}%` : "50%",
              top: horizontal ? "50%" : `${t * 100}%`,
              width: Math.max(4, cellSize * 0.16),
              height: Math.max(4, cellSize * 0.16),
              animationDelay: `${i * 35}ms`,
            }}
          />
        );
      })}
    </>
  );
}
