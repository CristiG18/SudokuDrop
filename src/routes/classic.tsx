import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import type { SudokuDifficulty } from "@/game/classic";

export const Route = createFileRoute("/classic")({
  head: () => ({ meta: [{ title: "Sudoku Clasic" }] }),
  component: ClassicPicker,
  validateSearch: (s: Record<string, unknown>) => ({ help: s.help ? 1 : undefined }),
});

const LEVELS: Array<{ key: SudokuDifficulty; label: string; clues: number }> = [
  { key: "easy", label: "Ușor", clues: 45 },
  { key: "medium", label: "Mediu", clues: 36 },
  { key: "hard", label: "Dificil", clues: 30 },
  { key: "expert", label: "Expert", clues: 26 },
  { key: "extreme", label: "Extrem", clues: 23 },
];

function ClassicPicker() {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen px-5 pt-5">
      <Link to="/" className="w-10 h-10 rounded-full bg-card border border-border flex items-center justify-center">
        <ArrowLeft className="w-5 h-5" />
      </Link>
      <h1 className="mt-6 text-3xl font-bold">Sudoku clasic</h1>
      <p className="text-sm text-muted-foreground mt-1">Alege o dificultate</p>

      <div className="mt-6 space-y-3">
        {LEVELS.map((l) => (
          <button
            key={l.key}
            onClick={() =>
              navigate({ to: "/play/classic", search: { difficulty: l.key } })
            }
            className="w-full flex items-center bg-card border border-border rounded-2xl p-4 shadow-soft active:scale-[0.99] transition"
          >
            <div className="flex-1 text-left">
              <div className="font-semibold">{l.label}</div>
              <div className="text-xs text-muted-foreground">{l.clues} indicii</div>
            </div>
            <span className="px-4 py-1.5 rounded-full bg-primary text-primary-foreground text-sm font-semibold">
              Joacă
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
