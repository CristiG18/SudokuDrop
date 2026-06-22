import { createFileRoute, Link } from "@tanstack/react-router";
import { Snowflake, Square, Blocks, Flame } from "lucide-react";

export const Route = createFileRoute("/explore")({
  head: () => ({ meta: [{ title: "Explorează — variante Sudoku" }] }),
  component: Explore,
});

const VARIANTS = [
  {
    to: "/play/dropdoku",
    search: { difficulty: "normal" as const },
    title: "Dropdoku",
    sub: "Piese care cad — endless",
    Icon: Blocks,
    available: true,
  },
  {
    to: "/classic",
    title: "Sudoku Clasic",
    sub: "Puzzle clasic 9×9",
    Icon: Square,
    available: true,
  },
  {
    to: "#",
    title: "Ice Sudoku",
    sub: "Piese de gheață se sparg",
    Icon: Snowflake,
    available: false,
  },
  {
    to: "#",
    title: "Killer Sudoku",
    sub: "Cuști cu sumă",
    Icon: Flame,
    available: false,
  },
];

function Explore() {
  return (
    <div className="min-h-screen px-5 pt-5">
      <h1 className="text-3xl font-bold">Explorează</h1>

      <div className="mt-6 space-y-3">
        {VARIANTS.map((v) => {
          const Card = (
            <div className="flex items-center gap-4 bg-card border border-border rounded-2xl p-4 shadow-soft">
              <div className="w-14 h-14 rounded-2xl bg-accent/60 flex items-center justify-center text-primary">
                <v.Icon className="w-7 h-7" strokeWidth={1.5} />
              </div>
              <div className="flex-1">
                <div className="font-semibold">{v.title}</div>
                <div className="text-xs text-muted-foreground">{v.sub}</div>
              </div>
              {v.available ? (
                <span className="px-4 py-1.5 rounded-full bg-primary text-primary-foreground text-sm font-semibold">
                  Joacă
                </span>
              ) : (
                <span className="text-xs text-muted-foreground">curând</span>
              )}
            </div>
          );
          return v.available ? (
            <Link key={v.title} to={v.to} search={v.search as never}>
              {Card}
            </Link>
          ) : (
            <div key={v.title} className="opacity-60">{Card}</div>
          );
        })}
      </div>
    </div>
  );
}
