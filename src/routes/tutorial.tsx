import { createFileRoute, Link, Outlet, useRouterState } from "@tanstack/react-router";
import { ArrowLeft, Blocks, Calendar, Sparkles, Square, Swords } from "lucide-react";

export const Route = createFileRoute("/tutorial")({
  head: () => ({ meta: [{ title: "Tutorial — Sudoku Drop" }] }),
  component: TutorialLayout,
});

const MODES = [
  { key: "dropdoku", title: "Sudoku Drop", sub: "Piese care cad — endless", Icon: Blocks },
  { key: "classic", title: "Sudoku Clasic", sub: "Puzzle 9×9 tradițional", Icon: Square },
  { key: "daily", title: "Provocarea Zilnică", sub: "Un puzzle nou în fiecare zi", Icon: Calendar },
  { key: "events", title: "Evenimente lunare", sub: "100 niveluri tematice", Icon: Sparkles },
  { key: "battle", title: "Turnee 1v1", sub: "Bronz → Master", Icon: Swords },
];

function TutorialLayout() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const onIndex = pathname === "/tutorial" || pathname === "/tutorial/";
  if (!onIndex) return <Outlet />;
  return (
    <div className="min-h-screen px-5 pt-5">
      <Link to="/" className="w-10 h-10 rounded-full bg-card border border-border flex items-center justify-center">
        <ArrowLeft className="w-5 h-5" />
      </Link>
      <h1 className="display text-3xl font-bold mt-6">Cum se joacă</h1>
      <p className="text-sm text-muted-foreground mt-1">Alege modul de joc</p>

      <div className="mt-6 space-y-3">
        {MODES.map((m) => (
          <Link
            key={m.key}
            to="/tutorial/$mode"
            params={{ mode: m.key }}
            className="flex items-center gap-4 bg-card border border-border rounded-2xl p-4 shadow-soft active:scale-[0.99] transition"
          >
            <div className="w-12 h-12 rounded-2xl bg-accent flex items-center justify-center text-primary">
              <m.Icon className="w-6 h-6" strokeWidth={1.6} />
            </div>
            <div className="flex-1">
              <div className="font-semibold">{m.title}</div>
              <div className="text-xs text-muted-foreground">{m.sub}</div>
            </div>
            <span className="text-muted-foreground">→</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
