import { Link } from "@tanstack/react-router";
import { Play } from "lucide-react";
import { useGameStore } from "@/store/game-store";

function fmt(sec: number) {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

export function ContinueCard() {
  const drop = useGameStore((s) => s.dropdokuSession);
  const classic = useGameStore((s) => s.classicSession);

  // Prefer dropdoku, then classic (most recent startedAt wins if both).
  const pick =
    drop && classic
      ? drop.startedAt > classic.startedAt
        ? "drop"
        : "classic"
      : drop
        ? "drop"
        : classic
          ? "classic"
          : null;

  if (!pick) return null;

  if (pick === "drop" && drop) {
    const elapsed = Math.floor((Date.now() - drop.startedAt) / 1000);
    return (
      <Link
        to="/play/dropdoku"
        search={{ difficulty: drop.difficulty as never, resume: true }}
        className="mx-5 mt-4 flex items-center bg-primary text-primary-foreground rounded-2xl p-4 shadow-card active:scale-[0.99] transition"
      >
        <Play className="w-5 h-5 mr-3" />
        <div className="flex-1 text-left">
          <div className="font-bold">Continuă Sudoku Drop</div>
          <div className="text-xs opacity-80 capitalize">
            {drop.difficulty} · {fmt(elapsed)} · {drop.score}p
          </div>
        </div>
        <span className="text-2xl">→</span>
      </Link>
    );
  }
  if (pick === "classic" && classic) {
    const elapsed = classic.seconds;
    return (
      <Link
        to="/play/classic"
        search={{ difficulty: classic.difficulty as never, resume: true }}
        className="mx-5 mt-4 flex items-center bg-primary text-primary-foreground rounded-2xl p-4 shadow-card active:scale-[0.99] transition"
      >
        <Play className="w-5 h-5 mr-3" />
        <div className="flex-1 text-left">
          <div className="font-bold">Continuă Sudoku Clasic</div>
          <div className="text-xs opacity-80 capitalize">
            {classic.difficulty} · {fmt(elapsed)} · greșeli {classic.mistakes}/3
          </div>
        </div>
        <span className="text-2xl">→</span>
      </Link>
    );
  }
  return null;
}
