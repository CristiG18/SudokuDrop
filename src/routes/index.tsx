import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Brain,
  Crown,
  Flame,
  HelpCircle,
  Calendar,
  Sparkles,
  Trophy,
  Blocks,
} from "lucide-react";
import { useGameStore } from "@/store/game-store";
import {
  currentMonthTheme,
  dailyForDate,
} from "@/game/schedule";
import { useEffect } from "react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Sudoku Drop — Acasă" },
      { name: "description", content: "Sudoku clasic, provocări zilnice, evenimente și turnee." },
    ],
  }),
  component: Home,
});

function Home() {
  const diamonds = useGameStore((s) => s.diamonds);
  const setTheme = useGameStore((s) => s.setTheme);
  const month = currentMonthTheme();
  const today = new Date();
  const todayDiff = dailyForDate(today);
  const monthName = today.toLocaleDateString("ro-RO", { month: "short" });
  const day = today.getDate();

  useEffect(() => {
    setTheme(month.key);
    if (typeof document !== "undefined") {
      document.documentElement.dataset.theme = month.key;
    }
  }, [month.key, setTheme]);

  return (
    <div className="min-h-screen flex flex-col">
      {/* Top HUD */}
      <header className="px-5 pt-5 flex items-center justify-between">
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-accent/60 text-sm font-semibold text-accent-foreground">
          <Brain className="w-4 h-4" />
          {diamonds}
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-accent/60 text-sm font-semibold text-accent-foreground">
            <Crown className="w-4 h-4" /> 0
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-accent/60 text-sm font-semibold text-accent-foreground">
            <Flame className="w-4 h-4" /> 0
          </div>
        </div>
      </header>

      {/* Carousel */}
      <div className="mt-6 -mx-1 overflow-x-auto no-scrollbar">
        <div className="flex gap-3 px-4 snap-x snap-mandatory">
          <CarouselCard
            to="/daily"
            tag="Provocarea Zilnică"
            title={`${monthName} ${day}`}
            sub={todayDiff.toUpperCase()}
            Icon={Trophy}
            tint="primary"
          />
          <CarouselCard
            to="/events"
            tag="Eveniment"
            title={month.name}
            sub="100 niveluri"
            Icon={Sparkles}
            tint="muted"
          />
          <CarouselCard
            to="/battle"
            tag="Turneu"
            title="Bronz"
            sub="Începe acum"
            Icon={Trophy}
            tint="primary"
          />
          <CarouselCard
            to="/play/dropdoku"
            search={{ difficulty: "normal" as const }}
            tag="Dropdoku"
            title="Endless"
            sub="Jewel falling"
            Icon={Blocks}
            tint="muted"
          />
        </div>
      </div>

      {/* Big classic */}
      <div className="flex-1 flex flex-col items-center justify-center px-6">
        <h1 className="text-4xl font-bold text-muted-foreground/80 tracking-tight">
          Sudoku clasic
        </h1>
        <Link
          to="/classic"
          search={{ help: 1 }}
          className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-full bg-card border border-border text-sm font-medium text-primary shadow-soft"
        >
          <HelpCircle className="w-4 h-4" /> Cum se joacă
        </Link>
      </div>

      {/* CTA */}
      <div className="px-6 pb-6">
        <Link
          to="/classic"
          className="block w-full text-center py-4 rounded-full bg-primary text-primary-foreground font-bold text-lg shadow-card active:scale-[0.98] transition"
        >
          Joc Nou
        </Link>
      </div>
    </div>
  );
}

function CarouselCard({
  to,
  search,
  tag,
  title,
  sub,
  Icon,
  tint,
}: {
  to: string;
  search?: Record<string, unknown>;
  tag: string;
  title: string;
  sub: string;
  Icon: typeof Trophy;
  tint: "primary" | "muted";
}) {
  return (
    <Link
      to={to}
      search={search as never}
      className="snap-start shrink-0 w-44 h-56 rounded-2xl p-4 flex flex-col justify-between bg-card border border-border shadow-soft active:scale-[0.98] transition"
    >
      <div>
        <p className="text-[11px] uppercase tracking-wide text-muted-foreground font-medium">
          {tag}
        </p>
        <h3 className="text-xl font-bold mt-1 leading-tight">{title}</h3>
        <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>
      </div>
      <div className="flex justify-end">
        <div
          className={
            tint === "primary"
              ? "w-14 h-14 rounded-2xl bg-primary/10 text-primary flex items-center justify-center"
              : "w-14 h-14 rounded-2xl bg-muted text-muted-foreground flex items-center justify-center"
          }
        >
          <Icon className="w-7 h-7" strokeWidth={1.6} />
        </div>
      </div>
    </Link>
  );
}
