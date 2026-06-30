import { X } from "lucide-react";
import { useGameStore } from "@/store/game-store";

export type DropDifficulty = "easy" | "normal" | "hard";

const LEVELS: Array<{ key: DropDifficulty; label: string; sub: string }> = [
  { key: "easy", label: "Ușor", sub: "2 seturi de cifre · cădere lentă" },
  { key: "normal", label: "Normal", sub: "3 seturi · viteză medie" },
  { key: "hard", label: "Dificil", sub: "4 seturi · cădere rapidă" },
];

interface Props {
  open: boolean;
  onClose: () => void;
  onPick: (d: DropDifficulty, resume: boolean) => void;
}

function fmt(sec: number) {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

export function DifficultySheet({ open, onClose, onPick }: Props) {
  const session = useGameStore((s) => s.dropdokuSession);
  if (!open) return null;
  const elapsed = session ? Math.floor((Date.now() - session.startedAt) / 1000) : 0;
  return (
    <div
      className="fixed inset-0 bg-foreground/50 backdrop-blur-sm z-40 flex items-end"
      onClick={onClose}
    >
      <div
        className="w-full bg-card rounded-t-3xl p-5 pb-7 animate-slide-up shadow-card"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-1">
          <h2 className="text-xl font-bold">Sudoku Drop</h2>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-muted flex items-center justify-center"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        <p className="text-sm text-muted-foreground mb-4">Alege dificultatea</p>

        {session && (
          <button
            onClick={() => onPick(session.difficulty as DropDifficulty, true)}
            className="w-full flex items-center justify-between bg-primary text-primary-foreground rounded-2xl p-4 mb-3 active:scale-[0.99] transition shadow-card"
          >
            <div className="text-left">
              <div className="font-bold">Continuă</div>
              <div className="text-xs opacity-80 capitalize">
                {session.difficulty} · {fmt(elapsed)} · {session.score}p
              </div>
            </div>
            <span className="text-2xl">→</span>
          </button>
        )}

        <div className="space-y-2">
          {LEVELS.map((l) => (
            <button
              key={l.key}
              onClick={() => onPick(l.key, false)}
              className="w-full flex items-center bg-card border border-border rounded-2xl p-4 shadow-soft active:scale-[0.99] transition"
            >
              <span className="w-1.5 h-10 rounded-full bg-primary mr-3" />
              <div className="flex-1 text-left">
                <div className="font-semibold">{l.label}</div>
                <div className="text-xs text-muted-foreground">{l.sub}</div>
              </div>
              <span className="text-primary text-xl">→</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
