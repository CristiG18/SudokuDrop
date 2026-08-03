import { createFileRoute, Link } from "@tanstack/react-router";
import { BookOpen, Square, Blocks, Flame } from "lucide-react";
import { useT } from "@/i18n";

export const Route = createFileRoute("/explore")({
  head: () => ({ meta: [{ title: "Explorează — variante Sudoku" }] }),
  component: Explore,
});

const VARIANTS = [
  {
    to: "/play/dropdoku",
    search: { difficulty: "normal" as const },
    title: "Sudoku Drop",
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
    title: "Killer Sudoku",
    sub: "Cuști cu sumă",
    Icon: Flame,
    available: false,
  },
];

function Explore() {
  const t = useT();
  return (
    <div className="min-h-screen px-5 pt-5">
      <h1 className="display text-3xl font-bold">{t("Explorează")}</h1>

      <Link
        to="/tutorial"
        className="mt-4 flex items-center gap-3 bg-accent text-accent-foreground rounded-2xl p-4"
      >
        <div className="w-10 h-10 rounded-xl bg-card flex items-center justify-center text-primary">
          <BookOpen className="w-5 h-5" />
        </div>
        <div className="flex-1">
          <div className="font-semibold">{t("Cum se joacă")}</div>
          <div className="text-xs opacity-80">{t("Tutoriale pentru fiecare mod")}</div>
        </div>
        <span>→</span>
      </Link>

      <div className="mt-4 space-y-3">
        {VARIANTS.map((v) => {
          const Card = (
            <div className="flex items-center gap-4 bg-card border border-border rounded-2xl p-4 shadow-soft relative overflow-hidden">
              <span className="absolute left-0 top-4 bottom-4 w-1 rounded-r-full bg-primary" />
              <div className="ml-2 w-12 h-12 rounded-2xl bg-accent flex items-center justify-center text-primary">
                <v.Icon className="w-6 h-6" strokeWidth={1.5} />
              </div>
              <div className="flex-1">
                <div className="font-semibold">{t(v.title)}</div>
                <div className="text-xs text-muted-foreground">{t(v.sub)}</div>
              </div>
              {v.available ? (
                <span className="px-4 py-1.5 rounded-full bg-primary text-primary-foreground text-sm font-semibold">
                  {t("Joacă")}
                </span>
              ) : (
                <span className="text-xs text-muted-foreground">{t("curând")}</span>
              )}
            </div>
          );
          return v.available ? (
            <Link key={v.title} to={v.to} search={v.search as never}>
              {Card}
            </Link>
          ) : (
            <div key={v.title} className="opacity-60">
              {Card}
            </div>
          );
        })}
      </div>
    </div>
  );
}
