import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import type { SudokuDifficulty } from "@/game/classic";
import { useGameStore } from "@/store/game-store";

export const Route = createFileRoute("/classic")({
  head: () => ({ meta: [{ title: "Sudoku Clasic" }] }),
  component: ClassicPicker,
  validateSearch: (s: Record<string, unknown>) => ({ help: s.help ? 1 : undefined }),
});

const LEVELS: Array<{ key: SudokuDifficulty; label: string }> = [
  { key: "easy", label: "Ușor" },
  { key: "medium", label: "Mediu" },
  { key: "hard", label: "Dificil" },
  { key: "expert", label: "Expert" },
  { key: "extreme", label: "Extrem" },
];

function ClassicPicker() {
  const navigate = useNavigate();
  const session = useGameStore((s) => s.classicSession);

  return (
    <div className="min-h-screen px-5 pt-5">
      <Link
        to="/"
        className="w-10 h-10 rounded-full bg-card border border-border flex items-center justify-center"
      >
        <ArrowLeft className="w-5 h-5" />
      </Link>
      <h1 className="mt-6 text-3xl font-bold">Sudoku clasic</h1>
      <p className="text-sm text-muted-foreground mt-1">Alege o dificultate</p>

      {session && (
        <button
          onClick={() =>
            navigate({
              to: "/play/classic",
              search: { difficulty: session.difficulty as SudokuDifficulty, resume: true },
            })
          }
          className="mt-5 w-full flex items-center justify-between bg-primary text-primary-foreground rounded-2xl p-4 shadow-card active:scale-[0.99] transition"
        >
          <div className="text-left">
            <div className="font-semibold">Continuă</div>
            <div className="text-xs opacity-80 capitalize">
              {session.difficulty} · greșeli {session.mistakes}/3
            </div>
          </div>
          <span className="text-2xl">→</span>
        </button>
      )}

      <div className="mt-5 space-y-3">
        {LEVELS.map((l) => (
          <button
            key={l.key}
            onClick={() =>
              navigate({ to: "/play/classic", search: { difficulty: l.key, seed: Date.now() } })
            }
            className="w-full flex items-center bg-card border border-border rounded-2xl p-4 shadow-soft active:scale-[0.99] transition"
          >
            <span className="w-1.5 h-10 rounded-full bg-primary mr-4" />
            <div className="flex-1 text-left">
              <div className="font-semibold">{l.label}</div>
            </div>
            <span className="px-4 py-1.5 rounded-full bg-primary text-primary-foreground text-sm font-semibold">
              Joacă
            </span>
          </button>
        ))}
      </div>

      <Link
        to="/tutorial/$mode"
        params={{ mode: "classic" }}
        className="mt-6 block text-center text-sm text-muted-foreground underline"
      >
        Cum se joacă Sudoku Clasic
      </Link>
    </div>
  );
}
